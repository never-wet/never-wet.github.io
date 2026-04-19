export type LabMode = 'beginner' | 'advanced'

export type BottomTabId = 'builder' | 'training' | 'notes' | 'workspace'

export type InspectorTabId = 'overview' | 'connections' | 'metrics'

export type NodeCategory =
  | 'neural'
  | 'note'
  | 'dataset'
  | 'experiment'
  | 'model'
  | 'idea'
  | 'task'
  | 'layerGroup'
  | 'result'

export type NodeVisualGroup =
  | 'architecture'
  | 'knowledge'
  | 'data'
  | 'workflow'
  | 'results'

export type EntityKind =
  | 'note'
  | 'dataset'
  | 'experiment'
  | 'model'
  | 'result'
  | 'idea'
  | 'task'
  | 'builder'

export type GraphClusterId =
  | 'knowledge-hub'
  | 'dataset-dock'
  | 'experiment-bay'
  | 'model-orbit'
  | 'results-shell'

export type BuilderBlockKind =
  | 'input'
  | 'dense'
  | 'activation'
  | 'dropout'
  | 'normalization'
  | 'reshape'
  | 'output'
  | 'dataset'
  | 'trainingConfig'
  | 'evaluation'
  | 'note'

export type TrainingTaskType =
  | 'binary-classification'
  | 'multiclass-classification'
  | 'regression'

export type TrainingStatus = 'idle' | 'training' | 'paused' | 'completed' | 'error'

export type FieldInputKind = 'text' | 'textarea' | 'number' | 'range' | 'toggle' | 'select'

export type BuilderConfigValue = string | number | boolean

export interface ConfigOption {
  label: string
  value: string | number
}

export interface ConfigFieldDefinition {
  id: string
  label: string
  input: FieldInputKind
  helper: string
  min?: number
  max?: number
  step?: number
  options?: ConfigOption[]
}

export interface ModelBlockDefinition {
  kind: BuilderBlockKind
  label: string
  family: 'model' | 'data' | 'control' | 'annotation'
  description: string
  beginner: boolean
  advanced: boolean
  color: string
  configFields: ConfigFieldDefinition[]
  acceptsFrom: BuilderBlockKind[] | 'any'
  emitsTo: BuilderBlockKind[] | 'any'
}

export interface GraphCategoryVisual {
  label: string
  description: string
  group: NodeVisualGroup
  cluster: GraphClusterId
  color: string
  accent: string
  size: number
  glow: number
}

export interface GraphClusterDefinition {
  id: GraphClusterId
  label: string
  hint: string
  color: string
  origin: {
    x: number
    y: number
    z: number
  }
}

export interface GraphBehaviorManifest {
  defaultCameraDistance: number
  focusCameraDistance: number
  linkOpacity: number
  settleTicks: number
  chargeStrength: number
  collisionRadius: number
  linkDistance: number
}

export interface NodeTypeManifest {
  category: NodeCategory
  detailTitle: string
  description: string
  defaultBottomTab: BottomTabId
  quickActionLabel: string
  relationHint: string
}

export interface GraphNodeRecord {
  id: string
  title: string
  category: NodeCategory
  summary: string
  cluster: GraphClusterId
  group: NodeVisualGroup
  tags: string[]
  entityKind: EntityKind
  entityId?: string
  emphasis: number
  x?: number
  y?: number
  z?: number
}

export interface GraphLinkRecord {
  id: string
  source: string
  target: string
  relation: string
  strength: number
}

export interface MetricSummary {
  loss?: number
  accuracy?: number
  valLoss?: number
  valAccuracy?: number
}

export interface TrainingMetricPoint extends MetricSummary {
  epoch: number
}

export interface PredictionPreview {
  label: string
  expected: string
  predicted: string
  confidence?: number
}

export interface ConfusionMatrix {
  labels: string[]
  values: number[][]
}

export interface NoteRecord {
  id: string
  title: string
  markdown: string
  tags: string[]
  linkedNodeIds: string[]
  linkedNoteIds: string[]
  updatedAt: string
}

export interface DatasetRecord {
  id: string
  title: string
  description: string
  tags: string[]
  schema: string[]
  targetField: string
  sampleRows: Array<Record<string, number | string>>
  presetId: string
}

export interface ExperimentRecord {
  id: string
  title: string
  description: string
  datasetId: string
  architectureNodeId: string
  noteIds: string[]
  modelIds: string[]
  latestResultId?: string
  presetId: string
  status: 'draft' | 'running' | 'trained'
}

export interface ModelRecord {
  id: string
  title: string
  description: string
  experimentId: string
  version: number
  storageKey?: string
  parameterEstimate?: number
  metrics?: MetricSummary
  updatedAt: string
}

export interface ResultRecord {
  id: string
  title: string
  experimentId: string
  observations: string[]
  metrics?: MetricSummary
  createdAt: string
}

export interface BuilderFlowNode {
  id: string
  kind: BuilderBlockKind
  label: string
  description: string
  position: {
    x: number
    y: number
  }
  config: Record<string, BuilderConfigValue>
}

export interface BuilderFlowEdge {
  id: string
  source: string
  target: string
}

export interface BuilderLayerPlan {
  id: string
  label: string
  kind: BuilderBlockKind
  description: string
  units?: number
  activation?: string
  inputUnits?: number
  parameterEstimate: number
}

export interface BuilderValidationResult {
  valid: boolean
  issues: string[]
  orderedNodes: BuilderFlowNode[]
  layerPlan: BuilderLayerPlan[]
  parameterEstimate: number
}

export interface BuilderFlowState {
  id: string
  title: string
  nodes: BuilderFlowNode[]
  edges: BuilderFlowEdge[]
}

export interface TrainingConfig {
  epochs: number
  batchSize: number
  learningRate: number
  validationSplit: number
  optimizer: 'adam' | 'sgd'
  loss: string
  metricKeys: string[]
}

export interface TrainingPresetDefinition {
  id: string
  name: string
  datasetId: string
  taskType: TrainingTaskType
  description: string
  narrative: string
  recommendedMode: LabMode
  recommendedFlow: BuilderBlockKind[]
  defaultConfig: TrainingConfig
}

export interface BrowserLimits {
  maxGraphNodes: number
  maxGraphLinks: number
  maxEpochs: number
  maxPreviewRows: number
  recommendedTensorBudget: number
}

export interface TrainingState {
  presetId: string
  status: TrainingStatus
  config: TrainingConfig
  metrics: TrainingMetricPoint[]
  predictions: PredictionPreview[]
  confusionMatrix?: ConfusionMatrix
  currentEpoch: number
  message: string
  parameterEstimate: number
  currentModelId?: string
  modelStorageKey?: string
  startedAt?: string
  finishedAt?: string
}

export interface UiState {
  activeBottomTab: BottomTabId
  activeInspectorTab: InspectorTabId
  selectedNodeId?: string
  hoveredNodeId?: string
  focusedNodeId?: string
  selectedBuilderNodeId?: string
  searchQuery: string
  categoryFilters: Record<NodeCategory, boolean>
  showLabels: boolean
  showOnlyConnected: boolean
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
}

export interface WorkspaceStateData {
  mode: LabMode
  nodes: GraphNodeRecord[]
  links: GraphLinkRecord[]
  notes: NoteRecord[]
  datasets: DatasetRecord[]
  experiments: ExperimentRecord[]
  models: ModelRecord[]
  results: ResultRecord[]
  builder: BuilderFlowState
  training: TrainingState
  ui: UiState
  lastSavedAt: string
  saveVersion: number
}

export interface ExportEnvelope {
  version: number
  exportedAt: string
  workspace: WorkspaceStateData
}
