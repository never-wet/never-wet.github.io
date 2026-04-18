# Hundred Days of Ashfall

Hundred Days of Ashfall is an original browser-based survival action game built with:

- TypeScript
- HTML5 Canvas
- Vite
- localStorage persistence
- procedural art and procedural audio

The player only controls movement. Weapons fire automatically, enemy pressure scales across 100 days, bosses appear on milestone days, and progression is saved locally.

## Features

- Top-down movement with `WASD` and arrow keys
- Auto-firing weapon system with 10 weapon archetypes
- 21 passive upgrades
- 7 core enemy types, 3 elite variants, and 5 bosses
- 100-day progression with escalating biome shifts and milestone events
- XP gems, healing drops, magnet pickups, level-up choices, and day rewards
- Title screen, pause menu, settings, game over, continue-from-dawn, and Day 100 victory
- Procedural sprite generation and Web Audio synthesis with saved volume settings
- Local save/continue via `localStorage`

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Development uses `dev.html`.

Published static hosting uses `index.html` plus the generated `assets/` folder after `npm run build`.

## Controls

- `WASD` or arrow keys: move
- `Escape`, `P`, or `Space`: pause or resume
- On-screen `Pause` button while playing

## Save Behavior

- The game autosaves during a run and at day transitions.
- `Continue Run` on the title screen restores the saved local run.
- `Continue From Dawn` on the game-over screen restores the current day snapshot once per run.

## Main Folders

- `src/engine/`: loop, camera, renderer, input, audio, save, spawns
- `src/game/`: runtime coordinator, rules, UI layer
- `src/data/`: biome visuals and upgrade pool helpers
- `src/memory/`: compact source-of-truth manifests for progression and content
- `src/assets/generated/`: notes for the procedural asset pipeline
- `docs/`: architecture and content editing guides

## Memory Files

These are the quickest files for future assistants or maintainers to read first:

- `docs/MEMORY.md`
- `src/memory/gameManifest.ts`
- `src/memory/dayProgression.ts`
- `src/memory/playerDefaults.ts`
- `src/memory/weaponIndex.ts`
- `src/memory/passiveIndex.ts`
- `src/memory/enemyIndex.ts`
- `src/memory/lootIndex.ts`
- `src/memory/audioManifest.ts`
- `src/memory/assetManifest.ts`
- `src/memory/storageKeys.ts`
- `src/memory/defaultState.ts`
- `src/memory/saveSchema.ts`
- `src/memory/types.ts`
- `src/memory/contentRegistry.ts`

## Notes

- All art is original and generated locally in code.
- All audio is generated procedurally through the Web Audio API.
- No backend is required.
