import { createEmptyStatsRecord } from "./statsSchema";
import type { PersistedAppState } from "./types";

export const defaultState: PersistedAppState = {
  version: 1,
  lastPlayedGameId: null,
  settings: {
    theme: "midnight",
    animations: true,
    sound: false,
    coordinateLabels: true,
  },
  stats: createEmptyStatsRecord(),
  saves: {},
  recentMatches: [],
};
