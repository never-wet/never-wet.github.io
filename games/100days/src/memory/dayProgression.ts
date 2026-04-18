import { gameManifest } from "./gameManifest";
import type { DayPlan, MilestoneTag } from "./types";

const biomeForDay = (day: number): string => {
  if (day >= 80) {
    return "eclipse-rift";
  }
  if (day >= 60) {
    return "frost-hollow";
  }
  if (day >= 40) {
    return "ember-waste";
  }
  if (day >= 20) {
    return "sunken-ruins";
  }
  return "verdant-reach";
};

const durationForDay = (day: number): number => {
  if (day >= 90) {
    return 13;
  }
  if (day >= 60) {
    return 14;
  }
  if (day >= 20) {
    return 16;
  }
  return 18;
};

const bossByDay: Record<number, string> = {
  25: "mire-titan",
  50: "ash-monarch",
  75: "glacier-revenant",
  90: "night-seraph",
  100: "hundredth-dawn",
};

const baseEnemyWeights = (day: number): Record<string, number> => {
  const weights: Record<string, number> = {
    rootling: 10,
    "racer-mite": day >= 3 ? 8 : 0,
    "mire-brute": day >= 5 ? 4 + day * 0.04 : 0,
    "spore-thrower": day >= 8 ? 3 + day * 0.03 : 0,
    "glass-lancer": day >= 10 ? 2 + day * 0.05 : 0,
    "gloom-wisp": day >= 14 ? 2 + day * 0.04 : 0,
    "seed-pod": day >= 18 ? 1 + day * 0.04 : 0,
  };

  if (day >= 45) {
    weights["rootling"] *= 0.7;
  }

  if (day >= 70) {
    weights["gloom-wisp"] += 2;
    weights["glass-lancer"] += 2;
  }

  return weights;
};

const elitePool = (day: number): string[] => {
  const pool = ["rootling-elite"];
  if (day >= 15) {
    pool.push("mire-brute-elite");
  }
  if (day >= 20) {
    pool.push("spore-thrower-elite");
  }
  return pool;
};

const tagsForDay = (day: number): MilestoneTag[] => {
  const tags: MilestoneTag[] = [];
  if ([5, 15, 35, 65, 85].includes(day)) {
    tags.push("challenge");
  }
  if ([10, 20, 30, 40, 60, 70, 80, 95].includes(day)) {
    tags.push("elite");
  }
  if ([20, 40, 60, 80].includes(day)) {
    tags.push("biome");
  }
  if ([12, 24, 48, 72, 96].includes(day)) {
    tags.push("horde");
  }
  if ([50, 75].includes(day)) {
    tags.push("spike");
  }
  if (bossByDay[day]) {
    tags.push("boss");
  }
  if (day === 100) {
    tags.push("final");
  }
  return tags;
};

const summaryForDay = (day: number, tags: MilestoneTag[]): string => {
  if (day === 100) {
    return "The final dawn has broken. Every unlocked tier is active and the last boss is waiting.";
  }
  if (tags.includes("boss")) {
    return `Boss day ${day}. Survive the opening swarm, break the champion, and carry momentum into the next dawn.`;
  }
  if (tags.includes("spike")) {
    return `Day ${day} brings a major difficulty spike with sustained elite pressure and denser late-day waves.`;
  }
  if (tags.includes("biome")) {
    return `Day ${day} transitions the battlefield into a new biome with fresh colors, enemy mixes, and pressure patterns.`;
  }
  if (tags.includes("elite")) {
    return `Day ${day} leans on elite packs that punish weak single-target damage and poor spacing.`;
  }
  if (tags.includes("challenge")) {
    return `Day ${day} is a focused survival check with sharper pacing and less breathing room.`;
  }
  return `Day ${day} increases enemy density, speed, and health while broadening wave composition.`;
};

const createDayPlan = (day: number): DayPlan => {
  const tags = tagsForDay(day);
  const bossId = bossByDay[day];
  const dangerLevel = 1 + day * 0.17 + (tags.includes("spike") ? 3.5 : 0) + (tags.includes("boss") ? 2.5 : 0);

  return {
    day,
    duration: durationForDay(day),
    biomeId: biomeForDay(day),
    dangerLevel,
    spawnRate: 0.95 + day * 0.06 + (tags.includes("horde") ? 0.55 : 0),
    enemyCap: Math.min(50 + day * 2.2 + (tags.includes("horde") ? 25 : 0), 230),
    eliteChance: Math.min(Math.max((day - 8) * 0.007, 0), 0.28) + (tags.includes("elite") ? 0.08 : 0),
    enemyWeights: baseEnemyWeights(day),
    elitePool: elitePool(day),
    bossId,
    bossSpawnAt: bossId ? (day === 100 ? 0.1 : 0.48) : undefined,
    tags,
    summary: summaryForDay(day, tags),
    restHealRatio: Math.min(0.2 + day * 0.0015, 0.32),
  };
};

export const dayProgression: DayPlan[] = Array.from({ length: gameManifest.dayCount }, (_, index) =>
  createDayPlan(index + 1),
);

export const getDayPlan = (day: number): DayPlan => dayProgression[Math.max(0, Math.min(day - 1, dayProgression.length - 1))];
