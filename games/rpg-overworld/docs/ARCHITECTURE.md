# Hollowmere Overworld Architecture

## Overview

`games/rpg-overworld/` is the live top-down Hollowmere build. The browser app uses React + TypeScript + Vite, but active gameplay is driven by a canvas-rendered overworld scene, not by page-style exploration panels.

All saves and settings are local-first and stored in `localStorage`.

## Runtime layers

### 1. Memory layer

`src/memory/` is the compact source-of-truth layer.

Main files:

- `gameManifest.ts`: title, regions, chapters, feature flags
- `mapIndex.ts`: lightweight map/environment/warp summaries
- `eventIndex.ts`: major story triggers, pickups, and battle-linked events
- `characterIndex.ts`: playable cast, NPCs, enemies, skill references
- `questIndex.ts`: main/side quest grouping and dependency hints
- `itemIndex.ts`: item ids and item categories
- `battleIndex.ts`: encounter tiers and reward previews
- `audioManifest.ts`: procedural music and SFX definitions
- `assetManifest.ts`: generated art definitions and palettes
- `storageKeys.ts`: localStorage keys
- `defaultState.ts`: first-play starting state
- `saveSchema.ts`: save versioning and migration
- `types.ts`: shared TypeScript contracts
- `contentRegistry.ts`: compact bridge connecting manifests to full authored content

### 2. Authored content layer

`src/data/` stores the heavier authored content:

- `maps/` equivalent is currently `src/data/locations/overworldMaps.ts`
- `dialogue/` equivalent is currently `src/data/story/scenes.ts`
- `quests/` is `src/data/quests/quests.ts`
- `items/` is `src/data/items/items.ts`
- `characters/` is `src/data/characters/characters.ts`
- `enemies/` is `src/data/enemies/enemies.ts`
- `audio/` is `src/data/audio/audioRoutes.ts`

### 3. Engine layer

`src/engine/` contains the reusable scene/gameplay systems:

- `camera.ts`: camera framing and tile-to-screen conversion
- `sceneManager.ts`: derives whether the runtime is in overworld, dialogue, battle, or gameover mode
- `input/useWorldControls.ts`: held-key movement, interact, pause, message close, shop close
- `render/mapRenderer.ts`: draws the overworld scene to canvas
- `render/spriteRenderer.ts`: draws player, NPC, object, and marker sprites using generated palettes

### 4. Game scene UI layer

`src/game/` contains the scene-specific React UI laid over the canvas:

- `GameViewport.tsx`: owns the canvas, render loop, input hookup, and movement interpolation
- `GameHud.tsx`: field HUD and quick access buttons
- `PauseMenu.tsx`: pause layer with save/menu routing
- `ShopOverlay.tsx`: in-world shop UI
- `WorldMessageOverlay.tsx`: field event/message layer
- `GameOverOverlay.tsx`: respawn/title layer

### 5. Core rules layer

`src/lib/game/` remains the authoritative rule engine:

- `reducer.ts`: all game state transitions
- `combat.ts`: turn-based battle resolution
- `overworld.ts`: tile passability, interaction lookup, encounter picking
- `helpers.ts`: condition checks, rewards, XP, inventory, derived stats
- `selectors.ts`: UI-facing state helpers

### 6. Platform systems

- `src/context/GameContext.tsx`: reducer provider, autosave, settings persistence, playtime ticking
- `src/lib/storage/saveService.ts`: save/load/export/import
- `src/lib/audio/audioManager.ts`: procedural Web Audio playback
- `src/lib/assets/generatedArt.ts`: SVG data URI generation

## How the map system works

1. `src/data/locations/overworldMaps.ts` defines passable tiles, blocked tiles, spawn points, and map interactions.
2. `src/lib/game/overworld.ts` resolves tile types, collisions, available interactions, and front-facing interaction checks.
3. `GameViewport.tsx` reads the current map and player position from state and feeds them into the canvas renderer.
4. `render/mapRenderer.ts` draws tiles, props, NPCs, interaction markers, weather, and the player sprite each frame.
5. `camera.ts` keeps the player near the center of the viewport when the map is larger than the screen.
6. `reducer.ts` remains authoritative for movement, stepping onto trigger tiles, travel, and encounter starts.

## Gameplay loop

1. `New Game` creates a playable state in Thornwake with the first main quest already active.
2. The player gets control in the live town map immediately.
3. Keyboard input drives collision-aware tile movement.
4. NPCs, interiors, pickups, and event tiles advance the story and side content.
5. Wild tiles or scripted actions transition into the battle scene.
6. Rewards feed inventory, XP, silver, journal entries, and quest progress.
7. Autosave and manual slots preserve progress locally.

## Save and persistence model

- Autosave runs automatically while playing.
- Manual save slots snapshot the full `GameState`.
- Settings and audio levels are persisted separately.
- Save migration currently normalizes to the current schema through `saveSchema.ts`.

## Static hosting

The project uses `HashRouter` because the build is published as static files under `games/rpg-overworld/` and needs safe refresh behavior on static hosts.
