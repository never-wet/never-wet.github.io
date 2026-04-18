# Architecture

## Overview

`games/100days/` is a standalone Vite + TypeScript project that renders a top-down survival game into one HTML5 canvas while HTML overlays handle menus and HUD.

The runtime is local-first:

- no backend
- no third-party hosted assets
- local save data in `localStorage`
- procedural art and audio generated inside the browser

## Runtime Layers

### 1. Memory layer

`src/memory/` is the compact source-of-truth layer.

- `gameManifest.ts`: title, run mode, milestones, feature flags
- `dayProgression.ts`: complete Day 1 to Day 100 pacing and boss scheduling
- `playerDefaults.ts`: base player stats and starting kit
- `weaponIndex.ts`: weapon archetypes and upgrade curves
- `passiveIndex.ts`: passive upgrades and stat modifiers
- `enemyIndex.ts`: enemy roster, elites, bosses, and combat roles
- `lootIndex.ts`: XP and item drop definitions
- `audioManifest.ts`: procedural music/SFX manifests
- `assetManifest.ts`: generated sprite/effect/logo definitions
- `storageKeys.ts`: localStorage key map
- `defaultState.ts`: initial settings, player stats, and profile
- `saveSchema.ts`: save versioning and migration
- `types.ts`: shared TS contracts
- `contentRegistry.ts`: single registry that maps IDs to loaded content

This layer is intentionally small so future edits can start with low context.

### 2. Data helpers

`src/data/` contains heavier content helpers that don’t belong in the compact manifests.

- `maps/biomes.ts`: biome palettes and background rendering data
- `upgrades/choicePool.ts`: level-up and day reward generation logic

### 3. Engine systems

`src/engine/` contains reusable runtime systems.

- `gameLoop.ts`: frame driver
- `renderer.ts`: world/background/effects rendering
- `camera.ts`: smoothed follow camera and shake
- `input.ts`: keyboard controls
- `collision.ts`: geometry, vectors, and utility math
- `entityManager.ts`: active world entity arrays and cleanup
- `particleManager.ts`: particles and floating damage text
- `spawnManager.ts`: wave and boss spawn scheduling
- `audioManager.ts`: procedural Web Audio music and SFX
- `saveManager.ts`: load/save/reset wrappers for localStorage
- `assets.ts`: procedural sprite generation pipeline

### 4. Game layer

`src/game/` coordinates the actual play loop.

- `runtime.ts`: central game coordinator and scene state
- `rules.ts`: weapon stat resolution, passive application, XP scaling
- `ui.ts`: DOM overlay menus, HUD, settings, rewards, and upgrade cards

## Main Loop

The runtime steps through this order each active gameplay frame:

1. Read movement input.
2. Update player movement, regen, hit state, and day timer.
3. Ask `SpawnManager` for enemy and boss spawns.
4. Update automatic weapons and drones.
5. Update enemy AI and attacks.
6. Update projectiles, beams, mines, and pickups.
7. Update particles and floating text.
8. Resolve level-ups, day completion, death, or victory.
9. Autosave periodically.
10. Render the world and refresh the UI overlay.

## Scene Model

The game uses lightweight scene IDs rather than a heavyweight scene framework:

- `title`
- `playing`
- `paused`
- `upgrade`
- `day-summary`
- `settings`
- `game-over`
- `victory`

The canvas stays mounted while the overlay swaps panels on top.

## Save Model

Save data is stored in a single localStorage entry and includes:

- profile meta (`bestDay`, `completedDay100`, totals)
- settings (master/music/SFX, toggles)
- the current run snapshot

Run snapshots store:

- current day
- day timer
- total run time
- full player state
- acquired weapons and passives
- whether the one-time continue has been spent

## Rendering Model

The renderer is custom and data-driven.

- Backgrounds use biome palettes and tile hashing for decorative world props.
- Entities are drawn with procedural sprite canvases generated from `assetManifest.ts`.
- UI stays in HTML/CSS to keep menus, settings, and upgrade cards responsive.

## Audio Model

The audio manager creates music and SFX procedurally through Web Audio:

- track manifests define BPM and note patterns
- SFX manifests define waveform, envelope, glide, and optional noise
- music state switches automatically between title, field, boss, and victory
- all volumes and mute toggles persist in the save
