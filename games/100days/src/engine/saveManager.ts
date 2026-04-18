import { createEmptySave } from "../memory/defaultState";
import { migrateSave } from "../memory/saveSchema";
import { storageKeys } from "../memory/storageKeys";
import type { SaveData, SettingsData } from "../memory/types";

export class SaveManager {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(storageKeys.save);
      if (!raw) {
        return createEmptySave();
      }
      return migrateSave(JSON.parse(raw));
    } catch {
      return createEmptySave();
    }
  }

  save(data: SaveData): void {
    localStorage.setItem(storageKeys.save, JSON.stringify(data));
  }

  saveRun(data: SaveData, run: SaveData["currentRun"]): SaveData {
    const next = { ...data, currentRun: run };
    this.save(next);
    return next;
  }

  saveSettings(data: SaveData, settings: SettingsData): SaveData {
    const next = { ...data, settings };
    this.save(next);
    return next;
  }

  clearRun(data: SaveData): SaveData {
    const next = { ...data, currentRun: null };
    this.save(next);
    return next;
  }

  reset(): SaveData {
    const next = createEmptySave();
    this.save(next);
    return next;
  }
}
