# Hollowmere Overworld Content Guide

## Main source-of-truth files

Start with these files before reading larger content modules:

- `src/memory/gameManifest.ts`
- `src/memory/mapIndex.ts`
- `src/memory/eventIndex.ts`
- `src/memory/characterIndex.ts`
- `src/memory/questIndex.ts`
- `src/memory/itemIndex.ts`
- `src/memory/battleIndex.ts`
- `src/memory/audioManifest.ts`
- `src/memory/assetManifest.ts`
- `src/memory/defaultState.ts`
- `src/memory/saveSchema.ts`
- `src/memory/contentRegistry.ts`

## Add a new map

1. Add the lightweight summary to `src/memory/mapIndex.ts`.
2. Add the `LocationDefinition` to `src/data/locations/locations.ts`.
3. Add the actual `OverworldMapDefinition` to `src/data/locations/overworldMaps.ts`.
4. Add travel targets/doors/warps through `interactions`.
5. Add the location to `src/data/audio/audioRoutes.ts`.
6. If the map is story gated, add `unlockConditions` on the location or conditions on the interactions.

## Add a new NPC

1. Add the character to `src/data/characters/characters.ts`.
2. Register the id in `src/memory/characterIndex.ts` if needed.
3. Add or reuse a portrait entry in `src/memory/assetManifest.ts`.
4. Place the NPC on a map by adding an `npc` interaction in `src/data/locations/overworldMaps.ts`.
5. Link the NPC to a scene, action, or message.

## Add a new quest

1. Add the quest to `src/data/quests/quests.ts`.
2. Register grouping/dependencies in `src/memory/questIndex.ts`.
3. Start it with a `startQuest` effect from a scene or map action.
4. Advance it with `advanceQuest`, battle victory effects, item rewards, or location discovery.
5. If it is a field event, record the high-level hook in `src/memory/eventIndex.ts`.

## Add a new battle or enemy

1. Add enemies to `src/data/enemies/enemies.ts`.
2. Register enemy ids in `src/memory/characterIndex.ts`.
3. Add the encounter to `src/data/story/encounters.ts`.
4. Add an overview entry to `src/memory/battleIndex.ts`.
5. Trigger it from a map action, a scene effect, or wild encounter pool.

## Add a new field item pickup

1. Add the item to `src/data/items/items.ts` if it does not already exist.
2. Add a `LocationAction` in `src/data/locations/actions.ts`.
3. Use `effects` on the action to add the item and set a flag.
4. Gate repeat pickup with a `not flag` condition.
5. Place the action on a map through an `action` interaction.

## Add a new dialogue scene

1. Add the scene to `src/data/story/scenes.ts`.
2. Register the chapter relationship in `src/memory/storyIndex.ts`.
3. Trigger it from:
   - a `LocationAction.sceneId`
   - a scene `completionEffects` entry
   - a battle victory effect

## Add audio or music

1. Add the sound definition to `src/memory/audioManifest.ts`.
2. Route the music/ambience to a location in `src/data/audio/audioRoutes.ts`.
3. Trigger one-shot SFX from gameplay UI or reducers through `audioManager`.

## Visual pipeline

Generated art still comes from `src/memory/assetManifest.ts` and `src/lib/assets/generatedArt.ts`.

Canvas gameplay visuals are layered separately:

- map tiles are drawn by `src/engine/render/mapRenderer.ts`
- field sprites and markers are drawn by `src/engine/render/spriteRenderer.ts`

If you add a new environment type, update:

- `src/memory/types.ts`
- `src/memory/mapIndex.ts`
- `src/data/locations/overworldMaps.ts`
- `src/engine/render/mapRenderer.ts`
