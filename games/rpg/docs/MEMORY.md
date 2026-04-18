# Hollowmere Classic Memory

## Identity

`games/rpg/` is the classic Hollowmere build.

This is the story-first, page-navigation version. It is meant to stay as the polished narrative RPG interface with location panels, scene progression, combat, inventory, quests, codex, saves, and generated art/audio.

It is not the live top-down canvas engine.

## Variant split

- `games/rpg/` is the classic panel-and-story build.
- `games/rpg-overworld/` is the live canvas-overworld build for future gameplay upgrades.
- `games/rpg-overworld-snapshot/` is the preserved saved copy of the older map-first build.

Do not merge or delete these folders unless that is explicitly requested.

## Current player-facing promise

- Landing page with `New Game`, `Continue`, `Load`, `Settings`, and `Credits`
- Story scenes with branching dialogue
- Exploration by location cards and action buttons
- Turn-based combat
- Inventory, equipment, journal, codex, and quests
- Local save/export/import flow
- Generated SVG art and procedural audio

This version is intentionally allowed to feel like a premium narrative RPG website rather than a free-walking top-down field game.

## Current gameplay loop

1. Start `New Game`.
2. Begin in the `prologue-arrival` story scene.
3. Reach the market attack and win `marketfire-raiders`.
4. Attend the Lantern Council in Thornwake.
5. Unlock Gloamwood and continue the main story.
6. Travel between authored region panels.
7. Use action buttons for encounters, scenes, shops, and rest points.
8. Save or continue later from local storage.

## Controls

- Mouse is the primary input.
- `Enter` or `Space` advances linear dialogue scenes.
- `Esc` closes the active shop panel.
- Battle shortcuts:
  - `1` attack
  - `2` first skill
  - `3` defend
  - `4` use tonic

## Major runtime files

### Page flow

- `src/App.tsx`
  - route wiring
- `src/pages/HomePage.tsx`
  - landing page
- `src/pages/NewGamePage.tsx`
  - intro/start flow
- `src/pages/GamePage.tsx`
  - classic exploration layout with action panels, travel cards, allies, and quest summary

### Scene and battle presentation

- `src/components/game/DialogueView.tsx`
  - cinematic dialogue scene UI
- `src/components/game/CombatView.tsx`
  - turn-based combat UI
- `src/components/game/NotificationTray.tsx`
  - rewards and progress notices

### Rule engine

- `src/context/GameContext.tsx`
  - reducer wiring, autosave, settings persistence
- `src/lib/game/reducer.ts`
  - authoritative state transitions
- `src/lib/game/combat.ts`
  - combat resolution
- `src/lib/game/helpers.ts`
  - rewards, conditions, XP, inventory, quest progress
- `src/lib/game/selectors.ts`
  - derived game state and active content selection

## Core memory files

These are the first files future edits should read:

- `src/memory/gameManifest.ts`
- `src/memory/storyIndex.ts`
- `src/memory/characterIndex.ts`
- `src/memory/locationIndex.ts`
- `src/memory/itemIndex.ts`
- `src/memory/questIndex.ts`
- `src/memory/audioManifest.ts`
- `src/memory/storageKeys.ts`
- `src/memory/defaultState.ts`
- `src/memory/saveSchema.ts`
- `src/memory/types.ts`
- `src/memory/contentRegistry.ts`
- `src/memory/uiManifest.ts`
- `src/memory/assetManifest.ts`

## Save isolation

Classic saves must stay separate from the overworld variants.

- Save slots: `hollowmere:rpg:saves`
- Settings: `hollowmere:rpg:settings`
- Manifest: `hollowmere:rpg:manifest`

## Starting state

`src/memory/defaultState.ts` starts the classic build in the authored prologue scene, not in free exploration.

Important start assumptions:

- `status` starts as `playing`
- `chapterId` starts as `prologue`
- `currentLocationId` starts as `thornwake`
- `activeSceneId` starts as `prologue-arrival`
- `activeNodeId` starts as `arrival-1`
- all quests begin locked and are activated by the opening story flow
- Rowan starts with:
  - `moonwater-tonic x2`
  - `emberleaf-poultice x1`
  - `glowcap-draught x1`

## Current region set

- `thornwake`
  - starter harbor town
  - council, rest, market, and ledger actions
- `gloamwood-trail`
  - forest route
  - Nessa meeting, briar pack, root nest, Whispering Oak
- `rainmire-crossing`
  - marsh bridge route
  - Fen scene, troll fight, Choir hunters
- `saint-veyra-abbey`
  - flooded abbey chapter
  - sentinels, betrayal, vault
- `skyglass-spire`
  - final chapter zone
  - Vael parley and Mirror Warden boss

## Current quest set

### Main quests

- `The Bell in the Fog`
- `Roots of the Whisperblight`
- `Abbey of Broken Vows`
- `The Hollow Star`

### Side quests

- `Remedy for Edda`
- `The Missing Caravan`
- `Fen's Ledger`

## Current story chain

### Prologue

- Rowan arrives in Thornwake
- the market square is attacked
- the Lantern Council points toward Gloamwood

### Chapter I

- Nessa leads Rowan into the forest mystery
- the Whisperblight route opens into Rainmire

### Chapter II

- Saint Veyra Abbey reveals betrayal and the star compass

### Chapter III

- Skyglass Spire resolves Vael, Lyessa, and the Hollow Star ending

## Current battle set

Important encounter ids:

- `marketfire-raiders`
- `gloamwood-roamers`
- `gloamwood-briar-pack`
- `root-nest`
- `rainmire-stalkers`
- `rainmire-troll`
- `smuggler-hunters`
- `abbey-hauntings`
- `abbey-sentinels`
- `vow-crypt`
- `mirror-warden-duel`

## Current audio behavior

- procedural music and SFX are routed through `src/lib/audio/audioManager.ts`
- manifest keys live in `src/memory/audioManifest.ts`
- the classic build uses menu, scene, combat, pickup, victory, defeat, and ambience routing

## Current visual behavior

- location art, portraits, and item art come from generated SVG asset helpers
- the classic build is still panel-based, not map-rendered
- there is no external hosted art dependency

## Known limits

- this build is not meant to become the free-walking top-down version
- direct overworld movement and camera systems belong in `games/rpg-overworld/`
- if future work changes story content, keep the classic UI intact unless asked otherwise

## Publish reminder

Run:

```bash
npm run build
```

inside `games/rpg/`.

That copies the final build back into:

- `index.html`
- `assets/`
