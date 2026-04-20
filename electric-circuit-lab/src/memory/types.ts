export type AppSection =
  | 'home'
  | 'learn'
  | 'builder'
  | 'simulation'
  | 'practice'
  | 'sandbox'
  | 'library'
  | 'progress'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type ComponentCategory =
  | 'sources'
  | 'passive'
  | 'outputs'
  | 'controls'
  | 'logic'
  | 'sensors'
  | 'advanced'
export type SimulationSupport = 'supported' | 'preview' | 'planned'
export type ParameterType = 'number' | 'boolean' | 'select' | 'text'
export type TerminalRole =
  | 'input'
  | 'output'
  | 'bidirectional'
  | 'power'
  | 'ground'
  | 'anode'
  | 'cathode'
  | 'collector'
  | 'emitter'
  | 'base'
  | 'sensor'

export type BoardPlacementMode = 'grid' | 'freeform'
export type WorkspaceType = 'builder' | 'simulation' | 'sandbox'
export type InspectorTab = 'inspector' | 'simulation' | 'lesson'
export type BottomPanelTab = 'guide' | 'log' | 'formula'
export type PrimitiveValue = string | number | boolean

export interface Point {
  x: number
  y: number
}

export interface TerminalDefinition {
  id: string
  label: string
  role: TerminalRole
  x: number
  y: number
}

export interface ParameterOption {
  value: string
  label: string
}

export interface ParameterSchema {
  id: string
  label: string
  type: ParameterType
  defaultValue: PrimitiveValue
  unit?: string
  min?: number
  max?: number
  step?: number
  options?: ParameterOption[]
  educationalHint?: string
}

export interface ComponentDefinition {
  id: string
  name: string
  shortName: string
  category: ComponentCategory
  symbol: string
  description: string
  educationalSummary: string
  terminals: TerminalDefinition[]
  parameters: ParameterSchema[]
  examples: string[]
  validationRules: string[]
  formula?: string
  simulationSupport: SimulationSupport
  defaultSize: {
    width: number
    height: number
  }
  phaseSupport: {
    phase1: boolean
    phase2Notes: string
  }
}

export interface ComponentInstance {
  id: string
  typeId: string
  label?: string
  position: Point
  rotation: 0 | 90 | 180 | 270
  flipX: boolean
  params: Record<string, PrimitiveValue>
}

export interface WireEndpoint {
  componentId: string
  terminalId: string
}

export interface Wire {
  id: string
  from: WireEndpoint
  to: WireEndpoint
}

export interface CircuitBoardState {
  placementMode: BoardPlacementMode
  zoom: number
  pan: Point
  showGrid: boolean
}

export interface CircuitDocument {
  id: string
  name: string
  description: string
  mode: 'guided' | 'builder' | 'sandbox' | 'challenge'
  components: ComponentInstance[]
  wires: Wire[]
  board: CircuitBoardState
  createdAt: string
  updatedAt: string
  linkedLessonId?: string
  linkedQuizId?: string
  tags: string[]
}

export interface SampleCircuitDefinition {
  id: string
  title: string
  summary: string
  circuit: CircuitDocument
  learningFocus: string[]
}

export interface LessonDefinition {
  id: string
  title: string
  difficulty: DifficultyLevel
  duration: string
  summary: string
  prerequisites: string[]
  goals: string[]
  concepts: string[]
  steps: string[]
  checkpoints: string[]
  commonMistakes: string[]
  challengePrompt: string
  relatedQuizId?: string
  sampleCircuitId?: string
  exampleComponentIds: string[]
}

export type QuizKind =
  | 'multiple-choice'
  | 'component-match'
  | 'prediction'
  | 'troubleshooting'
  | 'build-check'

export interface QuizChoice {
  id: string
  label: string
}

export interface BuildRequirement {
  requiredTypes: string[]
  requiredTypeCounts?: Record<string, number>
  minimumWires: number
  mustBeClosedLoop?: boolean
  minimumBranches?: number
  requiredPoweredTypes?: string[]
  forbiddenTypes?: string[]
  notes: string[]
}

export interface QuizDefinition {
  id: string
  title: string
  difficulty: DifficultyLevel
  kind: QuizKind
  prompt: string
  hint: string
  explanation: string
  sampleCircuitId?: string
  tags: string[]
  choices?: QuizChoice[]
  correctChoiceId?: string
  expectedBuild?: BuildRequirement
}

export interface QuizResult {
  attempts: number
  bestScore: number
  lastCorrect: boolean
  completedAt?: string
}

export interface LearningProgress {
  completedLessonIds: string[]
  unlockedLessonIds: string[]
  activeLessonId: string
}

export interface PracticeProgress {
  activeQuizId: string
  unlockedQuizIds: string[]
  results: Record<string, QuizResult>
}

export interface DashboardProgress {
  recentCircuitIds: string[]
  unlockedChallengeIds: string[]
}

export interface SimulationWarning {
  id: string
  severity: 'info' | 'warning' | 'error'
  message: string
  relatedIds?: string[]
}

export interface SimulationNodeState {
  id: string
  label: string
  voltage: number
  isPowered: boolean
  isGrounded: boolean
}

export interface ComponentSimulationState {
  componentId: string
  status: 'idle' | 'powered' | 'off' | 'warning' | 'unsupported'
  current?: number
  voltageDrop?: number
  digitalHigh?: boolean
  brightness?: number
  notes: string[]
}

export interface SimulationBranchState {
  id: string
  sourceId: string
  label: string
  estimatedCurrent: number
  estimatedResistance: number
  componentIds: string[]
  notes: string[]
}

export interface SimulationResult {
  ranAt: string
  supported: boolean
  isClosedCircuit: boolean
  estimatedEquivalentResistance: number
  estimatedCurrent: number
  warnings: SimulationWarning[]
  activePathComponentIds: string[]
  branchStates: SimulationBranchState[]
  nodeStates: SimulationNodeState[]
  componentStates: Record<string, ComponentSimulationState>
  log: string[]
}

export interface SimulationPreferences {
  autoRun: boolean
  highlightCurrent: boolean
}

export interface UiPreferences {
  activeSection: AppSection
  activeWorkspace: WorkspaceType
  inspectorTab: InspectorTab
  bottomPanelTab: BottomPanelTab
}

export interface SelectionState {
  componentIds: string[]
  wireIds: string[]
}

export interface CircuitHistoryState {
  past: CircuitDocument[]
  future: CircuitDocument[]
}

export interface WireDraft {
  start: WireEndpoint
  pointer: Point | null
}

export interface PersistedCircuitLabState {
  schemaVersion: number
  currentCircuit: CircuitDocument
  savedCircuits: CircuitDocument[]
  learning: LearningProgress
  practice: PracticeProgress
  dashboard: DashboardProgress
  ui: UiPreferences
  simulationPreferences: SimulationPreferences
  lastOpenedWorkspaceId?: string
}

export interface CircuitLabState extends PersistedCircuitLabState {
  history: CircuitHistoryState
  selection: SelectionState
  draftWire: WireDraft | null
  simulationResult: SimulationResult | null
}
