# Puzzle Escape Lab

Puzzle Escape Lab is a premium single-page puzzle platform built with React, TypeScript, and Vite. It combines IQ-style logic tests, ciphers, observation scenes, hidden-object hunts, passcode locks, and three multi-scene escape rooms into one local-first experience.

## Features

- Dark, polished mystery UI with responsive layouts and animated cards
- React Router navigation for Home, All Puzzles, Categories, Puzzle Play, Escape Mode, View Mode, Settings, and About
- Reusable puzzle engine supporting:
  - Multiple choice
  - Text input
  - Numeric and visual sequences
  - Match pairs
  - Drag-and-drop arrangement
  - Passcode / keypad puzzles
  - Hotspot / hidden-object scene puzzles
  - Spot-the-difference puzzles
- 45 built-in puzzles across many categories
- 3 sample escape rooms with multiple scenes, inventory, scene transitions, and linked puzzles
- Full localStorage persistence with a versioned storage layer
- View Mode dashboard for stats, timestamps, room progress, hint usage, and activity history
- Memory-file architecture for token-efficient future edits

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- LocalStorage only, no backend

## Run Locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

To create a production build:

```bash
npm run build
npm run preview
```

`npm run build` also publishes a static homepage into `games/puzzle/index.html` plus `games/puzzle/assets/`, so the puzzle folder has a directly openable homepage after building.

## Main Project Structure

```text
src/
  components/        Reusable UI and puzzle engine pieces
  context/           Game state provider and actions
  data/
    puzzles/         Puzzle content split by category
    escapeRooms/     Escape room and scene definitions
  hooks/             Custom hooks
  lib/
    game/            Validation, progression, formatting helpers
    storage/         Versioned localStorage manager
  memory/            Compact source-of-truth files and indexes
  pages/             Route pages
  styles/            Global styling
docs/
  ARCHITECTURE.md    Developer guide for extending the app
dev.html             Vite source entry used during development
index.html           Published static homepage after build
```

## Main Memory Files

- `src/memory/gameManifest.ts`
- `src/memory/puzzleIndex.ts`
- `src/memory/escapeRoomIndex.ts`
- `src/memory/storageKeys.ts`
- `src/memory/defaultState.ts`
- `src/memory/types.ts`
- `src/memory/activitySchema.ts`
- `src/memory/contentRegistry.ts`

These files are the compact source of truth for app metadata, shared schemas, storage keys, puzzle indexes, and escape room indexes.

## Adding New Puzzle Content

1. Add a new puzzle definition inside the relevant file in `src/data/puzzles/`.
2. Use the helper builders in `src/data/puzzles/builders.ts`.
3. The puzzle is automatically included through `src/memory/contentRegistry.ts`.
4. It will appear in the browser, category pages, dashboard, and unlock system.

## Adding a New Escape Room

1. Create a new room file in `src/data/escapeRooms/`.
2. Export an `EscapeRoomDefinition`.
3. Register it in `src/data/escapeRooms/index.ts`.
4. The room will appear in Escape Mode and the dashboard automatically.

## Notes

- All progress is stored in the browser only.
- No accounts, backend services, or databases are used.
- Resetting progress from Settings clears local puzzle and room state.

## Developer Docs

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the extension workflow and memory-file design.
