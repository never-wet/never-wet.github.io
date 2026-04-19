import type { SaveState } from "./types";

export const SAVE_VERSION = 1;

export function migrateSave(raw: unknown): SaveState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<SaveState>;
  if (candidate.version !== SAVE_VERSION) {
    return null;
  }

  if (!candidate.currentMapId || !candidate.player || !candidate.settings) {
    return null;
  }

  return candidate as SaveState;
}
