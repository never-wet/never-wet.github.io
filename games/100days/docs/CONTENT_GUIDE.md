# Content Guide

## Where To Edit Content

### Progression to Day 100

Edit:

- `src/memory/dayProgression.ts`

This file controls:

- day duration
- biome changes
- enemy caps
- spawn rate
- elite chance
- milestone tags
- boss schedule

### Add or Rebalance a Weapon

Edit:

- `src/memory/weaponIndex.ts`

Each weapon entry defines:

- `id`
- `name`
- `description`
- `archetype`
- rarity and unlock day
- `baseStats`
- `perLevel`

Runtime behavior for archetypes is implemented in:

- `src/game/runtime.ts`

If you add a new weapon archetype instead of reusing an existing one, update:

- `src/memory/types.ts`
- `src/game/runtime.ts`
- optionally `src/engine/renderer.ts`

### Add or Rebalance a Passive

Edit:

- `src/memory/passiveIndex.ts`

Passives apply stat deltas through:

- `src/game/rules.ts`

### Add a New Enemy

Edit:

- `src/memory/enemyIndex.ts`

Then ensure it appears in some day schedule inside:

- `src/memory/dayProgression.ts`

Enemy behavior routing is handled in:

- `src/game/runtime.ts`

### Add a New Boss

1. Add the boss definition to `src/memory/enemyIndex.ts`.
2. Schedule it in `src/memory/dayProgression.ts` via `bossByDay`.
3. If it needs special behavior, extend `handleBossActions()` in `src/game/runtime.ts`.
4. If it needs unique visuals, add an entry to `src/memory/assetManifest.ts`.

### Change Loot

Edit:

- `src/memory/lootIndex.ts`

Drop behavior is implemented in:

- `src/game/runtime.ts` in `dropLoot()`

## Generated Art Pipeline

The game does not rely on external image assets.

Procedural art files:

- `src/memory/assetManifest.ts`
- `src/engine/assets.ts`

How it works:

- each asset receives an ID, palette, shape, and size
- `SpriteLibrary` draws the asset into an offscreen canvas
- the renderer reuses those generated canvases for gameplay

To add a new procedural sprite:

1. Add its definition to `assetManifest.ts`.
2. Add or reuse a shape case in `assets.ts`.
3. Reference that asset ID from weapons, enemies, pickups, or UI logic.

## Generated Audio Pipeline

The game uses Web Audio instead of sound files.

Files:

- `src/memory/audioManifest.ts`
- `src/engine/audioManager.ts`

To add new SFX:

1. Add the cue manifest entry.
2. Trigger it from the runtime or UI.

To rebalance music:

1. Edit BPM, scale, bass, or melody arrays in `audioManifest.ts`.
2. The scheduler in `audioManager.ts` will automatically use the updated sequence.

## Main Content Counts In This Build

- 10 weapons
- 21 passives
- 7 standard enemies
- 3 elite variants
- 5 bosses
- 5 biome looks across the 100-day run

## Fast Entry Files For Future Assistants

If someone needs to understand the game quickly, start here:

1. `src/memory/gameManifest.ts`
2. `src/memory/dayProgression.ts`
3. `src/memory/weaponIndex.ts`
4. `src/memory/passiveIndex.ts`
5. `src/memory/enemyIndex.ts`
6. `src/game/runtime.ts`
