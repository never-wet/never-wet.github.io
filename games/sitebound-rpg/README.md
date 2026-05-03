# Sitebound RPG

Sitebound RPG is a full-screen browser RPG set in an explorable pixel-art town. Buildings are solid world objects with playable interiors, NPCs give quests and guidance, and the player progresses by walking, talking, unlocking doors, collecting items, and playing mini-games.

## Controls

- Move with `WASD` or arrow keys.
- Interact with `E`, `Space`, or `Enter`.
- Click the world to pathfind to that tile.
- Click the minimap to draw an A* route.
- `J` opens the Field Guide quest journal.
- `P` opens the Building Directory.
- `M` opens the expanded map.
- `O` opens settings.
- `U` unstucks the player back to the spawn tile.
- `F2` toggles grid, tile-type, and collision debug.
- `Esc` closes dialogue, mini-games, maps, menus, and panels.

## World

The map is authored, not randomly scattered:

- Starter Village with spawn, Lyra, Contact House, Workshop, and a practice yard.
- Tech District with AI Lab, Trading House, and Physics Lab.
- Creative District with Music Studio and Particle Gallery.
- Observatory Ridge with a locked observatory interior.
- Archive Grove with a locked archive room.

Roads connect doors, bridges cross water, cliffs frame the ridge, fences enclose the archive grove, and solid objects avoid doorways and buildings.

Terrain materials are generated from 512x512 source blocks, then packed into the Phaser tileset so grass, dirt, water, bridges, fences, stone, and floors have richer realistic texture without making the collision grid huge.
The tile renderer also auto-tiles each material against its neighbors: paths feather into grass, shorelines blend into water, cliffs get edge shadows, fences draw connected rails, and doors receive foundation aprons that snap to the road network.
The visible terrain is rendered as continuous world-space chunks; the tilemap remains underneath as an invisible collision layer so visual texture details do not repeat every tile.

## NPCs

NPCs are named characters with roles, personalities, fallback dialogue, and optional AI endpoint support:

- Lyra, guide NPC
- Iko, engineer near the AI Lab
- Marlo, merchant at the Trading House
- Rhea, creative district artist
- Warden Sol, observatory guard
- Archivist Nara, archive lore keeper
- Pulse, fun town resident

`AIChatService` can call `NEXT_PUBLIC_SITEBOUND_AI_ENDPOINT` if an external backend exists. No API key is exposed in the frontend. Without an endpoint, scripted fallback dialogue is used.

## Quests

Quest progress is tracked in Zustand and saved to localStorage:

- First Steps In Sitebound
- Meet The Engineer
- Market Signal
- Ridge Clearance
- Archive Shards

Quest objectives include talking to NPCs, visiting buildings, collecting shards, completing mini-games, and unlocking areas.

The Field Guide turns the quest system into a real in-game journal. It shows every quest, objective progress, completion state, and a route button that asks the pathfinder to guide the player to the next target.

## Building Interiors

Buildings do not open hyperlinks. The player walks to the door, presses `E`, fades into a playable room, interacts with props or mini-games, then exits through the room door.

- Workshop: shelves, blueprint bench, and tool wall.
- AI Lab: terminal props and antenna coils.
- Trading House: counter, price board, and market timing challenge.
- Physics Lab: test rig props.
- Music Studio: stage, speaker stack, and rhythm challenge.
- Particle Gallery: animated-feeling mosaic props.
- Observatory: telescope room.
- Contact House: quiet letter room.
- Archive Gate: locked lore room.

The Building Directory tracks visited rooms and locked/unvisited buildings. It also lets the player route to a door without leaving the RPG interface, so website-style navigation stays expressed as movement through the world.

## HUD And Quality Of Life

- Current quest panel with progress, discovered rooms, and route distance.
- Building Directory for portal/interior discovery.
- Field Guide for quest log and objective routing.
- Expanded map with player, NPC, building, quest, and destination markers.
- Clear Route action for canceling path lines.
- Save Now, Unstuck, and Reset Save controls in settings.
- Game-state status strip showing the current interior or overworld location.

## Systems

- `components/GameCanvas.tsx`: mounts Phaser inside the Next/React app.
- `game/scenes/MainWorldScene.ts`: main runtime loop and system orchestration.
- `game/systems/PlayerController.ts`: movement, animation, collision body, and path following.
- `game/systems/TerrainRenderer.ts`: continuous world-space terrain chunks with coordinate-based detail.
- `game/systems/TilemapLoader.ts`: generated 512px source material tiles, neighbor-aware auto-tiling, and Phaser tilemap layer.
- `game/systems/CollisionSystem.ts`: building/object collision plus grid/tile debug overlay.
- `game/systems/NPCSystem.ts`: NPC sprites, schedules, facing, and proximity.
- `game/systems/DialogueSystem.ts`: NPC/object dialogue and choices.
- `game/systems/QuestSystem.ts`: quest definitions, objective progress, and unlocks.
- `game/systems/PortalSystem.ts`: locked and unlocked building entry and exit flow.
- `game/systems/PathfindingSystem.ts`: A* over the tile grid.
- `game/systems/WeatherSystem.ts`: clear, rain, snow, fog, and wind particles.
- `game/systems/DayNightSystem.ts`: morning, afternoon, sunset, and night lighting.
- `game/systems/SoundManager.ts`: synthesized music, SFX, steps, portal sounds, and weather ambience.
- `game/systems/MiniGameManager.ts`: circuit duel, market timing, and rhythm pulse mini-games.
- `game/systems/AIChatService.ts`: optional backend dialogue and fallback NPC lines.
- `game/systems/SaveSystem.ts`: localStorage persistence.
- `store/useWorldStore.ts`: shared RPG state, discovered rooms, path targets, teleport requests, and settings.

## Development

```bash
npm install
npm run dev
```

Publish the static export into this folder:

```bash
npm run publish
```
