import { jobs } from "../data/jobs/jobs";
import { quests } from "../data/quests/quests";
import { SAVE_VERSION } from "./saveSchema";
import type { JobProgress, QuestProgress, SaveState } from "./types";

const defaultQuestProgress = Object.fromEntries(
  quests.map((quest) => [
    quest.id,
    {
      accepted: false,
      completed: false,
      turnInReady: false,
      objectiveCounts: Object.fromEntries(quest.objectives.map((objective) => [objective.id, 0])),
      rewardClaimed: false,
    } satisfies QuestProgress,
  ]),
) as Record<string, QuestProgress>;

const defaultJobProgress = Object.fromEntries(
  jobs.map((job) => [
    job.id,
    {
      rank: 0,
      xp: 0,
      loopsCompleted: 0,
      active: false,
      currentCount: 0,
      readyToTurnIn: false,
    } satisfies JobProgress,
  ]),
) as Record<string, JobProgress>;

export function createDefaultState(slot = 1): SaveState {
  const tile = 16;
  return {
    version: SAVE_VERSION,
    slot,
    label: "New Route",
    timestamp: Date.now(),
    playtimeMs: 0,
    chapter: 1,
    currentMapId: "emberwharf",
    respawnMapId: "emberwharf",
    respawnSpawnId: "start",
    player: {
      name: "Riven",
      x: 12.5 * tile,
      y: 11.5 * tile,
      direction: "down",
      stats: {
        maxHealth: 100,
        health: 100,
        maxStamina: 80,
        stamina: 80,
        maxAether: 40,
        aether: 40,
        attack: 6,
        defense: 2,
        moveSpeed: 74,
      },
    },
    gold: 28,
    inventory: [
      { itemId: "rust_blade", quantity: 1 },
      { itemId: "route_cloak", quantity: 1 },
      { itemId: "field_tonic", quantity: 3 },
      { itemId: "ember_biscuit", quantity: 2 },
    ],
    equipment: {
      weapon: "rust_blade",
      armor: "route_cloak",
    },
    activeQuestIds: [],
    completedQuestIds: [],
    questProgress: structuredClone(defaultQuestProgress),
    jobProgress: structuredClone(defaultJobProgress),
    discoveredMapIds: ["emberwharf"],
    discoveredRegionIds: ["emberward"],
    flags: {
      "story.intro_seen": false,
      "story.sunglade_open": false,
      "story.glassroot_hint": false,
      "story.glassroot_open": false,
      "story.ending_complete": false,
      "cache.moonwell_opened": false,
    },
    settings: {
      masterVolume: 0.7,
      musicVolume: 0.6,
      sfxVolume: 0.7,
      muteMusic: false,
      muteSfx: false,
    },
    knownDialogueIds: [],
  };
}
