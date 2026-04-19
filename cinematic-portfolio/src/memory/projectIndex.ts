import type { ProjectDefinition } from "@/memory/types";

export const projectIndex: ProjectDefinition[] = [
  {
    id: "lantern-oath",
    title: "Lantern Oath",
    shortDescription:
      "An open-world retro action RPG framed here as a floating hearth inside a cinematic void.",
    fullDescription:
      "Lantern Oath is an original open-world retro action RPG built with TypeScript, Vite, HTML5 canvas, procedural pixel art, and procedural audio. In this portfolio experience it becomes a radiant hearth chamber: a place about traversal, momentum, memory files, and systems depth rather than a flat card in a grid.",
    techStack: ["TypeScript", "Vite", "HTML5 Canvas", "Procedural Audio", "Memory Files"],
    sceneId: "lantern-oath",
    sceneTheme: "warm hearth suspended in cold space",
    visualTags: ["mythic", "warm metal", "soft fog", "quiet orbit"],
    objectId: "lantern-monolith-anchor",
    objectType: "lantern-monolith",
    portalType: "halo",
    media: [
      {
        id: "lantern-sigil",
        kind: "image",
        label: "Hearth signal",
        caption: "A bespoke poster surface for the chamber when no screenshot is foregrounded.",
        src: "./media/lantern-oath-poster.svg",
        fit: "contain",
      },
      {
        id: "lantern-systems",
        kind: "signal",
        label: "System cadence",
        caption: "Highlights the project's world structure, combat cadence, and authored content layers.",
      },
    ],
    links: [
      {
        label: "Launch project",
        href: "https://never-wet.github.io/games/lantern-oath/",
        accent: "solid",
        external: true,
      },
      {
        label: "Source folder",
        href: "https://github.com/never-wet/never-wet.github.io/tree/main/games/lantern-oath",
        accent: "ghost",
        external: true,
      },
    ],
    transitionBehavior: "dolly",
    accentLighting: {
      primary: "#f4ae65",
      secondary: "#6f5137",
      rim: "#fff4d5",
    },
    interactionText: "Open the hearth chamber",
    soundCueIds: {
      hover: "hover-gilded",
      open: "project-open",
      scene: "scene-shift",
    },
    detailCamera: {
      id: "lantern-chamber",
      position: [-2.7, 2.15, 4.7],
      target: [-4.75, 1.45, 0.25],
      fov: 40,
    },
    chamberTitle: "The Last Hearth",
    chamberDescription:
      "A warm chamber for a world built around exploration, authored content, and steadily layered mechanics.",
    stats: [
      { label: "Mode", value: "Open-world action RPG" },
      { label: "Lens", value: "Retro + systems-heavy" },
      { label: "Structure", value: "Data-first manifests" },
    ],
  },
  {
    id: "midnight-pawn",
    title: "Midnight Pawn",
    shortDescription:
      "A merchant sim and relic broker experience staged as a nocturnal luxury vault.",
    fullDescription:
      "Midnight Pawn is a browser merchant sim centered on appraisal, negotiation, and thematic UI. Its project chamber leans into brass, dark lacquer, and suspended display trays so the site can present it as a place with weight and ritual instead of a static screenshot panel.",
    techStack: ["HTML", "CSS", "JavaScript", "LocalStorage", "Themed UI Systems"],
    sceneId: "midnight-pawn",
    sceneTheme: "gilded nocturnal archive",
    visualTags: ["vintage luxury", "brass", "low glow", "museum vault"],
    objectId: "midnight-vault-anchor",
    objectType: "vault-relic",
    portalType: "vault",
    media: [
      {
        id: "midnight-screen",
        kind: "image",
        label: "Vintage shop floor",
        caption: "A preserved screen from the vintage broker direction.",
        src: "./media/midnight-pawn-screen.png",
        fit: "cover",
      },
      {
        id: "midnight-ledger",
        kind: "signal",
        label: "Broker ledger",
        caption: "A synthetic surface for flow, upgrade rhythm, and drawer-based navigation.",
      },
    ],
    links: [
      {
        label: "Launch project",
        href: "https://never-wet.github.io/games/midnight-pawn/",
        accent: "solid",
        external: true,
      },
      {
        label: "Source folder",
        href: "https://github.com/never-wet/never-wet.github.io/tree/main/games/midnight-pawn",
        accent: "ghost",
        external: true,
      },
    ],
    transitionBehavior: "portal",
    accentLighting: {
      primary: "#d1a36f",
      secondary: "#523620",
      rim: "#f6e1c0",
    },
    interactionText: "Unseal the broker vault",
    soundCueIds: {
      hover: "hover-gilded",
      open: "project-open",
      scene: "scene-shift",
    },
    detailCamera: {
      id: "midnight-chamber",
      position: [6.8, 2.05, -2.6],
      target: [4.1, 1.3, -7.45],
      fov: 39,
    },
    chamberTitle: "Broker's Ledger",
    chamberDescription:
      "A vault-like project scene focused on mood, negotiation flow, and tactile information design.",
    stats: [
      { label: "Mode", value: "Merchant sim" },
      { label: "Strength", value: "Atmosphere-first UI" },
      { label: "Persistence", value: "Browser save model" },
    ],
  },
  {
    id: "reelspull",
    title: "Reels Pull",
    shortDescription:
      "A browser gacha spectacle translated into an orbital machine of light, posters, and motion.",
    fullDescription:
      "Reels Pull is a reel-spinner and rarity-driven browser game with tuned celebration loops, collection systems, progression, and exportable moments. Its chamber becomes a suspended machine with rotating rings, glowing reels, and animated media surfaces that echo the game’s reward cadence.",
    techStack: ["HTML", "CSS", "JavaScript", "Animation Systems", "Browser Persistence"],
    sceneId: "reelspull",
    sceneTheme: "prismatic spin architecture",
    visualTags: ["orbital machine", "celebration", "signal glow", "suspended rings"],
    objectId: "reel-orbit-anchor",
    objectType: "orbital-reel",
    portalType: "prism",
    media: [
      {
        id: "reel-motion",
        kind: "video",
        label: "Reward loop",
        caption: "A live motion surface that mirrors the game's higher-tier celebration energy.",
        src: "./media/reelspull-unreal.gif",
        poster: "./media/reelspull-poster.png",
        fit: "cover",
      },
      {
        id: "reel-poster",
        kind: "image",
        label: "Signal poster",
        caption: "A static celebratory poster to balance the animated surface.",
        src: "./media/reelspull-poster.png",
        fit: "cover",
      },
    ],
    links: [
      {
        label: "Launch project",
        href: "https://never-wet.github.io/games/reelspull/",
        accent: "solid",
        external: true,
      },
      {
        label: "Source folder",
        href: "https://github.com/never-wet/never-wet.github.io/tree/main/games/reelspull",
        accent: "ghost",
        external: true,
      },
    ],
    transitionBehavior: "portal",
    accentLighting: {
      primary: "#78c7ff",
      secondary: "#382a7d",
      rim: "#f4dbff",
    },
    interactionText: "Trigger the orbital reel",
    soundCueIds: {
      hover: "hover-plasma",
      open: "project-open",
      scene: "scene-shift",
    },
    detailCamera: {
      id: "reel-chamber",
      position: [3.25, 3.15, -9.35],
      target: [0.2, 1.75, -17.45],
      fov: 49,
    },
    chamberTitle: "Signal Engine",
    chamberDescription:
      "An immersive spin chamber built around motion loops, rarity theater, and instant browser playability.",
    stats: [
      { label: "Mode", value: "Gacha / reel spinner" },
      { label: "Feel", value: "Celebration-heavy feedback" },
      { label: "Pace", value: "Single-page browser loop" },
    ],
  },
];
