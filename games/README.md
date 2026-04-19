# Games Folder

This folder holds the web game section for `never-wet.github.io`.

## What is here

- `index.html`
  The arcade landing page for the games section.
- `styles.css`
  Shared styling for the arcade landing page.
- `reelspull/`
  A GIF gacha / reel-pull game with rarity effects, pity, collection tracking, exports, and a large dev mode.
- `midnight-pawn/`
  A neon pawn-shop resale sim with night shifts, seller negotiation, item prep, listings, upgrades, and browser save data.
- `puzzle/`
  A React + TypeScript + Vite puzzle platform with logic puzzles, ciphers, hotspot scenes, local progress tracking, and multi-room escape mode.
- `lantern-oath/`
  A TypeScript + Vite open-world retro action RPG with real-time combat, jobs, dialogue, local saves, and generated pixel art/audio.
- `soccer-idle/`
  A playable soccer idle game with upgrades, passive income, multiple screens, and browser save data.
- `stitch_soccer_clicker_tycoon/`
  A concept bundle / prototype set for a larger soccer clicker tycoon project.

## How to open games

From the site:

- `/games/`
- `/games/reelspull/`
- `/games/midnight-pawn/`
- `/games/puzzle/`
- `/games/lantern-oath/`
- `/games/soccer-idle/`

If you are testing locally, serve the repo as a static site and open the same paths in your browser.

## Notes

- These games are static front-end projects.
- Most progress is stored in the browser with `localStorage`.
- Some folders are fully playable games, while others are design/prototype bundles.
- Shared workflow memory for future game additions lives at `/memories/GAMES_WORKFLOW.md`.
- When a game in this folder changes in a meaningful way, update that game's README in the same pass.
- For `midnight-pawn/`, treat `games/midnight-pawn/README.md` as required change documentation for UI, gameplay, tuning, and flow changes.
- The arcade landing page at `games/index.html` should keep one empty placeholder card for the next game.
- When adding a new game card, do not remove that last empty slot without recreating it in the same edit.
- Preserve the old placeholder style for that slot:
  `Coming Soon` tag, `Next Cabinet` title, the short `/games` copy, and a single `Open slot` pill.
- Do not redesign that empty slot into a detailed feature card unless explicitly requested.
- Give each game its own theme and UI direction based on genre instead of reusing one shared look for every project.
