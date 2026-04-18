# Hollowmere Content Guide

## Add a new chapter

1. Add the chapter metadata in `src/memory/gameManifest.ts`.
2. Register its scene IDs and quest IDs in `src/memory/storyIndex.ts`.
3. Create the actual scenes in `src/data/story/scenes.ts`.
4. Add or unlock any new locations in `src/data/locations/locations.ts`.

## Add a new scene

1. Create a `SceneDefinition` in `src/data/story/scenes.ts`.
2. Give it a unique `id`, `locationId`, `startNodeId`, and `nodes`.
3. Use `completionEffects` to award items, unlock quests, change chapters, or start another scene.
4. Hook it into a location action or another scene effect.

## Add a new NPC or companion

1. Add the character to `src/data/characters/characters.ts`.
2. Register the ID in `src/memory/characterIndex.ts` when relevant.
3. Add a generated portrait definition in `src/memory/assetManifest.ts`.
4. Reference the character from locations, scenes, or journal entries.

## Add a new enemy or boss

1. Add the enemy to `src/data/enemies/enemies.ts`.
2. Register it in `src/memory/characterIndex.ts`.
3. Give it a portrait asset ID in `src/memory/assetManifest.ts`.
4. Add it to an `EncounterDefinition` in `src/data/story/encounters.ts`.

## Add a new quest

1. Add a `QuestDefinition` to `src/data/quests/quests.ts`.
2. Register its grouping and dependency hints in `src/memory/questIndex.ts`.
3. Trigger it through a scene or location action with a `startQuest` effect.
4. Advance it through explicit `advanceQuest` effects or automatic item/location progress.

## Add a new location

1. Add a `LocationDefinition` to `src/data/locations/locations.ts`.
2. Add its lightweight metadata to `src/memory/locationIndex.ts`.
3. Create any actions in `src/data/locations/actions.ts`.
4. Add a background asset in `src/memory/assetManifest.ts`.
5. Map its music/ambience in `src/data/audio/audioRoutes.ts`.

## Add a new item

1. Create the item in `src/data/items/items.ts`.
2. Add its compact manifest entry in `src/memory/itemIndex.ts`.
3. Reuse an icon asset or add a new generated icon in `src/memory/assetManifest.ts`.
4. Grant it through quest rewards, shops, scenes, or encounters.

## Add or swap audio

### Procedural placeholders

Add or edit sound definitions in `src/memory/audioManifest.ts`.

### Routing

Update `src/data/audio/audioRoutes.ts` so pages or locations point to the right music and ambience keys.

## Asset pipeline

All built-in art is generated from the metadata in `src/memory/assetManifest.ts`.

- Portraits: generated from palette + variant
- Backgrounds: generated landscape cards
- Icons: generated SVG UI symbols
- Logo: generated title lockup

The helper at `src/lib/assets/generatedArt.ts` converts those definitions into SVG data URIs. If you later replace generated art with file assets, keep the manifest IDs stable so the rest of the app does not need rewiring.
