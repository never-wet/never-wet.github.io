# Hollowmere Overworld Memory

## Identity

`games/rpg-overworld/` is the live, editable top-down Hollowmere build.

This is the version meant for future gameplay upgrades. It is no longer the older "website page with a map section" style. The active `/game` route is now a full-screen canvas scene with HUD and overlays.

## Version split

- `games/rpg/` is the classic page-navigation version.
- `games/rpg-overworld/` is the live canvas-overworld version.
- `games/rpg-overworld-snapshot/` is the preserved copy of the liked overworld build.

Do not overwrite or delete `games/rpg/` or `games/rpg-overworld-snapshot/` unless that is explicitly requested.

## Current player-facing promise

- `New Game` starts directly in a playable overworld.
- The player immediately controls Rowan in Thornwake.
- Movement uses `WASD` or arrow keys.
- Interaction uses `E` or `Enter`.
- `Esc` closes a field prompt first, closes a shop second, otherwise opens the pause menu.
- The game route is immersive and hides the normal website header/nav while playing.
- Dialogue, battle, shop, message, pause, and gameover states all appear as scene overlays on top of the field.

## Current gameplay loop

1. Open the game and choose `New Game`.
2. Spawn in `thornwake`.
3. Walk around using keyboard movement with collision.
4. Trigger the `Market Square` opening event.
5. Enter battles through story triggers or wild encounter tiles.
6. Return to exploration after battle.
7. Enter at least one interior building: `lantern-house`.
8. Use pause/save/load flow through local saves.

## Controls

- Move: `WASD` or arrow keys
- Interact / advance prompt: `E` or `Enter`
- Pause / close overlays in priority order: `Esc`
- Battle shortcuts:
  - `1` attack
  - `2` first skill
  - `3` defend
  - `4` use tonic

## Major runtime files

### Scene orchestration

- `src/pages/GamePage.tsx`
  - main gameplay route
  - mounts the live viewport
  - switches overlays for dialogue, battle, pause, shop, message, and gameover

### Gameplay viewport

- `src/game/GameViewport.tsx`
  - owns the canvas
  - runs the render loop
  - interpolates movement for smoother tile stepping
  - plays footstep SFX
  - hooks keyboard input to reducer actions

### HUD and overlays

- `src/game/GameHud.tsx`
- `src/game/PauseMenu.tsx`
- `src/game/ShopOverlay.tsx`
- `src/game/WorldMessageOverlay.tsx`
- `src/game/GameOverOverlay.tsx`

### Engine

- `src/engine/camera.ts`
  - camera framing and tile-to-screen conversion
- `src/engine/sceneManager.ts`
  - scene mode helper
- `src/engine/input/useWorldControls.ts`
  - held-key movement loop
  - interact and pause handling
- `src/engine/render/mapRenderer.ts`
  - draws tiles, weather, props, interaction sprites, player sprite, and field location banner
- `src/engine/render/spriteRenderer.ts`
  - draws generated field sprites for player, NPCs, doors, chests, markers, and action props

### Rule engine

- `src/lib/game/reducer.ts`
  - authoritative game state transitions
  - movement
  - interaction
  - travel
  - scene start/completion
  - encounter start
  - item use
  - shopping
  - respawn
- `src/lib/game/overworld.ts`
  - tile passability
  - interaction lookup
  - wild encounter selection
- `src/lib/game/combat.ts`
  - turn-based combat resolution
- `src/lib/game/helpers.ts`
  - conditions, rewards, XP, notifications, inventory, derived stats

## Core memory files

These are the main source-of-truth files future edits should read first:

- `src/memory/gameManifest.ts`
- `src/memory/mapIndex.ts`
- `src/memory/eventIndex.ts`
- `src/memory/characterIndex.ts`
- `src/memory/questIndex.ts`
- `src/memory/itemIndex.ts`
- `src/memory/battleIndex.ts`
- `src/memory/audioManifest.ts`
- `src/memory/assetManifest.ts`
- `src/memory/storageKeys.ts`
- `src/memory/defaultState.ts`
- `src/memory/saveSchema.ts`
- `src/memory/types.ts`
- `src/memory/contentRegistry.ts`

## Save isolation

This build has separate browser storage from the classic and snapshot versions.

- Save slots: `hollowmere:overworld:saves`
- Settings: `hollowmere:overworld:settings`
- Manifest: `hollowmere:overworld:manifest`

## Starting state

`src/memory/defaultState.ts` intentionally starts after the arrival cutscene so movement is immediate.

Important start assumptions:

- `status` starts as `playing`
- `currentLocationId` starts as `thornwake`
- `activeSceneId` starts as `null`
- `completedSceneIds` includes `prologue-arrival`
- `main-bell-in-the-fog` starts as `active`
- Rowan starts with:
  - `veil-shard`
  - `moonwater-tonic x2`
  - `emberleaf-poultice x1`
  - `glowcap-draught x1`
- the intro notification and overworld message instruct the player to reach the Market Square

## Current map set

### Town / hub

- `thornwake`
  - starter town
  - market square trigger
  - council hall
  - shops
  - NPC interactions
  - door to `lantern-house`

### Interior

- `lantern-house`
  - enterable building
  - Sera rest point
  - Mira dialogue
  - Isolde archive desk
  - starter pickup cache

### Route / exploration

- `gloamwood-trail`
  - forest route
  - Nessa meeting
  - ranger pickup cache
  - briar pack fight
  - root nest
  - Whispering Oak scene

- `rainmire-crossing`
  - marsh route
  - Fen Hollow scene
  - drift crate pickup
  - troll boss-like route fight
  - choir hunter fight

### Dungeon-like zone

- `saint-veyra-abbey`
  - flooded abbey
  - reliquary pickup
  - sentinels fight
  - betrayal scene
  - vault access

### Final zone

- `skyglass-spire`
  - threshold scene
  - final parley
  - Mirror Warden boss route

## Current field pickups

- `lantern-house-cache`
- `gloamwood-ranger-pack`
- `rainmire-flotsam`
- `abbey-reliquary`

All are handled through `src/data/locations/actions.ts` with one-time flag guards.

## Current major story chain

### Prologue

- opening state starts in Thornwake after arrival
- player reaches Market Square
- `prologue-marketfire` starts
- `marketfire-raiders` battle happens
- council scene unlocks Chapter I

### Chapter I

- travel into Gloamwood
- meet Nessa
- clear briar pack
- clear root nest
- reach Whispering Oak
- unlock Rainmire and abbey lead

### Chapter II

- meet Fen in Rainmire
- enter abbey
- survive sentinels
- watch Elric betrayal scene
- enter vault and meet Lyessa

### Chapter III

- climb spire
- confront Vael
- fight Mirror Warden
- resolve Hollow Star ending

## Current battles

Field and scripted battles are indexed in:

- `src/data/story/encounters.ts`
- `src/memory/battleIndex.ts`

Important current encounters:

- `marketfire-raiders`
- `gloamwood-roamers`
- `gloamwood-briar-pack`
- `root-nest`
- `rainmire-stalkers`
- `rainmire-troll`
- `smuggler-hunters`
- `abbey-hauntings`
- `abbey-sentinels`
- `mirror-warden-duel`

## Current audio behavior

- music and ambience are routed by location in `src/data/audio/audioRoutes.ts`
- procedural sound definitions live in `src/memory/audioManifest.ts`
- manager lives in `src/lib/audio/audioManager.ts`
- active SFX currently include:
  - menu confirm
  - dialogue blip
  - battle start
  - hit
  - heal
  - pickup
  - quest complete
  - victory
  - defeat
  - boss warning
  - footstep stone
  - footstep grass

## Current visual behavior

- menu and portrait art still comes from generated SVG assets
- field rendering is canvas-based
- tile look is generated in `mapRenderer.ts`
- field sprites are generated in `spriteRenderer.ts`
- there is no external hosted art dependency

## Current menus and overlays

Normal non-immersive routes still exist for:

- home
- new game
- load
- character
- inventory
- quests
- map
- journal
- settings
- credits

But active gameplay on `/game` is immersive and hides the normal site chrome.

## Current acceptance status

What is working now:

- immediate overworld control on new game
- keyboard movement
- collision and map boundaries
- camera-follow canvas scene
- enterable building
- multiple connected maps
- in-world NPC interaction
- step-trigger and interact-trigger events
- turn-based battle scene
- local autosave and manual save
- audio routing and procedural SFX
- published Vite build

## Known limits

- combat is still single-hero, not party-swapping creature combat
- the overworld uses generated canvas sprites, not a sprite-sheet animation pipeline
- there is no catch/recruit creature system yet
- battle depth is solid but still lighter than a full monster-collector RPG

## If future work continues toward a monster-catching structure

Most logical next systems:

- party slots
- recruitable or catchable allies
- active party switching in battle
- overworld trainers / rival battles
- deeper skill typing and resistances
- creature progression separate from Rowan

## Publish reminder

Run:

```bash
npm run build
```

inside `games/rpg-overworld/`.

That copies the final build back into:

- `index.html`
- `assets/`
