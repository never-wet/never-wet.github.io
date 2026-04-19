import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDefaultWorkspaceState } from '../memory/defaultState'
import { SAVE_SCHEMA_VERSION, normalizeImportedWorkspace } from '../memory/saveSchema'
import { storageKeys } from '../memory/storageKeys'
import { trainingManifest } from '../memory/trainingManifest'
import type {
  BuilderConfigValue,
  BuilderFlowEdge,
  BuilderFlowNode,
  BuilderFlowState,
  ConfusionMatrix,
  GraphNodeRecord,
  LabMode,
  NodeCategory,
  PredictionPreview,
  TrainingConfig,
  TrainingMetricPoint,
  TrainingStatus,
  WorkspaceStateData,
} from '../memory/types'
import { createPresetFlow, validateBuilderFlow } from '../utils/builder'

export interface TrainingCommitPayload {
  status: Extract<TrainingStatus, 'completed' | 'paused' | 'error'>
  message: string
  metrics: TrainingMetricPoint[]
  predictions: PredictionPreview[]
  confusionMatrix?: ConfusionMatrix
  parameterEstimate: number
  modelStorageKey?: string
}

interface LabActions {
  setMode: (mode: LabMode) => void
  setSearchQuery: (query: string) => void
  setBottomTab: (tab: WorkspaceStateData['ui']['activeBottomTab']) => void
  setInspectorTab: (tab: WorkspaceStateData['ui']['activeInspectorTab']) => void
  selectNode: (nodeId?: string) => void
  hoverNode: (nodeId?: string) => void
  toggleCategoryFilter: (category: NodeCategory) => void
  setShowLabels: (enabled: boolean) => void
  setShowOnlyConnected: (enabled: boolean) => void
  updateGraphNodePosition: (
    nodeId: string,
    position: Partial<Pick<GraphNodeRecord, 'x' | 'y' | 'z'>>,
  ) => void
  updateNote: (noteId: string, patch: Partial<Pick<WorkspaceStateData['notes'][number], 'title' | 'markdown' | 'tags'>>) => void
  createLinkedNote: (sourceNodeId?: string) => void
  linkNoteToNode: (noteId: string, nodeId: string) => void
  selectTrainingPreset: (presetId: string) => void
  loadPresetArchitecture: (presetId: string) => void
  updateTrainingConfig: (patch: Partial<TrainingConfig>) => void
  setTrainingStatus: (status: TrainingStatus, message: string) => void
  pushTrainingMetric: (metric: TrainingMetricPoint, parameterEstimate: number) => void
  commitTrainingRun: (payload: TrainingCommitPayload) => void
  resetTrainingRun: () => void
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

      selectTrainingPreset: (presetId) =>
        set((state) => {
          const preset = trainingManifest.presets.find((entry) => entry.id === presetId)
          const dataset = state.datasets.find((entry) => entry.presetId === presetId)

          if (!preset) {
            return state
          }

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
                      datasetId: dataset?.id ?? experiment.datasetId,
                    }
                  : experiment,
              ),
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
