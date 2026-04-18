# Hollowmere Overworld Snapshot: Veil of the Hollow Star

Preserved copy of the graphical Hollowmere overworld build, kept as its own browser-first fantasy mystery RPG with React, TypeScript, Vite, React Router, localStorage persistence, generated SVG art, procedural Web Audio, and a tile-based overworld exploration layer.

## Run locally

```bash
npm install
npm run dev
```

Open `dev.html` through Vite, or visit the published static build at `index.html` after running:

```bash
npm run build
```

## What is included

- Full landing page and title flow
- New game, continue, load slots, export/import save
- Separate local save keys from both the classic build and the active overworld build
- Story scenes with branching dialogue
- Main quests and side quests
- Tile-based overworld exploration with keyboard movement and interact prompts
- Map-first start that places Rowan directly in Thornwake with a visible controllable character
- Turn-based combat with skills, items, boss support, and respawn
- Exploration between multiple locations on a world map
- Inventory and equipment systems
- Character, quest, journal, map, settings, and credits pages
- Procedural audio manager with music, ambience, UI sounds, and SFX
- Generated SVG asset pipeline for backgrounds, portraits, logo, and icons
- Compact memory files under `src/memory/` for future edits

## Important folders

- `src/memory/`: compact manifests, types, save schema, default state
- `src/data/`: story, characters, enemies, quests, items, locations, audio routing
- `src/lib/game/`: reducer, combat, selectors, helper logic
- `src/data/locations/overworldMaps.ts`: route/town/dungeon tile maps
- `src/lib/audio/`: procedural sound manager
- `src/lib/assets/`: generated SVG art helpers
- `src/pages/`: routed UI screens
- `docs/ARCHITECTURE.md`: system overview
- `docs/CONTENT_GUIDE.md`: how to add more content
- `docs/MEMORY.md`: snapshot-specific notes for future assistants and edits

## Static publishing

`npm run build` uses Vite to output `dist/dev.html`, then copies the final static files back to:

- `index.html`
- `assets/`

That keeps the game deployable inside `games/rpg-overworld/` on a static host like GitHub Pages.
