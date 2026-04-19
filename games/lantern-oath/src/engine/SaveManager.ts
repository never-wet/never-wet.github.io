import { contentRegistry } from "../memory/contentRegistry";
import { createDefaultState } from "../memory/defaultState";
import { migrateSave } from "../memory/saveSchema";
import { STORAGE_KEYS } from "../memory/storageKeys";
import type { SaveSlotSummary, SaveState, SettingsState } from "../memory/types";

export class SaveManager {
  getSlotKey(slot: number): string {
    return `${STORAGE_KEYS.savePrefix}${slot}`;
  }

  saveSlot(state: SaveState): void {
    const mapName = contentRegistry.maps[state.currentMapId]?.name ?? state.currentMapId;
    const payload: SaveState = {
      ...state,
      label: `Chapter ${state.chapter} - ${mapName}`,
      timestamp: Date.now(),
    };

    localStorage.setItem(this.getSlotKey(state.slot), JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEYS.latestSlot, String(state.slot));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload.settings));
  }

  loadSlot(slot: number): SaveState | null {
    const raw = localStorage.getItem(this.getSlotKey(slot));
    if (!raw) {
      return null;
    }

    try {
      return migrateSave(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  loadLatestSlot(): SaveState | null {
    const latest = Number(localStorage.getItem(STORAGE_KEYS.latestSlot));
    if (Number.isFinite(latest) && latest > 0) {
      return this.loadSlot(latest);
    }

    return this.getAllSlotSummaries().find((summary) => summary.exists)
      ? this.loadSlot(this.getAllSlotSummaries().find((summary) => summary.exists)!.slot)
      : null;
  }

  getAllSlotSummaries(): SaveSlotSummary[] {
    return [1, 2, 3].map((slot) => {
      const save = this.loadSlot(slot);
      if (!save) {
        return { slot, exists: false, label: "Empty slot" };
      }

      return {
        slot,
        exists: true,
        label: save.label,
        timestamp: save.timestamp,
        chapter: save.chapter,
        locationName: contentRegistry.maps[save.currentMapId]?.name ?? save.currentMapId,
        playtimeMs: save.playtimeMs,
        completedMainStory: Boolean(save.flags["story.ending_complete"]),
      };
    });
  }

  createFreshSave(slot: number): SaveState {
    const save = createDefaultState(slot);
    const storedSettings = this.loadSettings();
    save.settings = storedSettings;
    return save;
  }

  loadSettings(): SettingsState {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) {
      return createDefaultState(1).settings;
    }

    try {
      const parsed = JSON.parse(raw) as SettingsState;
      return {
        ...createDefaultState(1).settings,
        ...parsed,
      };
    } catch {
      return createDefaultState(1).settings;
    }
  }

  saveSettings(settings: SettingsState): void {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  clearAllSaves(): void {
    [1, 2, 3].forEach((slot) => localStorage.removeItem(this.getSlotKey(slot)));
    localStorage.removeItem(STORAGE_KEYS.latestSlot);
  }
}
