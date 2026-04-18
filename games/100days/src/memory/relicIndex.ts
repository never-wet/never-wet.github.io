import type { RelicDefinition } from "./types";

export const relicIndex: RelicDefinition[] = [
  {
    id: "ember-banner",
    name: "Ember Banner",
    description: "A scorched war-banner that lifts overall damage and keeps momentum high.",
    iconId: "icon-overcharge-core",
    rarity: "rare",
    statModifiers: { damageMultiplier: 0.12, critMultiplier: 0.08 },
  },
  {
    id: "magnet-crown",
    name: "Magnet Crown",
    description: "An old field crown that drags loot across the map and fattens XP routes.",
    iconId: "icon-magnet-array",
    rarity: "rare",
    statModifiers: { pickupRadius: 26, magnetStrength: 120, xpMultiplier: 0.08 },
  },
  {
    id: "frost-thread",
    name: "Frost Thread",
    description: "A cold-woven braid that cuts cooldowns and helps you slip danger lines.",
    iconId: "icon-chrono-lattice",
    rarity: "epic",
    statModifiers: { cooldownMultiplier: -0.06, dodgeChance: 0.04, moveSpeed: 10 },
  },
  {
    id: "revenant-coin",
    name: "Revenant Coin",
    description: "A forbidden token that grants one more comeback and steadier regen.",
    iconId: "icon-second-wind",
    rarity: "legendary",
    statModifiers: { reviveCharges: 1, regen: 0.2 },
  },
  {
    id: "storm-dial",
    name: "Storm Dial",
    description: "A static-laced mechanism that sharpens projectile speed and crit flow.",
    iconId: "icon-crit-lens",
    rarity: "epic",
    statModifiers: { projectileSpeed: 0.18, critChance: 0.05 },
  },
  {
    id: "survey-beacon",
    name: "Survey Beacon",
    description: "An uplink shard that boosts XP, luck, and long-run scaling.",
    iconId: "icon-salvage-sense",
    rarity: "epic",
    statModifiers: { xpMultiplier: 0.12, luck: 0.06, pickupRadius: 12 },
  },
];
