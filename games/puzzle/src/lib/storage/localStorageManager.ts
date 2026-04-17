import { defaultState } from "../../memory/defaultState";
import { STORAGE_KEYS, STORAGE_VERSION } from "../../memory/storageKeys";
import type { GameState } from "../../memory/types";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeState(snapshot: unknown): GameState {
  if (!isRecord(snapshot)) {
    return { ...defaultState };
  }

  const puzzleProgress = isRecord(snapshot.puzzleProgress) ? snapshot.puzzleProgress : {};
  const escapeProgress = isRecord(snapshot.escapeProgress) ? snapshot.escapeProgress : {};
  const inventory = isRecord(snapshot.inventory) ? snapshot.inventory : {};
  const settings = isRecord(snapshot.settings)
    ? { ...defaultState.settings, ...snapshot.settings }
    : defaultState.settings;
  const recentActivity = Array.isArray(snapshot.recentActivity) ? snapshot.recentActivity : [];
  const stats = isRecord(snapshot.stats) ? { ...defaultState.stats, ...snapshot.stats } : defaultState.stats;

  return {
    version: typeof snapshot.version === "number" ? snapshot.version : STORAGE_VERSION,
    puzzleProgress: puzzleProgress as GameState["puzzleProgress"],
    escapeProgress: escapeProgress as GameState["escapeProgress"],
    inventory: inventory as GameState["inventory"],
    settings,
    currentPuzzleId:
      typeof snapshot.currentPuzzleId === "string" ? snapshot.currentPuzzleId : undefined,
    recentActivity: recentActivity as GameState["recentActivity"],
    stats,
  };
}

function migrateState(snapshot: unknown): GameState {
  const sanitized = sanitizeState(snapshot);

  if (sanitized.version === STORAGE_VERSION) {
    return sanitized;
  }

  return {
    ...sanitized,
    version: STORAGE_VERSION,
  };
}

export const LocalStorageManager = {
  load(): GameState {
    if (!canUseStorage()) {
      return { ...defaultState };
    }

    const raw =
      window.localStorage.getItem(STORAGE_KEYS.root) ??
      STORAGE_KEYS.legacyRoots
        .map((key) => window.localStorage.getItem(key))
        .find((value) => value !== null) ??
      null;

    if (!raw) {
      return { ...defaultState };
    }

    try {
      return migrateState(JSON.parse(raw));
    } catch {
      return { ...defaultState };
    }
  },

  save(state: GameState) {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.root, JSON.stringify(state));
  },

  reset() {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEYS.root);
    STORAGE_KEYS.legacyRoots.forEach((key) => window.localStorage.removeItem(key));
  },
};
