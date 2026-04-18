import type { WeaponSynergyDefinition } from "./types";

export const synergyIndex: WeaponSynergyDefinition[] = [
  {
    id: "searing-rake",
    name: "Searing Rake",
    description: "Ember Darts and Rail Splinter add extra pierce and heavier knockback to line shots.",
    weaponIds: ["ember-darts", "rail-splinter"],
  },
  {
    id: "arc-conduit",
    name: "Arc Conduit",
    description: "Tether Beam and Storm Chain pulse an extra lightning arc during beam casts.",
    weaponIds: ["tether-beam", "storm-chain"],
  },
  {
    id: "halo-garden",
    name: "Halo Garden",
    description: "Sun Orbiters and Thorn Aura widen the defensive ring around the player.",
    weaponIds: ["sun-orbiters", "thorn-aura"],
  },
  {
    id: "faultline-charge",
    name: "Faultline Charge",
    description: "Ember Mines and Quake Ring turn mine blasts into larger arena ruptures.",
    weaponIds: ["ember-mines", "quake-ring"],
  },
];
