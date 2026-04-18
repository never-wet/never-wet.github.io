# Hollowmere: Veil of the Hollow Star

Browser-first fantasy mystery RPG built with React, TypeScript, Vite, React Router, localStorage persistence, generated SVG art, and procedural Web Audio.

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
- Story scenes with branching dialogue
- Main quests and side quests
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
- `src/lib/audio/`: procedural sound manager
- `src/lib/assets/`: generated SVG art helpers
- `src/pages/`: routed UI screens
- `docs/ARCHITECTURE.md`: system overview
- `docs/CONTENT_GUIDE.md`: how to add more content

## Static publishing

`npm run build` uses Vite to output `dist/dev.html`, then copies the final static files back to:

- `index.html`
- `assets/`

That keeps the game deployable inside `games/rpg/` on a static host like GitHub Pages.
