import { defaultState } from "./defaultState";
import type { PersistedAppState } from "./types";

export const SAVE_VERSION = 1;

export function migrateAppState(value: unknown): PersistedAppState {
  if (!value || typeof value !== "object") {
    return defaultState;
  }

  const candidate = value as Partial<PersistedAppState>;
  if (candidate.version !== SAVE_VERSION) {
    return {
      ...defaultState,
      ...candidate,
      version: SAVE_VERSION,
      settings: { ...defaultState.settings, ...candidate.settings },
      stats: candidate.stats ?? defaultState.stats,
      saves: candidate.saves ?? {},
      recentMatches: candidate.recentMatches ?? [],
    };
  }

  return {
    ...defaultState,
    ...candidate,
    settings: { ...defaultState.settings, ...candidate.settings },
    stats: candidate.stats ?? defaultState.stats,
    saves: candidate.saves ?? {},
    recentMatches: candidate.recentMatches ?? [],
  };
}
