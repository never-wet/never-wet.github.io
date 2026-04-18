import { createSaveFile, manualSlotIds, migrateSave } from "../../memory/saveSchema";
import { storageKeys } from "../../memory/storageKeys";
import type { GameState, SaveFile, SaveSlotRecord, SettingsState } from "../../memory/types";

const emptyRecord = (): SaveSlotRecord => ({
  manual: Object.fromEntries(manualSlotIds.map((slotId) => [slotId, undefined])),
});

const canUseStorage = () => typeof window !== "undefined" && "localStorage" in window;

export const loadSaveRecord = (): SaveSlotRecord => {
  if (!canUseStorage()) {
    return emptyRecord();
  }

  try {
    const raw = window.localStorage.getItem(storageKeys.saveSlots);
    if (!raw) {
      return emptyRecord();
    }
    const parsed = JSON.parse(raw) as SaveSlotRecord;
    const record = emptyRecord();

    record.autosave = parsed.autosave ? migrateSave(parsed.autosave) ?? undefined : undefined;
    manualSlotIds.forEach((slotId) => {
      record.manual[slotId] = parsed.manual?.[slotId] ? migrateSave(parsed.manual[slotId]) ?? undefined : undefined;
    });

    return record;
  } catch {
    return emptyRecord();
  }
};

export const writeSaveRecord = (record: SaveSlotRecord) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(storageKeys.saveSlots, JSON.stringify(record));
};

export const saveAutosave = (state: GameState) => {
  const record = loadSaveRecord();
  record.autosave = createSaveFile(state, "autosave", "Autosave");
  writeSaveRecord(record);
};

export const saveManualSlot = (state: GameState, slotId: string, label: string) => {
  const record = loadSaveRecord();
  record.manual[slotId] = createSaveFile(state, slotId, label);
  writeSaveRecord(record);
};

export const deleteManualSlot = (slotId: string) => {
  const record = loadSaveRecord();
  record.manual[slotId] = undefined;
  writeSaveRecord(record);
};

export const getLatestSave = (record = loadSaveRecord()): SaveFile | null => {
  const saves = [record.autosave, ...Object.values(record.manual)].filter(Boolean) as SaveFile[];
  if (saves.length === 0) {
    return null;
  }
  return saves.sort((a, b) => b.savedAt - a.savedAt)[0];
};

export const exportSaveFile = (saveFile: SaveFile) => JSON.stringify(saveFile, null, 2);

export const importSaveFile = (payload: string): SaveFile | null => {
  try {
    const parsed = JSON.parse(payload);
    return migrateSave(parsed);
  } catch {
    return null;
  }
};

export const loadSettings = (): SettingsState | null => {
  if (!canUseStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKeys.settings);
    return raw ? (JSON.parse(raw) as SettingsState) : null;
  } catch {
    return null;
  }
};

export const saveSettings = (settings: SettingsState) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
};
