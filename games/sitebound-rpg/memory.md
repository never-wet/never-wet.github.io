# Sitebound RPG Memory

## Pixel Style Rules

- Use 32x32 tile logic for movement/collision, but generate terrain from 512x512 source material blocks.
- Terrain should read more realistic and textured than flat placeholder pixels: grass blades, dirt grain, stone cracks, water waves, bridge planks, and fence wood grain.
- Render terrain with neighbor-aware auto-tiling so roads, shorelines, cliffs, fences, plazas, and floors blend at edges and corners.
- Visible terrain should be rendered as continuous world-space chunks; do not stamp identical visible grass/road materials on every 32px tile.
- Keep the game performant by packing the 512 source materials into the Phaser tileset instead of making the physics grid 512px.
- Avoid placeholder blocks; all tiles should represent grass, path, plaza, road stone, water, bridge, forest, sand, ridge, cliff, fence, or floor.
- Buildings must look like readable indie RPG landmarks with roofs, doors, windows, and night-friendly lighting.
- Characters use readable pixel silhouettes with hair, coat, trim, and skin palettes.

## World Layout Rules

- The world is authored and intentional, not random.
- Roads must connect building doors.
- Bridges must cross water where roads pass.
- Trees, rocks, fences, cliffs, and buildings must not overlap doorways.
- Houses sit on plaza/road/floor-adjacent ground and face paths.
- Every exterior building needs a foundation apron and a snapped path/road connector from its door to the main route.
- NPCs stand near their roles: guide in village, engineer by AI Lab, merchant by Trading House, artist in Creative District, guard at ridge, archivist by Archive Grove.

## NPC Rules

- NPCs have names, roles, personalities, and fallback dialogue.
- NPCs face the player when nearby.
- Scheduled NPCs walk short believable loops.
- Dialogue supports choices and can start mini-games.
- `AIChatService` may call an external backend endpoint, but never exposes an API key in the frontend.

## Quest Rules

- Quests include talk, visit, collect, unlock, and mini-game objectives.
- Quest target tiles feed minimap markers and A* route requests.
- The Field Guide must expose all quest states, objective meters, completion status, and route-to-objective actions.
- Route feedback should include the current target and approximate distance, plus a clear route action.
- Completing Ridge Clearance unlocks the Observatory.
- Completing Archive Shards unlocks the Archive Gate.
- Progress saves to localStorage.

## Portal Rules

- Buildings are in-world objects with doors.
- Entering a building fades the camera into a playable interior room.
- No building should use hyperlink-style panels or instant redirects.
- Only doors and interior exit tiles are interactive entry/exit points; the rest of the building stays solid.
- Locked portals explain their unlock condition through dialogue.
- Portals should feel like gameplay routes, not navbar links.
- The Building Directory should show locked, unvisited, and visited interiors without using external hyperlinks.
- Entering interiors should mark discovery progress so building visits feel meaningful.

## Collision Rules

- Buildings, trees, rocks, fences, cliffs, water, interior props, and NPC bodies block player movement.
- Use Phaser tile collision for map layers and static arcade bodies for buildings/solid objects.
- Keep `F2` debug off by default, but able to show grid alignment, tile boundaries, tile type labels, tile collisions, object hitboxes, and the player body.

## HUD And Recovery Rules

- HUD tools should feel like game UI, not a website menu.
- `J` opens the Field Guide, `P` opens the Building Directory, `M` opens the expanded map, and `O` opens settings.
- `U` is the player recovery shortcut and should move the character back to a valid spawn tile.
- Settings must keep practical recovery controls: save now, unstuck, reset save, mute, music volume, and SFX volume.
- Expanded map and minimap should share marker logic for player, NPCs, buildings, quest target, and destination target.
- Escape should close open HUD panels before leaving the player in control.

## Day, Weather, Sound, Mini-Game Rules

- Day/night cycles smoothly through morning, afternoon, sunset, and night.
- Weather cycles through clear, rain, snow, fog, and wind with particles and ambience.
- Sound is generated safely in browser after user gesture: music, steps, UI, interact, portal, and weather ambience.
- Mini-games are optional support systems, not the whole RPG: circuit duel, market timing, and rhythm pulse.

## Performance Constraints

- Use Phaser tilemap rendering instead of thousands of DOM nodes.
- Keep HUD in React and world simulation in Phaser.
- Pathfinding uses A* on the tile grid and avoids solid tiles/building/object blockers.
- Save periodically, but keep localStorage writes throttled.
