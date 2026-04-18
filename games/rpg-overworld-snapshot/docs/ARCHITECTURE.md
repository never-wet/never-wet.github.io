# Hollowmere Architecture

## Overview

Hollowmere is a local-first single-player RPG delivered as a static browser app. The runtime is a React + TypeScript + Vite client with no backend. All progression, settings, and save slots live in `localStorage`.

## Core layers

### 1. Memory files

`src/memory/` contains compact source-of-truth files that let future edits start with a small context window:

- `gameManifest.ts`: title, chapters, regions, feature flags
- `storyIndex.ts`: chapter-to-scene progression map
- `characterIndex.ts`: playable characters, NPCs, enemies, skills
- `locationIndex.ts`: location list and unlock intent
- `itemIndex.ts`: item IDs and behavior references
- `questIndex.ts`: main/side quest grouping and dependencies
- `audioManifest.ts`: procedural music/ambience/SFX definitions
- `storageKeys.ts`: all localStorage keys
- `defaultState.ts`: initial game state and settings
- `types.ts`: shared TypeScript contracts
- `contentRegistry.ts`: bridges manifests to full content modules
- `saveSchema.ts`: save versioning, slot IDs, migration helpers
- `uiManifest.ts`: navigation structure
- `assetManifest.ts`: generated art definitions

### 2. Content modules

`src/data/` holds the heavier authored content:

- `story/`: scenes, encounters, journal entries
- `characters/`: characters and skill definitions
- `quests/`: quest definitions and rewards
- `items/`: consumables, equipment, quest items
- `locations/`: map nodes and interactable actions
- `enemies/`: enemy definitions and AI behavior
- `audio/`: route-to-track mapping

The memory layer stays compact while the authored content remains modular and editable.

### 3. Game systems

`src/lib/game/` is the rule engine:

- `reducer.ts`: central game reducer and high-level action handling
- `combat.ts`: turn-based combat resolution
- `overworld.ts`: tile map movement, collisions, and field interaction helpers
- `helpers.ts`: condition checks, stat math, XP, notifications, inventory utilities
- `selectors.ts`: UI-facing read helpers

### 4. Platform systems

- `src/lib/storage/saveService.ts`: save slots, autosave, settings persistence, export/import
- `src/lib/audio/audioManager.ts`: procedural Web Audio playback for music, ambience, SFX, and UI sounds
- `src/lib/assets/generatedArt.ts`: SVG data URI generation for portraits, icons, backgrounds, and logo

### 5. UI

- `src/context/GameContext.tsx`: reducer wiring, autosave effect, settings persistence
- `src/pages/`: routed screens
- `src/components/`: reusable panels, art helpers, dialogue and combat views
- `src/styles/global.css`: visual system and responsive styling

## Gameplay loop

1. `New Game` creates a default state with Rowan already standing in Thornwake and the first quest active.
2. The opening instruction is delivered as an overworld prompt instead of a blocking cutscene.
3. The player moves across a tile-based overworld using keyboard or on-screen controls from the first second.
4. NPC, shop, travel, and hotspot tiles fire actions, story scenes, or message popups.
5. Wild tiles can trigger repeatable field encounters.
6. Story scenes still drive dialogue, choices, and scripted effects after those hotspots are reached.
7. Combat rewards feed inventory, XP, silver, and quest progress.
8. Autosave writes the live journey to localStorage while manual slots snapshot the current state.

## Persistence model

- Autosave is updated automatically while playing.
- Manual save slots are separate snapshots.
- Export/import serializes the same save shape used in localStorage.
- Save migration currently normalizes everything to `SAVE_VERSION = 1`.

## Why HashRouter

The project is published as static files under `games/rpg-overworld/`. Hash routing avoids direct-refresh path issues on static hosts while still satisfying the React Router requirement.
