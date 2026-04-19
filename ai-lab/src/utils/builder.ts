import { modelBlockIndex } from '../memory/modelBlockIndex'
import { trainingManifest } from '../memory/trainingManifest'
import type {
  BuilderBlockKind,
  BuilderFlowEdge,
  BuilderFlowNode,
  BuilderFlowState,
  BuilderLayerPlan,
  BuilderValidationResult,
  LabMode,
} from '../memory/types'

const modelKinds = new Set<BuilderBlockKind>([
  'input',
  'dense',
  'activation',
  'dropout',
  'normalization',
  'reshape',
  'output',
])

export const isLayerBlock = (kind: BuilderBlockKind) => modelKinds.has(kind)

export const isBlockAvailableInMode = (kind: BuilderBlockKind, mode: LabMode) => {
  const block = modelBlockIndex[kind]
  return mode === 'advanced' ? block.advanced : block.beginner
}

const coerceNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

const coerceString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`

export const createDefaultBlockConfig = (kind: BuilderBlockKind) => {
  const block = modelBlockIndex[kind]

  return Object.fromEntries(
    block.configFields.map((field) => {
      if (field.options?.length) {
        return [field.id, field.options[0].value]
      }

      if (field.input === 'toggle') {
        return [field.id, false]
      }

      if (field.min !== undefined) {
        return [field.id, field.min]
      }

      return [field.id, '']
    }),
  )
}

export const createBuilderNode = (
  kind: BuilderBlockKind,
  position: { x: number; y: number },
): BuilderFlowNode => ({
  id: createId(kind),
  kind,
  label: modelBlockIndex[kind].label,
  description: modelBlockIndex[kind].description,
  position,
  config: createDefaultBlockConfig(kind),
})

const getOrderedChain = (flow: BuilderFlowState) => {
  const layerNodes = flow.nodes.filter((node) => isLayerBlock(node.kind))
  const nodeById = new Map(layerNodes.map((node) => [node.id, node]))
  const layerEdges = flow.edges.filter(
    (edge) => nodeById.has(edge.source) && nodeById.has(edge.target),
  )

  const outgoing = new Map<string, BuilderFlowEdge[]>()
  const incoming = new Map<string, BuilderFlowEdge[]>()

  for (const node of layerNodes) {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }

  for (const edge of layerEdges) {
    outgoing.get(edge.source)?.push(edge)
    incoming.get(edge.target)?.push(edge)
  }

  const inputs = layerNodes.filter((node) => node.kind === 'input')
  const outputs = layerNodes.filter((node) => node.kind === 'output')
  const issues: string[] = []

  if (inputs.length !== 1) {
    issues.push('The trainable path must contain exactly one input block.')
  }

  if (outputs.length !== 1) {
    issues.push('The trainable path must contain exactly one output block.')
  }

  for (const node of layerNodes) {
    const inCount = incoming.get(node.id)?.length ?? 0
    const outCount = outgoing.get(node.id)?.length ?? 0

    if (node.kind === 'input' && inCount > 0) {
      issues.push('Input blocks cannot receive inbound model connections.')
    }

    if (node.kind === 'output' && outCount > 0) {
      issues.push('Output blocks must terminate the model path.')
    }

    if (node.kind !== 'input' && inCount !== 1) {
      issues.push(`"${node.label}" must have exactly one inbound model connection.`)
    }

    if (node.kind !== 'output' && outCount !== 1) {
      issues.push(`"${node.label}" must have exactly one outbound model connection.`)
    }
  }

  const orderedNodes: BuilderFlowNode[] = []

  if (inputs.length !== 1) {
    return { issues, orderedNodes, layerNodes }
  }

  const visited = new Set<string>()
  let cursor: BuilderFlowNode | undefined = inputs[0]

  while (cursor) {
    if (visited.has(cursor.id)) {
      issues.push('The model path contains a cycle. Use a single forward chain.')
      break
    }

    visited.add(cursor.id)
    orderedNodes.push(cursor)

    if (cursor.kind === 'output') {
      break
    }

    const nextEdge: BuilderFlowEdge | undefined = outgoing.get(cursor.id)?.[0]
    cursor = nextEdge ? nodeById.get(nextEdge.target) : undefined
  }

  if (!orderedNodes.some((node) => node.kind === 'output')) {
    issues.push('The trainable chain does not reach an output block.')
  }

  if (visited.size !== layerNodes.length) {
    issues.push('All trainable blocks must belong to one continuous chain.')
  }

  return { issues, orderedNodes, layerNodes }
}

export const validateBuilderFlow = (flow: BuilderFlowState): BuilderValidationResult => {
  const { issues, orderedNodes } = getOrderedChain(flow)
  const layerPlan: BuilderLayerPlan[] = []
  let parameterEstimate = 0
  let currentWidth = 0

  for (const node of orderedNodes) {
    if (node.kind === 'input') {
      currentWidth = coerceNumber(node.config.inputUnits, 2)
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: `${currentWidth} input features enter the network.`,
        inputUnits: currentWidth,
        parameterEstimate: 0,
      })
      continue
    }

    if (node.kind === 'dense') {
      const units = coerceNumber(node.config.units, 8)
      const activation = coerceString(node.config.activation, 'relu')
      const params = currentWidth * units + units
      parameterEstimate += params
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: `Dense layer with ${units} units and ${activation} activation.`,
        units,
        activation,
        inputUnits: currentWidth,
        parameterEstimate: params,
      })
      currentWidth = units
      continue
    }

    if (node.kind === 'activation') {
      const activation = coerceString(node.config.activation, 'relu')
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: `Standalone ${activation} activation.`,
        activation,
        inputUnits: currentWidth,
        parameterEstimate: 0,
      })
      continue
    }

    if (node.kind === 'dropout') {
      const rate = coerceNumber(node.config.rate, 0.2)
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: `Dropout regularization at rate ${rate.toFixed(2)}.`,
        inputUnits: currentWidth,
        parameterEstimate: 0,
      })
      continue
    }

    if (node.kind === 'normalization') {
      const params = currentWidth * 4
      parameterEstimate += params
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: 'Batch normalization stabilizes intermediate activations.',
        inputUnits: currentWidth,
        parameterEstimate: params,
      })
      continue
    }

    if (node.kind === 'reshape') {
      const targetUnits = coerceNumber(node.config.targetUnits, currentWidth)
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: `Reshapes the flowing representation to width ${targetUnits}.`,
        units: targetUnits,
        inputUnits: currentWidth,
        parameterEstimate: 0,
      })
      currentWidth = targetUnits
      continue
    }

    if (node.kind === 'output') {
      const units = coerceNumber(node.config.units, 1)
      const activation = coerceString(node.config.activation, 'sigmoid')
      const params = currentWidth * units + units
      parameterEstimate += params
      layerPlan.push({
        id: node.id,
        label: node.label,
        kind: node.kind,
        description: `Output layer with ${units} values and ${activation} activation.`,
        units,
        activation,
        inputUnits: currentWidth,
        parameterEstimate: params,
      })
      currentWidth = units
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    orderedNodes,
    layerPlan,
    parameterEstimate,
  }
}

export const createPresetFlow = (presetId: string): BuilderFlowState => {
  const preset = trainingManifest.presets.find((entry) => entry.id === presetId)

  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`)
  }

  const baseNodes: BuilderFlowNode[] = preset.recommendedFlow.map((kind, index) => {
    const defaults = createDefaultBlockConfig(kind)

    if (kind === 'input') {
      defaults.inputUnits = preset.id === 'sine-lab' ? 1 : 2
    }

    if (kind === 'dense') {
      defaults.units = index === 1 ? 12 : 6
      defaults.activation = preset.id === 'sine-lab' ? 'tanh' : 'relu'
    }

    if (kind === 'dropout') {
      defaults.rate = 0.18
    }

    if (kind === 'output') {
      defaults.units = 1
      defaults.activation = preset.taskType === 'regression' ? 'linear' : 'sigmoid'
    }

    return {
      id: createId(kind),
      kind,
      label: modelBlockIndex[kind].label,
      description: modelBlockIndex[kind].description,
      position: { x: 60 + index * 210, y: 170 },
      config: defaults,
    }
  })

  const baseEdges = baseNodes.slice(0, -1).map((node, index) => ({
    id: createId('edge'),
    source: node.id,
    target: baseNodes[index + 1].id,
  }))

  const metaNodes: BuilderFlowNode[] = [
    {
      id: createId('dataset'),
      kind: 'dataset',
      label: 'Dataset',
      description: 'Metadata node for the current training preset.',
      position: { x: 60, y: 26 },
      config: {},
    },
    {
      id: createId('training'),
      kind: 'trainingConfig',
      label: 'Training Config',
      description: 'Browser training hyperparameters.',
      position: { x: 280, y: 26 },
      config: {
        epochs: preset.defaultConfig.epochs,
        learningRate: preset.defaultConfig.learningRate,
      },
    },
    {
      id: createId('evaluation'),
      kind: 'evaluation',
      label: 'Evaluation',
      description: 'Preview metrics and prediction outputs.',
      position: { x: 520, y: 26 },
      config: {},
    },
  ]

  const metaEdges = [
    { id: createId('edge'), source: metaNodes[0].id, target: metaNodes[1].id },
    { id: createId('edge'), source: metaNodes[1].id, target: metaNodes[2].id },
  ]

  return {
    id: createId('flow'),
    title: `${preset.name} Flow`,
    nodes: [...baseNodes, ...metaNodes],
    edges: [...baseEdges, ...metaEdges],
  }
}
