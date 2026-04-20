import { canvasColorPresets, canvasManifest, canvasNodeManifest } from '../memory/canvasManifest'
import type {
  CanvasColor,
  CanvasEdgeRecord,
  CanvasNodeRecord,
  CanvasSide,
  DatasetRecord,
  ExperimentRecord,
  ModelRecord,
  NoteRecord,
  ResultRecord,
} from '../memory/types'

export interface CanvasEntityOption {
  label: string
  entityKind: NonNullable<CanvasNodeRecord['entityKind']>
  entityId: string
  file: string
}

export const resolveCanvasColor = (color?: CanvasColor, fallback = '#101923') => {
  if (!color) {
    return fallback
  }

  return canvasColorPresets[color] ?? color
}

export const createCanvasTextNode = (
  id: string,
  position: { x: number; y: number },
  text = 'New text card',
): CanvasNodeRecord => ({
  id,
  type: 'text',
  x: position.x,
  y: position.y,
  width: canvasNodeManifest.text.defaultWidth,
  height: canvasNodeManifest.text.defaultHeight,
  color: canvasNodeManifest.text.defaultColor,
  text,
})

export const createCanvasLinkNode = (
  id: string,
  position: { x: number; y: number },
  url: string,
): CanvasNodeRecord => ({
  id,
  type: 'link',
  x: position.x,
  y: position.y,
  width: canvasNodeManifest.link.defaultWidth,
  height: canvasNodeManifest.link.defaultHeight,
  color: canvasNodeManifest.link.defaultColor,
  url,
})

export const createCanvasGroupNode = (
  id: string,
  bounds: { x: number; y: number; width: number; height: number },
  label = 'Group',
): CanvasNodeRecord => ({
  id,
  type: 'group',
  x: bounds.x,
  y: bounds.y,
  width: Math.max(bounds.width, 240),
  height: Math.max(bounds.height, 180),
  color: canvasNodeManifest.group.defaultColor,
  label,
})

export const createCanvasEntityNode = (
  id: string,
  position: { x: number; y: number },
  option: CanvasEntityOption,
): CanvasNodeRecord => ({
  id,
  type: 'file',
  x: position.x,
  y: position.y,
  width: canvasNodeManifest.file.defaultWidth,
  height: canvasNodeManifest.file.defaultHeight,
  color: canvasNodeManifest.file.defaultColor,
  file: option.file,
  entityKind: option.entityKind,
  entityId: option.entityId,
})

export const createCanvasEdge = ({
  id,
  fromNode,
  toNode,
  fromSide = canvasManifest.edgeDefaults.fromSide as CanvasSide,
  toSide = canvasManifest.edgeDefaults.toSide as CanvasSide,
  label,
  color = '#4d87a8',
}: {
  id: string
  fromNode: string
  toNode: string
  fromSide?: CanvasSide
  toSide?: CanvasSide
  label?: string
  color?: CanvasColor
}): CanvasEdgeRecord => ({
  id,
  fromNode,
  toNode,
  fromSide,
  toSide,
  fromEnd: 'none',
  toEnd: 'arrow',
  label,
  color,
})

export const getCanvasEntityOptions = ({
  notes,
  datasets,
  experiments,
  models,
  results,
}: {
  notes: NoteRecord[]
  datasets: DatasetRecord[]
  experiments: ExperimentRecord[]
  models: ModelRecord[]
  results: ResultRecord[]
}): CanvasEntityOption[] => [
  ...notes.map((note) => ({
    label: `Note: ${note.title}`,
    entityKind: 'note' as const,
    entityId: note.id,
    file: `notes/${note.title.replace(/\s+/g, '-')}.md`,
  })),
  ...datasets.map((dataset) => ({
    label: `Dataset: ${dataset.title}`,
    entityKind: 'dataset' as const,
    entityId: dataset.id,
    file: `datasets/${dataset.title.replace(/\s+/g, '-')}.json`,
  })),
  ...experiments.map((experiment) => ({
    label: `Experiment: ${experiment.title}`,
    entityKind: 'experiment' as const,
    entityId: experiment.id,
    file: `experiments/${experiment.title.replace(/\s+/g, '-')}.md`,
  })),
  ...models.map((model) => ({
    label: `Model: ${model.title}`,
    entityKind: 'model' as const,
    entityId: model.id,
    file: `models/${model.title.replace(/\s+/g, '-')}.json`,
  })),
  ...results.map((result) => ({
    label: `Result: ${result.title}`,
    entityKind: 'result' as const,
    entityId: result.id,
    file: `results/${result.title.replace(/\s+/g, '-')}.md`,
  })),
]

export const getSelectionBounds = (nodes: CanvasNodeRecord[]) => {
  if (nodes.length === 0) {
    return undefined
  }

  const minX = Math.min(...nodes.map((node) => node.x))
  const minY = Math.min(...nodes.map((node) => node.y))
  const maxX = Math.max(...nodes.map((node) => node.x + node.width))
  const maxY = Math.max(...nodes.map((node) => node.y + node.height))

  return {
    x: minX - canvasManifest.selectionPadding,
    y: minY - canvasManifest.selectionPadding,
    width: maxX - minX + canvasManifest.selectionPadding * 2,
    height: maxY - minY + canvasManifest.selectionPadding * 2,
  }
}

export const duplicateCanvasNode = (
  node: CanvasNodeRecord,
  id: string,
): CanvasNodeRecord => ({
  ...node,
  id,
  x: node.x + 40,
  y: node.y + 40,
})

export const canvasDocumentFromState = (
  nodes: CanvasNodeRecord[],
  edges: CanvasEdgeRecord[],
) => ({
  nodes: [...nodes]
    .sort((left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0))
    .map((node) => ({
      ...node,
      entityKind: undefined,
      entityId: undefined,
      zIndex: undefined,
    }))
    .map((node) =>
      Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined)),
    ),
  edges: edges.map((edge) =>
    Object.fromEntries(Object.entries(edge).filter(([, value]) => value !== undefined)),
  ),
})

export const createEntitySummary = (
  option: CanvasEntityOption,
  records: {
    notes: NoteRecord[]
    datasets: DatasetRecord[]
    experiments: ExperimentRecord[]
    models: ModelRecord[]
    results: ResultRecord[]
  },
) => {
  if (option.entityKind === 'note') {
    return records.notes.find((entry) => entry.id === option.entityId)
  }

  if (option.entityKind === 'dataset') {
    return records.datasets.find((entry) => entry.id === option.entityId)
  }

  if (option.entityKind === 'experiment') {
    return records.experiments.find((entry) => entry.id === option.entityId)
  }

  if (option.entityKind === 'model') {
    return records.models.find((entry) => entry.id === option.entityId)
  }

  return records.results.find((entry) => entry.id === option.entityId)
}

export const getCanvasCardTitle = (
  node: CanvasNodeRecord,
  records: {
    notes: NoteRecord[]
    datasets: DatasetRecord[]
    experiments: ExperimentRecord[]
    models: ModelRecord[]
    results: ResultRecord[]
  },
) => {
  if (node.type === 'text') {
    return 'Text card'
  }

  if (node.type === 'group') {
    return node.label ?? 'Group'
  }

  if (node.type === 'link') {
    return node.url ?? 'Web card'
  }

  const option = node.entityKind && node.entityId
    ? createEntitySummary(
        {
          label: '',
          entityKind: node.entityKind,
          entityId: node.entityId,
          file: node.file ?? '',
        },
        records,
      )
    : undefined

  if (!option) {
    return node.file ?? 'File card'
  }

  return 'title' in option ? option.title : node.file ?? 'File card'
}
