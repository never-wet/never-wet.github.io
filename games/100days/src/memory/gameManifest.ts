import type { GameManifest } from "./types";

export const gameManifest: GameManifest = {
  id: "hundred-days-of-ashfall",
  title: "Hundred Days of Ashfall",
  subtitle: "Original top-down survival action",
  version: "0.1.0",
  tagline: "Move, endure, and outlast a hundred escalating dawns.",
  pitch:
    "A fully original browser survival game where you kite swarms, auto-fire evolving weapons, and survive escalating day-by-day pressure all the way to Day 100.",
  dayCount: 100,
  startingDay: 1,
  defaultDayDuration: 122,
  modes: [
    {
      id: "standard",
      label: "Hundred Day Run",
      description: "Fight through the full 100-day campaign with autosave, day breaks, bosses, and a final last stand.",
    },
    {
      id: "endless",
      label: "Endless Ash",
      shortLabel: "Endless",
      description: "Keep pushing past Day 100 with the final threat level locked in and no victory cutoff.",
    },
    {
      id: "boss-rush",
      label: "Boss Rush",
      shortLabel: "Boss Rush",
      description: "Shorter days, denser pressure, and rotating boss confrontations every few dawns.",
    },
    {
      id: "fragile",
      label: "Fragile Circuit",
      shortLabel: "Fragile",
      description: "Lower max health, faster XP growth, and sharper pressure for high-risk runs.",
    },
  ],
  biomeOrder: ["verdant-reach", "sunken-ruins", "ember-waste", "frost-hollow", "eclipse-rift"],
  milestoneDefinitions: [
    { day: 5, title: "First Trial", description: "A sharper wave tests movement and pickup discipline.", tags: ["challenge"] },
    { day: 10, title: "Elite Surge", description: "Elite enemies begin appearing in force.", tags: ["elite"] },
    { day: 20, title: "Biome Shift", description: "The battlefield transitions into the Sunken Ruins and new enemy tiers unlock.", tags: ["biome"] },
    { day: 25, title: "Boss Hunt", description: "The Mire Titan arrives and demands a proper duel.", tags: ["boss"] },
    { day: 50, title: "Ashfall Peak", description: "Enemy density and aggression spike dramatically.", tags: ["spike", "boss"] },
    { day: 75, title: "Whiteout", description: "Extreme pressure begins in the Frost Hollow.", tags: ["spike", "boss"] },
    { day: 100, title: "Final Dawn", description: "The Hundredth Dawn descends for the last fight.", tags: ["final", "boss"] },
  ],
  featureFlags: {
    proceduralAudio: true,
    generatedArt: true,
    autosave: true,
    metaProgression: true,
    bosses: true,
  },
};
