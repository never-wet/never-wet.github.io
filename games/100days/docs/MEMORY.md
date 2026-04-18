# Hundred Days of Ashfall Memory

Last updated: `2026-04-17`

This file is the high-context handoff for `games/100days/`.

Use this before re-reading the whole project. It is meant to capture the live state of the game after the major expansion pass so future work can start from files instead of chat history.

## Project Identity

- Title: `Hundred Days of Ashfall`
- Folder: `games/100days/`
- Genre: original top-down browser horde survival game
- Stack: `TypeScript + HTML5 Canvas + Vite`
- Runtime model: local-only browser game
- Persistence: `localStorage`
- Art model: procedural generated sprites, icons, logo, effects
- Audio model: procedural music and SFX through Web Audio
- Backend: none

## Current Snapshot

- Core campaign length: `100` days
- Challenge modes: `4`
- Survivors: `3`
- Weapons: `10`
- Passives: `21`
- Relics: `6`
- Weapon evolutions: `5`
- Weapon synergies: `4`
- Standard enemies: `7`
- Elites: `3`
- Bosses: `5`
- Elite affixes: `5`
- Biomes: `5`
- Day reward choices: `3`
- Level-up choices: `3`
- Extra systems now active:
  - character selection
  - mode selection
  - codex/unlock screen
  - relics
  - shrines and field events
  - day objectives
  - biome hazards
  - elite affixes
  - boss phases
  - weapon evolutions
  - weapon synergies
  - biome/faction-weighted enemy mixes

## Read Order

If you want the minimum useful set of files:

1. `docs/MEMORY.md`
2. `src/memory/gameManifest.ts`
3. `src/memory/dayProgression.ts`
4. `src/memory/characterIndex.ts`
5. `src/memory/relicIndex.ts`
6. `src/memory/weaponIndex.ts`
7. `src/memory/evolutionIndex.ts`
8. `src/memory/synergyIndex.ts`
9. `src/memory/passiveIndex.ts`
10. `src/memory/enemyIndex.ts`
11. `src/data/upgrades/choicePool.ts`
12. `src/game/runtime.ts`
13. `src/game/ui.ts`
14. `src/styles/main.css`

## Build And Entry Model

The project intentionally separates dev and published entry points.

- `dev.html`
  Vite development entry
- `index.html`
  published static entry for actual local/site hosting
- `assets/`
  built JS/CSS copied to project root after build
- `dist/`
  temporary Vite output before publish copy

### Commands

Install:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build published output:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

### Build flow

From `package.json`:

- `dev`: `vite --open /dev.html`
- `build`: `tsc --noEmit && vite build && node ./scripts/publish-static.mjs`
- `preview`: `vite preview`

From `vite.config.ts`:

- base path is `./`
- build input is `dev.html`

From `scripts/publish-static.mjs`:

1. remove root `assets/`
2. recreate root `assets/`
3. copy `dist/dev.html` to root `index.html`
4. copy `dist/assets` to root `assets/`

Important:

- `index.html` is generated output, not the source shell
- if the static page looks stale or empty, run `npm run build`

## Main Folder Map

### Root

- `package.json`
- `vite.config.ts`
- `dev.html`
- `index.html`
- `scripts/publish-static.mjs`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_GUIDE.md`
- `docs/MEMORY.md`

### `src/engine/`

- `gameLoop.ts`
  requestAnimationFrame loop
- `renderer.ts`
  draws world, hazards, shrines, sprites, projectiles, particles, background
- `camera.ts`
  tracking and screenshake
- `input.ts`
  keyboard state + press consumption
- `collision.ts`
  vectors, overlap helpers, bounds, weighted choice
- `entityManager.ts`
  active arrays for enemies, projectiles, beams, mines, drones, pickups, hazards, shrines
- `particleManager.ts`
  particles and floating damage text
- `spawnManager.ts`
  normal wave spawning, boss timing, biome faction bias
- `audioManager.ts`
  procedural track scheduling, cue playback, gain routing
- `saveManager.ts`
  `localStorage` load/save/reset helpers
- `assets.ts`
  procedural offscreen-canvas sprite generator

### `src/game/`

- `runtime.ts`
  main gameplay coordinator
- `rules.ts`
  weapon stat resolution, passive application, XP growth
- `ui.ts`
  DOM overlay rendering for title, codex, events, upgrade choices, settings, pause, game over, victory

### `src/data/`

- `maps/biomes.ts`
  biome palette and atmosphere data
- `upgrades/choicePool.ts`
  level-up choices and between-day rewards

### `src/memory/`

Current source-of-truth layer:

- `gameManifest.ts`
- `dayProgression.ts`
- `playerDefaults.ts`
- `characterIndex.ts`
- `relicIndex.ts`
- `weaponIndex.ts`
- `evolutionIndex.ts`
- `synergyIndex.ts`
- `passiveIndex.ts`
- `enemyIndex.ts`
- `lootIndex.ts`
- `audioManifest.ts`
- `assetManifest.ts`
- `storageKeys.ts`
- `defaultState.ts`
- `saveSchema.ts`
- `types.ts`
- `contentRegistry.ts`

## Runtime Ownership

`src/game/runtime.ts` currently owns:

- current scene
- current title selections
- current run state
- current event/shrine state
- player stats and damage flow
- weapon firing and weapon behavior routing
- relic application
- evolution/synergy discovery
- elite affix assignment
- boss phase transitions
- biome hazard spawning and updates
- shrine spawning and event choices
- objective creation and tracking
- save serialization and load restore
- autosave timing
- scene transitions and menu actions

It is still the most important file in the project.

## Current Scene Model

Current scene IDs:

- `title`
- `playing`
- `paused`
- `upgrade`
- `day-summary`
- `settings`
- `event`
- `codex`
- `game-over`
- `victory`

General behavior:

- the canvas stays mounted for all scenes
- camera still updates while not actively playing
- UI uses DOM/CSS on top of the canvas
- codex and shrine events are overlay scenes
- event/codex/settings/paused/game-over/title all route music to `menu-drift`

## Current Menus And HUD

### Title screen

Now contains:

- mode selection cards
- survivor selection cards
- `Start Run`
- `Continue Run`
- `Codex`
- `Settings`
- `Go To Games`

Stats still shown:

- best day
- total runs
- completed Day 100 flag

### Pause menu

Buttons:

- `Resume`
- `Settings`
- `Restart Run`
- `Return To Title`
- `Go To Games`

### Codex screen

Access:

- title menu `Codex` button
- `Escape` also closes codex back to title

Sections:

- modes
- survivors
- relics
- weapons
- passives
- enemies
- evolutions
- synergies

Entries display as discovered or locked.

### Event screen

Used for shrine interactions.

Current shrine choices:

- `Blood Price`
- `Forge Draft`
- `Pilgrim Rest`

### Upgrade screen

- still `3` choices
- can offer new weapons, weapon levels, new passives, passive levels
- upgraded weapons can now later qualify for evolutions

### Day summary screen

Now shows:

- day clear summary text
- kill count
- objective result line if objective existed
- `3` camp reward choices

### Settings screen

Controls:

- `Master Volume`
- `Music Volume`
- `SFX Volume`
- `Mute All`
- `Mute Music`
- `Mute SFX`
- `Screen Shake`
- `Damage Numbers`
- `Reduced Flash`

Buttons:

- `Back`
- `Go To Games`
- `Reset Save`

### HUD during a run

Now shows:

- day
- biome
- mode + survivor label
- HP bar
- XP bar
- level
- time left
- current objective title and progress
- warning banner
- boss name and boss HP bar
- weapon list
- passive list
- relic list
- synergy list

## Current Controls

Movement:

- `WASD`
- arrow keys

Pause/resume:

- `Escape`
- `P`
- `Space`
- on-screen `Pause` button

Special behavior:

- `Escape`, `P`, and `Space` pause only from `playing`
- `Escape`, `P`, and `Space` resume only from `paused`
- `Escape` closes settings
- `Escape` closes codex
- shrine event choices are mouse/click driven

## Save And Persistence Model

Storage key:

- `hundred-days-ashfall.save`

Save version:

- `2`
- source of truth lives in `CURRENT_SAVE_VERSION` in `src/memory/defaultState.ts`
- `SAVE_VERSION` in `src/memory/saveSchema.ts` mirrors that constant

Schema file:

- `src/memory/saveSchema.ts`

Save helpers:

- `src/engine/saveManager.ts`

### Root save shape

- `version`
- `profile`
- `settings`
- `currentRun`

### Profile fields

- `bestDay`
- `completedDay100`
- `totalRuns`
- `totalDeaths`
- `codex`

### Codex save categories

- `weapons`
- `passives`
- `enemies`
- `relics`
- `characters`
- `evolutions`
- `synergies`
- `modes`

### Settings defaults

- `masterVolume: 0.8`
- `musicVolume: 0.6`
- `sfxVolume: 0.8`
- `muted: false`
- `musicMuted: false`
- `sfxMuted: false`
- `screenshake: true`
- `damageNumbers: true`
- `reducedFlash: false`

### Current run snapshot fields

- `version`
- `day`
- `dayTimeRemaining`
- `totalRunTime`
- `player`
- `weapons`
- `passives`
- `relicIds`
- `modeId`
- `characterId`
- `objective`
- `usedContinue`

### Important save note

Transient world state is not fully serialized.

What restores:

- player stats
- mode
- survivor
- relic loadout
- weapons
- passives
- objective state
- day timer

What regenerates on load:

- live hazards
- shrine placement
- active particles
- existing enemy wave positions

This is intentional to keep save data compact and robust.

### Continue behavior

- title `Continue Run` restores `currentRun`
- game-over `Continue From Dawn` restores the day-start snapshot once per run
- day-start snapshot includes mode, survivor, relics, and objective state

### Navigation behavior

`go-games`:

- persists run unless the current scene is `game-over` or `victory`
- navigates to `../index.html`

## Current Modes

Source:

- `src/memory/gameManifest.ts`
- `runtime.ts` mode-adjustment helper

### `standard`

- original 100-day structure
- victory on Day 100

### `endless`

- continues after Day 100
- post-100 days clamp to Day 100 base plan, then add extra spawn pressure
- no automatic Day 100 victory cutoff

### `boss-rush`

- shorter days
- stronger pressure
- rotating bosses added every 5th day if no normal boss was scheduled

### `fragile`

- lower starting max HP
- faster XP growth and slightly faster movement
- higher pressure curve

## Current Survivors

Source:

- `src/memory/characterIndex.ts`

### `ash-warden`

- title: `Frontline Vanguard`
- starter weapon: `Ember Darts`
- starter passive: `Heartforge Plating`
- starter relic: `Ember Banner`
- role: balanced tanky opener

### `glint-seer`

- title: `Sightline Duelist`
- starter weapon: `Bloom Spread`
- starter passive: `Crit Lens`
- starter relic: `Survey Beacon`
- role: crit and XP snowball

### `moss-scrapper`

- title: `Salvage Skirmisher`
- starter weapon: `Rail Splinter`
- starter passive: `Magnet Array`
- starter relic: `Magnet Crown`
- role: loot flow, dodge, piercing pressure

## Current Relics

Source:

- `src/memory/relicIndex.ts`

Current relic set:

- `Ember Banner`
  damage + crit impact
- `Magnet Crown`
  pickup reach + magnet strength + XP gain
- `Frost Thread`
  cooldown + dodge + speed
- `Revenant Coin`
  revive + regen
- `Storm Dial`
  projectile speed + crit chance
- `Survey Beacon`
  XP + luck + pickup reach

Acquisition paths:

- each survivor starts with one relic
- shrine `Blood Price` can grant a random new relic

## Current Weapon Evolutions

Source:

- `src/memory/evolutionIndex.ts`

Current evolution rules:

- `Ember Darts` + `Crit Lens` -> `Solar Volley`
- `Bloom Spread` + `Wildbloom Halo` -> `Briar Tempest`
- `Rail Splinter` + `Hunter Sigil` -> `Dawn Lance`
- `Tether Beam` + `Chrono Lattice` -> `Prism Tether`
- `Storm Chain` + `Relay Spark` -> `Thunder Archive`

Activation rule:

- own the weapon
- reach max weapon level
- own the required passive

Implementation:

- evolution is derived at runtime, not stored as a permanent separate weapon entry
- the weapon keeps its base id but gets bonus stats and a different display name
- evolutions are discovered into the codex when first activated

## Current Weapon Synergies

Source:

- `src/memory/synergyIndex.ts`

Current synergy set:

- `Searing Rake`
  `Ember Darts + Rail Splinter`
- `Arc Conduit`
  `Tether Beam + Storm Chain`
- `Halo Garden`
  `Sun Orbiters + Thorn Aura`
- `Faultline Charge`
  `Ember Mines + Quake Ring`

Current gameplay effects:

- `Searing Rake`
  extra pierce and knockback on rail shots
- `Arc Conduit`
  beam casts fork an extra lightning link to a nearby target
- `Halo Garden`
  aura radius and slow strength increase
- `Faultline Charge`
  mine explosions grow larger and stronger

Synergies are derived from the current loadout and also tracked in the codex once seen.

## Current Weapons

Source:

- `src/memory/weaponIndex.ts`

Weapons still total `10`:

- `Ember Darts`
- `Bloom Spread`
- `Rail Splinter`
- `Sun Orbiters`
- `Quake Ring`
- `Tether Beam`
- `Ember Mines`
- `Drone Sentinels`
- `Storm Chain`
- `Thorn Aura`

Weapon archetype routing in `runtime.ts`:

- `projectile`
- `spread`
- `pierce`
- `orbit`
- `blast`
- `beam`
- `mine`
- `summon`
- `chain`
- `aura`

All old weapon stat data still lives in `weaponIndex.ts`.

## Current Passives

Source:

- `src/memory/passiveIndex.ts`

Passive count is still `21`.

The major new interaction is that passives now also serve as:

- survivor starter kit pieces
- evolution requirements
- synergy conditions in a few combinations

## Enemy Factions

Source:

- `src/memory/enemyIndex.ts`
- `src/engine/spawnManager.ts`

Current factions:

- `wildroot`
- `ruinborn`
- `embercourt`
- `frostkin`
- `riftspawn`

Current assignments:

- `wildroot`
  rootling, racer-mite, mire-brute, seed-pod, rootling-elite, mire-brute-elite, mire-titan
- `ruinborn`
  spore-thrower, spore-thrower-elite
- `embercourt`
  glass-lancer, ash-monarch
- `frostkin`
  gloom-wisp, glacier-revenant
- `riftspawn`
  night-seraph, hundredth-dawn

Current behavior:

- spawn weighting now gets a biome-based faction bias inside `spawnManager.ts`
- this makes biome transitions feel more thematically focused without fully replacing the original day-weight system

## Elite Affixes

Current elite affixes:

- `explosive`
- `hasted`
- `bulwark`
- `splitter`
- `siphon`

Current effects:

- `explosive`
  explodes on death
- `hasted`
  faster movement
- `bulwark`
  more HP and damage reduction
- `splitter`
  spawns extra mites on death
- `siphon`
  heals on successful contact hits

Current visuals:

- affix-colored elite ring in `renderer.ts`

## Boss Phases

Current boss phase logic:

- bosses start at phase `0`
- phase `1` triggers at `70%` HP
- phase `2` triggers at `35%` HP

Phase effects:

- faster boss movement
- lower ranged cooldown
- more bolts per volley
- stronger projectile damage
- more frequent summon waves
- warning banners fire on phase transitions

Current implementation:

- `updateBossPhase()` in `runtime.ts`

## Biome Hazards

Current hazard system:

- hazards spawn repeatedly during gameplay
- type is chosen by current biome
- hazards have a warmup telegraph, then pulse
- hazards can damage the player
- hazards also damage enemies lightly

Current biome hazards:

- `Verdant Reach`
  `bramble patch`
- `Sunken Ruins`
  `ruin pulse`
- `Ember Waste`
  `cinder vent`
- `Frost Hollow`
  `whiteout ring`
- `Eclipse Rift`
  `rift tear`

Renderer draws them as telegraphed circular zones.

## Shrines And Field Events

Current shrine behavior:

- shrine can spawn mid-day from Day 4 onward
- shrine appears as a world object
- touching it opens the `event` scene
- shrine is one-use and then removed

Current shrine choices:

- `Blood Price`
  lose HP, gain random relic if available
- `Forge Draft`
  upgrade weakest non-capped weapon or gain a strong fallback buff
- `Pilgrim Rest`
  heal, regen, luck

Objectives can directly require shrine activation.

## Day Objectives

Current objective kinds:

- `slayer`
- `collector`
- `shrine`
- `boss`

Current behavior:

- each day creates one objective
- boss days automatically use a boss objective
- non-boss days rotate between kill, collect, and shrine goals
- completion gives immediate bonus:
  heal
  XP burst
  luck increase
- objective result is also shown on the day-summary screen

Tracked in save snapshots:

- kind
- title
- description
- current progress
- target
- completed flag
- reward text

## Loot And Objective Interactions

Still available:

- XP shards
- heal orb
- magnet star

New interaction:

- pickup collection now also advances `collector` objectives

## Current Day Reward Choices

Still `3` between-day choices.

Current reward pool:

- `Rest and Mend`
- `Forge Weapon`
- `Scout Route`
- `Tempered Shell`
- `Lattice Tune`
- `Battle Tonic`
- `Cache Surge`
- `Phase Route`
- `Harvest Scan`

Reward logic remains in:

- `src/data/upgrades/choicePool.ts`
- `takeReward()` in `runtime.ts`

## Current Enemy And Boss Counts

Standard enemies:

- `Rootling`
- `Racer Mite`
- `Mire Brute`
- `Spore Thrower`
- `Glass Lancer`
- `Gloom Wisp`
- `Seed Pod`

Elite variants:

- `Rootling Champion`
- `Mire Juggernaut`
- `Blight Artillerist`

Bosses:

- `Mire Titan`
- `Ash Monarch`
- `Glacier Revenant`
- `Night Seraph`
- `The Hundredth Dawn`

## Renderer Notes

Important current renderer decisions:

- darker quieter battlefield floor for readability
- ground shadows under player and enemies
- brighter title crest positioned farther right
- shrine glyph rendering
- hazard telegraph rendering
- elite affix ring colors
- boss phase ring overlays

Files:

- `src/engine/renderer.ts`
- `src/engine/assets.ts`

## Audio Routing Notes

Music routing now is:

- `title`, `settings`, `paused`, `game-over`, `codex`, `event` -> `menu-drift`
- standard gameplay -> `field-drive`
- active boss -> `danger-bloom`
- `victory` -> `victory-rise`

## Current Runtime Update Order

While `scene === "playing"`:

1. process global input
2. update warnings
3. update player movement/regen
4. update day timer
5. spawn enemies and bosses
6. update weapons
7. sync drones
8. update drones
9. update biome hazards
10. update enemies
11. update projectiles
12. update beams
13. update mines
14. update pickups
15. update shrine interactions
16. update particles
17. cleanup entities
18. process level-ups
19. update camera
20. autosave check
21. finish day if timer expired and no boss remains
22. render canvas
23. render UI

## Verification Notes From This Pass

Verification done in this expansion turn:

1. full TypeScript + Vite production build before the final bug-fix sweep
2. UI action wiring check against runtime handlers and scene assignments
3. layout safety review for panel overflow, responsive widths, media queries, and 3-choice reward/level-up counts
4. save-schema consistency review for new mode/survivor/relic/objective/codex fields, including fresh-save version stamping
5. headless Playwright smoke test on built `index.html` covering title, settings, codex, mode selection, survivor selection, run start, `Space`/`P` pause-resume, floating pause button, and desktop/mobile viewport fit

Results:

- production build passed
- headless browser smoke checks passed
- desktop smoke viewport: `1440x900`
- mobile smoke viewport: `390x844`
- no console errors, page errors, or failed requests were observed during the scripted smoke run
- the day-summary objective separator was normalized to ASCII (`Completed - ...`) to avoid encoding artifacts in some environments
- fresh saves now stamp version `2` from a shared constant instead of leaving `createEmptySave()` on version `1`

## Things Most Likely To Break

### Save migration

Check:

- `src/memory/types.ts`
- `src/memory/defaultState.ts`
- `src/memory/saveSchema.ts`
- `loadRun()` in `runtime.ts`

### Title selection UI

Check:

- `GameUI` title template
- `select-mode`
- `select-character`
- `beginNewRun()`

### Shrine flow

Check:

- `updateShrines()`
- `takeShrineChoice()`
- `scene === "event"`

### Codex behavior

Check:

- `buildCodexSections()`
- `rememberCodex()`
- `open-codex` / `close-codex`

### Evolutions and synergies

Check:

- `getEvolutionForWeapon()`
- `getResolvedWeaponStats()`
- `getActiveSynergies()`
- weapon fire methods in `runtime.ts`

### Endless mode

Check:

- `getModeAdjustedDayPlan()`
- `finishDay()`

### HUD crowding

Check:

- `src/game/ui.ts`
- `src/styles/main.css`
- `.hud-loadout`
- `.objective-banner`

## Exact Edit Map

### Add a survivor

- `src/memory/characterIndex.ts`
- if needed, adjust title UI in `src/game/ui.ts`
- if needed, adjust start-run logic in `beginNewRun()` in `runtime.ts`

### Add a relic

- `src/memory/relicIndex.ts`
- `applyRelic()` in `runtime.ts`
- codex display comes from `buildCodexSections()`

### Add an evolution

- `src/memory/evolutionIndex.ts`
- `getEvolutionForWeapon()` in `runtime.ts`
- `getResolvedWeaponStats()` in `runtime.ts`

### Add a synergy

- `src/memory/synergyIndex.ts`
- `getActiveSynergies()` in `runtime.ts`
- weapon behavior methods in `runtime.ts`

### Add or change a challenge mode

- `src/memory/gameManifest.ts`
- `getModeAdjustedDayPlan()` in `runtime.ts`
- title UI cards in `ui.ts`

### Add a day objective type

- `DayObjectiveState` in `types.ts`
- `createObjective()` in `runtime.ts`
- `progressObjective()` in `runtime.ts`
- HUD/day-summary rendering in `ui.ts`

### Add a shrine option

- `spawnShrine()` in `runtime.ts`
- `takeShrineChoice()` in `runtime.ts`
- event scene in `ui.ts`

### Add a biome hazard

- `spawnBiomeHazard()` in `runtime.ts`
- `updateHazards()` in `runtime.ts`
- `drawHazards()` in `renderer.ts`

### Add an elite affix

- `EliteAffixId` in `types.ts`
- `spawnEnemy()` in `runtime.ts`
- affix logic in `updateEnemies()`, `damageEnemy()`, `killEnemy()`
- affix ring color in `renderer.ts`

### Add a codex category

- `CodexProgress` in `types.ts`
- `createDefaultCodex()` in `defaultState.ts`
- `migrateSave()` in `saveSchema.ts`
- `buildCodexSections()` in `runtime.ts`
- codex template in `ui.ts`

## Fast Sanity Checklist

1. run `npm run build`
2. confirm root `index.html` regenerated
3. confirm root `assets/` refreshed
4. open title screen
5. click a mode card
6. click a survivor card
7. open codex
8. close codex
9. start a run
10. test pause with `Escape`
11. test pause with `P`
12. test pause with `Space`
13. test floating `Pause` button
14. test one level-up screen
15. test one day-summary reward screen
16. test one shrine event if it spawns
17. confirm HUD objective text updates
18. confirm `Go To Games`
19. confirm `Continue Run`
20. confirm `Continue From Dawn`

## Recent History

Major recent changes now in the project:

- static hosting build/publish split was established
- game was added to the cabinet page
- menu hover/click rerender bug was fixed
- `Go To Games` navigation was added
- pause button and `P`/`Space` pause keys were added
- settings sliders/toggles were restyled
- between-day reward count was reduced back to `3`
- battlefield background was darkened for readability
- title crest logo was made more readable
- day-summary objective text separator was normalized to ASCII to avoid encoding glitches
- fresh save creation now uses the shared version-2 constant instead of a stale hardcoded version-1 value
- modal panel scrollbars are now visually hidden while preserving wheel/touch scrolling inside menus like settings and codex
- major feature expansion added:
  - 4 challenge modes
  - 3 selectable survivors
  - codex screen and save-backed discovery tracking
  - relic system
  - weapon evolutions
  - weapon synergies
  - elite affixes
  - biome hazards
  - day objectives
  - shrines and event scene
  - enemy factions and biome weighting
  - boss phases

## Bottom Line

The game is no longer just the base 100-day survival loop. It now has:

- mode selection
- survivor identity
- codex progression
- mid-run relic drafting
- emergent loadout interactions
- map-level pressure systems
- more distinct late-run enemies and bosses

If future work starts cold, read this file first, then the relevant memory registries, then `runtime.ts`, then `ui.ts` and `main.css` if the task touches menus or HUD.
