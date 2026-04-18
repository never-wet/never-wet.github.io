# Adding New Games

## 1. Create a module

Add a folder under `src/games/<your-game>/` and export a `GameModule`.

The module should provide:

- `createInitialState()`
- `parseState()`
- `serializeState()`
- `getStatus()`
- `getMoveHistory()`
- `getSidebarStats()`
- `isAiTurn()`
- `applyMove()`
- `getAiMove()`
- `Board` React component

## 2. Register metadata

Update:

- `src/memory/types.ts` with the new `GameId`
- `src/memory/gameIndex.ts` with title, copy, and feature bullets
- `src/memory/gameManifest.ts` if routes or featured content change
- `src/memory/contentRegistry.ts` to map the id to the runtime module
- `src/memory/aiIndex.ts` if the new game uses custom search depths

## 3. Add stats support

Per-game totals are keyed from the `GameId`, so adding the new id to `types.ts` and `gameIndex.ts` is usually enough. If the result schema changes, adjust `statsSchema.ts`.

## 4. Save / load behavior

Keep serialized state compact and JSON-safe. The app stores:

- difficulty
- current snapshot
- undo snapshots
- timestamps
- completion flag

If a schema changes, add migration logic to `saveSchema.ts`.

## 5. Improving AI

- Tune difficulty presets in `aiIndex.ts`
- Reuse or extend `src/ai/search.ts`
- Keep board evaluation inside the game module so heuristics stay local to the game
- Prefer candidate move pruning for large board games like Gomoku or Hex
