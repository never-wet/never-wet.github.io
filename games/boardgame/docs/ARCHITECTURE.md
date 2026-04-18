# Architecture

Boardgame Vault is organized around small source-of-truth files and pluggable game modules.

## Core layers

- `src/memory/`
  - Compact manifests and schemas.
  - These files are the first place to read when changing app-wide behavior.
- `src/context/AppContext.tsx`
  - Owns persisted app state, saves, stats, settings, and recent activity.
- `src/state/storage.ts`
  - Handles `localStorage` read/write and migration through `saveSchema.ts`.
- `src/games/`
  - One folder per playable game.
  - Each module owns rules, state shape, AI, serialization, and board rendering.
- `src/ai/search.ts`
  - Shared negamax / alpha-beta search helper used by several games.
- `src/pages/`
  - Route-level screens for home, hub, dashboard, settings, and live play.

## Main memory files

- `gameManifest.ts`: app metadata, feature flags, supported games, and routes.
- `gameIndex.ts`: per-game descriptions, tags, hero copy, and overview metadata.
- `aiIndex.ts`: difficulty presets, search depth, and AI move timing.
- `storageKeys.ts`: all `localStorage` keys in one place.
- `defaultState.ts`: default persisted app state.
- `types.ts`: shared types and game-module contracts.
- `statsSchema.ts`: default stats models and match record helpers.
- `contentRegistry.ts`: maps game ids to runtime modules.
- `uiManifest.ts`: navigation and dashboard card structure.
- `saveSchema.ts`: save format versioning and migration.

## Persistence

- App state is versioned through `saveSchema.ts`.
- Each game can serialize its own state through the shared `GameModule` contract.
- Saves store the current snapshot, a capped undo stack, difficulty, timestamps, and whether the match is finished.
- Completed games create a `MatchRecord`, update per-game totals, and mark the live save complete.

## AI

- Small games use full or near-full search.
- Larger games use alpha-beta with heuristics and candidate move pruning.
- Difficulty adjusts:
  - depth
  - randomness
  - move delay
  - heuristic sharpness

## UI flow

- Home page highlights resume state, progress, and featured quick starts.
- Hub page shows all games and rules summaries.
- Game page runs one module at a time and provides difficulty, undo, history, status, and rules.
- Dashboard aggregates wins, losses, draws, streak, per-game breakdown, and recent activity.

## UI memory

- `src/memory/uiManifest.ts` also stores play-view notes for special-case surfaces.
- Chess has bespoke UI rules:
  - keep a denser companion-panel layout
  - hide undo
  - size the board so a full match view fits more comfortably on one screen
  - force readable light text on dark chess surfaces regardless of global theme
