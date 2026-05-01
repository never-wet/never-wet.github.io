# Sky Atlas Flight Memory

## Project Shape

- Folder: `/games/flight-simulator/`
- Runtime: React + TypeScript + Vite, matching the existing games-folder static workflow.
- Core rendering/data: CesiumJS.
- State: Zustand in `src/store/useFlightStore.ts`.
- Public entry after build: `/games/flight-simulator/index.html`.

## Required Source Files

- `src/FlightScene.tsx`: owns Cesium lifecycle, animation loop, aircraft entity updates, location search wiring, recovery, and sandbox jumps.
- `src/AircraftController.ts`: keyboard input and camera modes.
- `src/MapLoader.ts`: Cesium Viewer setup, imagery, terrain, OSM buildings, address lookup, and sandbox markers.
- `src/BuildingInteraction.ts`: click/proximity picking, highlighting, and metadata panel data.
- `src/SandboxDestruction.ts`: fictional Training Sandbox destructible structures only; never applies destruction to real-world streamed buildings.
- `src/PhysicsEngine.ts`: simplified aerodynamic flight physics, terrain-aware takeoff/landing, stall warnings, and safe collision recovery.
- `src/UIOverlay.tsx`: top search bar, camera toggles, controls guide, building panel, and HUD.

## Safety Notes

- No real-world targeting mechanics.
- No weapon, damage, or destructive systems.
- Real-world OSM buildings are inspection-only and must not become destructible.
- Generic sandbox structures may break apart only in the fictional Training Sandbox.
- Non-sandbox collision is recovery-only: terrain/building contact resets the aircraft to a safe altitude.
- Building interiors are placeholders only; do not invent private indoor layouts.

## Follow-Up Ideas

- Add an optional aircraft GLB model if a locally licensed asset is available.
- Add terrain-aware takeoff/landing scoring in the Training Sandbox only.
- Add Cesium ion geocoding as an optional alternative to Nominatim.
- Add settings for flight assist, sensitivity, and day/night lighting.
