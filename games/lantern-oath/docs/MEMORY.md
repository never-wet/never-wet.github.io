# Project Memory

This file is the quick memory handoff for future work on `Lantern Oath: The Last Hearth`.

## Current State

- Project folder:
  `games/lantern-oath/`
- Stack:
  TypeScript + Vite + HTML5 canvas + DOM overlays
- Publish mode:
  `npm run build` compiles the Vite app, then copies the built `dev.html` output into the folder root `index.html` and `assets/`
- Static entry point for the arcade:
  `games/lantern-oath/index.html`
- Dev entry point:
  `games/lantern-oath/dev.html`

## What the Game Already Includes

- title screen with 3 save slots
- continue/new/load/reset flow
- localStorage save manager and saved settings
- top-down overworld exploration
- multiple connected regions and maps
- towns, city, fields, coast, forest, mine, ruins, dungeon, interiors
- real-time combat:
  movement, melee hitboxes, ranged attacks, dodge, stamina, aether, enemy AI, boss patterns, loot
- dialogue system with conditions and actions
- main questline and side quests
- 10 jobs/professions with repeatable loops
- inventory, equipment, shops, journal, map tab, save tab, settings tab
- procedural pixel-art sprites/icons/markers
- procedural music and sound effects

## Main Story Completion Route

The current beatable main-story route is:

1. Talk to `Sable Voss` in Emberwharf Guildhall to start `Embers at the Gate`.
2. Defeat 3 `cinder_bandit` enemies on `old_road` and turn the quest in to Sable.
3. Reach `sunglade_city`, speak with `Lyra Quill`, speak with `Captain Hale`, then return to Lyra for `Bells of Sunglade`.
4. Complete `Open the Roots` by bringing Lyra:
   - 1 `archive_rubbing` from `glassroot_ruins`
   - 3 `glow_ore` from `ridgewatch_mine`
5. Talk to `Mara Ashdown` to start `The Last Hearth`.
6. Travel through `whisperwood` and `glassroot_ruins` into `glassroot_depths`.
7. Defeat `the_hollow_stag`, collect the guaranteed `sun_shard`, and return it to Mara.
8. `story.ending_complete` is the true main-story completion flag.

## Finish-Pass Focus

The current release-quality gap is not missing core systems anymore. The main remaining work is polish and confidence:

- make the end of the main story feel explicit in the UI instead of relying on a hidden flag
- surface cleared-save status in the menus
- keep map, portal, spawn, and quest data validated so fragile content edits do not silently break traversal
- keep the memory file updated whenever workflow or project status changes

## QA Workflow

The project now has a repeatable content validator:

```bash
npm run qa
```

It validates:

- map bounds and layout widths
- tile legend usage
- portal targets and walkable approaches
- spawn positions
- NPC, enemy, and resource-node placement on walkable tiles
- region/map reference integrity
- quest, job, item, enemy, and dialogue references
- required main-story completion flags in the default save

Latest verification for this pass:

- `npm run qa` passed 5 times in a row
- `npm run build` passed after the validator and finish-state changes

## World Summary

The setting is the Cinder Reach, a frontier held together by ember lanterns and road oaths.

The main story is:

1. Clear the Greenway road and earn the Lantern Oath.
2. Reach Sunglade City and learn why the archive bells and lantern cores are failing.
3. Gather records and glow ore to reopen the sealed Glassroot route.
4. Descend beneath Glassroot, defeat the Hollow Stag, and restore the last hearth.

## Regions and Maps

Regions:

- Emberward
- Greenway
- Southfields
- Sunglade
- Ridgewatch
- Glassroot

Map IDs:

- `emberwharf`
- `lantern_inn`
- `forgehouse`
- `guildhall`
- `apothecary`
- `old_road`
- `southfields`
- `farmhouse`
- `brasscoast`
- `whisperwood`
- `ridgewatch_mine`
- `sunglade_city`
- `city_tavern`
- `archive_hall`
- `glassroot_ruins`
- `glassroot_depths`
- `moonwell_glen`

## Major NPCs

- Mara Ashdown: couriermaster, jobs, late-story quest handoff
- Sable Voss: main quest opener
- Brann Tul: blacksmith and smith job mentor
- Nessa Reed: apothecary and herb job mentor
- Captain Hale: patrol captain and guard job mentor
- Lyra Quill: archivist, city story, scribe mentor
- Toma Fenn: tavernkeeper and inn job mentor
- Pell Barrow: farmer and field jobs
- Brindle Roe: fisher mentor
- Orsa Vek: mining mentor
- Vale: hunter mentor
- Veil Hunter: Glassroot warning/lore character

## Jobs

- courier
- farmer
- fisher
- hunter
- miner
- smith
- apothecary
- guard
- scribe
- innhand

Important job note:

- Delivery jobs can now auto-provide their required delivery item when the shift starts.

## Quest Counts

- Main quests: 4
- Side quests: 12

## File Guide

Read in this order when resuming work:

1. `src/memory/gameManifest.ts`
2. `src/memory/worldIndex.ts`
3. `src/memory/mapIndex.ts`
4. `src/memory/questIndex.ts`
5. `src/memory/jobIndex.ts`
6. `src/memory/contentRegistry.ts`
7. `src/data/maps/maps.ts`
8. `src/data/dialogue/dialogues.ts`
9. `src/engine/GameSession.ts`
10. `src/game/App.ts`

## System Ownership

- `src/game/App.ts`
  DOM shell, title screen, menus, event delegation, modal overlays
- `src/engine/GameSession.ts`
  Main simulation and source of runtime truth
- `src/engine/Renderer.ts`
  Tile and sprite rendering
- `src/engine/AudioManager.ts`
  Synth music/SFX
- `src/engine/SaveManager.ts`
  save slots and settings persistence
- `src/lib/assets/pixelFactory.ts`
  generated sprite/icon art pipeline

## Known Important Implementation Details

- Tile size is `16`
- Canvas size is `512x288`
- The game uses ASCII layouts for maps
- Equipment bonuses are applied dynamically from item stat bonuses
- Enemy drops are spawned as pickup entities, not granted directly
- Dialogue actions can start quests, complete quests, open shops, open jobs, rest, heal, save, grant items, and set flags
- Collection objectives refresh automatically from inventory counts
- Built output is intentionally copied to root `index.html` and `assets/` so static hosting works under `/games/lantern-oath/`

## Recent Fixes

- Fixed a UI input blocker where empty overlay layers could intercept button clicks above the title/menu UI
- Fixed the main click bug where overlay HTML was being recreated every frame, preventing normal button clicks from completing
- Enabled pointer input on the HUD layer so in-game menu buttons can be clicked
- Added a readability-focused art pass for tiles, props, portals, and character sprites so roofs, wood, stone, doors, beds, crates, signs, ore, and NPCs read more clearly
- Moved the always-on gameplay HUD, quest prompt, and toast notices outside the map frame so they no longer cover the playfield during exploration
- Fixed edge-travel movement so portal tiles at map borders no longer act like solid walls before transitions can trigger
- Made doorway and map-exit portal triggers direction-aware and more forgiving so entering/leaving areas no longer requires pixel-perfect positioning
- Moved arrival spawn points farther off doorway and edge triggers, and added a portal clear-lock so transitions cannot immediately retrigger on load
- Opened blocked north/south portal lanes in the travel maps and added safe-spawn fallback logic so transitions do not place the player inside wall columns
- Smoothed NPC wandering and enemy steering so AI motion glides instead of snapping between positions
- Added clearer exterior-building readability with stronger roof silhouettes, door stoops, and approach tiles so enterable houses no longer look sealed by brick
- Restored the Emberwharf center house roof after an incorrect roof-removal edit; blocker fixes should target actual wall lanes and spawn logic instead of deleting building roofs
- Reworked Emberwharf's top-center block into an open stone-and-road lane and moved the `Forgehouse` entrance to the lower-center building so that area is accessible and still has meaningful interaction
- Shifted the Emberwharf central bridge one tile left to line up better with the town approach lane
- Replaced auto-enter door and portal travel with manual interaction, and added a floating bobbing `E` prompt near nearby interactables so doors clearly show when the player can enter
- Shifted Emberwharf's top-center stone approach and the nearby bridge strip one tile left so the visible town approach now matches the requested position
- Fixed manual interaction targeting so the closest interactable wins instead of NPCs always overriding doors, removed the old portal clear-lock from manual door use, and clamped/repositioned the floating `E` prompt so edge-of-map doors still show the indicator on-screen
- Centered the title screen as a viewport-centered overlay panel instead of leaving the menu content visually anchored off to one side
- Moved the title overlay to the full browser viewport instead of the game stage so the main menu no longer creates an unnecessary inner scroll area just to show the centered screen
- Corrected Emberwharf's visible north stone approach again after the first bridge/path shift was too subtle; the opening, stone lane, and front road were moved farther left so the change is obvious in the actual town view
- Corrected the Emberwharf north gate path alignment after that second pass too: the top opening now lines up with the central road lane instead of sitting one tile off and looking disconnected
- Added breathing room between Emberwharf's north path and the upper-left house by moving that house, its door portal, and its return spawn one tile left while keeping the main path aligned
- Switched UI action buttons to `pointerdown` handling instead of waiting for `click`, because frequently refreshed HUD/title DOM could replace buttons mid-press and make field-menu interactions feel dead
- Added explicit memory documentation so future edits do not rely on chat history
- Confirmed the project builds after publishing static output
- Added a real post-ending flow: finishing `main_last_hearth` now opens a main-story-complete panel instead of only setting a hidden flag
- Added persistent cleared-save awareness through `story.ending_seen` and a `Cleared` badge on save slots in both the title screen and pause save menu
- Added ambient dialogue profiles for previously silent placed NPCs: `elder_sen`, `jori_penn`, `dessa_wren`, `nill_stone`, `hesta_lane`, `marlo_sheen`, and `fara_glass`
- Fixed data-placement issues uncovered by the validator, including bad Emberwharf doorway return spawns and several non-walkable enemy/NPC/chest placements in Whisperwood, Glassroot Ruins, Glassroot Depths, and Moonwell Glen
- Added `npm run qa` using `src/tools/validateContent.ts` so future map/content edits can be checked before publishing
- Gave projectile attacks more weapon identity: player bow shots now travel faster and slimmer, tome shots travel slower and heavier, and projectile rendering now draws distinct visuals for `arrow_amber`, `ember_orb`, `lantern_spark`, `moth_dust`, `salt_bolt`, `shard_shot`, and `stag_flare`
- Fixed pause/inventory overlay scrolling so the modal is viewport-fixed and the panel scrolls internally instead of making the whole page scroll
- Pinned the tracked quest into the top HUD so the current quest stays visible on-screen even while the sidebar prompt changes based on nearby interactions
- Fixed field-menu clickability by making the full-screen overlay container itself ignore pointer events and giving the HUD layer an explicit stacking context above the playfield
- Fixed NPC/enemy wall-sticking in `GameSession`: wandering NPCs now detect when they are stalled against collision and reset to a safe walkable position near home, and enemies now correct back onto walkable tiles after knockback or bad collision states instead of getting embedded in walls
- Current HUD behavior:
  - top HUD permanently shows the tracked quest
  - right sidebar is now primarily for nearby/interact prompts and toast-style notices
  - field menu buttons (`Menu`, `Bag`, `Map`) should work through `pointerdown` without overlay interception
- Pause menu now includes a `Main Menu` button that returns to the title screen from an active session
- Title screen and pause menu now also include a `Games` button that navigates back to the parent arcade index at `/games/`

## Commands

Install:

```bash
npm install
```

Dev:

```bash
npm run dev
```

Build and publish static files into the folder root:

```bash
npm run build
```

## After Any Significant Change

- update `docs/MEMORY.md` if the game structure, content inventory, or workflow changes
- update `README.md` if run/build behavior changes
- rebuild so `index.html` and `assets/` stay in sync with source
