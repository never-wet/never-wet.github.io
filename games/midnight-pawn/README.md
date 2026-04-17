# Midnight Pawn

`Midnight Pawn` is a static browser game inside the arcade at `/games/midnight-pawn/`.

This README is written as a full handoff for future AI agents and collaborators. The goal is that someone can read this file first and immediately understand:

- what the game is
- what the current visual direction is
- which files own which behavior
- how state and rendering work
- how to make changes safely
- how to verify changes without guessing

If you are an AI agent working on this project, read this entire file before editing anything.

## Maintenance Rule

Any meaningful change to `Midnight Pawn` should be reflected in this README in the same change.

That includes:

- UI/layout changes
- gameplay rule changes
- tuning changes
- new buttons, drawers, or flows
- save/debug/test changes

Do not leave this README stale after updating the game.

## Player Guide

This section is for someone who wants to actually play `Midnight Pawn`.

### Goal

Your job is to survive each night by buying strange relics cheaply, preparing them well, and selling them for profit.

Each night has a bounty target. If you hit that target before the night closes:

- you get bonus cash
- you gain `+1` reputation
- the next night starts with a bigger target and better long-term momentum

If you miss the target:

- you still continue
- you do not lose the run
- you simply miss the bonus for that night

### What a full night looks like

Every night has exactly `8` travelers.

For each traveler:

1. You inspect the item if you need more information.
2. You can try to haggle the price down.
3. You either buy the relic or pass on it.
4. Bought relics go into your inventory.
5. You can prep them, list them, or vault them.
6. At closeout, listed relics try to sell.
7. Unsold listed relics stay with you for the next night.

### What each part of the screen means

#### Left rail

This is your run status.

- `Coin Purse`: how much cash you have right now
- `Renown`: your reputation, which helps your stall perform better
- `Chapter`: the current night and seller progress
- `Spoils`: tonight's running profit total
- `Town Rumor`: the hot and cold categories for tonight
- `Bound Relic Boons`: passive bonuses from relics in the reliquary

#### Exchange

This is the live negotiation area.

It shows:

- the current traveler
- the item they brought
- the asking price
- the item category and hidden info
- the action buttons for inspect, haggle, buy, or pass

#### Stash

This is your inventory management area.

It is split into:

- `Active Wares`: items already listed for sale
- `Broker Inventory`: items you own but have not listed
- `Bound Relics`: elite and cursed items stored for passive bonuses

#### Chronicles

This opens the codex / ledger drawer.

Use it to check:

- how many item templates you have seen
- seller discovery progress
- rarity sale totals
- collection progress

#### Guild Talents

This opens the upgrade drawer.

Use it to buy permanent upgrades with cash.

#### Camp

This opens settings.

Use it to:

- confirm save behavior
- reset the run if needed

### The seller phase

Each traveler arrives with:

- one item
- one ask price
- `2` patience

You must decide how much information you need before buying.

#### Appraise / Inspect

Inspecting is free.

The first inspect reveals the item condition.

The next inspect reveals deeper info such as authenticity hints and the weird tag.

If you own `Blacklight Lamp`, inspection can reveal stronger omen information for elite, cursed, or fake items.

#### Gentle Bargain

- aims for `10%` off
- safer than the hard bargain
- can only be used once per seller

If it fails, the seller loses `1` patience.

#### Hard Bargain

- aims for `20%` off
- riskier than the gentle bargain
- can only be used once per seller

If it fails, the seller loses `1` patience.

#### Seller patience

Every seller starts with `2` patience.

When patience reaches `0`, the traveler walks away with the item and you lose that opportunity.

#### Claim

This buys the relic for the current asking price and moves it into your inventory.

You cannot claim an item if you do not have enough cash.

#### Decline

This skips the relic and moves on to the next traveler.

Use this when:

- the price is bad
- the item looks weak
- you want to preserve cash for a better offer later in the night

### Reading item quality

Every relic is shaped by several hidden or semi-hidden values:

- category
- rarity
- condition
- authenticity
- weird tag

#### Category

Tonight's rumor board matters a lot.

- hot category items are easier to sell
- cold category items are harder to sell

#### Rarity

Rarity bands are:

- `junk`
- `solid`
- `vintage`
- `elite`
- `cursed`

In general:

- higher rarity can mean much stronger value
- elite and cursed items can also be vaulted in the reliquary
- higher rarity items are often worth inspecting more carefully

#### Condition

Condition affects sale chance and value.

Possible conditions:

- `wrecked`
- `rough`
- `clean`
- `pristine`

Cleaner items usually sell better and for more money.

#### Authenticity

Some relics are genuine. Some are fake.

You only fully know this after `Verify / Authenticate`.

Until then, you are often working from estimated value rather than true value.

### What to do after you buy an item

Bought items go into `Broker Inventory`.

From there, you can take several actions.

#### Polish

- cost: `$5`
- effect: `+10%` resale multiplier
- can only be used once per item

Use it on items you are likely to list soon.

#### Mend

- cost: `$12`
- effect: `+25%` resale multiplier
- can only be used once per item

This is expensive early, so use it on items that already look promising.

#### Verify

- cost: `$8`
- effect: reveals whether the relic is authentic or fake
- can only be used once per item

This is especially useful on higher-rarity items or anything you suspect is suspiciously overpriced.

#### Place on Stall

This moves the item into `Active Wares`, where it can be sold at closeout.

Important:

- only listed items can sell at closeout
- your stall has limited shelf space
- shelf space can be expanded with upgrades

#### Enshrine

Only `elite` and `cursed` relics can be moved into `Bound Relics`.

Vaulted relics do not sell, but they give passive bonuses.

Current reliquary boons:

- elite relic: `+3%` sale chance, `+2%` bargain chance, `+2%` sale price
- cursed relic: `+5%` sale chance, `+5%` bargain chance, `+4%` sale price

Use the reliquary when a relic is more valuable as a permanent bonus than as a one-time sale.

### Closeout and end of night

You can manually end the night with `Close Deal`, or the game will move to closeout after the last traveler is resolved.

At closeout:

- listed relics roll to see whether they sell
- sold relics pay out cash immediately
- unsold relics remain in your inventory
- vaulted relics stay in the reliquary
- if your nightly profit meets the target, you get the bounty bonus

The nightly target formula is:

- `60 + (night - 1) * 35`

The bonus for hitting the target is:

- `25%` of that night's target
- `+1` reputation

### Upgrades

Upgrades are permanent and bought from `Guild Talents`.

#### Blacklight Lamp

- makes inspection more informative
- helps spot strong omens on elite, cursed, and fake items

#### Fast Talk Lessons

- improves haggle success

#### Shelf Extension

- adds stall listing space
- max shelf size is `8`

#### Repair Cart

- reduces prep costs
- current reduced costs become:
  - polish `4`
  - mend `9`
  - verify `6`

#### Neon Window Sign

- improves sale chance

#### Lockbox Room

- adds reliquary space
- max reliquary size is `5`

### Good beginner strategy

If you are learning the game, this is a reliable first approach:

1. Inspect before buying unless the item is obviously cheap.
2. Use `Gentle Bargain` more often than `Hard Bargain`.
3. Avoid spending too much cash too early in the night.
4. Prioritize items in the hot category.
5. Do not overpay for low-condition junk just because it sounds funny.
6. Polish cheap wins, mend strong items, and verify suspicious expensive ones.
7. Keep your stall filled before closeout.
8. Vault elite or cursed relics when their passive bonus is worth more than a short-term cash spike.

### Common mistakes

New players usually lose money by doing one of these:

- buying too many items without enough cash left for better deals later
- forgetting to list items before closeout
- using hard bargain too aggressively and losing the seller
- spending prep costs on weak junk that still will not sell well
- ignoring the hot and cold category board
- selling every elite or cursed item instead of considering the reliquary

### How to tell if you are doing well

You are in good shape when:

- you regularly hit the nightly bounty
- your stall is full at closeout
- your reliquary is generating useful passive bonuses
- you are buying below value instead of at face price
- your reputation is climbing

### Saving and resetting

The game saves automatically in browser `localStorage`.

Normal save key:

- `neverwet-midnight-pawn-save-v1`

To fully restart the run, open `Camp` and use the reset option.

### Short version

If someone asks how to play in one paragraph:

`Midnight Pawn` is about buying weird relics from 8 travelers each night, using inspect and haggles to avoid bad deals, prepping the good items, listing them for closeout, and occasionally vaulting elite or cursed relics for passive bonuses. Hit the nightly bounty target to earn extra cash and reputation, then repeat with stronger upgrades and a better stall.

## 1. Project Identity

### What the game is

Mechanically, `Midnight Pawn` is:

- a merchant sim
- a shopkeeping / inventory management game
- a negotiation sim
- a light arcade progression game with persistent browser save data

Thematically, it is:

- a dark fantasy / occult-flavored relic broker game
- presented like an RPG merchant interface
- currently styled as a vintage `Broker's Ledger`

Important distinction:

- It looks like an RPG merchant game.
- It plays like a pawn / merchant management sim.

Do not accidentally redesign it into:

- a generic dashboard
- a modern SaaS admin panel
- a bright gacha interface
- a full combat RPG

## 2. Current Visual Direction

### Source of truth for the UI style

The current UI direction intentionally copies from the stitched visual reference set in:

- `games/midnight-pawn/stitch_mythic_relic_broker/`

The most important references are the **vintage** `Broker's Ledger` screens, especially:

- `stitch_mythic_relic_broker/the_shop_floor_vintage/`
- `stitch_mythic_relic_broker/appraisal_desk_vintage/`
- `stitch_mythic_relic_broker/the_backroom_vintage/`

The stitched folder is **reference material only**. It is not the runtime app.

### UI principles that should remain true

- Dark, heavy, low-light atmosphere
- `Newsreader` display typography + `Noto Serif` body + `Space Grotesk` labels
- Gold / parchment / mahogany palette
- Sharp or lightly softened corners, not bubbly rounded UI
- Strong editorial layout instead of generic cards
- Drawers and overlays should feel like physical folios / ledgers
- Big serif headlines, small technical labels
- CSS-first visuals, not image-heavy runtime UI

### Things that were explicitly fixed and should not regress

- The old layout felt like a generic dashboard. That is no longer acceptable.
- The drawer overlay used to be broken because inactive drawers still affected layout.
- Visible scrollbars were intentionally hidden.

If you touch overlays, drawers, or page structure, preserve:

- the fixed overlay behavior
- hidden scrollbars
- the `Broker's Ledger` style language

## 3. Game Loop

Each night:

1. A night is generated with exactly `8` sellers.
2. A market gets one hot category and one cold category.
3. The player sees one seller offer at a time.
4. The player can:
   - inspect
   - soft haggle
   - firm haggle
   - buy
   - pass
5. Bought items move into inventory.
6. Inventory items can be:
   - polished
   - repaired
   - authenticated
   - listed
   - vaulted
7. Listed items roll sales at closeout.
8. If the nightly target is met, the player gains bonus cash and reputation.
9. The next night unlocks regardless of success.

## 4. Core Numbers and Progression

These values live in `script.js` and are important project assumptions:

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
- `COLD_CATEGORY_SALE_PENALTY = 0.1`
- sale variance range: `0.92 .. 1.15`

### Categories

The game has 6 categories:

- `tech` -> `Devices`
- `media` -> `Archives`
- `tools` -> `Gear`
- `fashion` -> `Garb`
- `house` -> `Curios`
- `occult` -> `Occult`

### Rarities

The game has 5 rarity bands:

- `junk`
- `solid`
- `vintage`
- `elite`
- `cursed`

### Conditions

The game has 4 condition states:

- `wrecked`
- `rough`
- `clean`
- `pristine`

### Content scope

Current item content is built around:

- `30` item templates
- `6` categories
- `5` rarities
- `8` seller archetypes

### Seller archetypes

The current archetypes are:

- `Honest Peddler`
- `Green Traveler`
- `Desperate Courier`
- `Silver-Tongued Grifter`
- `Collector Squire`
- `Night Forager`
- `Estate Warden`
- `Occult Pilgrim`

### Upgrades

The permanent upgrade set is:

- `Blacklight Lamp`
- `Fast Talk Lessons`
- `Shelf Extension`
- `Repair Cart`
- `Neon Window Sign`
- `Lockbox Room`

### Prep actions

Prep action definitions:

- `wipe` -> cost `5`, resale multiplier `1.1`
- `repair` -> cost `12`, resale multiplier `1.25`
- `authenticate` -> cost `8`

## 5. File Ownership

These are the important runtime files:

- `games/midnight-pawn/index.html`
- `games/midnight-pawn/styles.css`
- `games/midnight-pawn/script.js`

### `index.html`

Owns:

- the static page shell
- the top bar
- the left rail
- the main layout containers
- drawer containers
- recap overlay container
- ids consumed by the render layer

Important note:

- Most of the meaningful gameplay content is **not** hardcoded in the HTML.
- `script.js` renders most dynamic UI into placeholder containers.

### `styles.css`

Owns:

- the complete visual system
- layout
- typography
- drawer behavior
- overlay behavior
- responsive behavior
- hidden scrollbar behavior
- all visual language for the `Broker's Ledger` look

Important note:

- The drawer overlay fix lives here.
- The hidden scrollbar behavior lives here.

### `script.js`

Owns:

- constants and game tuning
- content definitions
- save normalization
- night generation
- offer generation
- economy and sale math
- dynamic rendering
- `data-action` event handling
- self-test mode
- small debug query param behavior

## 6. Runtime Structure

The page is shell + dynamic render.

### Static shell in HTML

The main static regions are:

- top shell
- side rail
- session hero
- seller stage container
- listed items container
- inventory container
- curio container
- drawer layer
- recap layer
- toast

### Dynamic render in JS

These functions matter the most:

- `renderHud()`
- `renderSellerStage()`
- `renderRail()`
- `renderUpgrades()`
- `renderLedger()`
- `renderSettings()`
- `renderPanels()`
- `renderRecap()`
- `renderAll()`

If the UI looks wrong, the bug is often in one of:

- rendered markup in `renderSellerStage()`
- rendered markup in `renderItemCard()`
- ids and shell structure in `index.html`
- layout rules in `styles.css`

## 7. Save Model

### Storage keys

Normal mode uses:

- `localStorage["neverwet-midnight-pawn-save-v1"]`

Self-test mode uses:

- `localStorage["neverwet-midnight-pawn-save-v1-self-test"]`

### Save version

- `SAVE_VERSION = 1`

### `createDefaultSave()`

The base save includes:

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

### Stats tracked

Current stats include:

- `totalBuys`
- `totalSales`
- `totalPasses`
- `totalVaulted`
- `totalSpent`
- `totalRevenue`
- `nightsCompleted`
- `nightsHitTarget`
- `haggleWins`
- `haggleLosses`
- `bonusCashEarned`
- `bestSale`
- `bestSaleName`

### Collection tracked

Current collection fields:

- `templateSeenIds`
- `sellerSeenIds`
- `weirdTagsSeen`
- `soldByRarity`

### Why normalization matters

The save is aggressively normalized so refreshes and old data do not crash the page.

Important normalization functions:

- `normalizeInventoryItem()`
- `normalizeOffer()`
- `normalizeCurrentNight()`
- `normalizeSave()`

If you add fields:

- add them to `createDefaultSave()`
- add them to the correct normalization function
- preserve backward compatibility

## 8. Actions and Event Model

The page uses document-level event delegation.

### Central handler

`handleAction(action, trigger)` is the action router.

### Current `data-action` values

- `open-panel`
- `close-panel`
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

If any button “does nothing”, the first places to inspect are:

- the rendered button markup
- the `data-action` string
- `handleAction()`
- whether the button is disabled

## 9. Debug Hooks and AI-Friendly Hooks

### Global debug object

The page exposes:

- `window.__MIDNIGHT_PAWN__`

This is useful for tests and debugging.

It currently exposes useful methods and state such as:

- `state`
- `renderAll`
- `handleAction`
- `startNextNight`
- `runNightCloseout`
- item / prep / haggle / buy helpers

### Query params

Current query params:

- `?self-test=1`
- `?panel=upgrades`
- `?panel=ledger`
- `?panel=settings`

What they do:

- `self-test=1` runs the browser smoke test on load using an isolated storage key
- `panel=...` opens a drawer on load for debugging and screenshot verification

## 10. Self-Test Mode

### Purpose

This exists so an AI agent can verify real interactions without relying only on static screenshots.

### URL

Open:

- `games/midnight-pawn/index.html?self-test=1`

### What it verifies

It validates:

- drawer open / close
- inspect button
- soft haggle
- buy flow
- prep flow
- list flow
- withdraw flow
- vault flow
- unvault flow
- close-night flow
- next-night flow

### Output

The test writes a hidden report into:

- `#selfTestReport`

The report contains:

- `SELF_TEST:PASS`
- or `SELF_TEST:FAIL`

### Important implementation note

The self-test currently uses timeout-based waiting because animation-frame-only waiting was unreliable in some headless browser DOM dump runs.

Do not casually remove this unless you re-verify headless reliability.

## 11. Verification Workflow

When making changes, the safest baseline verification is:

1. `node --check games/midnight-pawn/script.js`
2. verify all `getElementById(...)` hooks still exist in `index.html`
3. render a headless screenshot
4. if overlays changed, render with `?panel=ledger` or another panel
5. run `?self-test=1`

### Example checks used in practice

- syntax check:
  - `node --check games/midnight-pawn/script.js`
- DOM hook check:
  - compare `getElementById("...")` ids in JS against ids in HTML
- screenshot:
  - render with Edge headless and inspect the output image
- self-test:
  - render DOM with `?self-test=1` and inspect `#selfTestReport`

### If the user mentions broken buttons

Do not stop after a syntax check.

At minimum:

- run the self-test
- inspect a screenshot
- reproduce the exact panel or state if possible

## 12. Known Project Rules / Invariants

These are important assumptions the current implementation relies on:

- The project is vanilla HTML/CSS/JS. There is no framework.
- Most visible content is rendered by `script.js`.
- `index.html` ids and `script.js` element lookups must stay in sync.
- Buttons use `data-action`, not direct inline handlers.
- The drawer layer must behave like a true overlay, not a layout grid.
- Scrollbars are intentionally hidden.
- The stitched reference folder is visual reference only.
- The current visual source of truth is the **vintage** ledger direction, not the cyber-neon direction.

## 13. Common Change Recipes

### If the user asks for gameplay tuning

Check:

- top-level constants in `script.js`
- sale chance and sale price helpers
- prep action definitions
- upgrade definitions
- seller archetype defs

### If the user asks for UI restyling

Check:

- `styles.css` first
- then dynamic markup in `renderSellerStage()` and `renderItemCard()`
- then static shell in `index.html` if layout needs structural changes

Do not revert back to generic rounded-card UI.

### If the user says a button is broken

Check:

- rendered HTML for the button
- `data-action`
- `handleAction()`
- disabled conditions
- self-test mode

### If the user says a drawer or overlay is broken

Check:

- `.panel-layer`
- `.panel-backdrop`
- `.drawer-panel`
- `.panel-layer.is-open .drawer-panel.is-active`
- `openPanel()`
- `closePanel()`
- `renderPanels()`

### If the user says the page still looks old after a change

Likely causes:

- browser cache
- CSS not reloaded
- screenshot taken from old build state

Ask them to hard refresh if needed, but verify locally first.

## 14. Common Pitfalls

- Do not assume the stitched reference folder is executable app code.
- Do not edit only `index.html` and expect the UI to change; most content comes from JS render functions.
- Do not rename ids casually.
- Do not rename `data-action` values casually.
- Do not break the isolated self-test storage key.
- Do not reintroduce visible scrollbars unless the user explicitly asks for them.
- Do not revert the drawer overlay to grid-based layout.
- Do not “modernize” the visual design into flat dashboard cards.

## 15. Design Intent in Plain Language

If you are another AI and need a quick visual read:

- This should feel like a relic broker’s desk in a dark shop.
- The UI should read like ledgers, folios, trays, and appraisal notes.
- Typography should feel editorial and antique, not app-like.
- The page should feel rich and moody even without bespoke assets.
- Strong CSS styling is preferred over adding unnecessary runtime images.

## 16. What to Read First Before Editing

If you need to get productive quickly:

1. Read this README completely.
2. Read `index.html`.
3. Read the render functions in `script.js`.
4. Read the drawer / overlay / layout parts of `styles.css`.
5. Open the stitched vintage reference screenshots if the task is visual.

## 17. Recommended Workflow for Future AI Agents

Before editing:

- inspect current HTML shell
- inspect render functions
- inspect relevant CSS section

Before finishing:

- run syntax check
- run DOM hook check
- run or inspect self-test
- render at least one screenshot for visual tasks

If the request is specifically UI-related:

- verify both desktop and a narrow/mobile width

## 18. Final Reminder

This project is already opinionated now.

Future work should usually:

- preserve the merchant-sim mechanics
- preserve the vintage ledger look
- preserve the overlay and scrollbar fixes
- preserve the AI-friendly debug and self-test hooks

If you are unsure whether a change matches the project, the safest default is:

- keep the `Broker's Ledger` presentation
- keep the current game loop
- verify with the built-in self-test
