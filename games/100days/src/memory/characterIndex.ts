import type { CharacterDefinition } from "./types";

export const characterIndex: CharacterDefinition[] = [
  {
    id: "ash-warden",
    name: "Ash Warden",
    title: "Frontline Vanguard",
    description: "A durable all-rounder who starts with stronger plating and a blazing banner relic.",
    starterWeaponId: "ember-darts",
    starterPassiveIds: ["heartforge"],
    starterRelicId: "ember-banner",
    statModifiers: { maxHp: 20, armor: 0.7, moveSpeed: 8 },
    accent: "#ffb36d",
  },
  {
    id: "glint-seer",
    name: "Glint Seer",
    title: "Sightline Duelist",
    description: "A high-tempo specialist who leans into crits, pickup flow, and faster snowballing.",
    starterWeaponId: "bloom-spread",
    starterPassiveIds: ["crit-lens"],
    starterRelicId: "survey-beacon",
    statModifiers: { critChance: 0.05, xpMultiplier: 0.08, moveSpeed: 12, maxHp: -10 },
    accent: "#8ae3ff",
  },
  {
    id: "moss-scrapper",
    name: "Moss Scrapper",
    title: "Salvage Skirmisher",
    description: "A mobile scavenger who starts with piercing power, bigger pickup reach, and better dodge.",
    starterWeaponId: "rail-splinter",
    starterPassiveIds: ["magnet-array"],
    starterRelicId: "magnet-crown",
    statModifiers: { pickupRadius: 24, dodgeChance: 0.04, projectileSpeed: 0.08, maxHp: -6 },
    accent: "#9cffc4",
  },
];
