# Architecture

## Overview

`Lantern Oath: The Last Hearth` is a Vite + TypeScript browser RPG built around a canvas-rendered world and DOM-driven retro overlays.

The runtime is split into three practical layers:

- `src/memory/`
  Compact source-of-truth indexes, save schema, default state, and the registry that ties authored content together.
- `src/data/`
  Authored world content: maps, NPCs, quests, jobs, dialogue, items, combat definitions, and music patterns.
- `src/engine/` plus `src/game/`
  Simulation, rendering, input, saves, audio, and overlay UI.

## Runtime Flow

1. `src/main.ts`
   Boots the app shell and global styles.
2. `src/game/App.ts`
   Creates the title screen, canvas, HUD, modal overlays, and the main animation loop.
3. `src/engine/GameSession.ts`
   Owns the live world state:
   player stats, movement, collisions, combat, enemies, quests, jobs, inventory, dialogue, shops, time, and saves.
4. `src/engine/Renderer.ts`
   Draws the tile world, sprites, effects, bars, pickups, and palette tint on the canvas.
5. `src/engine/AudioManager.ts`
   Synthesizes chiptune-style music and retro SFX with Web Audio.

## Memory Files

Read these first when extending the game:

- `src/memory/gameManifest.ts`
  Title, summary, chapter overview, feature flags.
- `src/memory/worldIndex.ts`
  Region-level structure and travel relationships.
- `src/memory/mapIndex.ts`
  Map IDs, theme tags, and map-to-map links.
- `src/memory/characterIndex.ts`
  Player, major NPCs, enemy families, boss list.
- `src/memory/jobIndex.ts`
  Profession summaries and gameplay hooks.
- `src/memory/questIndex.ts`
  Main and side quest IDs.
- `src/memory/dialogueIndex.ts`
  Dialogue ownership and variant reference overview.
- `src/memory/itemIndex.ts`
  Item category buckets and shop IDs.
- `src/memory/combatIndex.ts`
  Weapon IDs, boss IDs, behavior summaries, skill IDs.
- `src/memory/audioManifest.ts`
  Music and SFX inventory.
- `src/memory/assetManifest.ts`
  Generated sprite and icon inventory.
- `src/memory/defaultState.ts`
  Fresh save payload.
- `src/memory/saveSchema.ts`
  Save version and migration hook.
- `src/memory/contentRegistry.ts`
  Registry that the engine reads at runtime.

## World and Map System

Maps live in `src/data/maps/maps.ts`.

Each map contains:

- `layout`
  ASCII tile rows.
- `legend`
  Tile-character to tile-kind mapping and collision.
- `portals`
  Tile-space rectangles that transition to another map and spawn point.
- `spawnPoints`
  Named entry positions used by doors, map links, respawns, and scripted moves.
- `npcPlacements`
  NPC IDs and starting locations.
- `enemyPlacements`
  Enemy spawns with respawn timing.
- `resourceNodes`
  Herbs, ore, fish spots, chests, signs, beds, and lore pickups.

The engine multiplies tile-space coordinates by `TILE_SIZE` when a map is loaded.

## Combat

Real-time combat lives in `src/engine/GameSession.ts` using content from:

- `src/data/combat/weapons.ts`
- `src/data/items/items.ts`
- `src/data/combat/weapons.ts` enemy definitions section

Player combat supports:

- free movement during battle
- melee hitboxes
- ranged weapon projectiles
- dodge with invulnerability frames
- stamina and aether resource use
- pickups and loot drops

Enemy AI supports:

- melee chase attacks
- skirmish movement
- ranged projectile pressure
- charge attacks
- boss spread, nova, and charge patterns

## Generated Art

The visual pipeline is code-generated instead of using imported sprite sheets.

- `src/lib/assets/pixelFactory.ts`
  Draws player, NPC, enemy, icon, marker, and prop sprites into cached canvases.
- `src/engine/Renderer.ts`
  Draws tiles directly with palette-driven pixel details.

This keeps the project fully original, editable, and self-contained.

## Audio

Procedural audio lives in:

- `src/data/audio/tracks.ts`
  Track note patterns and voice definitions.
- `src/engine/AudioManager.ts`
  Music scheduling and SFX synthesis.

No external audio files are required.

## Save System

Local persistence uses browser `localStorage`:

- `src/engine/SaveManager.ts`
  Slot read/write, latest-slot tracking, and settings persistence.
- `src/memory/storageKeys.ts`
  All storage keys in one place.

Manual saves, auto-saves, settings, and multi-slot loading all route through the save manager.
