import type { NPCId } from "./npcs";
import type { PortalId } from "./portals";

export type QuestId =
  | "first_steps"
  | "engineer_intro"
  | "market_signal"
  | "observatory_pass"
  | "archive_shards";

export type QuestObjectiveType = "talk" | "visit" | "collect" | "minigame" | "unlock";

export interface QuestObjectiveDefinition {
  id: string;
  type: QuestObjectiveType;
  label: string;
  targetNpc?: NPCId;
  targetPortal?: PortalId;
  targetItem?: string;
  targetTile?: { x: number; y: number };
  required: number;
}

export interface QuestDefinition {
  id: QuestId;
  title: string;
  summary: string;
  giver: NPCId;
  reward: string;
  unlocks?: string[];
  objectives: QuestObjectiveDefinition[];
}

export const quests: QuestDefinition[] = [
  {
    id: "first_steps",
    title: "First Steps In Sitebound",
    summary: "Learn the town rules and enter your first playable building interior.",
    giver: "lyra",
    reward: "Workshop room badge",
    objectives: [
      {
        id: "talk_lyra",
        type: "talk",
        label: "Talk to Lyra in Starter Village",
        targetNpc: "lyra",
        targetTile: { x: 21, y: 33 },
        required: 1
      },
      {
        id: "visit_workshop",
        type: "visit",
        label: "Enter the Workshop",
        targetPortal: "workshop",
        targetTile: { x: 27, y: 26 },
        required: 1
      }
    ]
  },
  {
    id: "engineer_intro",
    title: "Meet The Engineer",
    summary: "Find Iko near the AI Lab and inspect the lab interior.",
    giver: "iko",
    reward: "AI Lab access note",
    objectives: [
      {
        id: "talk_iko",
        type: "talk",
        label: "Talk to Iko near the AI Lab",
        targetNpc: "iko",
        targetTile: { x: 56, y: 23 },
        required: 1
      },
      {
        id: "visit_ai_lab",
        type: "visit",
        label: "Enter the AI Lab",
        targetPortal: "ai_lab",
        targetTile: { x: 62, y: 22 },
        required: 1
      }
    ]
  },
  {
    id: "market_signal",
    title: "Market Signal",
    summary: "Help Marlo read the market bell by completing the trading mini-game.",
    giver: "marlo",
    reward: "Three bright coins",
    objectives: [
      {
        id: "talk_marlo",
        type: "talk",
        label: "Talk to Marlo outside the Trading House",
        targetNpc: "marlo",
        targetTile: { x: 82, y: 24 },
        required: 1
      },
      {
        id: "win_trading_game",
        type: "minigame",
        label: "Win the Trading House timing challenge",
        targetPortal: "trading_house",
        targetTile: { x: 77, y: 23 },
        required: 1
      }
    ]
  },
  {
    id: "observatory_pass",
    title: "Ridge Clearance",
    summary: "Earn the ridge pass and reach the Observatory.",
    giver: "warden",
    reward: "Observatory unlocked",
    unlocks: ["observatory"],
    objectives: [
      {
        id: "training_duel",
        type: "minigame",
        label: "Win the circuit duel at the practice yard",
        targetTile: { x: 39, y: 36 },
        required: 1
      },
      {
        id: "talk_warden",
        type: "talk",
        label: "Show the pass to Warden Sol",
        targetNpc: "warden",
        targetTile: { x: 72, y: 14 },
        required: 1
      },
      {
        id: "visit_observatory",
        type: "visit",
        label: "Enter the Observatory",
        targetPortal: "observatory",
        targetTile: { x: 79, y: 12 },
        required: 1
      }
    ]
  },
  {
    id: "archive_shards",
    title: "Archive Shards",
    summary: "Find hidden shards across town to open the Archive Gate.",
    giver: "archivist",
    reward: "Archive unlocked",
    unlocks: ["archive_gate"],
    objectives: [
      {
        id: "collect_shards",
        type: "collect",
        label: "Collect three signal shards",
        targetItem: "signal_shard",
        targetTile: { x: 41, y: 41 },
        required: 3
      },
      {
        id: "visit_archive",
        type: "visit",
        label: "Enter the Archive Gate",
        targetPortal: "archive_gate",
        targetTile: { x: 18, y: 63 },
        required: 1
      }
    ]
  }
];

export function getQuest(id: QuestId) {
  return quests.find((quest) => quest.id === id) ?? null;
}
