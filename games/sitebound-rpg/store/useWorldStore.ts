"use client";

import { create } from "zustand";
import type { NPCId } from "../game/data/npcs";
import type { PortalId } from "../game/data/portals";
import type { QuestId } from "../game/data/quests";
import {
  activateQuest,
  createInitialQuests,
  getCurrentQuest,
  progressQuestObjective,
  type QuestState
} from "../game/systems/QuestSystem";
import { loadSave, writeSave, type GameSettings } from "../game/systems/SaveSystem";

export type FacingDirection = "down" | "up" | "left" | "right";
export type WeatherKind = "clear" | "rain" | "snow" | "fog" | "wind";
export type DayPhase = "morning" | "afternoon" | "sunset" | "night";

export interface TilePoint {
  x: number;
  y: number;
}

export interface PlayerSnapshot {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  facing: FacingDirection;
  moving: boolean;
  hp: number;
  maxHp: number;
  coins: number;
  worldWidth: number;
  worldHeight: number;
}

export interface InteractionPrompt {
  id: string;
  label: string;
  action: string;
}

export interface DialogueChoice {
  id: string;
  label: string;
  next?: string;
  questId?: QuestId;
  objectiveId?: string;
  openMiniGame?: MiniGameKind;
  close?: boolean;
}

export interface DialogueLine {
  id?: string;
  speaker: string;
  text: string;
  mood?: "calm" | "bright" | "warning" | "fun";
}

export interface DialogueState {
  sourceId: string;
  lines: DialogueLine[];
  index: number;
  choices: DialogueChoice[];
}

export type MiniGameKind = "circuit_duel" | "market_timing" | "rhythm_pulse";

export interface MiniGameState {
  kind: MiniGameKind;
  title: string;
  playerHp: number;
  enemyHp: number;
  meter: number;
  result: "playing" | "won" | "lost";
  message: string;
  questReward?: {
    questId: QuestId;
    objectiveId: string;
  };
}

export interface WorldNotification {
  id: string;
  text: string;
}

interface WorldStore {
  player: PlayerSnapshot;
  prompt: InteractionPrompt | null;
  dialogue: DialogueState | null;
  quests: Record<QuestId, QuestState>;
  activeQuestId: QuestId;
  unlocked: Record<string, boolean>;
  collected: string[];
  visitedPortals: string[];
  conversationFlags: Record<string, number>;
  notifications: WorldNotification[];
  weather: WeatherKind;
  dayPhase: DayPhase;
  dayProgress: number;
  path: TilePoint[];
  destinationTile: TilePoint | null;
  pathRequestVersion: number;
  teleportRequest: {
    tile: TilePoint;
    interiorId: string | null;
    version: number;
  } | null;
  miniGame: MiniGameState | null;
  settings: GameSettings;
  debugCollision: boolean;
  currentInteriorId: string | null;
  setWorldSize: (width: number, height: number) => void;
  setPlayerSnapshot: (player: Partial<PlayerSnapshot>) => void;
  setPrompt: (prompt: InteractionPrompt | null) => void;
  openDialogue: (sourceId: string, lines: DialogueLine[], choices?: DialogueChoice[]) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
  chooseDialogue: (choice: DialogueChoice) => void;
  activateQuest: (questId: QuestId) => void;
  progressQuest: (questId: QuestId, objectiveId: string, amount?: number) => void;
  collectItem: (id: string, questId?: QuestId, objectiveId?: string) => void;
  visitPortal: (portalId: PortalId) => void;
  unlock: (id: string) => void;
  rememberConversation: (npcId: NPCId | string) => void;
  setWeather: (weather: WeatherKind) => void;
  setDayNight: (phase: DayPhase, progress: number) => void;
  requestPathTo: (tile: TilePoint) => void;
  requestTeleport: (tile: TilePoint, interiorId?: string | null) => void;
  setPath: (path: TilePoint[]) => void;
  clearPath: () => void;
  startMiniGame: (miniGame: MiniGameState) => void;
  setMiniGame: (miniGame: MiniGameState | null) => void;
  toggleDebugCollision: () => void;
  setCurrentInterior: (id: string | null) => void;
  pushNotification: (text: string) => void;
  dismissNotification: (id: string) => void;
  setSettings: (settings: Partial<GameSettings>) => void;
  saveGame: () => void;
}

const persisted = loadSave();
const initialQuests = persisted?.quests ?? createInitialQuests();
const initialSettings: GameSettings = {
  musicVolume: persisted?.settings?.musicVolume ?? 0.48,
  sfxVolume: persisted?.settings?.sfxVolume ?? 0.7,
  muted: persisted?.settings?.muted ?? false
};

function makeNotification(text: string): WorldNotification {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text
  };
}

function chooseActiveQuest(quests: Record<QuestId, QuestState>, activeQuestId: QuestId) {
  return getCurrentQuest(quests, activeQuestId)?.id ?? activeQuestId;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  player: {
    x: (persisted?.player?.x ?? 21) * 32,
    y: (persisted?.player?.y ?? 36) * 32,
    tileX: persisted?.player?.x ?? 21,
    tileY: persisted?.player?.y ?? 36,
    facing: "down",
    moving: false,
    hp: 20,
    maxHp: 20,
    coins: persisted?.coins ?? 0,
    worldWidth: 1,
    worldHeight: 1
  },
  prompt: null,
  dialogue: null,
  quests: initialQuests,
  activeQuestId: chooseActiveQuest(initialQuests, "first_steps"),
  unlocked: {
    workshop: true,
    contact_house: true,
    ai_lab: true,
    trading_house: true,
    physics_lab: true,
    music_studio: true,
    particle_gallery: true,
    observatory: false,
    archive_gate: false,
    ...(persisted?.unlocked ?? {})
  },
  collected: persisted?.collected ?? [],
  visitedPortals: persisted?.visitedPortals ?? [],
  conversationFlags: persisted?.conversationFlags ?? {},
  notifications: [makeNotification("Find Lyra in Starter Village.")],
  weather: "clear",
  dayPhase: "morning",
  dayProgress: 0.12,
  path: [],
  destinationTile: null,
  pathRequestVersion: 0,
  teleportRequest: null,
  miniGame: null,
  settings: initialSettings,
  debugCollision: false,
  currentInteriorId: persisted?.currentInteriorId ?? null,
  setWorldSize: (width, height) =>
    set((state) => ({
      player: {
        ...state.player,
        worldWidth: width,
        worldHeight: height
      }
    })),
  setPlayerSnapshot: (player) =>
    set((state) => ({
      player: {
        ...state.player,
        ...player
      }
    })),
  setPrompt: (prompt) =>
    set((state) => {
      if (state.prompt?.id === prompt?.id && state.prompt?.label === prompt?.label && state.prompt?.action === prompt?.action) {
        return state;
      }

      return { prompt };
    }),
  openDialogue: (sourceId, lines, choices = []) =>
    set({
      dialogue: {
        sourceId,
        lines,
        index: 0,
        choices
      }
    }),
  advanceDialogue: () =>
    set((state) => {
      if (!state.dialogue) {
        return state;
      }

      const nextIndex = state.dialogue.index + 1;

      if (nextIndex >= state.dialogue.lines.length) {
        return state.dialogue.choices.length > 0
          ? state
          : {
              dialogue: null
            };
      }

      return {
        dialogue: {
          ...state.dialogue,
          index: nextIndex
        }
      };
    }),
  closeDialogue: () => set({ dialogue: null }),
  chooseDialogue: (choice) => {
    if (choice.questId && choice.objectiveId) {
      get().progressQuest(choice.questId, choice.objectiveId);
    }

    if (choice.openMiniGame) {
      set({ dialogue: null });
      return;
    }

    if (choice.close !== false) {
      set({ dialogue: null });
    }
  },
  activateQuest: (questId) =>
    set((state) => {
      const result = activateQuest(state.quests, questId);

      return {
        quests: result.quests,
        activeQuestId: chooseActiveQuest(result.quests, state.activeQuestId),
        notifications: [...result.messages.map(makeNotification), ...state.notifications].slice(0, 6)
      };
    }),
  progressQuest: (questId, objectiveId, amount = 1) =>
    set((state) => {
      const result = progressQuestObjective(state.quests, questId, objectiveId, amount);
      const nextUnlocked = { ...state.unlocked };

      for (const id of result.unlockedIds) {
        nextUnlocked[id] = true;
      }

      const nextState = {
        quests: result.quests,
        activeQuestId: chooseActiveQuest(result.quests, state.activeQuestId),
        unlocked: nextUnlocked,
        notifications: [...result.messages.map(makeNotification), ...state.notifications].slice(0, 6)
      };

      return nextState;
    }),
  collectItem: (id, questId, objectiveId) =>
    set((state) => {
      if (state.collected.includes(id)) {
        return state;
      }

      const collected = [...state.collected, id];

      if (questId && objectiveId) {
        const result = progressQuestObjective(state.quests, questId, objectiveId);
        return {
          collected,
          quests: result.quests,
          activeQuestId: chooseActiveQuest(result.quests, state.activeQuestId),
          notifications: [
            makeNotification("Signal shard recovered."),
            ...result.messages.map(makeNotification),
            ...state.notifications
          ].slice(0, 6)
        };
      }

      return {
        collected,
        notifications: [makeNotification("Item collected."), ...state.notifications].slice(0, 6)
      };
    }),
  visitPortal: (portalId) =>
    set((state) => {
      const visitedPortals = state.visitedPortals.includes(portalId)
        ? state.visitedPortals
        : [...state.visitedPortals, portalId];
      const nextPartial: Partial<WorldStore> = { visitedPortals };

      for (const quest of Object.values(state.quests)) {
        const objective = quest.objectives.find(
          (entry) => entry.type === "visit" && entry.targetPortal === portalId && entry.progress < entry.required
        );

        if (objective) {
          const result = progressQuestObjective(state.quests, quest.id, objective.id);
          nextPartial.quests = result.quests;
          nextPartial.activeQuestId = chooseActiveQuest(result.quests, state.activeQuestId);
          nextPartial.unlocked = {
            ...state.unlocked,
            ...Object.fromEntries(result.unlockedIds.map((id) => [id, true]))
          };
          nextPartial.notifications = [...result.messages.map(makeNotification), ...state.notifications].slice(0, 6);
          break;
        }
      }

      return nextPartial;
    }),
  unlock: (id) =>
    set((state) => ({
      unlocked: {
        ...state.unlocked,
        [id]: true
      }
    })),
  rememberConversation: (npcId) =>
    set((state) => ({
      conversationFlags: {
        ...state.conversationFlags,
        [npcId]: (state.conversationFlags[npcId] ?? 0) + 1
      }
    })),
  setWeather: (weather) => set({ weather }),
  setDayNight: (dayPhase, dayProgress) => set({ dayPhase, dayProgress }),
  requestPathTo: (tile) =>
    set((state) => ({
      destinationTile: tile,
      pathRequestVersion: state.pathRequestVersion + 1
    })),
  requestTeleport: (tile, interiorId = null) =>
    set((state) => ({
      teleportRequest: {
        tile,
        interiorId,
        version: (state.teleportRequest?.version ?? 0) + 1
      },
      path: [],
      destinationTile: null,
      dialogue: null,
      miniGame: null
    })),
  setPath: (path) => set({ path }),
  clearPath: () => set({ path: [], destinationTile: null }),
  startMiniGame: (miniGame) => set({ miniGame, dialogue: null }),
  setMiniGame: (miniGame) => set({ miniGame }),
  toggleDebugCollision: () => set((state) => ({ debugCollision: !state.debugCollision })),
  setCurrentInterior: (id) => set({ currentInteriorId: id }),
  pushNotification: (text) =>
    set((state) => ({
      notifications: [makeNotification(text), ...state.notifications].slice(0, 6)
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id)
    })),
  setSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings
      }
    })),
  saveGame: () => {
    const state = get();

    writeSave({
      player: {
        x: state.player.tileX,
        y: state.player.tileY
      },
      quests: state.quests,
      unlocked: state.unlocked,
      collected: state.collected,
      visitedPortals: state.visitedPortals,
      conversationFlags: state.conversationFlags,
      settings: state.settings,
      currentInteriorId: state.currentInteriorId,
      coins: state.player.coins
    });
  }
}));
