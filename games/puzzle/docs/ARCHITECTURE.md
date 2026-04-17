# Puzzle Escape Lab Architecture

## Overview

Puzzle Escape Lab is organized around a lightweight memory-file architecture. The goal is to keep the project easy to extend without forcing future contributors to read large UI files to understand where content and rules live.

## Main Source-of-Truth Files

### `src/memory/gameManifest.ts`

Stores:

- Global app metadata
- Tagline and description
- Category list
- Progression overview
- Unlock rules summary
- Featured challenge ids

Read this first when orienting yourself to the app.

### `src/memory/puzzleIndex.ts`

Stores a lightweight index of every puzzle:

- `id`
- `title`
- `category`
- `difficulty`
- `type`
- `tags`
- `estimatedTime`
- `unlockSummary`

Use this when you need a quick inventory of the puzzle catalog.

### `src/memory/escapeRoomIndex.ts`

Stores a lightweight index of every escape room:

- `id`
- `title`
- `difficulty`
- `estimatedTime`
- `sceneCount`
- `featuredPuzzleIds`
- `unlockSummary`

Use this when working on Escape Mode without opening each room file.

### `src/memory/contentRegistry.ts`

Maps puzzle ids to their full content objects and exports `allPuzzles`.

### `src/memory/storageKeys.ts`

Defines the localStorage namespace and version in one place.

### `src/memory/defaultState.ts`

Defines the initial app state and default settings.

### `src/memory/types.ts`

Shared TypeScript interfaces for:

- Puzzles
- Puzzle progress
- Escape rooms
- Scenes
- Hotspots
- Inventory
- Activities
- Settings
- App state

### `src/memory/activitySchema.ts`

Defines the activity entry shape and the helper that creates timestamped activity entries.

## Where Puzzle Data Lives

Detailed puzzle content lives in:

- `src/data/puzzles/logicPuzzles.ts`
- `src/data/puzzles/deductionPuzzles.ts`
- `src/data/puzzles/cipherPuzzles.ts`
- `src/data/puzzles/scenePuzzles.ts`
- `src/data/puzzles/passcodePuzzles.ts`
- `src/data/puzzles/wordPuzzles.ts`
- `src/data/puzzles/metaPuzzles.ts`

These files use the builders in `src/data/puzzles/builders.ts` so puzzle definitions stay concise.

## Where Escape Room Data Lives

Escape room definitions live in:

- `src/data/escapeRooms/clockworkManor.ts`
- `src/data/escapeRooms/submergedArchive.ts`
- `src/data/escapeRooms/polarSignalLab.ts`

Room registration happens in:

- `src/data/escapeRooms/index.ts`

Each room contains:

- Room metadata
- Inventory items
- Scene definitions
- Hotspots
- Scene transitions
- Exit goal and featured puzzle ids

## LocalStorage Structure

The root app snapshot is stored under the key defined in `src/memory/storageKeys.ts`.

The saved structure includes:

- `version`
- `puzzleProgress`
- `escapeProgress`
- `inventory`
- `settings`
- `currentPuzzleId`
- `recentActivity`
- `stats`

Persistence is handled by:

- `src/lib/storage/localStorageManager.ts`

That file also contains migration-safe loading and basic snapshot sanitization.

## Game Logic Layer

### `src/lib/game/puzzleHelpers.ts`

Contains:

- Answer normalization
- Puzzle answer validation
- Score calculation
- Answer preview for reveal mode

### `src/lib/game/progression.ts`

Contains:

- Unlock checks
- Puzzle and room status calculations
- Category completion math
- Streak/stat calculations
- Resume route logic
- Transition availability checks

### `src/context/GameContext.tsx`

This is the main runtime state layer. It owns:

- Loading from localStorage
- Saving back to localStorage
- Puzzle start/submit/hint/reset actions
- Escape room scene progress
- Hotspot inspection
- Inventory combination
- Settings updates
- Toast notifications

## UI Layer

The UI is intentionally split into small focused folders:

- `src/components/layout`
- `src/components/common`
- `src/components/puzzle`
- `src/components/escape`
- `src/components/dashboard`
- `src/pages`

Pages should consume the memory/config files and context actions instead of hardcoding game rules.

## How to Add a New Puzzle

1. Choose the correct category file under `src/data/puzzles/`.
2. Add a new puzzle using a builder from `src/data/puzzles/builders.ts`.
3. Give it:
   - `id`
   - `title`
   - `category`
   - `difficulty`
   - `description`
   - `instructions`
   - `hints`
   - `unlock`
   - `tags`
   - `estimatedTime`
   - `relatedPuzzles`
   - `content`
4. The puzzle will be registered automatically by `src/memory/contentRegistry.ts`.
5. It will appear automatically in:
   - All Puzzles
   - Category pages
   - View Mode
   - Home featured lookups if referenced in the manifest

## How to Add a New Puzzle Type

1. Add the new type to `PuzzleType` and `PuzzleContent` in `src/memory/types.ts`.
2. Add a new builder helper in `src/data/puzzles/builders.ts` if it helps keep content concise.
3. Extend validation in `src/lib/game/puzzleHelpers.ts`.
4. Extend UI rendering in `src/components/puzzle/PuzzleRenderer.tsx`.
5. If the type affects scoring or session persistence, update `src/context/GameContext.tsx`.

## How to Add a New Escape Room

1. Create a new room file in `src/data/escapeRooms/`.
2. Export a valid `EscapeRoomDefinition`.
3. Register it in `src/data/escapeRooms/index.ts`.
4. If you want it locked behind progression, add unlock conditions in the room definition.
5. It will automatically appear in:
   - Escape Mode listing
   - View Mode room tab

## Token-Efficient Editing Strategy

When making future edits, read files in this order:

1. `src/memory/gameManifest.ts`
2. `src/memory/puzzleIndex.ts`
3. `src/memory/escapeRoomIndex.ts`
4. `src/memory/types.ts`
5. The specific content file you want to change

That path usually gives enough context without opening large route or component files.
