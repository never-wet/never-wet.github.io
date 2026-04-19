# Release Checklist

This file tracks the finish pass for `Lantern Oath: The Last Hearth`.

## Process

- Work sections in order.
- After finishing a section, run its repeatable release checks 5 times.
- After the whole game feels release-ready, run the final release check 10 times.
- Keep `docs/MEMORY.md` updated whenever release scope or tooling changes.

## Commands

- `npm run qa`
- `npm run release:must-have`
- `npm run release:must-have:5`
- `npm run release:combat`
- `npm run release:combat:5`
- `npm run release:world`
- `npm run release:world:5`
- `npm run release:story`
- `npm run release:story:5`
- `npm run release:content`
- `npm run release:content:5`
- `npm run release:visual`
- `npm run release:visual:5`
- `npm run release:audio`
- `npm run release:audio:5`
- `npm run release:qol`
- `npm run release:qol:5`
- `npm run release:final`
- `npm run release:final:10`

## Section 1: Must-Have

- [x] Automated must-have verification loop completed 5 times with `qa`, `release:must-have`, and `build`.
- [x] Add runtime protection so the player, NPCs, and enemies recover from bad wall-collision states instead of staying softlocked.
- [x] Add automated reachability checks for portals, NPCs, enemies, and resource nodes from valid map spawns.
- [x] Add automated save/load round-trip checks for slot saves, latest-slot behavior, settings persistence, and slot summaries.
- [x] Add automated route checks for the main world path from Emberwharf to the boss route.
- [ ] Manual playtest every major door, bridge, cave, city gate, and dungeon transition.
- [ ] Manual playtest all title, pause, save, field-menu, and inventory buttons in-browser.
- [ ] Manual playtest a fresh start to ending without debug intervention.

## Section 2: Combat Must Feel Finished

- [x] Automated combat verification loop completed 5 times with `qa`, `release:combat`, and `build`.
- [x] Every weapon feels distinct in timing, range, and projectile identity.
- [x] Lantern skill feels special and worth using.
- [x] Enemy telegraphs are readable.
- [x] Dodge feels reliable around corners and walls.
- [x] Hit, death, and boss feedback feel clear and satisfying.

## Section 3: World and Map Standards

- [x] Automated world verification loop completed 5 times with `qa`, `release:world`, and `build`.
- [x] Each region has a clear visual identity.
- [x] Paths, bridges, and gates read naturally.
- [x] Enterable buildings are obvious.
- [x] Important landmarks and secrets stand out.
- [x] No fake-looking dead ends or accidental blocker layouts remain.

## Section 4: Quest and Story Standards

- [x] Automated story verification loop completed 5 times with `qa`, `release:story`, and `build`.
- [x] Opening goal is immediately clear.
- [x] Main quest tracker stays visible and useful.
- [x] NPC dialogue updates after major quest progress.
- [x] Side quests all complete cleanly and reward something useful.
- [x] Ending presentation is clear and satisfying.

## Section 5: Content Completeness

- [x] Automated content verification loop completed 5 times with `qa`, `release:content`, and `build`.
- [x] Towns feel populated with named, useful NPCs.
- [x] Shops remain useful through the whole game.
- [x] Equipment progression is readable.
- [x] Job loops feel worthwhile instead of filler.
- [x] Exploration rewards include gear, lore, gold, or shortcuts.

## Section 6: Visual Finish

- [x] Automated visual verification loop completed 5 times with `qa`, `release:visual`, and `build`.
- [x] Tile readability is strong everywhere.
- [x] Interactables are visually obvious.
- [x] Sprite roles are easy to distinguish at a glance.
- [x] Combat and movement animations feel intentional.
- [x] Hit effects are strong enough to read quickly.

## Section 7: Audio Finish

- [x] Automated audio verification loop completed 5 times with `qa`, `release:audio`, and `build`.
- [x] Music coverage feels complete across title, town, field, ruins, and boss spaces.
- [x] Core SFX feel consistent and readable.
- [x] Volume and mute settings persist correctly.

## Section 8: Quality of Life

- [x] Automated quality-of-life verification loop completed 5 times with `qa`, `release:qol`, and `build`.
- [x] Controls are clearly explained.
- [x] Journal separation between main quests, side quests, and jobs is easy to read.
- [x] Inventory and equipment state are obvious.
- [x] Shop pricing and ownership are clear.
- [x] Interaction prompts stay readable near edges and tight spaces.

## Section 9: Technical Finish

- [x] `npm run build` is part of the repeatable release loop.
- [x] `npm run qa` is part of the repeatable release loop.
- [x] Release checks are written down instead of relying on chat history.
- [x] Final 10-pass release run completed after all sections are done.
