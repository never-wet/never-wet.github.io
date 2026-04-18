import type { LootDefinition } from "./types";

export const lootIndex: LootDefinition[] = [
  { id: "xp-small", label: "Shard XP", color: "#7be6ff", value: 6, radius: 10, spriteId: "pickup-xp-small" },
  { id: "xp-medium", label: "Prism XP", color: "#8aff9b", value: 15, radius: 12, spriteId: "pickup-xp-medium" },
  { id: "xp-large", label: "Core XP", color: "#ffd166", value: 34, radius: 14, spriteId: "pickup-xp-large" },
  { id: "heal-orb", label: "Heal Orb", color: "#ff8899", value: 18, radius: 12, spriteId: "pickup-heal-orb" },
  { id: "magnet-star", label: "Magnet Star", color: "#fffb8c", value: 0, radius: 13, spriteId: "pickup-magnet-star" },
];
