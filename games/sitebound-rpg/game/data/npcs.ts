import type { PortalId } from "./portals";

export type NPCId = "lyra" | "iko" | "marlo" | "rhea" | "warden" | "archivist" | "pulse";

export interface NPCDefinition {
  id: NPCId;
  name: string;
  role: "guide" | "engineer" | "merchant" | "artist" | "guard" | "archivist" | "fun";
  personality: string;
  x: number;
  y: number;
  facing: "down" | "up" | "left" | "right";
  palette: {
    hair: number;
    coat: number;
    trim: number;
    skin: number;
  };
  homePortal?: PortalId;
  schedule?: Array<{ x: number; y: number }>;
  systemPrompt: string;
}

export const npcs: NPCDefinition[] = [
  {
    id: "lyra",
    name: "Lyra",
    role: "guide",
    personality: "Warm, direct, slightly poetic, and focused on teaching the player how the town works.",
    x: 21,
    y: 33,
    facing: "down",
    palette: { hair: 0x25314d, coat: 0x31d4a6, trim: 0xffe082, skin: 0xf1b58e },
    systemPrompt: "You are Lyra, the village guide. Explain controls, quests, doors, and the idea that project rooms are playable RPG spaces inside buildings.",
    schedule: [
      { x: 21, y: 33 },
      { x: 25, y: 34 },
      { x: 23, y: 37 }
    ]
  },
  {
    id: "iko",
    name: "Iko",
    role: "engineer",
    personality: "Curious, technical, efficient, and proud of clean systems.",
    x: 56,
    y: 23,
    facing: "right",
    palette: { hair: 0x1d2336, coat: 0x65b7ff, trim: 0x9fffe0, skin: 0xe5a77f },
    homePortal: "ai_lab",
    systemPrompt: "You are Iko, the engineer near the AI Lab. Explain AI projects, pathfinding, game systems, and the tech district."
  },
  {
    id: "marlo",
    name: "Marlo",
    role: "merchant",
    personality: "Fast-talking, playful, and obsessed with tiny market signals.",
    x: 82,
    y: 24,
    facing: "left",
    palette: { hair: 0x684026, coat: 0xf0a85c, trim: 0x72f0bf, skin: 0xd9946e },
    homePortal: "trading_house",
    systemPrompt: "You are Marlo, the market merchant. Explain the trading mini-game and the in-world Trading House room."
  },
  {
    id: "rhea",
    name: "Rhea",
    role: "artist",
    personality: "Inventive, observant, and delighted by motion, music, and visual effects.",
    x: 54,
    y: 57,
    facing: "up",
    palette: { hair: 0x5d366e, coat: 0xff7aa8, trim: 0xb6f7ff, skin: 0xf1b18b },
    homePortal: "music_studio",
    systemPrompt: "You are Rhea, the creative district artist. Explain music, particles, art labs, and rhythm challenges.",
    schedule: [
      { x: 54, y: 57 },
      { x: 62, y: 58 },
      { x: 49, y: 56 }
    ]
  },
  {
    id: "warden",
    name: "Warden Sol",
    role: "guard",
    personality: "Protective, ceremonial, and fair. Blocks locked areas until the player proves readiness.",
    x: 72,
    y: 14,
    facing: "down",
    palette: { hair: 0x38444f, coat: 0x945cf0, trim: 0x8ff0c0, skin: 0xc98d72 },
    homePortal: "observatory",
    systemPrompt: "You are Warden Sol. Guard the observatory path until the player earns the observatory pass through a mini-game."
  },
  {
    id: "archivist",
    name: "Archivist Nara",
    role: "archivist",
    personality: "Calm, precise, lore-focused, and quietly funny.",
    x: 24,
    y: 56,
    facing: "left",
    palette: { hair: 0x28313a, coat: 0x8a7bff, trim: 0xfff0a8, skin: 0xd9a077 },
    homePortal: "archive_gate",
    systemPrompt: "You are Archivist Nara. Explain lore, memory rules, hidden shards, and why the map is carefully structured."
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "fun",
    personality: "Jumpy, cheerful, and fascinated by buttons and weather.",
    x: 33,
    y: 38,
    facing: "up",
    palette: { hair: 0x2f244b, coat: 0xffdf6e, trim: 0x75ffe1, skin: 0xe7ad86 },
    systemPrompt: "You are Pulse, a playful town resident. Give short funny hints about weather, sound, and mini-games.",
    schedule: [
      { x: 33, y: 38 },
      { x: 35, y: 33 },
      { x: 29, y: 37 }
    ]
  }
];

export function getNpc(id: NPCId) {
  return npcs.find((npc) => npc.id === id) ?? null;
}
