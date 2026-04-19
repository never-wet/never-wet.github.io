# Content Guide

## Add a New Town or Map

1. Add a new map object in `src/data/maps/maps.ts`.
2. Give it:
   `id`, `name`, `regionId`, `theme`, `layout`, `legend`, `portals`, `spawnPoints`, `npcPlacements`, `enemyPlacements`, `resourceNodes`, and `musicTrack`.
3. Add its ID to:
   `src/memory/mapIndex.ts`
4. If it belongs to a brand-new region, add that region to:
   `src/memory/worldIndex.ts`
5. Link nearby maps through portal definitions on both sides.

## Add a New NPC

1. Add the NPC to `src/data/characters/characters.ts`.
2. Place the NPC on a map in `src/data/maps/maps.ts`.
3. If the NPC needs custom dialogue, add a profile to:
   `src/data/dialogue/dialogues.ts`
4. If the NPC is important, include them in:
   `src/memory/characterIndex.ts`

Fallback behavior:

- NPCs without a dialogue profile still work.
- The engine falls back to their `bio` text when spoken to.

## Add a New Job or Profession

1. Add the job definition to `src/data/jobs/jobs.ts`.
2. Point `mentorId` at a character definition.
3. Define the repeatable `objective` clearly:
   defeat, collect, visit, talk, or deliver.
4. If the job uses deliveries, set `requiredItemId` on the objective.
5. Add the job summary to:
   `src/memory/jobIndex.ts`
6. Add job access in the mentor's dialogue profile via the `openJob` action.

## Add a New Quest

1. Add the quest to `src/data/quests/quests.ts`.
2. Define objectives using the supported event kinds:
   `talk`, `defeat`, `collect`, `deliver`, `visit`
3. If it is a delivery quest, add `requiredItemId` to the objective.
4. Add the quest ID to:
   `src/memory/questIndex.ts`
5. Hook it into the relevant NPC dialogue using:
   `startQuest` and `completeQuest` actions
6. If the quest should gate regions or content, award a flag in `rewards.unlockFlags`.

## Dialogue Structure

Dialogue lives in `src/data/dialogue/dialogues.ts`.

Each profile contains:

- `npcId`
- one or more `variants`

Each variant contains:

- optional `conditions`
- `entryPageId`
- `pages`

Pages support:

- multiple text lines
- next-page flow
- button choices
- page actions

Useful actions:

- `startQuest`
- `completeQuest`
- `grantItem`
- `openShop`
- `openJob`
- `rest`
- `setFlag`

## Add a New Item, Weapon, or Enemy

Items:

1. Add the item to `src/data/items/items.ts`.
2. Give it a category, description, icon, and optional stat bonuses or healing effect.
3. If the item should appear in shops, add it to one of the shop inventories in the same file.

Weapons:

1. Add the weapon definition to `src/data/combat/weapons.ts`.
2. Set the `itemId` to match an equipment item.
3. Tune damage, range, cooldown, stamina cost, and projectile style.

Enemies:

1. Add the enemy definition to `src/data/combat/weapons.ts` in the enemy list.
2. Choose a behavior:
   `melee`, `ranged`, `charger`, `skirmisher`, or `boss`
3. Place the enemy on maps in `src/data/maps/maps.ts`.

## Generated Sprite and Tile Assets

Sprites and icons are generated in `src/lib/assets/pixelFactory.ts`.

To add a new visual:

1. Add a new sprite or icon branch in the pixel factory.
2. Reference it from the appropriate data file using the new `spriteId` or `iconId`.
3. Add the ID to `src/memory/assetManifest.ts` if it is part of the project's tracked art inventory.

Tiles are painted directly in `src/engine/Renderer.ts` by tile kind. To add a tile look:

1. Add a new tile character to a map legend.
2. Add a matching tile kind branch in the renderer's `drawTile` method.

## Files to Read First for Fast Orientation

When coming back later, read these in order:

1. `src/memory/gameManifest.ts`
2. `src/memory/worldIndex.ts`
3. `src/memory/mapIndex.ts`
4. `src/memory/questIndex.ts`
5. `src/memory/jobIndex.ts`
6. `src/memory/contentRegistry.ts`
7. `src/data/maps/maps.ts`
8. `src/data/dialogue/dialogues.ts`
