import { componentRegistry } from '../memory/contentRegistry'
import { performanceConfig } from '../memory/performanceConfig'
import type {
  CircuitDocument,
  ComponentInstance,
  ComponentSimulationState,
  SimulationBranchState,
  SimulationResult,
  SimulationWarning,
} from '../memory/types'
import { getTerminalKey } from '../utils/circuit'
import { validateCircuit } from './validation'

interface SourceDescriptor {
  component: ComponentInstance
  positiveNode: string
  negativeNode: string
  voltage: number
  internalResistance: number
}

interface AnalogEdge {
  id: string
  component: ComponentInstance
  componentTypeId: string
  fromNode: string
  toNode: string
  resistance: number
  threshold: number
  bidirectional: boolean
}

interface TraversedEdge {
  edge: AnalogEdge
  forward: boolean
}

interface AnalogAnalysisResult {
  mode: 'exact' | 'approximate'
  totalCurrent: number
  closedPathCount: number
  pathResistances: number[]
  branchStates: SimulationBranchState[]
  warnings: SimulationWarning[]
  log: string[]
  nodeVoltages: Map<string, number>
  poweredNodeIds: Set<string>
  activePathComponentIds: Set<string>
  currentByComponent: Map<string, number>
  voltageDropByComponent: Map<string, number>
  currentBySource: Map<string, number>
}

class UnionFind {
  private parent = new Map<string, string>()

  add(value: string) {
    if (!this.parent.has(value)) {
      this.parent.set(value, value)
    }
  }

  find(value: string): string {
    const parent = this.parent.get(value)

    if (!parent) {
      this.parent.set(value, value)
      return value
    }

    if (parent === value) {
      return value
    }

    const root = this.find(parent)
    this.parent.set(value, root)
    return root
  }

  union(a: string, b: string) {
    const rootA = this.find(a)
    const rootB = this.find(b)

    if (rootA !== rootB) {
      this.parent.set(rootA, rootB)
    }
  }
}

const currentEpsilon = 0.0001
const voltageEpsilon = 0.01

const createIdleComponentState = (component: ComponentInstance): ComponentSimulationState => {
  const definition = componentRegistry[component.typeId]
  const notes =
    definition.simulationSupport === 'supported'
      ? []
      : [`${definition.name} is included for learning and building, but deeper behavior is a later simulation phase.`]

  return {
    componentId: component.id,
    status: definition.simulationSupport === 'supported' ? 'idle' : 'unsupported',
    notes,
  }
}

const getParamNumber = (component: ComponentInstance, key: string, fallback: number): number => {
  const value = component.params[key]
  return typeof value === 'number' ? value : fallback
}

const getParamBoolean = (component: ComponentInstance, key: string, fallback: boolean): boolean => {
  const value = component.params[key]
  return typeof value === 'boolean' ? value : fallback
}

const buildBranchLabel = (componentIds: string[], index: number): string => {
  const names = componentIds
    .map((componentId) => componentId.split('-')[0]?.toUpperCase() ?? componentId.toUpperCase())
    .slice(0, 2)

  return names.length > 0 ? `${names.join(' + ')} branch` : `Branch ${index + 1}`
}

const uniqueComponentIdsFromPath = (path: TraversedEdge[]): string[] =>
  Array.from(new Set(path.map((entry) => entry.edge.component.id)))

const buildBranchStatesFromExactPaths = (
  source: SourceDescriptor,
  paths: TraversedEdge[][],
  currentByComponent: Map<string, number>,
): SimulationBranchState[] =>
  paths
    .map((path, index) => {
      const componentIds = uniqueComponentIdsFromPath(path)
      const edgeCurrents = path.map((entry) => currentByComponent.get(entry.edge.component.id) ?? 0)
      const estimatedCurrent = edgeCurrents.length > 0 ? Math.min(...edgeCurrents) : 0
      const estimatedResistance =
        source.internalResistance + path.reduce((sum, entry) => sum + entry.edge.resistance + entry.edge.threshold, 0)

      return {
        id: `${source.component.id}-branch-${index + 1}`,
        sourceId: source.component.id,
        label: buildBranchLabel(componentIds, index),
        estimatedCurrent,
        estimatedResistance,
        componentIds,
        notes: ['Derived from solved edge currents across a source-to-return branch.'],
      }
    })
    .filter((branch) => branch.estimatedCurrent > currentEpsilon)

const deriveNodeHighStates = (
  circuit: CircuitDocument,
  endpointToNode: Map<string, string>,
  groundedNodeIds: Set<string>,
  nodeVoltages: Map<string, number>,
) => {
  const nodeHigh = new Map<string, boolean>()

  nodeVoltages.forEach((voltage, nodeId) => {
    if (voltage >= 2.5) {
      nodeHigh.set(nodeId, true)
    }
  })

  for (const nodeId of groundedNodeIds) {
    nodeHigh.set(nodeId, false)
  }

  for (const component of circuit.components) {
    if (
      component.typeId !== 'light-sensor' &&
      component.typeId !== 'temperature-sensor' &&
      component.typeId !== 'proximity-sensor'
    ) {
      continue
    }

    const signalNode = getNodeForTerminal(component.id, 'signal', endpointToNode)
    const referenceNode = getNodeForTerminal(component.id, 'reference', endpointToNode)
    if (!signalNode || !referenceNode) {
      continue
    }

    const threshold = getParamNumber(component, 'threshold', 50)
    const invert = getParamBoolean(component, 'invert', false)
    let currentValue = 0

    if (component.typeId === 'light-sensor') {
      currentValue = getParamNumber(component, 'ambient', 0)
    } else if (component.typeId === 'temperature-sensor') {
      currentValue = getParamNumber(component, 'temperature', 0)
    } else {
      currentValue = threshold - getParamNumber(component, 'distance', 100)
    }

    let high = currentValue >= threshold
    if (component.typeId === 'proximity-sensor') {
      high = getParamNumber(component, 'distance', 100) <= threshold
    }
    if (invert) {
      high = !high
    }

    nodeHigh.set(signalNode, high)
    nodeHigh.set(referenceNode, false)
  }

  for (let iteration = 0; iteration < 4; iteration += 1) {
    for (const component of circuit.components) {
      if (!component.typeId.endsWith('-gate')) {
        continue
      }

      const definition = componentRegistry[component.typeId]
      const inputIds = definition.terminals.filter((terminal) => terminal.role === 'input').map((terminal) => terminal.id)
      const outputTerminal = definition.terminals.find((terminal) => terminal.role === 'output')

      if (!outputTerminal) {
        continue
      }

      const inputStates = inputIds.map((terminalId) => {
        const nodeId = getNodeForTerminal(component.id, terminalId, endpointToNode)
        return nodeId ? nodeHigh.get(nodeId) ?? false : false
      })

      const outputNode = getNodeForTerminal(component.id, outputTerminal.id, endpointToNode)
      if (outputNode) {
        nodeHigh.set(outputNode, evaluateGate(component.typeId, inputStates))
      }
    }
  }

  return nodeHigh
}

const buildNodeMap = (circuit: CircuitDocument) => {
  const unionFind = new UnionFind()

  for (const component of circuit.components) {
    const definition = componentRegistry[component.typeId]
    for (const terminal of definition.terminals) {
      unionFind.add(getTerminalKey({ componentId: component.id, terminalId: terminal.id }))
    }
  }

  for (const wire of circuit.wires) {
    unionFind.union(getTerminalKey(wire.from), getTerminalKey(wire.to))
  }

  const nodeIds = new Map<string, string>()
  let nodeIndex = 1

  const endpointToNode = new Map<string, string>()
  for (const component of circuit.components) {
    const definition = componentRegistry[component.typeId]

    for (const terminal of definition.terminals) {
      const endpoint = getTerminalKey({ componentId: component.id, terminalId: terminal.id })
      const root = unionFind.find(endpoint)

      if (!nodeIds.has(root)) {
        nodeIds.set(root, `N${nodeIndex}`)
        nodeIndex += 1
      }

      endpointToNode.set(endpoint, nodeIds.get(root)!)
    }
  }

  const nodeToEndpoints = new Map<string, string[]>()
  endpointToNode.forEach((nodeId, endpoint) => {
    const endpoints = nodeToEndpoints.get(nodeId) ?? []
    endpoints.push(endpoint)
    nodeToEndpoints.set(nodeId, endpoints)
  })

  return { endpointToNode, nodeToEndpoints }
}

const getNodeForTerminal = (
  componentId: string,
  terminalId: string,
  endpointToNode: Map<string, string>,
): string | null => endpointToNode.get(getTerminalKey({ componentId, terminalId })) ?? null

const buildSourcesAndEdges = (
  circuit: CircuitDocument,
  endpointToNode: Map<string, string>,
  transistorStates = new Map<string, boolean>(),
) => {
  const sources: SourceDescriptor[] = []
  const edges: AnalogEdge[] = []
  const warnings: SimulationWarning[] = []

  for (const component of circuit.components) {
    const typeId = component.typeId

    if (typeId === 'battery' || typeId === 'voltage-source') {
      const positiveNode = getNodeForTerminal(component.id, 'positive', endpointToNode)
      const negativeNode = getNodeForTerminal(component.id, 'negative', endpointToNode)

      if (!positiveNode || !negativeNode) {
        continue
      }

      sources.push({
        component,
        positiveNode,
        negativeNode,
        voltage: getParamNumber(component, 'voltage', typeId === 'battery' ? 9 : 5),
        internalResistance: getParamNumber(component, 'internalResistance', 0.2),
      })
      continue
    }

    const addEdge = (
      terminalA: string,
      terminalB: string,
      resistance: number,
      threshold = 0,
      bidirectional = true,
    ) => {
      const fromNode = getNodeForTerminal(component.id, terminalA, endpointToNode)
      const toNode = getNodeForTerminal(component.id, terminalB, endpointToNode)

      if (!fromNode || !toNode) {
        return
      }

      edges.push({
        id: component.id,
        component,
        componentTypeId: component.typeId,
        fromNode,
        toNode,
        resistance,
        threshold,
        bidirectional,
      })
    }

    switch (typeId) {
      case 'resistor':
        addEdge('a', 'b', getParamNumber(component, 'resistance', 220))
        break
      case 'lamp':
        addEdge('a', 'b', getParamNumber(component, 'resistance', 60))
        break
      case 'output-indicator':
        addEdge('input', 'return', 100)
        break
      case 'switch':
        if (getParamBoolean(component, 'closed', false)) {
          addEdge('a', 'b', 0.05)
        }
        break
      case 'push-button':
        if (getParamBoolean(component, 'pressed', false)) {
          addEdge('a', 'b', 0.05)
        }
        break
      case 'led':
        addEdge(
          'anode',
          'cathode',
          getParamNumber(component, 'resistance', 180),
          getParamNumber(component, 'forwardVoltage', 2),
          false,
        )
        break
      case 'diode':
        addEdge('anode', 'cathode', 15, getParamNumber(component, 'forwardVoltage', 0.7), false)
        break
      case 'capacitor':
        addEdge('a', 'b', Math.max(500000, 1000000 / Math.max(getParamNumber(component, 'capacitance', 100), 1)))
        warnings.push({
          id: `capacitor-dc-${component.id}`,
          severity: 'info',
          message: 'Capacitors are currently solved as a DC steady-state approximation, so they behave like a nearly open path after charging.',
          relatedIds: [component.id],
        })
        break
      case 'inductor':
        addEdge('a', 'b', Math.max(0.05, 1 / Math.max(getParamNumber(component, 'inductance', 10), 1)))
        warnings.push({
          id: `inductor-dc-${component.id}`,
          severity: 'info',
          message: 'Inductors are currently solved as a DC steady-state approximation, so they behave like a low-resistance path after startup.',
          relatedIds: [component.id],
        })
        break
      case 'transistor':
        if (transistorStates.get(component.id)) {
          addEdge('collector', 'emitter', Math.max(0.12, 12 / Math.max(getParamNumber(component, 'gain', 100), 20)))
        }
        break
      default:
        break
    }
  }

  return { sources, edges, warnings }
}

const buildAdjacency = (edges: AnalogEdge[]) => {
  const adjacency = new Map<string, AnalogEdge[]>()

  for (const edge of edges) {
    const startList = adjacency.get(edge.fromNode) ?? []
    startList.push(edge)
    adjacency.set(edge.fromNode, startList)

    const endList = adjacency.get(edge.toNode) ?? []
    endList.push(edge)
    adjacency.set(edge.toNode, endList)
  }

  return adjacency
}

const propagateOpenCircuitPotential = (
  source: SourceDescriptor,
  adjacency: Map<string, AnalogEdge[]>,
  nodeVoltages: Map<string, number>,
  poweredNodeIds: Set<string>,
) => {
  const queue = [source.positiveNode]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const nodeId = queue.shift() as string
    if (visited.has(nodeId)) {
      continue
    }

    visited.add(nodeId)
    nodeVoltages.set(nodeId, Math.max(nodeVoltages.get(nodeId) ?? 0, source.voltage))
    poweredNodeIds.add(nodeId)

    for (const edge of adjacency.get(nodeId) ?? []) {
      const forward = nodeId === edge.fromNode
      if (!edge.bidirectional && !forward) {
        continue
      }

      const nextNode = forward ? edge.toNode : edge.fromNode
      if (!visited.has(nextNode)) {
        queue.push(nextNode)
      }
    }
  }
}

const findPaths = (source: SourceDescriptor, adjacency: Map<string, AnalogEdge[]>): TraversedEdge[][] => {
  const paths: TraversedEdge[][] = []
  const visitedNodes = new Set<string>()
  const usedEdgeIds = new Set<string>()

  const walk = (node: string, path: TraversedEdge[]) => {
    if (paths.length >= 12 || path.length > performanceConfig.maxPathDepth) {
      return
    }

    if (node === source.negativeNode && path.length > 0) {
      paths.push([...path])
      return
    }

    visitedNodes.add(node)
    const nextEdges = adjacency.get(node) ?? []

    for (const edge of nextEdges) {
      if (usedEdgeIds.has(edge.id)) {
        continue
      }

      const forward = node === edge.fromNode
      if (!edge.bidirectional && !forward) {
        continue
      }

      const nextNode = forward ? edge.toNode : edge.fromNode
      if (visitedNodes.has(nextNode)) {
        continue
      }

      usedEdgeIds.add(edge.id)
      path.push({ edge, forward })
      walk(nextNode, path)
      path.pop()
      usedEdgeIds.delete(edge.id)
    }

    visitedNodes.delete(node)
  }

  walk(source.positiveNode, [])
  return paths
}

const evaluateGate = (typeId: string, inputs: boolean[]): boolean => {
  const first = inputs[0] ?? false
  const second = inputs[1] ?? false

  switch (typeId) {
    case 'and-gate':
      return first && second
    case 'or-gate':
      return first || second
    case 'not-gate':
      return !first
    case 'nand-gate':
      return !(first && second)
    case 'nor-gate':
      return !(first || second)
    case 'xor-gate':
      return first !== second
    default:
      return false
  }
}

const solveLinearSystem = (matrix: number[][], vector: number[]): number[] | null => {
  const size = vector.length
  const coefficients = matrix.map((row) => [...row])
  const constants = [...vector]

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(coefficients[row][column]) > Math.abs(coefficients[pivotRow][column])) {
        pivotRow = row
      }
    }

    if (Math.abs(coefficients[pivotRow][column]) < 1e-10) {
      return null
    }

    if (pivotRow !== column) {
      ;[coefficients[column], coefficients[pivotRow]] = [coefficients[pivotRow], coefficients[column]]
      ;[constants[column], constants[pivotRow]] = [constants[pivotRow], constants[column]]
    }

    const pivot = coefficients[column][column]
    for (let entry = column; entry < size; entry += 1) {
      coefficients[column][entry] /= pivot
    }
    constants[column] /= pivot

    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue
      }

      const factor = coefficients[row][column]
      if (Math.abs(factor) < 1e-10) {
        continue
      }

      for (let entry = column; entry < size; entry += 1) {
        coefficients[row][entry] -= factor * coefficients[column][entry]
      }
      constants[row] -= factor * constants[column]
    }
  }

  return constants
}

const collectReachableNodes = (sources: SourceDescriptor[], edges: AnalogEdge[]) => {
  const adjacency = new Map<string, string[]>()

  for (const edge of edges) {
    const fromNodes = adjacency.get(edge.fromNode) ?? []
    fromNodes.push(edge.toNode)
    adjacency.set(edge.fromNode, fromNodes)

    const toNodes = adjacency.get(edge.toNode) ?? []
    toNodes.push(edge.fromNode)
    adjacency.set(edge.toNode, toNodes)
  }

  const visited = new Set<string>()
  const queue = sources.flatMap((source) => [source.positiveNode, source.negativeNode])

  while (queue.length > 0) {
    const nodeId = queue.shift() as string
    if (visited.has(nodeId)) {
      continue
    }

    visited.add(nodeId)
    for (const nextNode of adjacency.get(nodeId) ?? []) {
      if (!visited.has(nextNode)) {
        queue.push(nextNode)
      }
    }
  }

  return visited
}

const runExactResistiveAnalysis = (
  sources: SourceDescriptor[],
  edges: AnalogEdge[],
  groundedNodeIds: Set<string>,
): AnalogAnalysisResult | null => {
  const warnings: SimulationWarning[] = []
  const log = ['Using exact resistive solver for this linear network.']
  const branchStates: SimulationBranchState[] = []
  const currentByComponent = new Map<string, number>()
  const voltageDropByComponent = new Map<string, number>()
  const currentBySource = new Map<string, number>()
  const nodeVoltages = new Map<string, number>()
  const poweredNodeIds = new Set<string>()
  const activePathComponentIds = new Set<string>()
  const pathResistances: number[] = []

  const validSources: SourceDescriptor[] = []
  for (const source of sources) {
    if (source.positiveNode === source.negativeNode) {
      warnings.push({
        id: `short-${source.component.id}`,
        severity: 'error',
        message: 'The source positive and negative terminals resolve to the same node, indicating a direct short.',
        relatedIds: [source.component.id],
      })
      continue
    }

    validSources.push(source)
  }

  if (validSources.length === 0) {
    return {
      mode: 'exact',
      totalCurrent: 0,
      closedPathCount: 0,
      pathResistances,
      warnings,
      log,
      branchStates,
      nodeVoltages,
      poweredNodeIds,
      activePathComponentIds,
      currentByComponent,
      voltageDropByComponent,
      currentBySource,
    }
  }

  const reachableNodes = collectReachableNodes(validSources, edges)
  const relevantEdges = edges.filter(
    (edge) => reachableNodes.has(edge.fromNode) && reachableNodes.has(edge.toNode),
  )
  const relevantGroundedNodes = new Set(
    [...groundedNodeIds].filter((nodeId) => reachableNodes.has(nodeId)),
  )

  for (const source of validSources) {
    relevantGroundedNodes.add(source.negativeNode)
  }

  const unknownNodeIds = [...reachableNodes].filter((nodeId) => !relevantGroundedNodes.has(nodeId))
  const nodeIndex = new Map(unknownNodeIds.map((nodeId, index) => [nodeId, index]))
  const matrixSize = unknownNodeIds.length + validSources.length
  const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0))
  const vector = Array(matrixSize).fill(0)

  for (const edge of relevantEdges) {
    const safeResistance = Math.max(edge.resistance, 0.0001)
    const conductance = 1 / safeResistance
    const fromIndex = nodeIndex.get(edge.fromNode)
    const toIndex = nodeIndex.get(edge.toNode)

    if (fromIndex !== undefined) {
      matrix[fromIndex][fromIndex] += conductance
    }
    if (toIndex !== undefined) {
      matrix[toIndex][toIndex] += conductance
    }
    if (fromIndex !== undefined && toIndex !== undefined) {
      matrix[fromIndex][toIndex] -= conductance
      matrix[toIndex][fromIndex] -= conductance
    }
  }

  validSources.forEach((source, sourceOffset) => {
    const sourceIndex = unknownNodeIds.length + sourceOffset
    const positiveIndex = nodeIndex.get(source.positiveNode)
    const negativeIndex = nodeIndex.get(source.negativeNode)

    if (positiveIndex !== undefined) {
      matrix[positiveIndex][sourceIndex] += 1
      matrix[sourceIndex][positiveIndex] += 1
    }
    if (negativeIndex !== undefined) {
      matrix[negativeIndex][sourceIndex] -= 1
      matrix[sourceIndex][negativeIndex] -= 1
    }

    vector[sourceIndex] = source.voltage
  })

  const solution = solveLinearSystem(matrix, vector)
  if (!solution) {
    return null
  }

  for (const nodeId of relevantGroundedNodes) {
    nodeVoltages.set(nodeId, 0)
  }
  unknownNodeIds.forEach((nodeId, index) => {
    nodeVoltages.set(nodeId, solution[index] ?? 0)
  })

  let totalCurrent = 0
  let closedPathCount = 0

  validSources.forEach((source, sourceOffset) => {
    const sourceCurrent = Math.abs(solution[unknownNodeIds.length + sourceOffset] ?? 0)
    currentBySource.set(source.component.id, sourceCurrent)
    currentByComponent.set(source.component.id, sourceCurrent)

    if (sourceCurrent > currentEpsilon) {
      closedPathCount += 1
      totalCurrent += sourceCurrent
      activePathComponentIds.add(source.component.id)
      poweredNodeIds.add(source.positiveNode)
      poweredNodeIds.add(source.negativeNode)

      const equivalentResistance = source.voltage / sourceCurrent
      pathResistances.push(equivalentResistance)
      log.push(
        `${componentRegistry[source.component.typeId].name} solved exactly at about ${sourceCurrent.toFixed(3)} A.`,
      )

      if (equivalentResistance < 1) {
        warnings.push({
          id: `short-risk-${source.component.id}`,
          severity: 'warning',
          message: 'The exact resistive solve found a very low equivalent resistance. This behaves like a short-circuit risk.',
          relatedIds: [source.component.id],
        })
      }
    } else {
      log.push(`${componentRegistry[source.component.typeId].name} has no closed resistive return path.`)
    }
  })

  for (const edge of relevantEdges) {
    const fromVoltage = nodeVoltages.get(edge.fromNode) ?? 0
    const toVoltage = nodeVoltages.get(edge.toNode) ?? 0
    const current = Math.abs((fromVoltage - toVoltage) / Math.max(edge.resistance, 0.0001))
    const voltageDrop = Math.abs(fromVoltage - toVoltage)

    currentByComponent.set(edge.component.id, current)
    voltageDropByComponent.set(edge.component.id, voltageDrop)

    if (current > currentEpsilon || voltageDrop > voltageEpsilon) {
      activePathComponentIds.add(edge.component.id)
      poweredNodeIds.add(edge.fromNode)
      poweredNodeIds.add(edge.toNode)
    }
  }

  nodeVoltages.forEach((voltage, nodeId) => {
    if (Math.abs(voltage) > voltageEpsilon) {
      poweredNodeIds.add(nodeId)
    }
  })

  const exactAdjacency = buildAdjacency(relevantEdges)
  for (const source of validSources) {
    const sourcePaths = findPaths(source, exactAdjacency)
    branchStates.push(...buildBranchStatesFromExactPaths(source, sourcePaths, currentByComponent))
  }

  return {
    mode: 'exact',
    totalCurrent,
    closedPathCount,
    pathResistances,
    branchStates,
    warnings,
    log,
    nodeVoltages,
    poweredNodeIds,
    activePathComponentIds,
    currentByComponent,
    voltageDropByComponent,
    currentBySource,
  }
}

const runApproximatePathAnalysis = (
  sources: SourceDescriptor[],
  edges: AnalogEdge[],
  groundedNodeIds: Set<string>,
): AnalogAnalysisResult => {
  const warnings: SimulationWarning[] = []
  const log = ['Using path approximation for directional or mixed network analysis.']
  const branchStates: SimulationBranchState[] = []
  const nodeVoltages = new Map<string, number>()
  const poweredNodeIds = new Set<string>()
  const activePathComponentIds = new Set<string>()
  const currentByComponent = new Map<string, number>()
  const voltageDropByComponent = new Map<string, number>()
  const currentBySource = new Map<string, number>()
  const pathResistances: number[] = []
  const adjacency = buildAdjacency(edges)

  let totalCurrent = 0
  let closedPathCount = 0

  for (const source of sources) {
    if (source.positiveNode === source.negativeNode) {
      warnings.push({
        id: `short-${source.component.id}`,
        severity: 'error',
        message: 'The source positive and negative terminals resolve to the same node, indicating a direct short.',
        relatedIds: [source.component.id],
      })
      continue
    }

    nodeVoltages.set(source.positiveNode, Math.max(nodeVoltages.get(source.positiveNode) ?? 0, source.voltage))
    nodeVoltages.set(source.negativeNode, 0)
    groundedNodeIds.add(source.negativeNode)

    const paths = findPaths(source, adjacency)
    if (paths.length === 0) {
      propagateOpenCircuitPotential(source, adjacency, nodeVoltages, poweredNodeIds)
      currentBySource.set(source.component.id, 0)
      currentByComponent.set(source.component.id, 0)
      log.push(`${componentRegistry[source.component.typeId].name} has no complete return path.`)
      continue
    }

    if (paths.length > 4) {
      warnings.push({
        id: `complex-${source.component.id}`,
        severity: 'warning',
        message: 'This network has many possible paths. The phase 1 engine is using an educational approximation.',
        relatedIds: [source.component.id],
      })
    }

    let sourceCurrent = 0
    let sourceClosedPaths = 0

    for (const path of paths) {
      const pathResistance =
        source.internalResistance + path.reduce((sum, entry) => sum + entry.edge.resistance, 0)
      const totalThreshold = path.reduce((sum, entry) => sum + entry.edge.threshold, 0)
      const safeResistance = Math.max(pathResistance, 0.2)
      const branchCurrent = Math.max(0, (source.voltage - totalThreshold) / safeResistance)

      pathResistances.push(pathResistance)

      if (branchCurrent <= currentEpsilon) {
        warnings.push({
          id: `threshold-${source.component.id}-${path[0]?.edge.id ?? 'path'}`,
          severity: 'info',
          message: 'A path exists, but the source voltage is below the forward threshold required by at least one component.',
        })
        continue
      }

      if (pathResistance < 1) {
        warnings.push({
          id: `short-risk-${source.component.id}-${path[0]?.edge.id ?? 'path'}`,
          severity: 'warning',
          message: 'A very low-resistance path was found. This behaves like a short-circuit risk.',
        })
      }

      sourceClosedPaths += 1
      closedPathCount += 1
      sourceCurrent += branchCurrent
      totalCurrent += branchCurrent
      poweredNodeIds.add(source.positiveNode)
      poweredNodeIds.add(source.negativeNode)
      activePathComponentIds.add(source.component.id)

      let runningVoltage = source.voltage
      let currentNode = source.positiveNode
      const branchComponentIds = uniqueComponentIdsFromPath(path)

      for (const entry of path) {
        const component = entry.edge.component
        const componentCurrent = (currentByComponent.get(component.id) ?? 0) + branchCurrent
        currentByComponent.set(component.id, componentCurrent)
        voltageDropByComponent.set(
          component.id,
          Math.max(
            voltageDropByComponent.get(component.id) ?? 0,
            branchCurrent * entry.edge.resistance + entry.edge.threshold,
          ),
        )

        const nextNode = entry.forward ? entry.edge.toNode : entry.edge.fromNode
        activePathComponentIds.add(component.id)
        poweredNodeIds.add(currentNode)
        poweredNodeIds.add(nextNode)

        runningVoltage = Math.max(0, runningVoltage - (branchCurrent * entry.edge.resistance + entry.edge.threshold))
        nodeVoltages.set(nextNode, Math.max(nodeVoltages.get(nextNode) ?? 0, runningVoltage))
        currentNode = nextNode
      }

      branchStates.push({
        id: `${source.component.id}-branch-${sourceClosedPaths}`,
        sourceId: source.component.id,
        label: buildBranchLabel(branchComponentIds, sourceClosedPaths - 1),
        estimatedCurrent: branchCurrent,
        estimatedResistance: pathResistance,
        componentIds: branchComponentIds,
        notes: ['Estimated from the educational path-based solver for a directional or mixed network.'],
      })
    }

    currentBySource.set(source.component.id, sourceCurrent)
    currentByComponent.set(source.component.id, sourceCurrent)

    if (sourceClosedPaths > 0) {
      log.push(
        `${componentRegistry[source.component.typeId].name} approximated ${sourceClosedPaths} active path${sourceClosedPaths === 1 ? '' : 's'} at about ${sourceCurrent.toFixed(3)} A total.`,
      )
    }
  }

  return {
    mode: 'approximate',
    totalCurrent,
    closedPathCount,
    pathResistances,
    branchStates,
    warnings,
    log,
    nodeVoltages,
    poweredNodeIds,
    activePathComponentIds,
    currentByComponent,
    voltageDropByComponent,
    currentBySource,
  }
}

export const simulateCircuit = (circuit: CircuitDocument): SimulationResult => {
  const componentStates = Object.fromEntries(
    circuit.components.map((component) => [component.id, createIdleComponentState(component)]),
  ) as Record<string, ComponentSimulationState>
  const warnings: SimulationWarning[] = [...validateCircuit(circuit)]
  const log: string[] = []
  const nodeVoltages = new Map<string, number>()
  const poweredNodeIds = new Set<string>()
  const groundedNodeIds = new Set<string>()
  const activePathComponentIds = new Set<string>()

  const { endpointToNode, nodeToEndpoints } = buildNodeMap(circuit)
  const initialNetwork = buildSourcesAndEdges(circuit, endpointToNode)
  const { sources } = initialNetwork
  let edges = initialNetwork.edges
  warnings.push(...initialNetwork.warnings)

  if (sources.length === 0) {
    warnings.push({
      id: 'no-source',
      severity: 'warning',
      message: 'No battery or voltage source is connected, so the circuit cannot energize.',
    })
  }

  for (const component of circuit.components) {
    if (component.typeId === 'ground') {
      const nodeId = getNodeForTerminal(component.id, 'pin', endpointToNode)
      if (nodeId) {
        groundedNodeIds.add(nodeId)
      }
    }

    if (component.typeId === 'battery' || component.typeId === 'voltage-source') {
      const negativeNode = getNodeForTerminal(component.id, 'negative', endpointToNode)
      if (negativeNode) {
        groundedNodeIds.add(negativeNode)
      }
    }
  }

  const runAnalogAnalysis = (activeEdges: AnalogEdge[]) => {
    const canUseExactResistiveSolver = activeEdges.every((edge) => edge.bidirectional && edge.threshold === 0)
    const exactAnalysis = canUseExactResistiveSolver
      ? runExactResistiveAnalysis(sources, activeEdges, new Set(groundedNodeIds))
      : null
    const analogAnalysis =
      exactAnalysis ??
      runApproximatePathAnalysis(sources, activeEdges, new Set(groundedNodeIds))

    if (canUseExactResistiveSolver && !exactAnalysis) {
      warnings.push({
        id: `exact-solver-fallback-${activeEdges.length}`,
        severity: 'info',
        message: 'The exact resistive solver could not resolve this network cleanly, so the simulator fell back to path approximation.',
      })
    }

    return analogAnalysis
  }

  let analogAnalysis = runAnalogAnalysis(edges)
  const preTransistorNodeHigh = deriveNodeHighStates(
    circuit,
    endpointToNode,
    groundedNodeIds,
    analogAnalysis.nodeVoltages,
  )
  const transistorStates = new Map<string, boolean>()

  for (const component of circuit.components) {
    if (component.typeId !== 'transistor') {
      continue
    }

    const baseNode = getNodeForTerminal(component.id, 'base', endpointToNode)
    const emitterNode = getNodeForTerminal(component.id, 'emitter', endpointToNode)
    const baseVoltage =
      (baseNode ? analogAnalysis.nodeVoltages.get(baseNode) : undefined) ??
      (baseNode && (preTransistorNodeHigh.get(baseNode) ?? false) ? 5 : 0)
    const emitterVoltage =
      (emitterNode ? analogAnalysis.nodeVoltages.get(emitterNode) : undefined) ??
      (emitterNode && (preTransistorNodeHigh.get(emitterNode) ?? false) ? 5 : 0)
    const threshold = getParamNumber(component, 'baseThreshold', 0.7)
    const isOn =
      baseVoltage - emitterVoltage >= threshold ||
      Boolean(baseNode && (preTransistorNodeHigh.get(baseNode) ?? false) && !(emitterNode && (preTransistorNodeHigh.get(emitterNode) ?? false)))

    transistorStates.set(component.id, isOn)
  }

  if ([...transistorStates.values()].some(Boolean)) {
    const transistorNetwork = buildSourcesAndEdges(circuit, endpointToNode, transistorStates)
    edges = transistorNetwork.edges
    warnings.push(...transistorNetwork.warnings)
    analogAnalysis = runAnalogAnalysis(edges)
    log.push(
      `${[...transistorStates.values()].filter(Boolean).length} transistor switch${[...transistorStates.values()].filter(Boolean).length === 1 ? '' : 'es'} activated and re-solved in the analog pass.`,
    )
  }

  warnings.push(...analogAnalysis.warnings)
  log.push(...analogAnalysis.log)

  for (const [nodeId, voltage] of analogAnalysis.nodeVoltages) {
    nodeVoltages.set(nodeId, voltage)
  }
  for (const nodeId of analogAnalysis.poweredNodeIds) {
    poweredNodeIds.add(nodeId)
  }
  for (const componentId of analogAnalysis.activePathComponentIds) {
    activePathComponentIds.add(componentId)
  }

  const branchStates = analogAnalysis.branchStates
  const { currentByComponent, voltageDropByComponent, currentBySource } = analogAnalysis
  const totalCurrent = analogAnalysis.totalCurrent
  const closedPathCount = analogAnalysis.closedPathCount
  const pathResistances = analogAnalysis.pathResistances

  for (const source of sources) {
    const sourceCurrent = currentBySource.get(source.component.id) ?? 0
    componentStates[source.component.id] = {
      componentId: source.component.id,
      status: sourceCurrent > currentEpsilon ? 'powered' : 'off',
      current: sourceCurrent,
      notes:
        sourceCurrent > currentEpsilon
          ? [
              analogAnalysis.mode === 'exact'
                ? `Supplying about ${sourceCurrent.toFixed(3)} A from the exact resistive solve.`
                : `Supplying about ${sourceCurrent.toFixed(3)} A across the discovered path network.`,
            ]
          : ['The source is present, but no conductive return path was discovered.'],
    }
  }

  for (const component of circuit.components) {
    const state = componentStates[component.id]
    const current = currentByComponent.get(component.id) ?? 0
    const voltageDrop = voltageDropByComponent.get(component.id) ?? 0

    if (component.typeId === 'ground') {
      const nodeId = getNodeForTerminal(component.id, 'pin', endpointToNode)
      if (nodeId && (poweredNodeIds.has(nodeId) || groundedNodeIds.has(nodeId))) {
        activePathComponentIds.add(component.id)
      }

      componentStates[component.id] = {
        componentId: component.id,
        status: 'powered',
        notes: ['Ground marks a reference or return node in the current workspace.'],
      }
      continue
    }

    if (component.typeId === 'battery' || component.typeId === 'voltage-source') {
      continue
    }

    if (current <= currentEpsilon || activePathComponentIds.has(component.id) === false) {
      if (state.status === 'unsupported') {
        continue
      }

      if (component.typeId === 'capacitor') {
        componentStates[component.id] = {
          componentId: component.id,
          status: voltageDrop > voltageEpsilon ? 'warning' : 'off',
          current: 0,
          voltageDrop,
          notes: ['In the current DC model, the capacitor settles toward an open path after charging.'],
        }
        continue
      }

      if (component.typeId === 'transistor') {
        componentStates[component.id] = {
          componentId: component.id,
          status: 'off',
          current: 0,
          voltageDrop,
          notes: ['The transistor base is not driving enough emitter-relative voltage to switch the path on.'],
        }
        continue
      }

      componentStates[component.id] = {
        ...state,
        status: 'off',
        current: 0,
        voltageDrop,
        notes: state.notes.length > 0 ? state.notes : ['No active current path was found through this component.'],
      }
      continue
    }

    switch (component.typeId) {
      case 'resistor':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          notes:
            analogAnalysis.mode === 'exact'
              ? ['Resistor current and voltage drop came from the exact linear network solve.']
              : ['Resistors lower current and create voltage drop across the loop.'],
        }
        break
      case 'led':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          brightness: Math.min(1, current / 0.02),
          notes: ['The LED is forward-biased and receiving current.'],
        }
        break
      case 'lamp':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          brightness: Math.min(1, current / 0.08),
          notes:
            analogAnalysis.mode === 'exact'
              ? ['The lamp current came from the exact resistive branch solve.']
              : ['The lamp has a complete branch and is receiving current.'],
        }
        break
      case 'switch':
      case 'push-button':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          notes: ['This control is currently completing an active path.'],
        }
        break
      case 'capacitor':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'warning',
          current,
          voltageDrop,
          notes: ['The capacitor is using a DC steady-state approximation. Transient charging behavior is the next simulation step.'],
        }
        break
      case 'inductor':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          notes: ['The inductor is using a DC steady-state approximation and is acting like a low-resistance path.'],
        }
        break
      case 'output-indicator':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          brightness: Math.min(1, current / 0.02),
          notes: ['The indicator sees enough signal difference to show an on state.'],
        }
        break
      case 'diode':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          notes: ['The diode is conducting in the forward direction.'],
        }
        break
      case 'transistor':
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          current,
          voltageDrop,
          notes: ['The transistor is acting like a controlled switch between collector and emitter in the current approximation.'],
        }
        break
      default:
        componentStates[component.id] = {
          ...state,
          status: 'powered',
          current,
          voltageDrop,
          notes: state.notes.length > 0 ? state.notes : ['This component is on an active path.'],
        }
        break
    }
  }

  const nodeHigh = deriveNodeHighStates(circuit, endpointToNode, groundedNodeIds, nodeVoltages)
  for (const nodeId of groundedNodeIds) {
    if (!nodeVoltages.has(nodeId)) {
      nodeVoltages.set(nodeId, 0)
    }
  }

  for (const component of circuit.components) {
    if (
      component.typeId !== 'light-sensor' &&
      component.typeId !== 'temperature-sensor' &&
      component.typeId !== 'proximity-sensor'
    ) {
      continue
    }

    const signalNode = getNodeForTerminal(component.id, 'signal', endpointToNode)
    const referenceNode = getNodeForTerminal(component.id, 'reference', endpointToNode)
    if (!signalNode || !referenceNode) {
      continue
    }

    const threshold = getParamNumber(component, 'threshold', 50)
    const invert = getParamBoolean(component, 'invert', false)
    let currentValue = 0

    if (component.typeId === 'light-sensor') {
      currentValue = getParamNumber(component, 'ambient', 0)
    } else if (component.typeId === 'temperature-sensor') {
      currentValue = getParamNumber(component, 'temperature', 0)
    } else {
      currentValue = threshold - getParamNumber(component, 'distance', 100)
    }

    let high = currentValue >= threshold
    if (component.typeId === 'proximity-sensor') {
      high = getParamNumber(component, 'distance', 100) <= threshold
    }
    if (invert) {
      high = !high
    }

    nodeHigh.set(signalNode, high)
    nodeHigh.set(referenceNode, false)
    componentStates[component.id] = {
      componentId: component.id,
      status: 'powered',
      digitalHigh: high,
      notes: [high ? 'Sensor output is high.' : 'Sensor output is low.'],
    }
  }

  for (const component of circuit.components) {
    if (!component.typeId.endsWith('-gate')) {
      continue
    }

    const definition = componentRegistry[component.typeId]
    const outputTerminal = definition.terminals.find((terminal) => terminal.role === 'output')
    const outputNode = outputTerminal
      ? getNodeForTerminal(component.id, outputTerminal.id, endpointToNode)
      : null
    const outputValue = outputNode ? nodeHigh.get(outputNode) ?? false : false

    componentStates[component.id] = {
      componentId: component.id,
      status: 'powered',
      digitalHigh: outputValue,
      notes: [outputValue ? 'Gate output is high.' : 'Gate output is low.'],
    }
  }

  for (const component of circuit.components) {
    if (componentStates[component.id].status === 'powered') {
      continue
    }

    if (component.typeId === 'output-indicator') {
      const inputNode = getNodeForTerminal(component.id, 'input', endpointToNode)
      const returnNode = getNodeForTerminal(component.id, 'return', endpointToNode)
      const high = inputNode ? nodeHigh.get(inputNode) ?? false : false
      const returnLow = returnNode ? groundedNodeIds.has(returnNode) || !(nodeHigh.get(returnNode) ?? false) : false

      if (high && returnLow) {
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          digitalHigh: true,
          brightness: 1,
          notes: ['The indicator is high because its input node is high relative to return.'],
        }
        activePathComponentIds.add(component.id)
      }
    }

    if (component.typeId === 'led') {
      const anodeNode = getNodeForTerminal(component.id, 'anode', endpointToNode)
      const cathodeNode = getNodeForTerminal(component.id, 'cathode', endpointToNode)
      const forwardHigh = anodeNode ? nodeHigh.get(anodeNode) ?? false : false
      const returnLow = cathodeNode ? groundedNodeIds.has(cathodeNode) || !(nodeHigh.get(cathodeNode) ?? false) : false

      if (forwardHigh && returnLow) {
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          digitalHigh: true,
          brightness: 0.7,
          notes: ['The LED is being driven by a high signal in the logic pass.'],
        }
        activePathComponentIds.add(component.id)
      }
    }
  }

  const nodeStates = Array.from(nodeToEndpoints.keys()).map((nodeId) => ({
    id: nodeId,
    label: nodeId,
    voltage: nodeVoltages.get(nodeId) ?? (nodeHigh.get(nodeId) ? 5 : 0),
    isPowered: poweredNodeIds.has(nodeId) || (nodeHigh.get(nodeId) ?? false),
    isGrounded: groundedNodeIds.has(nodeId),
  }))

  if (closedPathCount === 0) {
    warnings.push({
      id: 'open-circuit',
      severity: 'warning',
      message: 'No complete conductive source-to-return path is currently active.',
    })
  } else {
    log.push(
      analogAnalysis.mode === 'exact'
        ? `Exact solve found ${closedPathCount} energized source loop${closedPathCount === 1 ? '' : 's'}.`
        : `Found ${closedPathCount} active path${closedPathCount === 1 ? '' : 's'} in the current approximation.`,
    )
  }

  if (branchStates.length > 1) {
    log.push(`Branch reporting captured ${branchStates.length} active branch summaries for the current run.`)
  }

  const primaryActiveSource = sources.find(
    (source) => (currentBySource.get(source.component.id) ?? 0) > currentEpsilon,
  )
  const equivalentResistance =
    primaryActiveSource && (currentBySource.get(primaryActiveSource.component.id) ?? 0) > currentEpsilon
      ? primaryActiveSource.voltage / (currentBySource.get(primaryActiveSource.component.id) as number)
      : (pathResistances[0] ?? 0)

  const supported = !circuit.components.some(
    (component) =>
      componentRegistry[component.typeId].simulationSupport !== 'supported' && activePathComponentIds.has(component.id),
  )
  const dedupedWarnings = Array.from(new Map(warnings.map((warning) => [warning.id, warning])).values())

  return {
    ranAt: new Date().toISOString(),
    supported,
    isClosedCircuit: closedPathCount > 0,
    estimatedEquivalentResistance: equivalentResistance,
    estimatedCurrent: totalCurrent,
    warnings: dedupedWarnings,
    activePathComponentIds: Array.from(activePathComponentIds),
    branchStates,
    nodeStates,
    componentStates,
    log,
  }
}
