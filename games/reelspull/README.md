# Reels Pull

`Reels Pull` is a browser gacha / reel-spinner game that lives almost entirely inside one file: `games/reelspull/index.html`.

This README is meant to be a real handoff document for future developers and AIs. The goal is not just "what the project is", but "how this project behaves, what the user cares about, what has already been tuned by hand, and what you should not break while editing it."

If another AI reads only one file before working on this game, it should read this README first.

## Project Memory File

Treat this README as the memory file for `Reels Pull`.

Working rule:

- before changing the game, read this file first
- after changing the game, update this file if the real project state changed
- if chat history and this file disagree, re-check the code and update this file so it matches reality
- prefer relying on this file for project context instead of trying to carry every detail in conversation memory

This README is supposed to function like the persistent operating memory for the project.

Extra memory rule:

- once a project detail is written here clearly, future work should rely on this file instead of clinging to old chat-only memory
- if an older remembered detail conflicts with this file, re-check the code and update this file so it stays the source of truth

## README Maintenance Rule

From this point forward, this README is supposed to stay in sync with the real game.

That means:

- every feature added to `Reels Pull` should be written down here
- every meaningful gameplay/system/UI rule added to the game should be written down here
- if something is removed from the game, remove it from this README too
- if something was only a temporary bug note and it gets fixed, remove that stale note or rewrite it so the README reflects the current state
- do not let this README become a pile of old history that no longer matches the project

The goal is for this file to describe what is true right now, so another AI can read it and start working correctly immediately.

Treat this README as the primary source of current project context for future work. Prefer checking this file first instead of relying on old chat history.

This file is also meant to reduce context load for future sessions. If something important about the current game state exists only in chat and not here, this README is incomplete and should be updated.

## Quick Start

- Site path: `/games/reelspull/`
- Main file: `games/reelspull/index.html`
- Assets folder: `games/reelspull/gif/`
- Save storage: `localStorage["reels-pull-save-v1"]`
- Hidden dev mode code: type `never-wet`

This is a static front-end project. There is no backend for this game.

## What This Game Is

`Reels Pull` is no longer a simple spinner. It is a full single-page gacha game with:

- a tuned reel / slot-like spin belt
- weighted rarity pulls
- pity / bad-luck protection
- multi-variant pulls
- banner-specific odds multipliers
- crafting and signal economy
- collection, album, showcase, latest results, full roll history
- rare hit popups and tier celebrations
- 1-pull / 10-pull / 100-pull modes with progression unlocks
- auto pull
- challenge mode
- 10,000 achievements
- export to PNG
- hidden draggable dev tools

## Current Verified State

This section is a plain-language "where the project stands right now" snapshot.

- the game is still a single-page app in `index.html`
- the reel / spin feel is currently treated as tuned and protected
- the belt uses placeholder/static art, not live GIF playback
- result GIF playback happens in result cards / overlays, not inside the moving reel belt
- auto pull exists and is intentionally faster / shorter than manual pull flow
- all banners are data-driven from one banner table
- achievements are generated to `10,000`
- the achievements box tracks all `10,000`, but now loads cards in batches while scrolling so the page stays fast
- locked achievements appear first, cleared ones appear afterward, and built-in order is preserved inside each group
- full saved roll history is still preserved, but the visible history list now loads in batches while scrolling
- full achievement completion now gives signal, all banners, and stacked Godlike rewards
- the page now has a dedicated small-laptop responsive pass in CSS
- the save system was recently audited and the long-term progression state looks consistent from the code side
- save writes are now lightly debounced before hitting `localStorage`
- synced GIF thumbnails now refresh only for images near the viewport instead of every synced image on the page

## Current Page Structure

The visible page is organized like this:

1. Hero
   - back button
   - album button
   - game title and intro text
2. Main play row
   - left: reel, pull buttons, result banner, latest results
   - right: account stats, pull counts, full roll history
3. Collection section
4. Control Center
   - featured banners
   - workshop
   - daily + challenge
   - showcase + settings
5. Achievements
6. Signal Lab
   - odds
   - drought
   - rare hit chart
   - banner history

### Important DOM Anchors

Useful IDs for future edits:

- `slotStrip`
- `singlePullButton`
- `multiPullButton`
- `hundredPullButton`
- `autoPullButton`
- `resetProgressButton`
- `resultContainer`
- `resultsGrid`
- `statsGrid`
- `historyList`
- `recentList`
- `collectionGrid`
- `bannerList`
- `resourceCard`
- `craftGrid`
- `dailyCard`
- `challengeCard`
- `showcaseCard`
- `themeList`
- `soundList`
- `achievementGrid`
- `oddsGrid`
- `droughtCard`
- `rareHitChart`
- `bannerHistoryList`

## Responsive Layout

The page now has explicit responsive tuning. This is no longer "desktop only with a tiny mobile fallback."

Current breakpoint intent:

- `max-width: 1280px`
  - small-laptop spacing compression
  - tighter main grid
  - smaller collection / results / systems sizing
  - smaller modal / dev window sizing
- `max-width: 1160px`
  - main two-column area collapses into one column
  - side stack becomes a 3-card grid
- `max-height: 860px` with desktop widths
  - short laptop compression
  - tighter hero / panel spacing
  - shorter slot and scroll regions
- `max-width: 920px`
  - tablet-ish collapse
  - systems and lab grids shift to 2 columns
- `max-width: 760px`
  - further collapse toward one-column content blocks
- `max-width: 600px`
  - mobile stacking
  - buttons go full-width

Responsive goal:

- keep the game readable on small laptops
- do not change gameplay behavior
- do not change reel feel
- do not make the UI look like a separate mobile redesign

## Performance Guardrails

The game can feel laggy if future edits casually re-introduce huge DOM or storage work. Current performance-sensitive rules:

- do not render the full saved roll history into the DOM at once
- do not render all `10,000` achievement cards into the DOM at once
- keep scroll-heavy areas staged / incremental
- avoid refreshing synced GIF thumbnails that are offscreen
- avoid synchronous save spam; writes are intentionally lightly debounced now

Current implementation intent:

- roll history shows the full saved count, but only loads more cards when the user scrolls down
- achievements show the full tracked total, but only load more cards as the user scrolls the achievement vault
- thumbnail sync skips offscreen media to reduce repeated image reload work
- `persistProgress()` is no longer meant to hammer `localStorage` instantly on every tiny state change

## Current Banner Ladder

The banner shop is intentionally ordered from cheapest to most expensive, and the intent is that higher-cost banners should generally feel more valuable.

Current order:

1. `Signal Drift`
2. `Chaos Static`
3. `Neon Bloom`
4. `Mythic Voltage`
5. `Mirage Archive`
6. `Ember Rush`
7. `Royal Relay`
8. `Void Choir`
9. `Celestial Crown`
10. `Solar Flare`

Interpretation:

- cheap banners = utility / collection / ladder climbing
- middle banners = progression / hunting
- expensive banners = serious chase banners
- most expensive banners = top-end chase specialization

If banner prices or strengths change, update both the table below and this meaning section.

## The Most Important Rule

Do not casually change the reel feel.

This project was tuned through many rounds of user feedback. The user is especially sensitive to:

- how the reel starts
- how it slows down
- whether it jumps before moving
- whether it over-spins
- whether it reverses
- whether the yellow box lines up perfectly
- whether the belt shows live GIFs or placeholders

Unless the user explicitly asks for reel changes, preserve the current spin behavior.

## AI Handoff: How To Work On This Project

If you are another AI stepping into this project, these are the highest-signal working rules:

1. Read this README first.
2. Then inspect only the part of `index.html` related to the requested system.
3. Prefer narrow edits over broad refactors.
4. Do not "clean up" the reel, popup, or save model unless the user asked for that.
5. Assume visual details were tuned intentionally, even if they look unusual at first.

The user tends to work iteratively and visually. They often want:

- direct edits, not long plans
- preserved feel with small targeted tweaks
- exact UI behavior, not "close enough"
- quick fixes after they spot something off in a screenshot

## File Layout

This folder is intentionally small:

- `index.html`
  - HTML structure
  - CSS
  - gameplay logic
  - state
  - persistence
  - audio
  - exports
  - dev mode
- `gif/`
  - rarity GIFs
  - loop-only GIFs for top tiers
  - export poster stills
  - reel placeholder art

This is effectively a single-file app with an asset directory.

## Architecture Overview

`index.html` contains all major systems. The most important anchors are:

- `const STORAGE_KEY`
- `const GIFS`
- `const BANNERS`
- `const VARIANT_TYPES`
- `const CRAFT_OPTIONS`
- `createDefaultStats()`
- `startSpin(...)`
- `showWinnerOverlaySequence(...)`
- `showWinnerOverlay(...)`
- `finalizeResults(...)`
- `renderAll()`
- `buildChallengePool()`
- `openDevModeOverlay()`
- `persistProgress()`
- `loadProgress()`

Responsive layout now also matters here. The page includes dedicated media-query tuning for:

- small laptops / tighter desktop widths
- shorter laptop heights
- tablet widths
- mobile widths

Those responsive rules are CSS-only and are meant to preserve the current game feel while making the layout fit better on smaller screens.

### Mental Model

Use this mental model when navigating the code:

1. Constants define all live tuning.
2. Pull generation chooses a result set.
3. Reel animation visualizes a selected winner.
4. Winner popup shows the pull.
5. `finalizeResults(...)` mutates long-term account state.
6. `renderAll()` redraws the page from saved / live state.
7. `persistProgress()` writes the account back to localStorage.

## Core Live Tuning

These constants are important because they define the current game feel.

### Global Constants

- `STORAGE_KEY = "reels-pull-save-v1"`
- `PITY_START = 18`
- `PITY_GUARANTEE = 30`
- `BIG_PULL_RANK = 6`
- `DEV_MODE_CODE = "never-wet"`
- `AUTO_PULL_UNLOCK_COST = 5000`
- `TEN_PULL_UNLOCK_REQUIREMENT = 100`
- `HUNDRED_PULL_UNLOCK_REQUIREMENT = 1000`
- `GODLIKE_SHINY_TOTAL_PROBABILITY = 1 / 252000000`
- `THUMBNAIL_SYNC_DURATION_MS = 4000`

### Rarity Table

Current base `GIFS` table:

| Key | Name | Label | Rank | Weight |
| --- | --- | --- | ---: | ---: |
| `absmal` | Abysmal | Glitched | 1 | 28 |
| `common` | Common | Common | 2 | 24 |
| `uncommon` | Uncommon | Uncommon | 3 | 21 |
| `rare` | Rare | Rare | 4 | 12 |
| `exotic` | Exotic | Exotic | 5 | 8 |
| `mythic` | Mythic | Mythic | 6 | 5 |
| `legendary` | Legendary | Legendary | 7 | 3.25 |
| `unreal` | Unreal | Unreal | 8 | 0.02 |
| `insane` | Insane | Insane | 9 | 0.0025 |
| `godlike` | Godlike | Godlike | 10 | 0.00045 |

Notes:

- `Abysmal` key is intentionally spelled `absmal` in code and file paths.
- Do not "fix" that key casually unless you plan to migrate all dependent logic and assets.

### Banner Table

Current `BANNERS`:

Listed from cheapest to most expensive:

| Key | Name | Cost | Purpose |
| --- | --- | ---: | --- |
| `signal` | Signal Drift | 0 | baseline banner |
| `chaos` | Chaos Static | 900 | cheapest specialty banner, small push toward Abysmal / Exotic / Insane |
| `neon` | Neon Bloom | 1200 | cheap ladder-climber for Uncommon / Rare / Exotic |
| `mythic` | Mythic Voltage | 2200 | early premium banner for Mythic / Legendary / some Unreal |
| `mirage` | Mirage Archive | 2600 | broad collection-builder banner for the useful middle of the pool |
| `ember` | Ember Rush | 4200 | strong progression banner for Rare / Exotic / Mythic |
| `royal` | Royal Relay | 6800 | upper-mid hunting banner for Mythic / Legendary / some Unreal |
| `voidsong` | Void Choir | 12000 | late-game top-end chase banner |
| `celestial` | Celestial Crown | 18000 | premium all-around chase banner with excellent upper-tier pressure |
| `solar` | Solar Flare | 26000 | super-premium pure top-end chase banner stronger than Celestial |

Banner multipliers are real gameplay changes, not cosmetic. The user explicitly wanted banners to provide actual odds benefits, and the paid banners are intentionally ordered so the shop climbs from cheap utility banners into very expensive chase banners with stronger benefits.

Banner modal wording currently uses:

- `Boosted Odds`
- `Reduced Odds`
- chips like `65% higher` and `22% lower`

That wording was chosen because `+/-` looked too easy to misread.

### Variant Table

Current `VARIANT_TYPES`:

| Key | Label | Chance | Min Rank | Intended Feel |
| --- | --- | ---: | ---: | --- |
| `void` | Void | 0.0012 | 8 | cosmic / purple |
| `holo` | Holo | 0.0035 | 6 | cyan / prism |
| `alt` | Alt | 0.006 | 5 | alternate-tint / stripe treatment |
| `shiny` | Shiny | 0.0001797 | 3 | gold / premium |

Important behavior:

- Variants can stack.
- A result is not limited to one variant anymore.
- Result objects may contain `variantKeys`, not just `variantKey`.
- `Godlike Shiny` is special-cased so the total combined odds target about `1 in 252,000,000`.

### Variant Availability By Rarity

This is the intended availability model:

- `Abysmal`, `Common`: no normal variants
- `Uncommon`, `Rare`: `Shiny`
- `Exotic`: `Alt`, `Shiny`
- `Mythic`, `Legendary`: `Holo`, `Alt`, `Shiny`
- `Unreal`, `Insane`, `Godlike`: `Void`, `Holo`, `Alt`, `Shiny`

## Major Gameplay Systems

### Reel / Spin Belt

This is the most protected system in the project.

Current expectations:

- the reel starts from where it already is
- it launches fast
- it gradually slows down
- it does not jump before spinning
- it does not reverse
- it does not do an unwanted extra loop after landing
- the yellow center box should visually align with a real card
- the reel belt uses placeholder/static art, not actual playing GIFs
- the real GIF reveal happens in result contexts, not inside the spinning strip

If the user did not ask to touch reel motion, do not change this.

### Pull Modes

Current modes:

- `Single Pull`
- `10 Pulls`
- `100 Pulls`

Unlock rules:

- `10 Pulls` unlocks after `100` single pulls
- `100 Pulls` unlocks after `1000` pulls made through `10 Pulls`

### Pity

Pity is the bad-luck protection system.

- starts boosting after `18` dry pulls
- guarantees a `BIG_PULL_RANK` result at `30`
- `BIG_PULL_RANK = 6`, so this means `Mythic` or better

When editing pity, check both displayed copy and actual odds logic.

### Auto Pull

Auto Pull is a permanent upgrade purchased with signal.

- cost: `5000 signal`
- intended to stay fast
- uses short popup flow
- uses scaled-down winner media
- skips the long intro reveal feel
- should immediately continue without manual interaction

Important:

- auto mode popup sizing is intentionally different from manual mode
- do not assume manual popup changes should also apply to auto mode

Auto-pull specific presentation rules:

- skip the long reveal feel
- flash the revealed state faster
- use smaller contained media
- keep cycling without waiting for long celebratory pauses

### Crafting

Current crafting is intentionally expensive:

| Craft | Cost |
| --- | ---: |
| Legendary+ | 5000 signal |
| Unreal+ | 15000 signal |
| Insane+ | 50000 signal |

These high costs were explicitly requested.

### Daily / Challenge / Progression

The page also includes:

- daily free claim with streak logic
- challenge system
- signal economy
- theme unlocks
- banner ownership and switching

## Challenge System

Challenge data comes from `buildChallengePool()`.

Current total:

- `203` challenges
- `3` original challenges
- `200` generated challenges

Per-challenge completion counts are saved in `challengeCompletionCounts`.

The challenge UI now has an `i` button that opens a modal showing:

- every challenge
- how many times each one was completed
- totals and tracking summary

Current sort order in that modal:

1. most cleared first
2. then higher target rarity
3. then name

That order was requested by the user.

## Achievement Box Behavior

The achievements panel is intentionally staged now for performance.

Current ordering rule:

- locked achievements first
- unlocked achievements after that
- built-in achievement order preserved inside each group

Current loading rule:

- the vault tracks all `10,000`
- only part of the list is in the DOM at once
- more cards load as the player scrolls deeper into the box

Reason:

- the user wanted to see what can be cleared next without scrolling through old clears first
- the full immediate `10,000`-card render made the page lag badly

If you change this again, update both this section and the "Current Verified State" section.

## Achievement System

Achievements are large-scale now.

Current total:

- `10,000` achievements

The achievements header should show progress like:

- `123 / 10000 complete`

Important UI note:

- the game really tracks all `10,000`
- the achievements panel now loads them in batches inside the scrollable box
- locked achievements appear first so the player can see what to clear next
- cleared achievements move to the bottom, while built-in order is preserved inside each group

### Full Completion Reward

When all 10,000 achievements are cleared:

- grant `+10000 signal`
- unlock all banners
- grant `10 stacked Godlikes`

"10 stacked Godlikes" means:

- not separate bundles by variant
- not "Void x10" plus "Holo x10" plus others as separate rewards
- it means `10` Godlike pulls, and each of those `10` has:
  - `Void`
  - `Holo`
  - `Alt`
  - `Shiny`

Banner reward note:

- full achievement completion should also unlock the entire banner shop
- this should apply retroactively to old saves that already have the grand prize claimed

After the achievement completion modal is closed, the game should open a real winner-style reward popup for that stacked Godlike reward.

## Save / Load Audit Summary

This is the current code-level understanding of persistence.

### What Is Intentionally Saved

- pity
- total pulls
- per-GIF pull counts
- unlocked collection
- full recent history entries
- stacked favorite state
- stacked best pull state
- signal dust
- active and owned banners
- banner history
- achievements and achievement dates
- grand prize claim flags
- variant counts
- total variant pulls
- daily streak info
- selected theme
- sound settings
- challenge state and challenge completion counts
- drought / luck / spend stats
- rare-hit history
- auto-pull unlock
- 10-pull and 100-pull unlock counters

### What Is Intentionally Not Saved

- in-progress reel animation state
- currently open popup/modal state
- pending unreconciled spin results
- whether auto pull is actively spinning at that exact moment
- other temporary live UI-only state

### Save Confidence Note

The save system has been code-audited recently. From the current code:

- `createDefaultStats()` defines the long-term shape
- `persistProgress()` writes `state.stats`
- `loadProgress()` restores and normalizes old saves
- `normalizeDevStatsState()` also repairs newer fields after debug edits
- `resetProgress()` clears storage and rebuilds defaults

This does not replace live browser QA, but it does mean the progression save model currently looks internally consistent.

## Winner Popup Rules

The winner popup is another high-sensitivity part of the game.

Current expectations:

- closing it should finalize results immediately
- manual pulls get the full popup
- auto pulls get the shortened popup
- the popup includes `Set Favorite`
- top-tier tiers have distinct celebration effects
- stacked variants should render together in the popup

Special rule:

- `Mythic` should not show its special background accent inside the winner popup

That was explicitly requested.

## Rare Tier Celebration Rules

These three should remain visually distinct:

- `Unreal`
- `Insane`
- `Godlike`

The current approach uses separate celebration styling and popup treatments. The user explicitly asked not to casually retune these after they were finally working.

## Collection / Album / Showcase / Latest Results

These are related but not identical systems.

Key difference:

- preview cards may reflect owned-variant state
- actual rolled results must reflect the exact rolled `variantKeys`

Do not accidentally merge those behaviors together.

### Thumbnail Sync

Collection / latest / other thumbnail GIF loops were synced to a shared timing clock so they restart together. That is intentional.

### Card Glow Rules

Card glow logic is variant-driven now.

Important glow behavior:

- only `Void` -> purple glow
- only `Holo` -> cyan glow
- only `Shiny` -> gold glow
- two of them -> only those two colors glow
- all three -> all three colors glow

Notes:

- `Alt` is intentionally not part of the outer multi-color glow logic
- glow colors are split spatially so they do not collapse into one muddy blur

### High-Tier Outer Box Glow

Entire card boxes for high rarities also have identity glows:

- `Unreal` -> coral / orange feel
- `Insane` -> hot pink feel
- `Godlike` -> divine yellow / gold feel

## Mythic / Unreal / Godlike Visual Intent

These were tuned for specific looks:

- `Mythic` should feel visibly different from `Rare`
- `Unreal` should show its own background colors / pattern, not look flat
- `Godlike` should feel divine, not dark
- `Godlike` outer box should glow yellow

If you are editing effects, preserve these identity goals.

## Export System

Export behavior has gone through a lot of fixes.

Important facts:

- exports should use real result art, not a made-up generic phone icon
- poster stills exist in `gif/`
- long titles need scaling to fit
- `Abysmal` export art was manually cleaned up to remove bad spike artifacts

If export output looks wrong, inspect:

- poster path mapping
- variant filter logic
- title fitting logic
- card composition logic

## Save Model

The long-term player state lives in `state.stats`.

`createDefaultStats()` is the source of truth.

### Important Stored Fields

This is not every field, but it is the high-value map future editors need:

- `totalPulls`
- `counts`
- `unlocked`
- `recent`
- `signalDust`
- `pityCounter`
- `currentDrought`
- `longestDrought`
- `bestPullKey`
- `bestPullVariant`
- `bestPullVariantKeys`
- `favoriteKey`
- `favoriteVariant`
- `favoriteVariantKeys`
- `activeBannerKey`
- `ownedBannerKeys`
- `bannerHistory`
- `variantCounts`
- `totalVariantPulls`
- `achievementKeys`
- `achievementDates`
- `achievementGrandPrizeClaimed`
- `achievementGrandPrizeClaimedAt`
- `dailyStreak`
- `lastDailyClaimDate`
- `selectedTheme`
- `challenge`
- `challengeWins`
- `challengeCompletionCounts`
- `totalSignalSpent`
- `totalLuckScore`
- `rareHitHistory`
- `autoPullUnlocked`
- `singlePullUnlockCount`
- `tenPullUnlockCount`

### Critical Save Notes

- stacked variant support depends on `favoriteVariantKeys` and `bestPullVariantKeys`
- do not flatten favorites or best pull back to one variant
- old saves may be missing newer fields
- `loadProgress()` and normalization logic must safely fill gaps

If you add or rename a saved field, also inspect:

- `createDefaultStats()`
- `loadProgress()`
- dev-state normalization logic
- reset logic
- any debug mutation helpers

## Dev Mode

Trigger:

- type `never-wet`

Current dev mode is intentionally:

- draggable
- window-like, not modal
- no background blur
- custom-styled pickers
- scrollbar-hidden

It can control a huge amount of game state, including:

- signal
- banners
- themes
- challenge state
- force pulls
- grant collection state
- grant variants
- set best pull
- set favorite
- manipulate achievements
- paste / apply snapshot JSON

This is used heavily for testing. Do not casually remove power from it.

Dev mode current behavior notes:

- draggable floating window
- no blur overlay behind it
- custom pickers instead of native ugly dropdowns
- hidden scrollbars
- wide save/debug mutation coverage

## Things That Were Buggy Before

These are known historical bug zones. If you touch related code, re-check them.

- reel overspin / reverse / extra loop
- reel drifting out of rendered range
- yellow box not centered on refresh
- winner popup not restarting GIF from frame 1
- top-tier popup animation not firing in 10-pull because the wrong batch winner was used
- best pull flattening stacked variants into only one variant
- favorite flattening stacked variants into only one variant
- export using ugly phone art instead of real result art
- `Abysmal` export artifact spikes
- visible default browser scrollbars in custom UI

## User Preference Rules

These are not generic style notes. They are actual product expectations gathered through repeated feedback.

### Do Not Break These

- do not change reel motion unless explicitly asked
- do not put live GIF playback back into the reel belt
- do not reintroduce visible browser-default scrollbars
- do not undo the small-laptop responsive pass with one-off desktop-only spacing edits
- do not remove stacked variant support
- do not break auto-pull fast flow
- do not simplify banner effects into pure cosmetics
- do not flatten best-pull or favorite state to one variant
- do not make top-tier popup celebrations generic again
- do not let README and real behavior drift apart

### If The User Says Something "Feels Off"

They often mean one of these:

- alignment is off by only a few pixels
- easing / motion timing is wrong
- overlay layering hides the art
- effect is technically present but not visible enough
- a special case path is using the wrong result object

Prefer a targeted fix over a rewrite.

## Where To Start For Common Tasks

If you need to work on:

- pull odds / rarity tuning:
  - inspect `GIFS`, `BANNERS`, `VARIANT_TYPES`, pity helpers, odds rendering
- reel motion:
  - inspect `startSpin(...)` and reel-position helpers
- popup behavior:
  - inspect `showWinnerOverlaySequence(...)`, `showWinnerOverlay(...)`
- result state:
  - inspect `finalizeResults(...)`
- UI redraw:
  - inspect `renderAll()` and related render helpers
- challenges:
  - inspect `buildChallengePool()` and challenge render helpers
- dev tools:
  - inspect `openDevModeOverlay()` and its event wiring
- saving:
  - inspect `persistProgress()` and `loadProgress()`
- responsiveness / layout:
  - inspect the CSS grid definitions and media queries near the end of the style block
- achievements:
  - inspect `buildAchievements()`, `renderAchievements()`, and grand-prize helpers
- banners:
  - inspect `BANNERS`, banner shop rendering, and banner info modal helpers

## How To Validate Changes

Because this project is one large HTML file, syntax-checking the inline script is important after edits.

Example PowerShell flow:

```powershell
$content = Get-Content -Path 'games/reelspull/index.html' -Raw
$match = [regex]::Match($content, '<script>([\s\S]*)</script>')
Set-Content -Path 'games/reelspull/.tmp-check.js' -Value $match.Groups[1].Value
node --check 'games/reelspull/.tmp-check.js'
Remove-Item 'games/reelspull/.tmp-check.js'
```

### Manual Smoke Tests

At minimum, a careful pass should cover:

- single pull
- 10 pull
- 100 pull
- auto pull
- refresh persistence
- favorite from winner popup
- best pull after a stacked variant result
- dev mode open / drag / picker interaction
- challenge modal and sorting
- export single card
- export batch
- top-tier popup effects
- small-laptop layout
- short-height laptop layout

## Recommended Editing Style For Future AIs

When the user asks for a change:

1. identify the exact subsystem
2. inspect only the functions around that subsystem
3. preserve tuned behavior outside the request
4. if a result object is involved, check both `variantKey` and `variantKeys`
5. if a save field is involved, check load / reset / dev mode too

This project looks simple from the outside, but many features have manual exceptions and special-case logic. Broad refactors are more dangerous here than small precise edits.

## Final Summary

`Reels Pull` is a hand-tuned single-page gacha game. It is feature-rich, stateful, and visually sensitive. The most important things to preserve are:

- reel feel
- popup behavior
- stacked variant correctness
- hidden-scrollbar UI polish
- banner / pity / odds integrity
- the user's tuned visual identity for top tiers

If you are another AI, the safest path is:

- read this README
- search the relevant function names in `index.html`
- make the smallest change that satisfies the user
- re-check syntax
- sanity-check the exact UX path you touched
