import type { WeaponEvolutionDefinition } from "./types";

export const evolutionIndex: WeaponEvolutionDefinition[] = [
  {
    id: "solar-volley",
    weaponId: "ember-darts",
    passiveId: "crit-lens",
    evolvedName: "Solar Volley",
    description: "Ember Darts bloom into brighter, faster volleys with extra pierce.",
    bonuses: { damage: 12, count: 1.5, speed: 80, pierce: 2 },
  },
  {
    id: "briar-tempest",
    weaponId: "bloom-spread",
    passiveId: "wildbloom",
    evolvedName: "Briar Tempest",
    description: "Bloom Spread throws wider petal storms that hit denser packs.",
    bonuses: { damage: 10, count: 2, spread: 0.18, size: 2 },
  },
  {
    id: "dawn-lance",
    weaponId: "rail-splinter",
    passiveId: "hunter-sigil",
    evolvedName: "Dawn Lance",
    description: "Rail Splinter becomes a heavier lance with brutal crit force.",
    bonuses: { damage: 16, pierce: 2, size: 2, knockback: 70 },
  },
  {
    id: "prism-tether",
    weaponId: "tether-beam",
    passiveId: "chrono-lattice",
    evolvedName: "Prism Tether",
    description: "The beam lingers longer and digs harder into boss phases.",
    bonuses: { damage: 14, duration: 0.45, range: 36, beamWidth: 3 },
  },
  {
    id: "thunder-archive",
    weaponId: "storm-chain",
    passiveId: "relay-spark",
    evolvedName: "Thunder Archive",
    description: "Storm Chain forks across more targets and spikes the opening hit.",
    bonuses: { damage: 14, chain: 2, range: 36 },
  },
];
