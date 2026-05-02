### Never Wet RPG Homepage

`test5.html` is a playable homepage prototype for `never-wet.github.io`. Instead of a normal link menu, the site is a compact 3D RPG-style hub where each building is a portal to another page.

### Concept

The homepage behaves like a polished navigation world:

- The player starts in a central plaza.
- Buildings are spaced around the hub with clear paths.
- Each building has a distinct silhouette, color, label, and spatial overlay.
- Approaching or targeting a building highlights it and reveals a glass-style Enter panel.
- Entering a building triggers a camera push, fade, and seamless iframe portal.

### Added Systems

- GTA-style circular minimap with player arrow, roads, building markers, route line, and north-up/rotating mode.
- Lightweight character customization for outfit color, hair color/style, accessory, and avatar type.
- Character preferences are saved with `localStorage`.
- Smooth day/night cycle with morning, afternoon, sunset, and night lighting.
- Building glow and stars intensify at night.
- Central AI guide NPC with idle motion, speech bubble, and scripted fallback chat responses.
- Premium spatial UI overlays near buildings with destination details and Enter/Guide actions.

### Controls

- `WASD` or arrow keys: move around the plaza.
- Click the ground: walk to a point.
- Click a building: walk to its entrance, then enter if close.
- Click a minimap marker: set a route.
- Drag: rotate the camera.
- Mouse wheel: adjust camera distance.
- `E`: enter the nearby or targeted building.
- `Back` or `Escape`: return from a portal to the plaza.

### Building Links

- Portfolio Building: `./project-hub.html`
- AI Lab: `./ai-lab/`
- Stock Terminal: `./games/stock-trading-sim/`
- Music Studio: `./loop-daw/`
- Galaxy Lab: `./games/galaxy-simulator/`
- Contact Office: `./#contact`

### Architecture

The working GitHub Pages build is the standalone `test5.html` file. It uses the repo-local Three.js module, GSAP for cinematic transitions when available, DOM-projected spatial UI, and no build step.

The source structure mirrors the requested Next.js/React architecture:

- `components/WorldScene.tsx`: React Three Fiber scene shell.
- `components/PlayerController.tsx`: movement, camera follow, click-to-route hooks, and proximity logic.
- `components/BuildingPortal.tsx`: building navigation wrapper.
- `components/SpatialOverlay.tsx`: camera-facing building UI panels.
- `components/Minimap.tsx`: circular minimap and route marker layer.
- `components/CharacterCustomizer.tsx`: lightweight avatar preferences and localStorage persistence.
- `components/DayNightCycle.tsx`: time-of-day lighting, sky, and stars.
- `components/AINPCGuide.tsx`: central concierge NPC.
- `components/WorldHUD.tsx`: minimal HUD, tools, minimap, time controls, and NPC chat.
- `store/useWorldStore.ts`: Zustand world state.
- `lib/worldData.ts`: buildings, world constants, character options, and time helpers.
- `lib/navigationRoutes.ts`: destination routes.
- `lib/npcResponses.ts`: scripted fallback guide responses.
- `memory.md`: design rules and constraints for future iterations.

### Performance Notes

The scene stays lightweight by using low-poly primitive geometry, capped device pixel ratio, simple lighting, restrained shadows, canvas minimap drawing, DOM-projected panels, and lazy iframe destination loading.
