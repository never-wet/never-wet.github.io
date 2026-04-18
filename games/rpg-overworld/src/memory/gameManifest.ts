import type { GameManifest } from "./types";

export const gameManifest: GameManifest = {
  id: "hollowmere-overworld-veil-of-the-hollow-star",
  title: "Hollowmere Overworld: Veil of the Hollow Star",
  subtitle: "A graphical top-down fantasy RPG",
  version: "0.1.0",
  tagline: "Walk the rain roads yourself, push through haunted routes, and carry the Veil Shard into a living world.",
  pitch:
    "A top-down browser RPG with tile-based movement, overworld hotspots, field encounters, story scenes, and local-first saves.",
  chapters: [
    {
      id: "prologue",
      label: "Prologue",
      title: "The Bell in the Fog",
      description: "A storm, a missing courier, and a lantern relic that wakes in your hands.",
    },
    {
      id: "chapter1",
      label: "Chapter I",
      title: "Roots of the Whisperblight",
      description: "Track the Glass Choir through Gloamwood and learn why the forest has started speaking back.",
    },
    {
      id: "chapter2",
      label: "Chapter II",
      title: "Abbey of Broken Vows",
      description: "Descend beneath Saint Veyra Abbey and face the bargain that sold Thornwake to the dark.",
    },
    {
      id: "chapter3",
      label: "Chapter III",
      title: "The Hollow Star",
      description: "Climb Skyglass Spire and choose what survives the truth at the center of Hollowmere.",
    },
    {
      id: "epilogue",
      label: "Epilogue",
      title: "After the Rain",
      description: "Your choices reshape the kingdom, the people you spared, and the memory the star leaves behind.",
    },
  ],
  regions: [
    {
      id: "lantern-coast",
      name: "Lantern Coast",
      mood: "Windblown harbor towns, market fires, and watchtowers staring into the rain.",
      description: "The safest edge of Hollowmere, if the bells stay lit.",
    },
    {
      id: "gloamwood-reach",
      name: "Gloamwood Reach",
      mood: "Silver trees, wet paths, drifting spores, and voices woven into the canopy.",
      description: "An ancient wood where memory roots into bark.",
    },
    {
      id: "saintfall-basin",
      name: "Saintfall Basin",
      mood: "Flooded cloisters, ruined arches, and monks who never left the abbey below.",
      description: "The basin where vows were broken and the Choir first learned to bend glass to prayer.",
    },
    {
      id: "skyglass-rise",
      name: "Skyglass Rise",
      mood: "Needle towers, mirrored wind, and the wounded light of the Hollow Star.",
      description: "The highest scar in the kingdom and the only place the veil can be rewritten.",
    },
  ],
  featureFlags: {
    companions: true,
    shops: true,
    achievements: true,
    keyboardShortcuts: true,
    proceduralAudio: true,
    generatedArt: true,
  },
};
