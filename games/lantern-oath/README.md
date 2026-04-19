# Lantern Oath: The Last Hearth

An original open-world retro pixel action RPG built with TypeScript, Vite, HTML5 canvas, procedural pixel art, and procedural chiptune-style audio.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## What is included

- Top-down 16-bit inspired open-world exploration
- Real-time melee, dodge, projectile, and enemy pattern combat
- Starter town, major city, farms, coast, forest, mines, ruins, dungeon, and interiors
- Main story chapters, side quests, repeatable jobs, shops, inventory, equipment, and economy
- Pixel dialogue boxes, journal, world map, save slots, settings, and generated art/audio pipelines
- Compact memory files under `src/memory/` that act as the source of truth

## Key folders

- `src/engine/`: loop, rendering, combat, AI, collision, input, save, and audio
- `src/game/`: app bootstrapping and DOM-driven retro UI overlays
- `src/data/`: authored maps, quests, jobs, dialogue, items, characters, combat, and audio data
- `src/lib/assets/`: generated pixel sprite and icon pipeline
- `src/memory/`: manifests, registries, save schema, and extension-oriented indexes
- `docs/`: architecture and content extension guides

## First files to read later

If you or another coding assistant comes back to this project later, start with:

- `docs/MEMORY.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_GUIDE.md`
- `src/memory/`
