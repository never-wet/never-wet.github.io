import { create } from "zustand";
import {
  BuildingDestination,
  CharacterCustomization,
  DEFAULT_CHARACTER,
  WORLD_BUILDINGS,
  getBuildingById
} from "../lib/worldData";
import { getNpcResponse } from "../lib/npcResponses";

export type MinimapMode = "north-up" | "rotate";

export type ChatMessage = {
  id: string;
  from: "npc" | "user";
  text: string;
};

export type WorldStore = {
  buildings: BuildingDestination[];
  playerPosition: [number, number, number];
  hoveredBuildingId: string | null;
  nearbyBuildingId: string | null;
  selectedBuildingId: string | null;
  activeBuildingId: string | null;
  enteringBuildingId: string | null;
  portalBuildingId: string | null;
  portalOpen: boolean;
  cameraLocked: boolean;
  character: CharacterCustomization;
  timeOfDay: number;
  autoCycle: boolean;
  minimapMode: MinimapMode;
  npcChatOpen: boolean;
  npcMessages: ChatMessage[];
  setPlayerPosition: (position: [number, number, number]) => void;
  setHoveredBuilding: (id: string | null) => void;
  setNearbyBuilding: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  beginEnter: (id: string) => void;
  openPortal: (id: string) => void;
  closePortal: () => void;
  setCharacter: (patch: Partial<CharacterCustomization>) => void;
  setTimeOfDay: (value: number) => void;
  setAutoCycle: (enabled: boolean) => void;
  toggleMinimapMode: () => void;
  openNpcChat: (topic?: string) => void;
  closeNpcChat: () => void;
  askNpc: (topic: string) => void;
  activeBuilding: () => BuildingDestination | null;
};

export const useWorldStore = create<WorldStore>((set, get) => ({
  buildings: WORLD_BUILDINGS,
  playerPosition: [0, 0, 1.8],
  hoveredBuildingId: null,
  nearbyBuildingId: null,
  selectedBuildingId: null,
  activeBuildingId: null,
  enteringBuildingId: null,
  portalBuildingId: null,
  portalOpen: false,
  cameraLocked: false,
  character: DEFAULT_CHARACTER,
  timeOfDay: 0.36,
  autoCycle: true,
  minimapMode: "north-up",
  npcChatOpen: false,
  npcMessages: [{ id: "intro", from: "npc", text: getNpcResponse("intro") }],

  setPlayerPosition: (position) => set({ playerPosition: position }),

  setHoveredBuilding: (id) => {
    const nearbyBuildingId = get().nearbyBuildingId;
    set({
      hoveredBuildingId: id,
      activeBuildingId: nearbyBuildingId ?? id
    });
  },

  setNearbyBuilding: (id) => {
    const hoveredBuildingId = get().hoveredBuildingId;
    set({
      nearbyBuildingId: id,
      activeBuildingId: id ?? hoveredBuildingId
    });
  },

  selectBuilding: (id) =>
    set({
      selectedBuildingId: id,
      activeBuildingId: id ?? get().activeBuildingId
    }),

  beginEnter: (id) =>
    set({
      enteringBuildingId: id,
      cameraLocked: true,
      activeBuildingId: id
    }),

  openPortal: (id) =>
    set({
      portalBuildingId: id,
      portalOpen: true,
      enteringBuildingId: null,
      cameraLocked: true,
      activeBuildingId: id
    }),

  closePortal: () =>
    set({
      portalBuildingId: null,
      portalOpen: false,
      enteringBuildingId: null,
      cameraLocked: false
    }),

  setCharacter: (patch) =>
    set({
      character: {
        ...get().character,
        ...patch
      }
    }),

  setTimeOfDay: (value) => set({ timeOfDay: value }),
  setAutoCycle: (enabled) => set({ autoCycle: enabled }),

  toggleMinimapMode: () =>
    set({
      minimapMode: get().minimapMode === "north-up" ? "rotate" : "north-up"
    }),

  openNpcChat: (topic = "intro") => {
    const message = getNpcResponse(topic);
    set({
      npcChatOpen: true,
      npcMessages:
        topic === "intro"
          ? get().npcMessages
          : [...get().npcMessages, { id: `${topic}-${Date.now()}`, from: "npc", text: message }]
    });
  },

  closeNpcChat: () => set({ npcChatOpen: false }),

  askNpc: (topic) => {
    const user = { id: `user-${Date.now()}`, from: "user" as const, text: topic };
    const npc = { id: `npc-${Date.now()}`, from: "npc" as const, text: getNpcResponse(topic) };
    set({ npcMessages: [...get().npcMessages, user, npc] });
  },

  activeBuilding: () => getBuildingById(get().activeBuildingId)
}));
