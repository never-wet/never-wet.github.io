import {
  createContext,
  type Dispatch,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { audioManager } from "../lib/audio/audioManager";
import { gameReducer, type GameAction } from "../lib/game/reducer";
import { createDefaultState, defaultSettings } from "../memory/defaultState";
import type { GameState, SaveFile, SaveSlotRecord } from "../memory/types";
import {
  deleteManualSlot,
  exportSaveFile,
  getLatestSave,
  importSaveFile,
  loadSaveRecord,
  loadSettings,
  saveAutosave,
  saveManualSlot,
  saveSettings,
} from "../lib/storage/saveService";

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  saveRecord: SaveSlotRecord;
  latestSave: SaveFile | null;
  startNewGame: (playerName?: string) => void;
  loadGame: (saveFile: SaveFile) => void;
  continueLatest: () => void;
  saveToSlot: (slotId: string) => void;
  deleteSlot: (slotId: string) => void;
  exportCurrentSave: () => string;
  importSavePayload: (payload: string) => boolean;
  resetToTitle: () => void;
  unlockAudio: () => Promise<void>;
}

const titleState = () => {
  const state = createDefaultState("Rowan");
  state.status = "title";
  state.activeSceneId = null;
  state.activeNodeId = null;
  state.notifications = [];
  state.settings = { ...defaultSettings };
  return state;
};

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider = ({ children }: PropsWithChildren) => {
  const initial = titleState();
  const storedSettings = loadSettings();
  initial.settings = storedSettings ? { ...initial.settings, ...storedSettings } : initial.settings;

  const [state, dispatch] = useReducer(gameReducer, initial);
  const [saveRecord, setSaveRecord] = useState<SaveSlotRecord>(() => loadSaveRecord());
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    audioManager.applySettings(state.settings);
    saveSettings(state.settings);
  }, [state.settings]);

  useEffect(() => {
    if (state.status !== "playing") {
      return;
    }

    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = window.setTimeout(() => {
      saveAutosave(state);
      setSaveRecord(loadSaveRecord());
    }, 700);

    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
      }
    };
  }, [state]);

  useEffect(() => {
    if (state.status !== "playing") {
      return;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: "TICK_PLAYTIME", seconds: 1 });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.status]);

  const latestSave = getLatestSave(saveRecord);

  const value: GameContextValue = {
    state,
    dispatch,
    saveRecord,
    latestSave,
    startNewGame: (playerName?: string) => {
      dispatch({ type: "NEW_GAME", playerName });
    },
    loadGame: (saveFile: SaveFile) => {
      dispatch({ type: "LOAD_STATE", state: saveFile.state });
    },
    continueLatest: () => {
      const save = getLatestSave(saveRecord);
      if (save) {
        dispatch({ type: "LOAD_STATE", state: save.state });
      }
    },
    saveToSlot: (slotId: string) => {
      saveManualSlot(state, slotId, `Journey ${slotId.replace("slot-", "Slot ")}`);
      setSaveRecord(loadSaveRecord());
    },
    deleteSlot: (slotId: string) => {
      deleteManualSlot(slotId);
      setSaveRecord(loadSaveRecord());
    },
    exportCurrentSave: () => exportSaveFile({ version: state.version, slotId: "export", savedAt: Date.now(), state }),
    importSavePayload: (payload: string) => {
      const imported = importSaveFile(payload);
      if (!imported) {
        return false;
      }
      dispatch({ type: "LOAD_STATE", state: imported.state });
      return true;
    },
    resetToTitle: () => {
      dispatch({ type: "LOAD_STATE", state: titleState() });
    },
    unlockAudio: async () => {
      await audioManager.unlock();
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
