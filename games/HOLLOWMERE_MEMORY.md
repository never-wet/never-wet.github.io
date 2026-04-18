# Hollowmere Variants Memory

## Purpose

This file is the top-level memory index for the three Hollowmere builds inside `games/`.

Read this first when future work needs to understand which RPG folder is the active one and which ones are preserved.

## Current variant contract

- `games/rpg/`
  - classic story-first panel/navigation build
  - keep as the polished narrative interface version
- `games/rpg-overworld/`
  - live active top-down overworld build
  - this is the version meant for future gameplay upgrades
- `games/rpg-overworld-snapshot/`
  - preserved saved copy of the earlier liked overworld build
  - keep frozen unless explicitly asked to change it

Do not silently merge these folders back together.

## Recommended read order

If continuing work on the live game, read:

1. `games/rpg-overworld/docs/MEMORY.md`
2. `games/rpg-overworld/src/memory/`
3. `games/rpg-overworld/src/pages/GamePage.tsx`
4. `games/rpg-overworld/src/game/`
5. `games/rpg-overworld/src/engine/`

If continuing work on the classic version, read:

1. `games/rpg/docs/MEMORY.md`
2. `games/rpg/src/memory/`
3. `games/rpg/src/pages/GamePage.tsx`

If referencing the preserved older overworld version, read:

1. `games/rpg-overworld-snapshot/docs/MEMORY.md`
2. `games/rpg-overworld-snapshot/src/memory/`
3. `games/rpg-overworld-snapshot/src/pages/GamePage.tsx`

## Save isolation

Each build must keep separate browser storage:

- classic:
  - `hollowmere:rpg:saves`
  - `hollowmere:rpg:settings`
  - `hollowmere:rpg:manifest`
- live overworld:
  - `hollowmere:overworld:saves`
  - `hollowmere:overworld:settings`
  - `hollowmere:overworld:manifest`
- snapshot:
  - `hollowmere:overworld-snapshot:saves`
  - `hollowmere:overworld-snapshot:settings`
  - `hollowmere:overworld-snapshot:manifest`

## Current status

- classic build exists and should stay page-navigation based
- live overworld build exists and is the main place for engine/gameplay upgrades
- snapshot exists as a preserved saved copy of the earlier graphical overworld version
- each variant already has its own `docs/MEMORY.md`

## Publish reminders

Build inside the specific folder being changed:

- `games/rpg/`
- `games/rpg-overworld/`
- `games/rpg-overworld-snapshot/`

Each Vite build republishes static output back into that folder's:

- `index.html`
- `assets/`
