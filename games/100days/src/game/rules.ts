import { contentRegistry } from "../memory/contentRegistry";
import type {
  PassiveDefinition,
  PlayerStats,
  RunWeaponState,
  StatModifier,
  WeaponLevelStats,
} from "../memory/types";

const weaponStatKeys: Array<keyof WeaponLevelStats> = [
  "damage",
  "cooldown",
  "count",
  "speed",
  "size",
  "range",
  "duration",
  "pierce",
  "knockback",
  "radius",
  "chain",
  "orbitals",
  "drones",
  "spread",
  "orbitRadius",
  "fuse",
  "beamWidth",
];

export const resolveWeaponStats = (state: RunWeaponState): WeaponLevelStats => {
  const definition = contentRegistry.weapons[state.id];
  const resolved = { ...definition.baseStats };
  for (const key of weaponStatKeys) {
    resolved[key] = definition.baseStats[key] + (definition.perLevel[key] ?? 0) * (state.level - 1);
  }
  return resolved;
};

export const applyModifier = (stats: PlayerStats, modifier: StatModifier): void => {
  for (const [key, value] of Object.entries(modifier) as Array<[keyof StatModifier, number]>) {
    const statKey = key as keyof PlayerStats;
    stats[statKey] = (stats[statKey] as number) + value;
  }
};

export const applyPassiveDefinition = (stats: PlayerStats, definition: PassiveDefinition): void => {
  applyModifier(stats, definition.perLevel);
  if (definition.healOnPick) {
    stats.hp = Math.min(stats.maxHp, stats.hp + definition.healOnPick);
  }
};

export const nextXpThreshold = (current: number, level: number): number => Math.round(current * 1.14 + level * 8);
