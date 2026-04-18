import { overworldMaps } from "../data/locations/overworldMaps";
import { quests } from "../data/quests/quests";
import type { GameState, OverworldPosition, QuestProgress, SettingsState } from "./types";

export const defaultSettings: SettingsState = {
  masterVolume: 0.85,
  musicVolume: 0.6,
  sfxVolume: 0.75,
  ambienceVolume: 0.5,
  muteAll: false,
  reducedMotion: false,
  textSpeed: "standard",
};

const buildQuestState = (): Record<string, QuestProgress> =>
  Object.fromEntries(
    quests.map((quest) => [
      quest.id,
      {
        id: quest.id,
        status: "locked",
        currentObjectiveIndex: 0,
        completedObjectiveIds: [],
        updatedAt: Date.now(),
      },
    ]),
  );

export const createDefaultState = (playerName = "Rowan"): GameState => {
  const now = Date.now();
  const positions: Record<string, OverworldPosition> = Object.fromEntries(
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
    version: 1,
    status: "playing",
    chapterId: "prologue",
    currentLocationId: "thornwake",
    activeSceneId: "prologue-arrival",
    activeNodeId: "arrival-1",
    activeShopId: null,
    completedSceneIds: [],
    discoveredLocationIds: ["thornwake"],
    journalEntryIds: ["entry-rowan", "entry-thornwake"],
    defeatedEncounterIds: [],
    companionIds: [],
    inventory: [
      { itemId: "moonwater-tonic", quantity: 2 },
      { itemId: "emberleaf-poultice", quantity: 1 },
      { itemId: "glowcap-draught", quantity: 1 },
    ],
    equipment: {},
    quests: buildQuestState(),
    player: {
      name: playerName,
      title: "Bearer of the Veil Shard",
      className: "Wayfinder",
      level: 1,
      xp: 0,
      silver: 34,
      baseStats: {
        maxHp: 88,
        maxMp: 30,
        attack: 12,
        defense: 8,
        speed: 10,
        spirit: 9,
      },
      currentHp: 88,
      currentMp: 30,
      learnedSkillIds: ["moonlit-cut", "veil-ward", "restoration-hymn"],
    },
    combat: null,
    decisions: {},
    flags: {},
    notifications: [],
    settings: { ...defaultSettings },
    overworld: {
      positions,
      message: null,
      lastEncounterStepByLocation: {},
    },
    checkpoint: {
      locationId: "thornwake",
      chapterId: "prologue",
    },
    achievements: [],
    saveMeta: {
      slotId: "autosave",
      label: "Autosave",
      timestamp: now,
      preview: "A storm-battered arrival in Thornwake",
    },
    startedAt: now,
    updatedAt: now,
    totalPlaytimeSeconds: 0,
  };
};
