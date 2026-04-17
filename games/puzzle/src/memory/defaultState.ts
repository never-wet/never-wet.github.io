import { STORAGE_VERSION } from "./storageKeys";
import type { GameSettings, GameState } from "./types";

export const defaultSettings: GameSettings = {
  timerEnabled: true,
  soundEnabled: false,
  reducedMotion: false,
  highContrast: false,
  hintsEnabled: true,
  defaultViewMode: "immersive",
};

export const defaultState: GameState = {
  version: STORAGE_VERSION,
  puzzleProgress: {},
  escapeProgress: {},
  inventory: {},
  settings: defaultSettings,
  currentPuzzleId: undefined,
  recentActivity: [],
  stats: {
    totalSolved: 0,
    totalStarted: 0,
    totalHintsUsed: 0,
    streakDays: 0,
    lastPlayedAt: undefined,
    categoryCompletion: {},
  },
};
