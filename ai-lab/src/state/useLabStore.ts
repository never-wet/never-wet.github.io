import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDefaultWorkspaceState } from '../memory/defaultState'
import { noteTemplates } from '../memory/noteTemplates'
import { SAVE_SCHEMA_VERSION, normalizeImportedWorkspace } from '../memory/saveSchema'
import { storageKeys } from '../memory/storageKeys'
import { trainingManifest } from '../memory/trainingManifest'
import type {
  BuilderConfigValue,
  BuilderFlowEdge,
  BuilderFlowNode,
  BuilderFlowState,
  CanvasState,
  ConfusionMatrix,
  DatasetRecord,
  GraphLinkRecord,
  GraphNodeRecord,
  LabMode,
  NodeCategory,
  PredictionPreview,
  TrainingConfig,
  TrainingMetricPoint,
  TrainingStatus,
  WorkspaceStateData,
} from '../memory/types'
import { createPresetFlow, summarizeLayerPlan, validateBuilderFlow } from '../utils/builder'
import { getDefaultPresetIdForTaskType } from '../utils/datasets'

export interface TrainingCommitPayload {
  status: Extract<TrainingStatus, 'completed' | 'paused' | 'error'>
  message: string
  metrics: TrainingMetricPoint[]
  predictions: PredictionPreview[]
  confusionMatrix?: ConfusionMatrix
  parameterEstimate: number
  modelStorageKey?: string
}

interface FolderImportPayload {
  nodes: GraphNodeRecord[]
  links: GraphLinkRecord[]
  rootNodeId: string
}

interface LabActions {
  setMode: (mode: LabMode) => void
  setSearchQuery: (query: string) => void
  setBottomTab: (tab: WorkspaceStateData['ui']['activeBottomTab']) => void
  setCanvasState: (canvas: CanvasState) => void
  setInspectorTab: (tab: WorkspaceStateData['ui']['activeInspectorTab']) => void
  selectNode: (nodeId?: string) => void
  hoverNode: (nodeId?: string) => void
  toggleCategoryFilter: (category: NodeCategory) => void
  setShowLabels: (enabled: boolean) => void
  setShowOnlyConnected: (enabled: boolean) => void
  toggleFolderNode: (nodeId: string) => void
  updateGraphNodePosition: (
    nodeId: string,
    position: Partial<Pick<GraphNodeRecord, 'x' | 'y' | 'z'>>,
  ) => void
  updateNote: (noteId: string, patch: Partial<Pick<WorkspaceStateData['notes'][number], 'title' | 'markdown' | 'tags'>>) => void
  createLinkedNote: (sourceNodeId?: string) => void
  linkNoteToNode: (noteId: string, nodeId: string) => void
  applyNoteTemplate: (noteId: string, templateId: string, contextNodeId?: string) => void
  selectTrainingPreset: (presetId: string) => void
  setActiveDataset: (datasetId: string) => void
  importDataset: (dataset: DatasetRecord) => void
  importFolderTree: (payload: FolderImportPayload) => void
  loadPresetArchitecture: (presetId: string) => void
  updateTrainingConfig: (patch: Partial<TrainingConfig>) => void
  setTrainingStatus: (status: TrainingStatus, message: string) => void
  pushTrainingMetric: (metric: TrainingMetricPoint, parameterEstimate: number) => void
  commitTrainingRun: (payload: TrainingCommitPayload) => void
  resetTrainingRun: () => void
  loadModelIntoBuilder: (modelId: string) => void
  setBuilderSelection: (nodeId?: string) => void
  setBuilderFlow: (flow: BuilderFlowState) => void
  updateBuilderNodeConfig: (
    nodeId: string,
    key: string,
    value: BuilderConfigValue,
  ) => void
  deleteBuilderNode: (nodeId: string) => void
  addBuilderNode: (node: BuilderFlowNode) => void
  updateBuilderGraph: (nodes: BuilderFlowNode[], edges: BuilderFlowEdge[]) => void
  importWorkspace: (workspace: WorkspaceStateData) => void
  resetWorkspace: () => void
  getWorkspaceData: () => WorkspaceStateData
}

type LabStore = WorkspaceStateData & LabActions

const stamp = <T extends Partial<WorkspaceStateData>>(payload: T): T & Pick<WorkspaceStateData, 'lastSavedAt'> => ({
  ...payload,
  lastSavedAt: new Date().toISOString(),
})

const extractWorkspaceData = (state: LabStore): WorkspaceStateData => ({
  mode: state.mode,
  nodes: state.nodes,
  links: state.links,
  notes: state.notes,
  datasets: state.datasets,
  experiments: state.experiments,
  models: state.models,
  results: state.results,
  canvas: state.canvas,
  builder: state.builder,
  training: state.training,
  ui: state.ui,
  lastSavedAt: state.lastSavedAt,
  saveVersion: state.saveVersion,
})

const updateArchitectureNode = (state: WorkspaceStateData): Partial<WorkspaceStateData> => {
  const validation = validateBuilderFlow(state.builder)
  const architectureNodeId = state.experiments[0]?.architectureNodeId

  if (!architectureNodeId) {
    return {
      training: {
        ...state.training,
        parameterEstimate: validation.parameterEstimate,
      },
    }
  }

  return {
    nodes: state.nodes.map((node) =>
      node.id === architectureNodeId
        ? {
            ...node,
            summary: validation.valid
              ? `${validation.layerPlan.length} trainable stages with ~${validation.parameterEstimate} parameters.`
              : validation.issues[0] ?? node.summary,
            tags: validation.valid ? ['builder', 'validated'] : ['builder', 'needs-attention'],
          }
        : node,
    ),
    training: {
      ...state.training,
      parameterEstimate: validation.parameterEstimate,
    },
  }
}

const createLinkedNoteNode = (noteId: string, title: string, sourceNode?: GraphNodeRecord): GraphNodeRecord => ({
  id: `node-note-${noteId}`,
  title,
  category: 'note',
  summary: 'New linked research note.',
  cluster: 'knowledge-hub',
  group: 'knowledge',
  tags: ['new-note'],
  entityKind: 'note',
  entityId: noteId,
  emphasis: 0.62,
  x: (sourceNode?.x ?? -64) + 22,
  y: (sourceNode?.y ?? 18) + 14,
  z: (sourceNode?.z ?? 32) + 16,
})

const cloneBuilderFlow = (flow: BuilderFlowState): BuilderFlowState => ({
  ...flow,
  nodes: flow.nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    config: { ...node.config },
  })),
  edges: flow.edges.map((edge) => ({ ...edge })),
})

const createDatasetGraphNode = (dataset: DatasetRecord): GraphNodeRecord => ({
  id: `node-${dataset.id}`,
  title: dataset.title,
  category: 'dataset',
  summary:
    dataset.source === 'imported'
      ? `Imported ${dataset.taskType.replace(/-/g, ' ')} dataset with ${dataset.rows?.length ?? dataset.sampleRows.length} rows.`
      : dataset.description,
  cluster: 'dataset-dock',
  group: 'data',
  tags: dataset.tags,
  entityKind: 'dataset',
  entityId: dataset.id,
  emphasis: dataset.source === 'imported' ? 0.82 : 0.76,
  x: 118,
  y: -38,
  z: 12,
})

const syncExperimentDatasetLink = (
  state: WorkspaceStateData,
  datasetId: string,
) => {
  const experiment = state.experiments[0]
  if (!experiment) {
    return state.links
  }

  const experimentNode = state.nodes.find(
    (node) => node.entityId === experiment.id && node.category === 'experiment',
  )
  const datasetNode = state.nodes.find(
    (node) => node.entityId === datasetId && node.category === 'dataset',
  )

  if (!experimentNode || !datasetNode) {
    return state.links
  }

  const nextLinks = state.links.filter(
    (link) => !(link.source === experimentNode.id && link.relation === 'trains'),
  )

  nextLinks.unshift({
    id: `link-${experimentNode.id}-${datasetNode.id}`,
    source: experimentNode.id,
    target: datasetNode.id,
    relation: 'trains',
    strength: 0.96,
  })

  return nextLinks
}

const initialState = createDefaultWorkspaceState()

export const useLabStore = create<LabStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...updateArchitectureNode(initialState),

      setMode: (mode) =>
        set((state) =>
          state.mode === mode
            ? state
            : {
                ...stamp({
                  mode,
                  ui: {
                    ...state.ui,
                  },
                }),
              },
        ),

      setSearchQuery: (query) =>
        set((state) =>
          state.ui.searchQuery === query
            ? state
            : {
                ...stamp({
                  ui: {
                    ...state.ui,
                    searchQuery: query,
                  },
                }),
              },
        ),

      setBottomTab: (tab) =>
        set((state) =>
          state.ui.activeBottomTab === tab
            ? state
            : {
                ...stamp({
                  ui: {
                    ...state.ui,
                    activeBottomTab: tab,
                  },
                }),
              },
        ),

      setCanvasState: (canvas) =>
        set((state) =>
          state.canvas === canvas
            ? state
            : {
                ...stamp({
                  canvas,
                }),
              },
        ),

      setInspectorTab: (tab) =>
        set((state) =>
          state.ui.activeInspectorTab === tab
            ? state
            : {
                ...stamp({
                  ui: {
                    ...state.ui,
                    activeInspectorTab: tab,
                  },
                }),
              },
        ),

      selectNode: (nodeId) =>
        set((state) => {
          const node = state.nodes.find((entry) => entry.id === nodeId)
          const nextBottomTab = node
            ? node.category === 'note'
              ? 'notes'
              : node.category === 'dataset' ||
                  node.category === 'experiment' ||
                  node.category === 'model'
                ? 'training'
                : node.category === 'folder' || node.category === 'file'
                  ? 'workspace'
                : node.category === 'layerGroup' || node.category === 'neural'
                  ? 'builder'
                  : state.ui.activeBottomTab
            : state.ui.activeBottomTab

          if (
            state.ui.selectedNodeId === nodeId &&
            state.ui.focusedNodeId === nodeId &&
            state.ui.activeBottomTab === nextBottomTab
          ) {
            return state
          }

          return {
            ...stamp({
              ui: {
                ...state.ui,
                selectedNodeId: nodeId,
                focusedNodeId: nodeId,
                activeBottomTab: nextBottomTab,
              },
            }),
          }
        }),

      hoverNode: (nodeId) =>
        set((state) =>
          state.ui.hoveredNodeId === nodeId
            ? state
            : {
                ui: {
                  ...state.ui,
                  hoveredNodeId: nodeId,
                },
              },
        ),

      toggleCategoryFilter: (category) =>
        set((state) => ({
          ...stamp({
            ui: {
              ...state.ui,
              categoryFilters: {
                ...state.ui.categoryFilters,
                [category]: !state.ui.categoryFilters[category],
              },
            },
          }),
        })),

      setShowLabels: (enabled) =>
        set((state) =>
          state.ui.showLabels === enabled
            ? state
            : {
                ...stamp({
                  ui: {
                    ...state.ui,
                    showLabels: enabled,
                  },
                }),
              },
        ),

      setShowOnlyConnected: (enabled) =>
        set((state) =>
          state.ui.showOnlyConnected === enabled
            ? state
            : {
                ...stamp({
                  ui: {
                    ...state.ui,
                    showOnlyConnected: enabled,
                  },
                }),
              },
        ),

      toggleFolderNode: (nodeId) =>
        set((state) => {
          const node = state.nodes.find((entry) => entry.id === nodeId)

          if (!node || node.category !== 'folder') {
            return state
          }

          const nextCollapsed = !node.isCollapsed

          return {
            ...stamp({
              nodes: state.nodes.map((entry) =>
                entry.id === nodeId
                  ? {
                      ...entry,
                      isCollapsed: nextCollapsed,
                      summary: entry.summary.replace(
                        /Click to (expand|collapse)\./,
                        `Click to ${nextCollapsed ? 'expand' : 'collapse'}.`,
                      ),
                    }
                  : entry,
              ),
            }),
          }
        }),

      updateGraphNodePosition: (nodeId, position) =>
        set((state) => {
          const currentNode = state.nodes.find((node) => node.id === nodeId)

          if (
            currentNode &&
            currentNode.x === position.x &&
            currentNode.y === position.y &&
            currentNode.z === position.z
          ) {
            return state
          }

          return {
            ...stamp({
              nodes: state.nodes.map((node) =>
                node.id === nodeId
                  ? {
                      ...node,
                      ...position,
                    }
                  : node,
              ),
            }),
          }
        }),

      updateNote: (noteId, patch) =>
        set((state) => ({
          ...stamp({
            notes: state.notes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    ...patch,
                    updatedAt: new Date().toISOString(),
                  }
                : note,
            ),
          }),
        })),

      createLinkedNote: (sourceNodeId) =>
        set((state) => {
          const noteId = `note-${Math.random().toString(36).slice(2, 8)}`
          const sourceNode = state.nodes.find((node) => node.id === sourceNodeId)
          const title = sourceNode ? `Note for ${sourceNode.title}` : 'New Research Note'
          const newNote = {
            id: noteId,
            title,
            markdown: 'Capture findings, hypotheses, or model observations here.',
            tags: sourceNode ? [...sourceNode.tags.slice(0, 2), 'note'] : ['note'],
            linkedNodeIds: sourceNodeId ? [sourceNodeId] : [],
            linkedNoteIds: [],
            updatedAt: new Date().toISOString(),
          }
          const newNode = createLinkedNoteNode(noteId, title, sourceNode)
          const newLinks = sourceNodeId
            ? [
                ...state.links,
                {
                  id: `link-${sourceNodeId}-${newNode.id}`,
                  source: sourceNodeId,
                  target: newNode.id,
                  relation: 'documents',
                  strength: 0.7,
                },
              ]
            : state.links

          return {
            ...stamp({
              notes: [newNote, ...state.notes],
              nodes: [newNode, ...state.nodes],
              links: newLinks,
              ui: {
                ...state.ui,
                selectedNodeId: newNode.id,
                focusedNodeId: newNode.id,
                activeBottomTab: 'notes',
              },
            }),
          }
        }),

      linkNoteToNode: (noteId, nodeId) =>
        set((state) => {
          const note = state.notes.find((entry) => entry.id === noteId)
          const noteNode = state.nodes.find((entry) => entry.entityId === noteId)
          if (!note || !noteNode) {
            return state
          }

          const alreadyLinked = note.linkedNodeIds.includes(nodeId)
          const nextLinks = alreadyLinked
            ? state.links
            : [
                ...state.links,
                {
                  id: `link-${noteNode.id}-${nodeId}`,
                  source: noteNode.id,
                  target: nodeId,
                  relation: 'documents',
                  strength: 0.64,
                },
              ]

          return {
            ...stamp({
              notes: state.notes.map((entry) =>
                entry.id === noteId
                  ? {
                      ...entry,
                      linkedNodeIds: alreadyLinked
                        ? entry.linkedNodeIds
                        : [...entry.linkedNodeIds, nodeId],
                      updatedAt: new Date().toISOString(),
                    }
                  : entry,
              ),
              links: nextLinks,
            }),
          }
        }),

      applyNoteTemplate: (noteId, templateId, contextNodeId) =>
        set((state) => {
          const template = noteTemplates.find((entry) => entry.id === templateId)
          const contextTitle = state.nodes.find((node) => node.id === contextNodeId)?.title

          if (!template) {
            return state
          }

          return {
            ...stamp({
              notes: state.notes.map((note) =>
                note.id === noteId
                  ? {
                      ...note,
                      title: template.buildTitle(contextTitle),
                      markdown: template.buildMarkdown(contextTitle),
                      tags: Array.from(new Set([...template.tags, ...note.tags])),
                      updatedAt: new Date().toISOString(),
                    }
                  : note,
              ),
            }),
          }
        }),

      selectTrainingPreset: (presetId) =>
        set((state) => {
          const preset = trainingManifest.presets.find((entry) => entry.id === presetId)

          if (!preset) {
            return state
          }

          const currentDataset = state.datasets.find(
            (entry) => entry.id === state.experiments[0]?.datasetId,
          )
          const fallbackDataset = state.datasets.find((entry) => entry.presetId === presetId)
          const nextDatasetId =
            currentDataset && currentDataset.taskType === preset.taskType
              ? currentDataset.id
              : (fallbackDataset?.id ?? state.experiments[0]?.datasetId)

          return {
            ...stamp({
              training: {
                ...state.training,
                presetId,
                config: preset.defaultConfig,
                status: 'idle',
                metrics: [],
                predictions: [],
                confusionMatrix: undefined,
                currentEpoch: 0,
                message: `Loaded ${preset.name}.`,
              },
              experiments: state.experiments.map((experiment, index) =>
                index === 0
                  ? {
                      ...experiment,
                      presetId,
                      datasetId: nextDatasetId ?? experiment.datasetId,
                    }
                  : experiment,
              ),
              links: syncExperimentDatasetLink(
                {
                  ...state,
                  experiments: state.experiments.map((experiment, index) =>
                    index === 0
                      ? {
                          ...experiment,
                          presetId,
                          datasetId: nextDatasetId ?? experiment.datasetId,
                        }
                      : experiment,
                  ),
                },
                nextDatasetId ?? state.experiments[0]?.datasetId ?? fallbackDataset?.id ?? '',
              ),
            }),
          }
        }),

      setActiveDataset: (datasetId) =>
        set((state) => {
          const dataset = state.datasets.find((entry) => entry.id === datasetId)
          const currentPreset = trainingManifest.presets.find(
            (entry) => entry.id === state.training.presetId,
          )

          if (!dataset) {
            return state
          }

          const nextPresetId =
            currentPreset?.taskType === dataset.taskType
              ? currentPreset.id
              : getDefaultPresetIdForTaskType(dataset.taskType)
          const nextPreset = trainingManifest.presets.find((entry) => entry.id === nextPresetId)
          const nextExperiments = state.experiments.map((experiment, index) =>
            index === 0
              ? {
                  ...experiment,
                  datasetId,
                  presetId: nextPresetId,
                }
              : experiment,
          )
          const nextState = {
            ...state,
            experiments: nextExperiments,
          }

          return {
            ...stamp({
              experiments: nextExperiments,
              links: syncExperimentDatasetLink(nextState, datasetId),
              training: {
                ...state.training,
                presetId: nextPresetId,
                config:
                  currentPreset?.taskType === dataset.taskType
                    ? state.training.config
                    : (nextPreset?.defaultConfig ?? state.training.config),
                message:
                  dataset.source === 'imported'
                    ? `Imported dataset "${dataset.title}" is active for training.`
                    : `Using ${dataset.title} as the active training dataset.`,
              },
            }),
          }
        }),

      importDataset: (dataset) =>
        set((state) => {
          const nextDatasets = [dataset, ...state.datasets]
          const existingDatasetNode = state.nodes.find(
            (node) => node.entityId === dataset.id && node.category === 'dataset',
          )
          const datasetNode = existingDatasetNode ?? createDatasetGraphNode(dataset)
          const nextNodes = existingDatasetNode ? state.nodes : [datasetNode, ...state.nodes]
          const nextCanvasNodes = state.canvas.nodes.some(
            (node) => node.entityId === dataset.id && node.type === 'file',
          )
            ? state.canvas.nodes
            : [
                {
                  id: `canvas-${dataset.id}`,
                  type: 'file' as const,
                  x: 610,
                  y: 220,
                  width: 280,
                  height: 170,
                  color: '#111b24' as `#${string}`,
                  file: `datasets/${dataset.title.replace(/\s+/g, '-')}.json`,
                  entityKind: 'dataset' as const,
                  entityId: dataset.id,
                },
                ...state.canvas.nodes,
              ]
          const nextExperiments = state.experiments.map((experiment, index) =>
            index === 0
              ? {
                  ...experiment,
                  datasetId: dataset.id,
                  presetId: dataset.presetId,
                }
              : experiment,
          )
          const nextState = {
            ...state,
            nodes: nextNodes,
            experiments: nextExperiments,
          }
          const nextPreset = trainingManifest.presets.find(
            (entry) => entry.id === dataset.presetId,
          )

          return {
            ...stamp({
              datasets: nextDatasets,
              nodes: nextNodes,
              canvas: {
                ...state.canvas,
                nodes: nextCanvasNodes,
              },
              experiments: nextExperiments,
              links: syncExperimentDatasetLink(nextState, dataset.id),
              training: {
                ...state.training,
                presetId: dataset.presetId,
                config: nextPreset?.defaultConfig ?? state.training.config,
                message: `Imported ${dataset.title} and set it as the active dataset.`,
              },
              ui: {
                ...state.ui,
                selectedNodeId: datasetNode.id,
                focusedNodeId: datasetNode.id,
                activeBottomTab: 'training',
              },
            }),
          }
        }),

      importFolderTree: (payload) =>
        set((state) => {
          const nextNodes = [...payload.nodes, ...state.nodes]
          const nextLinks = [...payload.links, ...state.links]

          return {
            ...stamp({
              nodes: nextNodes,
              links: nextLinks,
              ui: {
                ...state.ui,
                selectedNodeId: payload.rootNodeId,
                focusedNodeId: payload.rootNodeId,
                activeBottomTab: 'workspace',
              },
            }),
          }
        }),

      loadPresetArchitecture: (presetId) =>
        set((state) => {
          const flow = createPresetFlow(presetId)
          const nextState = {
            ...state,
            builder: flow,
          }
          return {
            ...stamp({
              builder: flow,
              ui: {
                ...state.ui,
                activeBottomTab: 'builder',
              },
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      updateTrainingConfig: (patch) =>
        set((state) => ({
          ...stamp({
            training: {
              ...state.training,
              config: {
                ...state.training.config,
                ...patch,
              },
            },
          }),
        })),

      setTrainingStatus: (status, message) =>
        set((state) => ({
          ...stamp({
            training: {
              ...state.training,
              status,
              message,
              startedAt:
                status === 'training'
                  ? new Date().toISOString()
                  : state.training.startedAt,
            },
            experiments: state.experiments.map((experiment, index) =>
              index === 0
                ? {
                    ...experiment,
                    status: status === 'training' ? 'running' : experiment.status,
                  }
                : experiment,
            ),
          }),
        })),

      pushTrainingMetric: (metric, parameterEstimate) =>
        set((state) => ({
          training: {
            ...state.training,
            metrics: [...state.training.metrics, metric],
            currentEpoch: metric.epoch,
            parameterEstimate,
          },
        })),

      commitTrainingRun: (payload) =>
        set((state) => {
          const experiment = state.experiments[0]
          const validation = validateBuilderFlow(state.builder)
          const nextVersion =
            state.models
              .filter((model) => model.experimentId === experiment?.id)
              .reduce((max, model) => Math.max(max, model.version), 0) + 1
          const modelId = `model-${Date.now().toString(36)}`
          const resultId = `result-${Date.now().toString(36)}`
          const finalMetric = payload.metrics[payload.metrics.length - 1]
          const newModel = experiment
            ? {
                id: modelId,
                title: `${trainingManifest.presets.find((preset) => preset.id === state.training.presetId)?.name ?? 'Browser'} v${nextVersion}`,
                description: payload.message,
                experimentId: experiment.id,
                version: nextVersion,
                presetId: state.training.presetId,
                datasetId: experiment.datasetId,
                builderTitle: state.builder.title,
                builderSignature: summarizeLayerPlan(validation.layerPlan),
                configSnapshot: { ...state.training.config },
                builderSnapshot: cloneBuilderFlow(state.builder),
                storageKey: payload.modelStorageKey,
                parameterEstimate: payload.parameterEstimate,
                metrics: finalMetric,
                updatedAt: new Date().toISOString(),
              }
            : undefined
          const newResult = experiment
            ? {
                id: resultId,
                title: `${experiment.title} snapshot`,
                experimentId: experiment.id,
                observations: [
                  payload.message,
                  payload.status === 'completed'
                    ? 'Training finished successfully in the browser.'
                    : 'Training stopped before completion.',
                ],
                metrics: finalMetric,
                createdAt: new Date().toISOString(),
              }
            : undefined
          const modelNode: GraphNodeRecord | undefined = newModel
            ? {
                id: `node-${newModel.id}`,
                title: newModel.title,
                category: 'model',
                summary: payload.message,
                cluster: 'model-orbit',
                group: 'architecture',
                tags: ['saved-model', state.training.presetId],
                entityKind: 'model',
                entityId: newModel.id,
                emphasis: 0.82,
              }
            : undefined
          const resultNode: GraphNodeRecord | undefined = newResult
            ? {
                id: `node-${newResult.id}`,
                title: newResult.title,
                category: 'result',
                summary: payload.message,
                cluster: 'results-shell',
                group: 'results',
                tags: ['training-output'],
                entityKind: 'result',
                entityId: newResult.id,
                emphasis: 0.72,
              }
            : undefined
          const extraLinks =
            experiment && modelNode && resultNode
              ? [
                  {
                    id: `link-${experiment.architectureNodeId}-${modelNode.id}`,
                    source: experiment.architectureNodeId,
                    target: modelNode.id,
                    relation: 'versions',
                    strength: 0.86,
                  },
                  {
                    id: `link-${modelNode.id}-${resultNode.id}`,
                    source: modelNode.id,
                    target: resultNode.id,
                    relation: 'evaluates',
                    strength: 0.82,
                  },
                ]
              : []

          return {
            ...stamp({
              models: newModel ? [newModel, ...state.models] : state.models,
              results: newResult ? [newResult, ...state.results] : state.results,
              nodes: [
                ...(resultNode ? [resultNode] : []),
                ...(modelNode ? [modelNode] : []),
                ...state.nodes,
              ],
              links: [...extraLinks, ...state.links],
              training: {
                ...state.training,
                status: payload.status,
                message: payload.message,
                metrics: payload.metrics,
                predictions: payload.predictions,
                confusionMatrix: payload.confusionMatrix,
                currentEpoch: payload.metrics[payload.metrics.length - 1]?.epoch ?? state.training.currentEpoch,
                parameterEstimate: payload.parameterEstimate,
                currentModelId: newModel?.id ?? state.training.currentModelId,
                modelStorageKey: payload.modelStorageKey,
                finishedAt: new Date().toISOString(),
              },
              experiments: state.experiments.map((entry, index) =>
                index === 0
                  ? {
                      ...entry,
                      status: payload.status === 'completed' ? 'trained' : entry.status,
                      latestResultId: newResult?.id ?? entry.latestResultId,
                      modelIds: newModel ? [newModel.id, ...entry.modelIds] : entry.modelIds,
                    }
                  : entry,
              ),
              ui: {
                ...state.ui,
                activeBottomTab: 'training',
                selectedNodeId: resultNode?.id ?? state.ui.selectedNodeId,
                focusedNodeId: resultNode?.id ?? state.ui.focusedNodeId,
              },
            }),
          }
        }),

      resetTrainingRun: () =>
        set((state) => ({
          ...stamp({
            training: {
              ...state.training,
              status: 'idle',
              metrics: [],
              predictions: [],
              confusionMatrix: undefined,
              currentEpoch: 0,
              message: 'Training state cleared.',
              currentModelId: undefined,
              modelStorageKey: undefined,
              startedAt: undefined,
              finishedAt: undefined,
            },
          }),
        })),

      loadModelIntoBuilder: (modelId) =>
        set((state) => {
          const model = state.models.find((entry) => entry.id === modelId)

          if (!model) {
            return state
          }

          const builder =
            model.builderSnapshot
              ? cloneBuilderFlow(model.builderSnapshot)
              : createPresetFlow(model.presetId ?? state.training.presetId)

          if (model.builderTitle) {
            builder.title = model.builderTitle
          }

          const nextExperiments = model.datasetId
            ? state.experiments.map((experiment, index) =>
                index === 0
                  ? {
                      ...experiment,
                      datasetId: model.datasetId ?? experiment.datasetId,
                      presetId: model.presetId ?? experiment.presetId,
                    }
                  : experiment,
              )
            : state.experiments
          const nextState = {
            ...state,
            builder,
            experiments: nextExperiments,
          }

          return {
            ...stamp({
              builder,
              experiments: nextExperiments,
              links:
                model.datasetId
                  ? syncExperimentDatasetLink(nextState, model.datasetId)
                  : state.links,
              training: {
                ...state.training,
                presetId: model.presetId ?? state.training.presetId,
                config: model.configSnapshot ?? state.training.config,
                message: `Loaded ${model.title} into the builder.`,
              },
              ui: {
                ...state.ui,
                activeBottomTab: 'builder',
              },
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      setBuilderSelection: (nodeId) =>
        set((state) =>
          state.ui.selectedBuilderNodeId === nodeId
            ? state
            : {
                ui: {
                  ...state.ui,
                  selectedBuilderNodeId: nodeId,
                },
              },
        ),

      setBuilderFlow: (flow) =>
        set((state) => {
          const nextState = {
            ...state,
            builder: flow,
          }
          return {
            ...stamp({
              builder: flow,
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      updateBuilderNodeConfig: (nodeId, key, value) =>
        set((state) => {
          const builder = {
            ...state.builder,
            nodes: state.builder.nodes.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    config: {
                      ...node.config,
                      [key]: value,
                    },
                  }
                : node,
            ),
          }
          const nextState = {
            ...state,
            builder,
          }
          return {
            ...stamp({
              builder,
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      deleteBuilderNode: (nodeId) =>
        set((state) => {
          const builder = {
            ...state.builder,
            nodes: state.builder.nodes.filter((node) => node.id !== nodeId),
            edges: state.builder.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId,
            ),
          }
          const nextState = {
            ...state,
            builder,
          }
          return {
            ...stamp({
              builder,
              ui: {
                ...state.ui,
                selectedBuilderNodeId:
                  state.ui.selectedBuilderNodeId === nodeId
                    ? undefined
                    : state.ui.selectedBuilderNodeId,
              },
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      addBuilderNode: (node) =>
        set((state) => {
          const builder = {
            ...state.builder,
            nodes: [...state.builder.nodes, node],
          }
          const nextState = {
            ...state,
            builder,
          }
          return {
            ...stamp({
              builder,
              ui: {
                ...state.ui,
                selectedBuilderNodeId: node.id,
                activeBottomTab: 'builder',
              },
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      updateBuilderGraph: (nodes, edges) =>
        set((state) => {
          const builder = {
            ...state.builder,
            nodes,
            edges,
          }
          const nextState = {
            ...state,
            builder,
          }
          return {
            ...stamp({
              builder,
              ...updateArchitectureNode(nextState),
            }),
          }
        }),

      importWorkspace: (workspace) =>
        set(() => ({
          ...workspace,
        })),

      resetWorkspace: () => {
        const freshState = createDefaultWorkspaceState()
        set(() => ({
          ...freshState,
          ...updateArchitectureNode(freshState),
        }))
      },

      getWorkspaceData: () => extractWorkspaceData(get()),
    }),
    {
      name: storageKeys.workspace,
      version: SAVE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => extractWorkspaceData(state),
      merge: (persistedState, currentState) => {
        const current = currentState as LabStore
        const fallback = extractWorkspaceData(current)
        const normalized = normalizeImportedWorkspace(persistedState, fallback)
        return {
          ...current,
          ...normalized,
        }
      },
    },
  ),
)
