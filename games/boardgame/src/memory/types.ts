import type { ComponentType } from "react";

export const gameIds = [
  "chess",
  "connect4",
  "checkers",
  "tictactoe",
  "reversi",
  "gomoku",
] as const;

export type GameId = (typeof gameIds)[number];
export type Difficulty = "easy" | "medium" | "hard";
export type MatchResult = "win" | "loss" | "draw";
export type ThemeMode = "midnight" | "paper";

export interface RuleSection {
  title: string;
  body: string;
}

export interface GameStatus {
  phase: "playing" | "win" | "loss" | "draw";
  headline: string;
  detail: string;
}

export interface SidebarStat {
  label: string;
  value: string;
}

export interface MatchRecord {
  id: string;
  gameId: GameId;
  result: MatchResult;
  difficulty: Difficulty;
  turnCount: number;
  summary: string;
  completedAt: string;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  played: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: string | null;
  lastDifficulty: Difficulty | null;
}

export interface SaveSlot {
  gameId: GameId;
  difficulty: Difficulty;
  state: unknown;
  undoStack: unknown[];
  updatedAt: string;
  isComplete: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  animations: boolean;
  sound: boolean;
  coordinateLabels: boolean;
}

export interface PersistedAppState {
  version: number;
  lastPlayedGameId: GameId | null;
  settings: AppSettings;
  stats: Record<GameId, GameStats>;
  saves: Partial<Record<GameId, SaveSlot>>;
  recentMatches: MatchRecord[];
}

export interface DifficultyProfile {
  label: string;
  description: string;
  moveDelayMs: number;
  randomness: number;
  searchDepth: Partial<Record<GameId, number>>;
}

export interface GameCardMeta {
  id: GameId;
  title: string;
  shortDescription: string;
  longDescription: string;
  tag: string;
  accent: string;
  boardShape: string;
  heroMetric: string;
  bullets: string[];
  difficultyNote: string;
}

export interface NavItem {
  label: string;
  to: string;
}

export interface DashboardPanel {
  title: string;
  description: string;
}

export interface GameBoardProps<State, Move> {
  state: State;
  disabled: boolean;
  coordinateLabels: boolean;
  onMove: (move: Move) => void;
}

export interface GameModule<State = unknown, Move = unknown> {
  id: GameId;
  name: string;
  createInitialState: () => State;
  parseState: (value: unknown) => State;
  serializeState: (state: State) => unknown;
  getStatus: (state: State) => GameStatus;
  getMoveHistory: (state: State) => string[];
  getSidebarStats: (state: State) => SidebarStat[];
  getTurnCount: (state: State) => number;
  isAiTurn: (state: State) => boolean;
  applyMove: (state: State, move: Move) => State;
  getAiMove: (state: State, difficulty: Difficulty) => Move | null;
  Board: ComponentType<GameBoardProps<State, Move>>;
  rules: RuleSection[];
}
