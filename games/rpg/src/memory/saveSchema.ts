import { overworldMaps } from "../data/locations/overworldMaps";
import { defaultSettings } from "./defaultState";
import type { GameState, OverworldPosition, SaveFile } from "./types";

export const SAVE_VERSION = 1;
export const manualSlotIds = ["slot-1", "slot-2", "slot-3"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createSaveFile = (state: GameState, slotId: string, label: string): SaveFile => ({
  version: SAVE_VERSION,
  slotId,
  savedAt: Date.now(),
  state: {
    ...state,
    version: SAVE_VERSION,
    updatedAt: Date.now(),
    saveMeta: {
      slotId,
      label,
      timestamp: Date.now(),
      preview: `${state.player.name} at ${state.currentLocationId}`,
    },
  },
});

export const migrateSave = (raw: unknown): SaveFile | null => {
  if (!isRecord(raw)) {
    return null;
  }

  if (!isRecord(raw.state)) {
    return null;
  }

  const state = raw.state as unknown as GameState;
  const defaultPositions: Record<string, OverworldPosition> = Object.fromEntries(
    overworldMaps.map((map) => [
      map.locationId,
      {
        x: map.spawn.x,
        y: map.spawn.y,
        facing: "right" as const,
        steps: 0,
      },
    ]),
  );

  return {
    version: SAVE_VERSION,
    slotId: typeof raw.slotId === "string" ? raw.slotId : "autosave",
    savedAt: typeof raw.savedAt === "number" ? raw.savedAt : Date.now(),
    state: {
      ...state,
      version: SAVE_VERSION,
      settings: {
        ...defaultSettings,
        ...(isRecord(state.settings) ? state.settings : {}),
      },
      overworld: {
        positions: {
          ...defaultPositions,
          ...(isRecord(state.overworld?.positions) ? state.overworld.positions : {}),
        },
        message: state.overworld?.message ?? null,
        lastEncounterStepByLocation: isRecord(state.overworld?.lastEncounterStepByLocation)
          ? (state.overworld.lastEncounterStepByLocation as Record<string, number>)
          : {},
      },
    },
  };
};
