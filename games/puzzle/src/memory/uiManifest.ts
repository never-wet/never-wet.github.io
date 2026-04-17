// Read this file before making visual, wording, or control-system changes.
// It captures compact UI/content decisions so future edits do not depend on
// long chat history or re-reading large component files.
//
// Maintenance rule:
// When a durable UI, wording, layout, or control decision is made, update this
// file in the same change whenever that decision should survive beyond the
// current conversation.
export const uiManifest = {
  codename: "Kinetic Core",
  designDirection: {
    summary: "Sharp-edged cyber mystery interface inspired by stitched terminal panels.",
    principles: [
      "Prefer monolithic panels and hard edges over soft, generic rounded cards.",
      "Keep the app dark, high-contrast, and premium rather than playful or pastel.",
      "Use accent color with restraint so key clues, buttons, and status lines stand out.",
    ],
  },
  layoutRules: [
    "Use the full viewport width and avoid decorative left/right page gutters.",
    "Keep scrollbars visually hidden unless a platform forces them.",
    "Preserve the same hierarchy across devices by scaling and stacking layouts with media queries.",
  ],
  controlRules: [
    "Do not rely on native opened <select> menus for important UI; use the custom SelectMenu.",
    "Checkboxes and list controls should use the shared themed styles in global.css.",
    "Option lists should feel like part of the app shell, not browser-default widgets.",
    "Dropdown trigger labels must reserve dedicated space for the arrow so text never collides with the affordance.",
    "Search and filter controls should wrap before placeholder or value text becomes visibly clipped.",
  ],
  navigationRules: [
    "Every puzzle page should expose a direct Next Puzzle action so players can move through the catalog without returning to the browser grid each time.",
    "The global shell should always provide a direct way back to the games hub from anywhere in the app.",
  ],
  puzzleCommunicationRules: [
    "Prefer literal, step-by-step instructions over poetic or ambiguous phrasing.",
    "When a visual clue is clearer than text, show the visual first and keep text as backup.",
    "Keep answer visuals compact enough to compare at a glance without scrolling.",
  ],
  assetRules: [
    "Prefer local SVG/CSS-generated visuals over external hosted images.",
    "Keep puzzle metadata and rules in memory/data files instead of scattering logic across pages.",
  ],
  primaryReferences: [
    "src/styles/global.css",
    "src/components/common/SelectMenu.tsx",
    "src/components/puzzle/PuzzleRenderer.tsx",
    "src/data/puzzles/visuals.ts",
  ],
} as const;
