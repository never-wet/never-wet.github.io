# Midnight Pawn

`Midnight Pawn` is a static browser game inside the arcade at `/games/midnight-pawn/`.

This README is the project memory file. Its job is to carry the important context so future work does not depend on long chat history. Another AI or human should be able to read this file first, understand the current game, and continue safely with much less guesswork.

If you are editing `Midnight Pawn`, read this file before changing code.

## Why this file exists

This file is meant to answer:

- what the game is
- how it is supposed to feel
- which files own which parts
- how the runtime is structured
- what the current tuning is
- what the user explicitly asked to preserve
- what was already fixed and must not regress
- how to verify real behavior instead of guessing

## Maintenance Rule

Any meaningful `Midnight Pawn` change should update this README in the same pass.

That includes:

- UI and layout changes
- gameplay rule changes
- tuning changes
- new buttons, drawers, overlays, or flows
- save model changes
- debug or self-test changes
- responsive behavior changes
- new fixes for bugs or regressions

Do not leave this README stale.

## Quick Snapshot

- Genre: merchant sim / shopkeeping management game with negotiation and light arcade progression
- Theme: occult relic broker presented like a dark fantasy RPG merchant interface
- Tech stack: vanilla HTML, CSS, and JavaScript
- Save system: browser `localStorage`
- Main save key: `neverwet-midnight-pawn-save-v1`
- Test save key: `neverwet-midnight-pawn-save-v1-self-test`
- Visual source of truth: `games/midnight-pawn/stitch_mythic_relic_broker/`
- Current visual direction: vintage `Broker's Ledger`, not neon dashboard UI
- In-game manual: `Camp -> Open Guidebook`
- Built-in browser smoke test: `?self-test=1`
- Drawer debug hook: `?panel=upgrades`, `?panel=ledger`, or `?panel=settings`

## Project Rules And User Preferences

These are important because they came from actual iteration and user feedback, not just code structure.

### Product and theme rules

- The game should look like a themed relic broker / merchant RPG interface.
- The game should not drift back into a generic dashboard, admin panel, or bubble-card UI.
- The game should feel like ledgers, trays, appraisal notes, reliquaries, and old shop surfaces.
- The game looks RPG-like, but the mechanics are still merchant sim first.

### UI rules

- Keep the stitched `Broker's Ledger` vintage reference as the main visual target.
- Keep the moving gold nav underline in the top navigation.
- Keep scrollbars visually hidden unless the user explicitly asks for visible scrollbars.
- Keep drawers as real overlays, not layout-participating panels.
- Keep the in-game guidebook as a book-like popup, not just plain help text in settings.
- Keep the guidebook page-flip animation.
- Keep the left rail usable on short screens and around Windows taskbar overlap.

### Responsive rules

- Responsive work is for the whole page, not only the guidebook.
- If a change affects layout, think about desktop, short laptop, tablet, and phone widths.
- The current implementation already has a short-laptop height breakpoint that scales the full UI down. Preserve that intent.

### Workflow rules

- When code changes, update this README in the same pass.
- If a button changes, verify the button behavior, not just syntax.
- If a UI bug is reported, do not stop at a static inspection. Reproduce it if possible.

### Cross-project note

The arcade page at `/games/index.html` keeps one old-style placeholder card for the next game. That rule is documented in `games/README.md`, not here, but do not accidentally replace it with a feature-heavy placeholder unless asked.

## Current Product Identity

### What the game is

Mechanically, `Midnight Pawn` is:

- a merchant sim
- a shopkeeping and inventory management game
- a negotiation game
- a browser arcade game with persistent run progress

Thematically, it is:

- an occult relic brokerage
- a moonlit backroom merchant story
- presented through an RPG-like ledger interface

Important distinction:

- It looks like an RPG merchant screen.
- It does not play like a combat RPG.

### Current feature set

The live build includes:

- one active traveler at a time
- 8 travelers per night
- inspect and haggle flow
- buy and pass flow
- inventory prep actions
- listing and closeout sales
- reliquary vaulting for elite and cursed items
- permanent upgrades
- chronicles / collection tracking
- camp drawer
- in-game guidebook book popup
- animated page flip in the guidebook
- moving gold nav underline
- recap modal between nights
- self-test mode

## Current Visual Direction

### Primary reference folder

The current style intentionally copies from:

- `games/midnight-pawn/stitch_mythic_relic_broker/`

The most relevant reference areas are:

- `the_shop_floor_vintage`
- `appraisal_desk_vintage`
- `the_backroom_vintage`

The stitched folder is reference material only. It is not runtime code.

### Visual language to preserve

- dark low-light atmosphere
- gold, parchment, walnut, mahogany, smoke, and brass tones
- `Newsreader` for major display type
- `Noto Serif` for body copy
- `Space Grotesk` for small labels and technical UI text
- sharp or lightly softened edges
- dense layout instead of overly padded panels
- editorial composition instead of app-card composition
- CSS-first visuals rather than image-heavy runtime assets

### Things that were explicitly fixed and should not regress

- The old dashboard-like layout was rejected.
- The old bubbly rounded UI was rejected.
- Excessive side padding was reduced.
- The drawer overlay used to create giant black layout blocks when opening a panel. That was fixed by making drawers true fixed overlays.
- Scrollbars were deliberately hidden.
- The left rail was adjusted so lower cards are not trapped behind the Windows taskbar on shorter screens.
- The guidebook was compacted so full spreads fit more often without scrolling.

## Current UI Map

This section describes the player-facing layout as it exists now.

### Top shell

The sticky top shell contains:

- brand link back to the arcade
- primary nav
- icon buttons for upgrades, settings, and arcade return

Primary nav items:

- `Exchange`
- `Stash`
- `Chronicles`

Important behavior:

- `Exchange` and `Stash` are anchor links
- `Chronicles` opens the ledger drawer
- the gold nav underline is a moving indicator controlled by JS
- hover and focus move the underline temporarily
- active state snaps back after hover leaves

### Left rail

The left rail is the status column. It includes:

- broker profile
- coin purse
- renown
- current chapter
- spoils
- town rumor
- bound relic boons
- `Close Deal`
- quick buttons for `Guild Talents`, `Codex`, and `Camp`

Important behavior:

- on large screens the rail is sticky
- on short screens it scrolls internally
- the rail scrollbar is hidden

### Session hero

The hero area shows:

- game title
- short pitch copy
- current bounty
- stall occupancy
- inventory count
- reliquary occupancy

### Seller stage

This is the main exchange area. It is rendered entirely by JS and includes:

- active traveler info
- item presentation
- asking price
- diagnostic paper
- action board

The core action buttons here are:

- `Appraise`
- `Gentle Bargain`
- `Hard Bargain`
- `Claim`
- `Decline`

### Stash area

The stash area contains:

- `Active Wares`
- `Broker Inventory`
- `Bound Relics`

`Active Wares` is for listed items.  
`Broker Inventory` is for owned, not-listed items.  
`Bound Relics` is the reliquary.

### Drawers

There are three right-side drawers:

- `Guild Talents`
- `Relic Codex`
- `Camp`

They live in `#panelLayer`.

### Guidebook

The guidebook lives in `#guidebookLayer` and opens from `Camp`.

It is:

- a centered open-book popup
- spread-based
- navigable by tabs and previous/next buttons
- animated with a page-flip effect

### Recap

The recap modal appears after closeout and lives in `#recapLayer`.

It shows:

- profit
- number of sold items
- bounty bonus
- target hit or missed
- carry-over count
- detailed sale results
- `Begin Night N`

## Player Guide

This section is for players and for future AI work that changes game rules.

### Goal

Your job is to buy relics below value, prepare the best ones, list them, and beat the nightly bounty target.

If you hit the target:

- you get bonus cash
- you gain `+1` renown

If you miss the target:

- the run continues
- you simply miss that night's bonus

### The night structure

Each night has exactly `8` travelers.

For each traveler:

1. Read the traveler and item.
2. Appraise if the deal is unclear.
3. Bargain if the ask is close.
4. Claim or decline.
5. Prep, list, or enshrine bought relics.
6. Close the chapter and let listed relics roll for sale.

### Seller phase

Each offer has:

- one item
- one ask price
- `2` patience

Actions:

- `Appraise`: free, reveals condition first, then deeper clues
- `Gentle Bargain`: tries for `10%` off and is safer
- `Hard Bargain`: tries for `20%` off and is riskier
- `Claim`: buys the item at the current price
- `Decline`: skips to the next traveler

If patience reaches `0`, the traveler leaves.

### Reading quality

Each relic is shaped by:

- category
- rarity
- condition
- authenticity
- weird tag

Important ideas:

- hot category items sell more easily
- cold category items sell less easily
- clean and pristine items are stronger than wrecked items
- fake items can mislead you until verified
- elite and cursed items may be worth binding instead of selling

### Inventory phase

Owned relics can be:

- polished
- mended
- verified
- listed
- enshrined

Prep actions:

- `Polish`: costs `$5`, adds `+10%` resale multiplier
- `Mend`: costs `$12`, adds `+25%` resale multiplier
- `Verify`: costs `$8`, reveals real authenticity

### Listing and reliquary

Only listed relics can sell at closeout.

Only `elite` and `cursed` relics can be enshrined.

Enshrined relics do not sell, but they provide passive bonuses.

Current reliquary boons:

- each elite relic adds `+3%` sale chance, `+2%` bargain chance, `+2%` sale price
- each cursed relic adds `+5%` sale chance, `+5%` bargain chance, `+4%` sale price

### Closeout

When the chapter ends:

- listed relics roll for sale
- sold relics pay out cash immediately
- unsold relics stay in inventory
- enshrined relics stay bound
- the bounty is checked

Target formula:

- `60 + (night - 1) * 35`

Bounty reward:

- `25%` of that night's target
- `+1` renown

### Good beginner strategy

Reliable play:

1. Appraise before buying unless the item is clearly cheap.
2. Use `Gentle Bargain` more than `Hard Bargain`.
3. Do not spend all cash early in the night.
4. Favor hot-category items.
5. Fill the stall before closeout.
6. Verify expensive or suspicious relics.
7. Consider binding elite and cursed relics instead of always selling them.

### Common mistakes

- overspending early
- forgetting to list items before closeout
- using `Hard Bargain` too aggressively
- spending prep money on weak junk
- ignoring the rumor board
- selling every elite and cursed relic instead of checking reliquary value

## Current Tuning And Content

These values are important project assumptions.

### Core constants

- `SAVE_VERSION = 1`
- `SELLERS_PER_NIGHT = 8`
- `STARTING_CASH = 120`
- `STARTING_REPUTATION = 0`
- `STARTING_NIGHT = 1`
- `STARTING_SHELF_SLOTS = 4`
- `MAX_SHELF_SLOTS = 8`
- `STARTING_CURIO_SLOTS = 2`
- `MAX_CURIO_SLOTS = 5`
- `TARGET_PROFIT_BASE = 60`
- `TARGET_PROFIT_STEP = 35`
- `BASE_SALE_CHANCE = 0.55`
- `HOT_CATEGORY_SALE_BONUS = 0.15`
- `COLD_CATEGORY_SALE_PENALTY = 0.10`
- sale variance range: `0.92` to `1.15`

### Categories

The six categories are:

- `tech` -> `Devices`
- `media` -> `Archives`
- `tools` -> `Gear`
- `fashion` -> `Garb`
- `house` -> `Curios`
- `occult` -> `Occult`

### Rarity bands

- `junk`
- `solid`
- `vintage`
- `elite`
- `cursed`

### Condition states

- `wrecked`
- `rough`
- `clean`
- `pristine`

### Content scope

- `30` item templates
- `8` seller archetypes
- `4` guidebook spreads
- `8` guidebook pages

### Seller archetypes

- `Honest Peddler`
- `Green Traveler`
- `Desperate Courier`
- `Silver-Tongued Grifter`
- `Collector Squire`
- `Night Forager`
- `Estate Warden`
- `Occult Pilgrim`

### Permanent upgrades

- `Blacklight Lamp`
- `Fast Talk Lessons`
- `Shelf Extension`
- `Repair Cart`
- `Neon Window Sign`
- `Lockbox Room`

### Prep costs

Base costs:

- `wipe` / `Wipe Down`: `5`
- `repair` / `Repair`: `12`
- `authenticate` / `Authenticate`: `8`

With `Repair Cart`:

- `wipe`: `4`
- `repair`: `9`
- `authenticate`: `6`

### Sale math summary

`computeSaleChance(item, market)` uses:

- base sale chance
- hot or cold category modifier
- condition sale modifier
- renown bonus at `0.02` per renown
- `Neon Window Sign` bonus of `0.08`
- reliquary sale chance bonus
- final clamp to `0.20 .. 0.95`

`computeSalePrice(item)` uses:

- current valuation
- prep multiplier
- reliquary sale multiplier
- random variance
- minimum floor of `6`

## File Ownership

The runtime files are:

- `games/midnight-pawn/index.html`
- `games/midnight-pawn/styles.css`
- `games/midnight-pawn/script.js`

Reference-only folder:

- `games/midnight-pawn/stitch_mythic_relic_broker/`

### `index.html`

Owns:

- the static shell
- structural regions
- ids used by the JS render layer
- drawer containers
- guidebook container
- recap container

Important note:

Most visible game content is not hardcoded in HTML. The HTML is mostly scaffolding for the dynamic render layer.

### `styles.css`

Owns:

- the full visual system
- layout
- typography
- overlay behavior
- drawer behavior
- scrollbar hiding
- guidebook appearance
- guidebook page-flip animation
- responsive breakpoints
- short-laptop compression behavior for the full page

Important note:

Several major bug fixes live here:

- fixed overlay drawer behavior
- hidden scrollbars
- taskbar-safe left rail behavior
- guidebook fit and compactness rules

### `script.js`

Owns:

- constants
- content definitions
- game rules
- save normalization
- night generation
- offer generation
- sale math
- render functions
- action routing
- top-nav indicator behavior
- guidebook content and state
- self-test mode
- debug query params

## DOM Map

These ids are important and should stay in sync with JS lookups.

### Structural ids

- `topNav`
- `topNavIndicator`
- `exchangeSection`
- `stashSection`
- `sellerStage`
- `listedItemsList`
- `inventoryList`
- `curioList`
- `panelLayer`
- `guidebookLayer`
- `guidebookBody`
- `guidebookSpread`
- `recapLayer`
- `toast`
- `selfTestReport`

### Main status ids

- `cashDisplay`
- `cashTrend`
- `reputationDisplay`
- `repHint`
- `nightDisplay`
- `queueDisplay`
- `profitDisplay`
- `targetDisplay`
- `targetStatus`
- `hotCategoryDisplay`
- `coldCategoryDisplay`
- `hotMarketChip`
- `coldMarketChip`
- `curioBonusChip`
- `curioPassiveSummary`

### Capacity and counts

- `shelfCapacityLabel`
- `inventoryCountLabel`
- `curioCapacityLabel`

### Drawer content roots

- `upgradesList`
- `ledgerContent`
- `settingsContent`

### Guidebook ids

- `guidebookTabs`
- `guidebookBody`
- `guidebookSpread`
- `guidebookPageLabel`
- `guidebookPrevButton`
- `guidebookNextButton`

### Recap ids

- `recapTitle`
- `recapSubtitle`
- `recapProfit`
- `recapSoldCount`
- `recapBonus`
- `recapTargetBadge`
- `recapUnsoldBadge`
- `recapSalesList`
- `startNextNightButton`

## Runtime Structure

The page is a shell plus a dynamic render layer.

### Main render functions

The most important render functions are:

- `renderHud()`
- `renderSellerStage()`
- `renderRail()`
- `renderUpgrades()`
- `renderLedger()`
- `renderSettings()`
- `renderPanels()`
- `renderGuidebook()`
- `renderRecap()`
- `renderAll()`

`renderAll()` is the main UI refresh entry point.

### Common render bug locations

If the UI looks wrong, the likely places are:

- markup returned by `renderSellerStage()`
- markup returned by `renderItemCard()`
- guidebook markup in `renderGuidebook()`
- structural ids in `index.html`
- layout rules in `styles.css`

## Data Model

### Persistent save shape

`createDefaultSave()` includes:

- `version`
- `cash`
- `reputation`
- `night`
- `inventory`
- `listedItemIds`
- `curioItemIds`
- `upgrades`
- `stats`
- `collection`
- `currentNight`
- `settings`

### `InventoryItem` shape

`normalizeInventoryItem()` keeps these fields:

- `id`
- `templateId`
- `name`
- `category`
- `rarity`
- `condition`
- `authenticity`
- `weirdTag`
- `baseValue`
- `estimatedValue`
- `trueValue`
- `purchasePrice`
- `acquiredNight`
- `sellerArchetypeId`
- `blurb`
- `wipedDown`
- `repaired`
- `isAuthenticated`
- `listed`
- `vaulted`

### `SellerOffer` shape

`normalizeOffer()` keeps these fields:

- `id`
- `sellerName`
- `archetypeId`
- `story`
- `askPrice`
- `currentPrice`
- `patience`
- `status`
- `inspectionCount`
- `revealState`
- `haggleState`
- `itemDraft`

`revealState` contains:

- `conditionKnown`
- `authenticityHintKnown`
- `weirdTagKnown`
- `rareReadKnown`

`haggleState` contains:

- `soft`
- `firm`

### `currentNight` shape

`generateNight()` and `normalizeCurrentNight()` keep these fields:

- `number`
- `status`
- `market`
- `targetProfit`
- `todayProfit`
- `activeIndex`
- `queue`
- `closeoutResults`
- `goalMet`
- `bonusCash`
- `manualClose`

`market` contains:

- `hotCategory`
- `coldCategory`

### Runtime-only UI state

The `runtime` object currently tracks:

- `openPanel`
- `guidebookOpen`
- `guidebookSpreadIndex`
- `guidebookFlipDirection`
- `guidebookFlipTimer`
- `topNavActive`
- `toastTimer`
- `lastMessage`
- `lastOfferId`
- `counterFrame`
- `animatedValues`

## Save, Normalization, And Compatibility

Normalization matters because the page is meant to survive:

- refreshes mid-night
- older save shapes
- partial or malformed browser data

Important functions:

- `normalizeInventoryItem()`
- `normalizeOffer()`
- `normalizeCurrentNight()`
- `normalizeSave()`

If you add fields:

1. add them to `createDefaultSave()`
2. add them to the right normalization function
3. keep old saves readable

Do not change save shape casually.

## Actions And Event Model

The page uses document-level event delegation.

Main router:

- `handleAction(action, trigger)`

Current `data-action` values:

- `open-panel`
- `close-panel`
- `open-guidebook`
- `close-guidebook`
- `guidebook-nav`
- `set-guidebook-spread`
- `inspect-offer`
- `haggle-soft`
- `haggle-firm`
- `buy-offer`
- `pass-offer`
- `close-night`
- `prep-item`
- `list-item`
- `pull-listing`
- `vault-item`
- `unvault-item`
- `buy-upgrade`
- `start-next-night`
- `reset-save`

If a button appears broken, inspect:

- rendered markup
- the `data-action` value
- disabled state
- `handleAction()`
- follow-up state transitions

## Top Navigation Indicator

The moving gold underline is not purely CSS. It is actively positioned by JS.

Main functions:

- `updateTopNavIndicator()`
- `setTopNavActive()`

Important behavior:

- hover and focus temporarily move the underline
- it follows `data-nav-key`
- when the ledger drawer opens, the active nav key becomes `chronicles`
- after anchor navigation, it snaps back to the correct active section state

If the line stops moving, check:

- `#topNav`
- `#topNavIndicator`
- `[data-nav-key]`
- `updateTopNavIndicator()`
- `setTopNavActive()`

## Guidebook System

The guidebook is important because the user explicitly wanted the full how-to-play inside the game.

### Location and entry point

Open path:

- `Camp -> Open Guidebook`

### Current guidebook chapters

- `Primer`
- `Travelers`
- `Inventory`
- `Strategy`

### Current guidebook behavior

- centered modal book
- two-page spread on larger desktop widths
- single-column pages on smaller widths
- tabs for direct spread jump
- previous and next buttons
- page counter label
- close button
- page-flip animation

### Guidebook state and functions

Main functions:

- `renderGuidebookPage()`
- `renderGuidebook()`
- `queueGuidebookFlip()`
- `openGuidebook()`
- `closeGuidebook()`
- `setGuidebookSpread()`
- `shiftGuidebookSpread()`

Main runtime fields:

- `guidebookOpen`
- `guidebookSpreadIndex`
- `guidebookFlipDirection`
- `guidebookFlipTimer`

### Important layout rule

The guidebook shell uses:

- `grid-template-rows: auto auto minmax(0, 1fr) auto`

This is critical. It makes the body the scrollable row and prevents the bottom of long spreads from being clipped.

Do not remove this unless you replace it with equivalent behavior.

### Current fit target

The guidebook was intentionally compacted.

Current target behavior:

- on normal desktop, the longest spread should fit without guidebook-body scrolling
- on short laptop screens such as `1366x768`, the longest spread should still fit in the desktop-style book layout

## Responsive System

The current responsive system matters a lot because the user asked for media-query handling for the whole site.

Current breakpoints in `styles.css`:

- `@media (max-width: 1380px)`
- `@media (min-width: 1101px) and (max-height: 820px)`
- `@media (max-width: 1100px)`
- `@media (max-width: 820px)`
- `@media (max-width: 640px)`

### What each breakpoint does

`max-width: 1380px`

- simplifies some wide layouts
- reduces seller desk density before collapsing all the way down

`min-width: 1101px and max-height: 820px`

- short-laptop desktop breakpoint
- keeps the desktop feel but scales the whole site tighter
- affects top shell, left rail, hero, seller desk, action cards, item cards, drawers, recap, and guidebook
- exists specifically so shorter laptop screens do not feel cropped and oversized

`max-width: 1100px`

- collapses the main layout toward a single-column flow
- turns the guidebook into a single-page vertical stack

`max-width: 820px`

- stacks more major regions
- simplifies top shell alignment
- pushes more content into one-column mobile/tablet behavior

`max-width: 640px`

- tightens spacing and typography further for phone-width screens

### Left rail and taskbar fix

The left rail uses sticky positioning on larger screens and internal scrolling with hidden scrollbar.

Important CSS ideas there:

- `max-height` using viewport math
- extra bottom breathing room
- safe-area-aware padding
- hidden rail scrollbar

This exists because the user reported that lower left-rail content could be hidden by Windows taskbar overlap.

## Overlay And Scrollbar Rules

These fixes should not regress.

### Drawer overlay rule

The drawer layer must behave like a true overlay:

- `panelLayer` is fixed
- drawers are positioned absolutely inside the overlay
- inactive drawers must not take layout space

If you accidentally turn the drawer layer into a normal layout grid again, the old giant black overlay bug can come back.

### Scrollbar rule

Scrollbars are intentionally hidden on:

- page root
- left rail
- drawer panels
- guidebook body
- recap panel

Scrolling still works. Only the visible bars are hidden.

## Debug Hooks

### Global runtime handle

The page exposes:

- `window.__MIDNIGHT_PAWN__`

Useful exposed helpers include:

- `state`
- `renderAll`
- `handleAction`
- `startNextNight`
- `runNightCloseout`
- `buyUpgrade`
- `openGuidebook`
- `closeGuidebook`
- `listItem`
- `pullListing`
- `vaultItem`
- `unvaultItem`
- `applyPrepAction`
- `inspectOffer`
- `haggleOffer`
- `buyActiveOffer`
- `passActiveOffer`

### Query params

- `?self-test=1`
- `?panel=upgrades`
- `?panel=ledger`
- `?panel=settings`

What they do:

- `self-test=1` runs the smoke test using the isolated storage key
- `panel=...` opens a drawer on load for debugging and screenshots

## Self-Test And Verification

### Built-in self-test

Purpose:

- verify real interactions
- catch broken buttons
- make visual tasks safer

Self-test route:

- `games/midnight-pawn/index.html?self-test=1`

The self-test currently checks:

- upgrades drawer open
- ledger drawer open
- settings drawer open
- guidebook open
- guidebook next spread
- guidebook close
- inspect
- gentle bargain
- buy
- prep
- list
- withdraw
- vault
- unvault
- close-night
- start-next-night

Output goes into:

- `#selfTestReport`

Expected status:

- `SELF_TEST:PASS`

### Verification workflow

For most changes, use this baseline:

1. `node --check games/midnight-pawn/script.js`
2. verify important `getElementById(...)` hooks still exist
3. inspect the affected view visually
4. run `?self-test=1` if the change could affect interactions

### Windows and PowerShell notes

On this machine, `rg.exe` may not be usable from the current shell. If search fails, use PowerShell-native search instead:

- `Select-String` for text search
- `Get-Content` for file reads

### Browser-based checks

A reliable local workflow on this machine is:

1. run a local server from the repo root
2. use Edge headless for screenshots or DOM dumps

Typical server command:

- `py -m http.server 4173`

Typical Edge path on this machine:

- `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`

You do not always need this, but it is useful when the user reports a real visual or interaction bug.

## Known Good Behavior

These are current expectations that should remain true unless intentionally changed.

- `Camp` contains an `Open Guidebook` button.
- The guidebook opens as a book popup, not as plain inline text.
- The guidebook supports tabs plus previous and next spread navigation.
- The guidebook animates page turns.
- The gold top-nav underline moves.
- `Chronicles` opens the ledger drawer instead of navigating to a different page.
- The drawer overlay does not create black layout blocks.
- Scrollbars are hidden.
- The left rail remains usable on short desktop windows.
- The game auto-saves.
- The self-test passes.

## Common Change Recipes

### If the user asks for gameplay tuning

Check:

- top-level constants
- prep action definitions
- upgrade definitions
- sale chance and sale price logic
- seller archetypes
- night generation

### If the user asks for visual restyling

Check:

- `styles.css` first
- then render markup in `script.js`
- then `index.html` only if structure truly needs to change

Do not drift back into generic rounded-card UI.

### If the user says a button is broken

Check:

- rendered button markup
- `data-action`
- `handleAction()`
- disabled conditions
- state transitions after click
- self-test

### If the user says a drawer or overlay is broken

Check:

- `.panel-layer`
- `.panel-backdrop`
- `.drawer-panel`
- `.panel-layer.is-open .drawer-panel.is-active`
- `openPanel()`
- `closePanel()`
- `renderPanels()`

### If the user says the guidebook is clipped or too large

Check:

- `.guidebook-book`
- `.guidebook-body`
- `.guidebook-page`
- the `grid-template-rows` rule
- desktop width and height breakpoints

### If the user says the site does not fit on a small laptop

Check:

- the short-laptop breakpoint at `@media (min-width: 1101px) and (max-height: 820px)`
- left rail max-height behavior
- overall top shell and app shell spacing
- guidebook sizing
- action card heights

## Regression Traps

- Do not assume the stitched reference folder is runnable app code.
- Do not edit only `index.html` and expect the whole UI to change.
- Do not rename ids casually.
- Do not rename `data-action` values casually.
- Do not remove the isolated self-test storage key.
- Do not reintroduce visible scrollbars unless asked.
- Do not turn drawers back into layout-participating panels.
- Do not remove the guidebook and replace it with plain settings text.
- Do not forget responsive behavior when changing major UI.
- Do not forget to document the change here.

## What To Read First Before Editing

If you need to move quickly:

1. Read this README all the way through.
2. Read `games/midnight-pawn/index.html`.
3. Read the render functions in `games/midnight-pawn/script.js`.
4. Read the layout and overlay sections in `games/midnight-pawn/styles.css`.
5. Open the stitched vintage reference folder if the task is visual.

## Quick Start For Future AI Agents

If you are another AI and want the shortest useful plan:

1. Trust this README as the current memory source.
2. Treat the game as a merchant sim with a vintage ledger UI.
3. Preserve the in-game guidebook, overlay fixes, hidden scrollbars, and responsive rules.
4. Use `script.js` for logic and rendered content, `styles.css` for most visual work, and `index.html` for shell structure only.
5. Verify buttons with actual interaction checks, not just syntax.
6. Update this README in the same change.

## Final Reminder

This project is already opinionated.

The safest defaults are:

- preserve the merchant-sim loop
- preserve the vintage `Broker's Ledger` presentation
- preserve the guidebook and top-nav polish
- preserve the overlay and scrollbar fixes
- preserve responsive handling for the whole page
- preserve self-test and debug hooks

If you are unsure, prefer preserving the existing feel and documenting the change rather than improvising a new direction.
