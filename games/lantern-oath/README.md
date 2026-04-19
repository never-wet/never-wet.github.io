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

## Validate content

```bash
npm run qa
```

This validates map bounds, portals, spawns, NPC/enemy placements, dialogue links, quest references, job references, and the required main-story completion flags before you publish a build.

## Release checks

```bash
npm run release:must-have
npm run release:must-have:5
npm run release:combat
npm run release:combat:5
npm run release:world
npm run release:world:5
npm run release:story
npm run release:story:5
npm run release:content
npm run release:content:5
npm run release:visual
npm run release:visual:5
npm run release:audio
npm run release:audio:5
npm run release:qol
npm run release:qol:5
npm run release:final
npm run release:final:10
```

These add stricter release gates on top of `npm run qa`. The must-have gate checks map reachability from valid spawns, critical main-route portal connectivity, and save/load round-trip persistence. The combat gate checks weapon-style coverage, projectile differentiation, lantern-skill burst tuning, enemy telegraph timing, and combat-role coverage. The world gate checks region graph coverage, landmark/lore presence on major travel maps, and main-quest guidance chain integrity. The story gate checks main-story guidance and ending support. The content gate checks population, shops, job payoffs, progression breadth, and secret rewards. The visual gate checks marker/icon asset coverage. The audio gate checks track/SFX coverage plus settings persistence. The QoL gate checks controls, journal separation, ownership/equipment cues, and prompt clamp behavior. The repeated commands run `qa`, the selected release gate, and `build` in sequence.

The written finish checklist lives in `docs/RELEASE_CHECKLIST.md`.

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
