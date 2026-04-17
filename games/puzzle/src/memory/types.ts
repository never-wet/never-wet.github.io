export type PuzzleDifficulty = "Novice" | "Analyst" | "Expert" | "Mastermind";

export type PuzzleCategoryId =
  | "pattern-recognition"
  | "analogies"
  | "odd-one-out"
  | "syllogism-deduction"
  | "truth-lie"
  | "sequence-systems"
  | "grid-logic"
  | "cipher-lab"
  | "signal-decoding"
  | "observation-scenes"
  | "passcodes-locks"
  | "word-riddles"
  | "meta-puzzles";

export type PuzzleType =
  | "multipleChoice"
  | "textInput"
  | "sequence"
  | "matchPairs"
  | "arrange"
  | "hotspot"
  | "combinationLock"
  | "spotDifference";

export type PuzzleStatus = "locked" | "available" | "started" | "solved";
export type RoomStatus = "locked" | "unlocked" | "in_progress" | "escaped";

export interface CategoryDefinition {
  id: PuzzleCategoryId;
  name: string;
  blurb: string;
  accent: string;
  icon: string;
  heroMetric: string;
  route: string;
}

export interface HintDefinition {
  id: string;
  title: string;
  text: string;
  penalty: number;
}

export interface PuzzleGuide {
  title?: string;
  summary: string;
  steps?: string[];
}

export interface UnlockCondition {
  description?: string;
  requiredPuzzleIds?: string[];
  requiredRoomIds?: string[];
  requiredTotalSolved?: number;
  requiredCategoryCounts?: Partial<Record<PuzzleCategoryId, number>>;
}

export interface VisualGlyph {
  kind: "rect" | "circle" | "ring" | "diamond" | "line" | "triangle" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  letterSpacing?: number;
  align?: "start" | "middle" | "end";
}

export interface PuzzleVisual {
  variant?: "tile" | "diagram" | "code" | "paper";
  background?: string;
  accent?: string;
  frameLabel?: string;
  caption?: string;
  aspectRatio?: "square" | "wide";
  grid?: boolean;
  glyphs: VisualGlyph[];
}

export interface PuzzleChoice {
  id: string;
  label: string;
  detail?: string;
  visual?: PuzzleVisual;
}

export interface MatchItem {
  id: string;
  label: string;
  visual?: PuzzleVisual;
}

export interface ArrangeItem {
  id: string;
  label: string;
  note?: string;
  visual?: PuzzleVisual;
}

export interface SceneElement {
  id: string;
  label: string;
  shape: "rect" | "circle" | "pill" | "beam" | "ring" | "diamond" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color: string;
  opacity?: number;
  border?: string;
}

export interface HotspotDefinition {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
  result: string;
  itemId?: string;
  linkedPuzzleId?: string;
  unlocksSceneId?: string;
  requiresItemIds?: string[];
  tags?: string[];
}

export interface SceneDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  theme: string;
  backdrop: string;
  accent: string;
  elements: SceneElement[];
  hotspots: HotspotDefinition[];
  objective?: string;
}

export interface ClueBlock {
  title: string;
  body: string;
  tone?: "neutral" | "warning" | "success";
  visual?: PuzzleVisual;
}

export interface MultipleChoiceContent {
  kind: "multipleChoice";
  prompt: string;
  question: string;
  promptVisual?: PuzzleVisual;
  choices: PuzzleChoice[];
  correctChoiceId: string;
  evidence?: string[];
}

export interface TextInputContent {
  kind: "textInput";
  prompt: string;
  promptVisual?: PuzzleVisual;
  placeholder: string;
  acceptedAnswers: string[];
  clueBlocks?: ClueBlock[];
  answerFormat?: string;
}

export interface SequenceContent {
  kind: "sequence";
  prompt: string;
  promptVisual?: PuzzleVisual;
  sequence: string[];
  sequenceVisuals?: PuzzleVisual[];
  missingIndex?: number;
  options: string[];
  optionVisuals?: Record<string, PuzzleVisual>;
  acceptedAnswer: string;
}

export interface MatchPairsContent {
  kind: "matchPairs";
  prompt: string;
  promptVisual?: PuzzleVisual;
  left: MatchItem[];
  right: MatchItem[];
  solution: Record<string, string>;
}

export interface ArrangeContent {
  kind: "arrange";
  prompt: string;
  promptVisual?: PuzzleVisual;
  items: ArrangeItem[];
  solution: string[];
  completionText: string;
}

export interface HotspotContent {
  kind: "hotspot";
  prompt: string;
  mode: "inspect" | "hiddenObjects";
  scene: SceneDefinition;
  requiredHotspotIds: string[];
  passcode?: {
    label: string;
    placeholder: string;
    acceptedAnswer: string;
  };
}

export interface CombinationLockContent {
  kind: "combinationLock";
  prompt: string;
  promptVisual?: PuzzleVisual;
  keypadLabel: string;
  codeLength: number;
  acceptedCode: string;
  clueBlocks?: ClueBlock[];
}

export interface SpotDifferenceContent {
  kind: "spotDifference";
  prompt: string;
  leftScene: SceneDefinition;
  rightScene: SceneDefinition;
  requiredHotspotIds: string[];
}

export type PuzzleContent =
  | MultipleChoiceContent
  | TextInputContent
  | SequenceContent
  | MatchPairsContent
  | ArrangeContent
  | HotspotContent
  | CombinationLockContent
  | SpotDifferenceContent;

export interface PuzzleDefinition {
  id: string;
  title: string;
  category: PuzzleCategoryId;
  difficulty: PuzzleDifficulty;
  type: PuzzleType;
  description: string;
  instructions: string;
  assets: string[];
  clueData: string[];
  validation: {
    mode: "choice" | "text" | "sequence" | "pairs" | "arrange" | "hotspot" | "lock";
    acceptableAnswers?: string[];
  };
  hints: HintDefinition[];
  unlock: UnlockCondition;
  guide?: PuzzleGuide;
  tags: string[];
  estimatedTime: number;
  relatedPuzzles: string[];
  featured?: boolean;
  content: PuzzleContent;
  roomBinding?: {
    roomId: string;
    sceneId: string;
  };
}

export interface PuzzleIndexEntry {
  id: string;
  title: string;
  category: PuzzleCategoryId;
  difficulty: PuzzleDifficulty;
  type: PuzzleType;
  tags: string[];
  estimatedTime: number;
  featured?: boolean;
  unlockSummary: string;
}

export interface EscapeRoomTransition {
  label: string;
  targetSceneId: string;
  description: string;
  requiredItemIds?: string[];
  requiredHotspotIds?: string[];
}

export interface InventoryItemDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  roomId: string;
  combinableWith?: string[];
  combinationResultId?: string;
}

export interface EscapeRoomDefinition {
  id: string;
  title: string;
  blurb: string;
  tagline: string;
  difficulty: PuzzleDifficulty;
  estimatedTime: number;
  unlock: UnlockCondition;
  intro: string;
  exitGoal: string;
  featuredPuzzleIds: string[];
  inventory: InventoryItemDefinition[];
  scenes: SceneDefinition[];
  transitions: Record<string, EscapeRoomTransition[]>;
}

export interface EscapeRoomIndexEntry {
  id: string;
  title: string;
  difficulty: PuzzleDifficulty;
  estimatedTime: number;
  sceneCount: number;
  featuredPuzzleIds: string[];
  unlockSummary: string;
}

export interface PuzzleActivitySnapshot {
  startedAt?: string;
  solvedAt?: string;
  lastPlayedAt?: string;
  hintsUsed: number;
  completionPercent: number;
}

export interface PuzzleProgress {
  puzzleId: string;
  status: Exclude<PuzzleStatus, "locked" | "available"> | "unseen";
  startedAt?: string;
  solvedAt?: string;
  lastPlayedAt?: string;
  hintsUsed: number;
  score: number;
  stars: number;
  attempts: number;
  revealedAnswer: boolean;
  bestTimeSeconds?: number;
  sessionData?: Record<string, unknown>;
}

export interface InventoryState {
  itemId: string;
  roomId: string;
  collectedAt: string;
  usedAt?: string;
}

export interface EscapeRoomProgress {
  roomId: string;
  status: RoomStatus;
  startedAt?: string;
  completedAt?: string;
  currentSceneId: string;
  unlockedSceneIds: string[];
  visitedSceneIds: string[];
  discoveredHotspotIds: string[];
  solvedPuzzleIds: string[];
  collectedItemIds: string[];
}

export interface GameSettings {
  timerEnabled: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  hintsEnabled: boolean;
  defaultViewMode: "immersive" | "compact";
}

export type ActivityType =
  | "puzzle_started"
  | "puzzle_solved"
  | "hint_used"
  | "answer_revealed"
  | "room_started"
  | "scene_unlocked"
  | "room_escaped"
  | "item_collected"
  | "settings_updated"
  | "progress_reset";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  label: string;
  entityId: string;
  timestamp: string;
  detail?: string;
}

export interface GameStats {
  totalSolved: number;
  totalStarted: number;
  totalHintsUsed: number;
  streakDays: number;
  lastPlayedAt?: string;
  categoryCompletion: Partial<Record<PuzzleCategoryId, number>>;
}

export interface GameState {
  version: number;
  puzzleProgress: Record<string, PuzzleProgress>;
  escapeProgress: Record<string, EscapeRoomProgress>;
  inventory: Record<string, InventoryState>;
  settings: GameSettings;
  currentPuzzleId?: string;
  recentActivity: ActivityEntry[];
  stats: GameStats;
}

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  tone?: "neutral" | "success" | "warning";
}
