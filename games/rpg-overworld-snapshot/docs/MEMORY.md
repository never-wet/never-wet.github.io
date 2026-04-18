# Hollowmere Overworld Snapshot Memory

## Identity

`games/rpg-overworld-snapshot/` is the preserved copy of the older map-first Hollowmere build that the user explicitly wanted to keep.

This build is meant to stay frozen as a liked snapshot. It uses the earlier tile-map UI approach with a visible map, keyboard movement, interaction prompts, and a side HUD, but it is not the newer live canvas-engine version.

## Variant split

- `games/rpg/` is the classic story-panel version.
- `games/rpg-overworld/` is the active live canvas-overworld version for future iteration.
- `games/rpg-overworld-snapshot/` is the preserved saved copy of the earlier graphical overworld version.

Do not overwrite or silently replace this folder with the live overworld build.

## Current player-facing promise

- `New Game` drops Rowan directly into Thornwake instead of starting with a long scene-only intro
- visible grid/tile map on the main play screen
- movement with `WASD` or arrow keys
- interaction with `E` or `Enter`
- opening goal is to walk to the Market Square and trigger the first battle
- map-first layout with HUD cards and nearby interaction summary
- home page includes a visual map preview so this version feels different before launch

## Current gameplay loop

1. Start `New Game`.
2. Spawn directly in `thornwake`.
3. Walk around the visible map.
4. Reach the Market Square prompt.
5. Trigger `marketfire-raiders`.
6. Continue route-by-route through the Hollowmere story.
7. Use shops, travel exits, and interact hotspots from the map screen.
8. Save or continue later with isolated snapshot save keys.

## Controls

- Move: `WASD` or arrow keys
- Interact / advance prompt: `E` or `Enter`
- Close overworld prompt or shop: `Esc`
- Battle shortcuts:
  - `1` attack
  - `2` first skill
  - `3` defend
  - `4` use tonic

## Major runtime files

### Main route

- `src/pages/HomePage.tsx`
  - landing page and map preview
- `src/pages/NewGamePage.tsx`
  - start-flow copy for the map-first version
- `src/pages/GamePage.tsx`
  - main graphical play screen with map, sidebar HUD, nearby interactions, allies, quests, and travel buttons

### Map rendering

- `src/components/game/OverworldMap.tsx`
  - tile rendering
  - player marker
  - interaction markers
  - direct movement and interact hooks

### Scene and combat overlays

- `src/components/game/DialogueView.tsx`
- `src/components/game/CombatView.tsx`

### Rule engine

- `src/context/GameContext.tsx`
  - reducer wiring and autosave
- `src/lib/game/reducer.ts`
  - movement, interaction, travel, battle, quests, and shop state
- `src/lib/game/overworld.ts`
  - map passability and interaction lookup
- `src/lib/game/combat.ts`
  - turn-based combat resolution

## Core memory files

These are the snapshot source-of-truth files future edits should read first:

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

Unlike the live overworld build, this preserved snapshot does not have the newer `mapIndex.ts`, `eventIndex.ts`, or `battleIndex.ts` layer.

## Save isolation

This snapshot must stay isolated from both the classic and live overworld saves.

- Save slots: `hollowmere:overworld-snapshot:saves`
- Settings: `hollowmere:overworld-snapshot:settings`
- Manifest: `hollowmere:overworld-snapshot:manifest`

## Starting state

`src/memory/defaultState.ts` intentionally skips past the arrival cutscene so movement is immediate.

Important start assumptions:

- `status` starts as `playing`
- `chapterId` starts as `prologue`
- `currentLocationId` starts as `thornwake`
- `activeSceneId` starts as `null`
- `completedSceneIds` includes `prologue-arrival`
- `main-bell-in-the-fog` starts as `active`
- Rowan starts with:
  - `veil-shard`
  - `moonwater-tonic x2`
  - `emberleaf-poultice x1`
  - `glowcap-draught x1`
- the opening notification and overworld message instruct the player to reach the Market Square

## Current map set

- `thornwake`
  - starter town map
  - council, rest, market, ledger, and marketfire hotspots
- `gloamwood-trail`
  - forest route with Nessa, briar pack, root nest, and Whispering Oak
- `rainmire-crossing`
  - marsh bridge route with Fen, troll, and Choir hunters
- `saint-veyra-abbey`
  - flooded abbey route with sentinels, betrayal, and vault access
- `skyglass-spire`
  - final climb and boss route

This snapshot keeps the original five-map route structure and does not include the newer extra interior/pickup expansion from the live overworld build.

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

## Current story chain

- prologue attack in Thornwake
- Lantern Council sends Rowan outward
- Gloamwood reveals the Whisperblight
- Rainmire leads into Saint Veyra Abbey
- abbey betrayal opens the final climb
- Skyglass Spire resolves the Hollow Star ending

## Current audio behavior

- procedural sound and music routing are active
- audio settings persist locally
- this build uses the earlier overworld audio routing rather than the newer canvas-engine hooks

## Current visual behavior

- map view is graphical and tile-based
- visuals are generated/local, with no hosted asset dependency
- this version is more interactive than the classic build, but less engine-driven than the live overworld build

## Known limits

- this is still a single-hero RPG, not a creature-catching party battler
- this preserved build should stay stable rather than absorb major refactors
- deeper engine work should happen in `games/rpg-overworld/`, not here

## Publish reminder

Run:

```bash
npm run build
```

inside `games/rpg-overworld-snapshot/`.

That copies the final build back into:

- `index.html`
- `assets/`
