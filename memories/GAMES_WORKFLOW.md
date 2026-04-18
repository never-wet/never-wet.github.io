# Games Workflow Memory

This file is the persistent source of truth for how game projects should be added and maintained in this repo. It exists so future work does not rely on chat memory.

## Core Rules

- Every new game project belongs under `/games/<project-slug>/`.
- Every new game project must also be added to `/games/index.html` so it appears on the main games hub.
- Do not consume the last empty placeholder slot without recreating a new one in the same edit.
- The games hub should always keep one empty placeholder card ready for the next project.
- Preserve the placeholder style unless the user explicitly asks to redesign it:
  `Coming Soon` tag, `Next Cabinet` title, short `/games` copy, and a single `Open slot` pill.
- Each game should have its own theme and UI direction based on its genre, tone, and setting.
- Do not reuse the exact same visual skin across all games.
- A board game should feel different from a puzzle game, sports game, horror game, idle game, or arcade game.
- When a game changes in a meaningful way, update that game's README or memory/docs in the same pass.
- If a game has its own compact memory/source-of-truth files, update those too when the related feature or UI changes.

## Theme Direction Rule

Every game should feel intentionally designed for its genre.

Examples:

- Board / strategy: premium, focused, tactile, readable, competitive.
- Puzzle: clever, calm, clean, hint-oriented, high contrast.
- Sports: energetic, bold, scoreboard-driven, motion-heavy.
- Horror / night theme: darker, moodier, atmospheric, sharper accent color choices.
- Idle / tycoon: clear upgrade hierarchy, rewarding feedback, dashboard-first layout.

The goal is variety. New game projects should not look like reskins of the previous game unless the user asks for a shared universe or design system.

## Current Repo Expectations

- `games/index.html` is the public game hub for this repo.
- The game hub currently includes a `Boardgame Vault` entry and should still retain one empty placeholder slot after it.
- Game projects in this repo are usually static front-end experiences that can be hosted directly from GitHub Pages or another static host.
- If a new game uses React + Vite or another build step, the final published output still needs to land in a deployable `/games/<project-slug>/` path.

## Working Rule For Future Game Adds

When adding a new game project:

1. Create the project inside `/games/<project-slug>/`.
2. Add or update the card for that project in `/games/index.html`.
3. Recreate or preserve one empty placeholder slot in `/games/index.html`.
4. Give the new game a UI theme that matches its genre instead of copying the last game's look.
5. Update the game's README and any relevant memory/docs files before finishing.
