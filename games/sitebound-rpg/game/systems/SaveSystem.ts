import type { QuestId } from "../data/quests";
import type { QuestState } from "./QuestSystem";

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface SaveData {
  player: {
    x: number;
    y: number;
  };
  quests: Record<QuestId, QuestState>;
  unlocked: Record<string, boolean>;
  collected: string[];
  visitedPortals: string[];
  conversationFlags: Record<string, number>;
  settings: GameSettings;
  currentInteriorId: string | null;
  coins: number;
  savedAt: string;
}

const SAVE_KEY = "sitebound-rpg-save-v2";

export function loadSave(): Partial<SaveData> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Partial<SaveData>;
  } catch {
    return null;
  }
}

export function writeSave(data: Omit<SaveData, "savedAt">) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: SaveData = {
    ...data,
    savedAt: new Date().toISOString()
  };

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage can be unavailable in private contexts. The game should keep running.
  }
}

export function clearSave() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SAVE_KEY);
}
