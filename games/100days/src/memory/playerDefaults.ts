import type { PlayerBaseStats } from "./types";

export const playerBaseStats: PlayerBaseStats = {
  maxHp: 140,
  moveSpeed: 260,
  pickupRadius: 96,
  armor: 0,
  critChance: 0.08,
  critMultiplier: 1.75,
  cooldownMultiplier: 1,
  regen: 0.55,
  xpMultiplier: 1,
  luck: 0.04,
  damageMultiplier: 1,
  areaMultiplier: 1,
  durationMultiplier: 1,
  projectileSpeed: 1,
  dodgeChance: 0,
  magnetStrength: 420,
  reviveCharges: 0,
};

export const startingWeapons = ["ember-darts"];
export const startingPassives: string[] = [];
export const continueFromDawnLimit = 1;
