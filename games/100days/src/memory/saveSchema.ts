import { CURRENT_SAVE_VERSION, createDefaultCodex, createDefaultProfile, createDefaultSettings, createEmptySave } from "./defaultState";
import type { SaveData } from "./types";

export const SAVE_VERSION = CURRENT_SAVE_VERSION;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const migrateSave = (raw: unknown): SaveData => {
  if (!isRecord(raw)) {
    return createEmptySave();
  }

  return {
    version: SAVE_VERSION,
    profile: isRecord(raw.profile)
      ? {
          ...createDefaultProfile(),
          ...raw.profile,
          codex: isRecord(raw.profile.codex)
            ? {
                ...createDefaultCodex(),
                ...raw.profile.codex,
              }
            : createDefaultCodex(),
        }
      : createDefaultProfile(),
    settings: isRecord(raw.settings)
      ? {
          ...createDefaultSettings(),
          ...raw.settings,
        }
      : createDefaultSettings(),
    currentRun: isRecord(raw.currentRun) ? (raw.currentRun as unknown as SaveData["currentRun"]) : null,
  };
};
