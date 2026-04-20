import { componentRegistry } from '../memory/contentRegistry'
import { performanceConfig } from '../memory/performanceConfig'
import type {
  CircuitDocument,
  ComponentInstance,
  ComponentSimulationState,
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
      case 'inductor':
      case 'transistor':
        warnings.push({
          id: `preview-${component.id}`,
          severity: 'info',
          message: `${componentRegistry[typeId].name} is present as a preview component. Phase 1 shows the part and metadata but does not solve its full behavior yet.`,
          relatedIds: [component.id],
        })
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
  const { sources, edges, warnings: edgeWarnings } = buildSourcesAndEdges(circuit, endpointToNode)
  warnings.push(...edgeWarnings)

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

  const adjacency = buildAdjacency(edges)
  const currentByComponent = new Map<string, number>()
  const voltageDropByComponent = new Map<string, number>()
  const pathResistances: number[] = []
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

    const paths = findPaths(source, adjacency)

    if (paths.length === 0) {
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

    for (const path of paths) {
      const pathResistance =
        source.internalResistance + path.reduce((sum, entry) => sum + entry.edge.resistance, 0)
      const totalThreshold = path.reduce((sum, entry) => sum + entry.edge.threshold, 0)
      const safeResistance = Math.max(pathResistance, 0.2)
      const branchCurrent = Math.max(0, (source.voltage - totalThreshold) / safeResistance)

      pathResistances.push(pathResistance)

      if (branchCurrent <= 0.0001) {
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

      closedPathCount += 1
      totalCurrent += branchCurrent
      nodeVoltages.set(source.positiveNode, Math.max(nodeVoltages.get(source.positiveNode) ?? 0, source.voltage))
      nodeVoltages.set(source.negativeNode, 0)
      poweredNodeIds.add(source.positiveNode)
      groundedNodeIds.add(source.negativeNode)
      activePathComponentIds.add(source.component.id)

      let runningVoltage = source.voltage
      let currentNode = source.positiveNode

      for (const entry of path) {
        const component = entry.edge.component
        const resistanceDrop = branchCurrent * entry.edge.resistance
        const totalDrop = resistanceDrop + entry.edge.threshold
        const nextNode = entry.forward ? entry.edge.toNode : entry.edge.fromNode

        activePathComponentIds.add(component.id)
        currentByComponent.set(component.id, (currentByComponent.get(component.id) ?? 0) + branchCurrent)
        voltageDropByComponent.set(component.id, totalDrop)
        poweredNodeIds.add(currentNode)
        poweredNodeIds.add(nextNode)

        runningVoltage = Math.max(0, runningVoltage - totalDrop)
        nodeVoltages.set(nextNode, Math.max(nodeVoltages.get(nextNode) ?? 0, runningVoltage))
        currentNode = nextNode
      }
    }

    currentByComponent.set(source.component.id, totalCurrent)
    componentStates[source.component.id] = {
      componentId: source.component.id,
      status: totalCurrent > 0 ? 'powered' : 'off',
      current: totalCurrent,
      notes:
        totalCurrent > 0
          ? [`Supplying about ${totalCurrent.toFixed(3)} A across the discovered path network.`]
          : ['The source is present, but no conductive return path was discovered.'],
    }
  }

  for (const component of circuit.components) {
    const state = componentStates[component.id]
    const current = currentByComponent.get(component.id) ?? 0
    const voltageDrop = voltageDropByComponent.get(component.id) ?? 0

    if (component.typeId === 'ground') {
      componentStates[component.id] = {
        componentId: component.id,
        status: 'powered',
        notes: ['Ground marks a reference or return node in the current workspace.'],
      }
      continue
    }

    if (current <= 0 || activePathComponentIds.has(component.id) === false) {
      if (state.status === 'unsupported') {
        continue
      }

      componentStates[component.id] = {
        ...state,
        status: 'off',
        current: 0,
        voltageDrop: 0,
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
          notes: ['Resistors lower current and create voltage drop across the loop.'],
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
          notes: ['The lamp has a complete branch and is receiving current.'],
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
      const distance = getParamNumber(component, 'distance', 100)
      currentValue = threshold - distance
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

      const outputValue = evaluateGate(component.typeId, inputStates)
      const outputNode = getNodeForTerminal(component.id, outputTerminal.id, endpointToNode)

      if (outputNode) {
        nodeHigh.set(outputNode, outputValue)
        componentStates[component.id] = {
          componentId: component.id,
          status: 'powered',
          digitalHigh: outputValue,
          notes: [outputValue ? 'Gate output is high.' : 'Gate output is low.'],
        }
      }
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
    log.push(`Found ${closedPathCount} active path${closedPathCount === 1 ? '' : 's'} in the current approximation.`)
  }

  const equivalentResistance = totalCurrent > 0 && sources[0] ? sources[0].voltage / totalCurrent : 0
  const supported = !circuit.components.some(
    (component) =>
      componentRegistry[component.typeId].simulationSupport !== 'supported' && activePathComponentIds.has(component.id),
  )

  return {
    ranAt: new Date().toISOString(),
    supported,
    isClosedCircuit: closedPathCount > 0,
    estimatedEquivalentResistance: equivalentResistance || (pathResistances[0] ?? 0),
    estimatedCurrent: totalCurrent,
    warnings,
    activePathComponentIds: Array.from(activePathComponentIds),
    nodeStates,
    componentStates,
    log,
  }
}
