# Reels Pull

`Reels Pull` is a browser-based gacha / reel spinner game built as a single-page static HTML project.

## What it does

- Spins a horizontal reel and lands on a GIF pull
- Tracks collection progress, recent pulls, and total pull counts
- Supports pity / bad-luck protection
- Includes rarity tiers, variants, banners, sounds, exports, and rare popup effects
- Saves progress in browser storage
- Includes a hidden draggable dev mode window

## Main files

- `index.html`
  The full game UI, styling, logic, saves, sounds, exports, and dev tools.
- `gif/`
  GIF assets, loop variants, and export poster stills used by the game.

## Run it

Open:

- `/games/reelspull/`

Or locally:

- `games/reelspull/index.html`

## Notes for editing

- This game is mostly self-contained in one file.
- Progress is saved with `localStorage`.
- The hidden dev mode opens when typing `never-wet` on the page.
