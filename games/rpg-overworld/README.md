# Hollowmere Overworld: Veil of the Hollow Star

Top-down browser RPG built with React, TypeScript, Vite, localStorage persistence, procedural audio, generated SVG art, and a canvas-rendered overworld scene.

This build is the live gameplay version of Hollowmere. It is separate from:

- `games/rpg/` for the classic page-navigation build
- `games/rpg-overworld-snapshot/` for the preserved saved copy of the liked overworld build

## Run locally

```bash
npm install
npm run dev
```

Build the published static version:

```bash
npm run build
```

## What is included

- Title screen, new game, continue, load, settings, credits
- Full-screen top-down overworld scene on `/game`
- Keyboard movement with collision, camera follow, and interaction prompts
- Enterable interior building
- Town, route, marsh, abbey, and spire maps
- NPC interactions, dialogue scenes, step triggers, item pickups, and quests
- Turn-based battle scene with encounter transitions
- Inventory, equipment, journal, map, and character menus
- Procedural music and SFX with persistent settings
- Autosave, manual saves, export/import, and local-first persistence
- Compact memory files under `src/memory/`

## Important folders

- `src/engine/`: camera, input handler, scene helpers, canvas renderers
- `src/game/`: viewport, HUD, pause menu, shop overlay, and other in-game scene UI
- `src/memory/`: compact source-of-truth manifests and save schema
- `src/data/`: authored maps, dialogue, enemies, quests, items, and audio routes
- `src/lib/game/`: reducer, combat resolution, movement/collision, selectors, helper logic
- `src/lib/audio/`: procedural Web Audio manager
- `src/lib/assets/`: generated SVG asset helpers
- `docs/ARCHITECTURE.md`: engine and system overview
- `docs/CONTENT_GUIDE.md`: how to add maps, NPCs, quests, encounters, and audio
- `docs/MEMORY.md`: project memory and split/version notes

## Static publishing

`npm run build` outputs Vite files to `dist/dev.html`, then copies the final published files back into:

- `index.html`
- `assets/`

That keeps the game deployable inside `games/rpg-overworld/` on a static host like GitHub Pages.
