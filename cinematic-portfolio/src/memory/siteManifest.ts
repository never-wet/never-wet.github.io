import type { SiteManifest } from "@/memory/types";

export const siteManifest: SiteManifest = {
  title: "Never Wet // Project Atlas",
  handle: "never-wet",
  tagline: "A cinematic index of worlds, prototypes, and playable systems.",
  description:
    "A scroll-based 3D personal showcase built as a premium atmospheric journey through project chambers.",
  visualDirection: [
    "luxury minimalism",
    "soft-lit futurism",
    "surreal floating architecture",
    "glass and metal materials",
    "calm cinematic motion",
  ],
  sceneOrder: [
    "intro",
    "threshold",
    "lantern-oath",
    "midnight-pawn",
    "reelspull",
    "outro",
  ],
  featureFlags: {
    audioEnabled: true,
    fullscreenProjectScenes: true,
    adaptiveQuality: true,
    reducedMotionRespect: true,
    postProcessing: true,
  },
};
