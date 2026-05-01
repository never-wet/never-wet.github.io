# Sky Atlas Flight

Sky Atlas Flight is a browser-based 3D flight exploration prototype built for the `games` folder. It uses CesiumJS with React and TypeScript to stream real map imagery, optional Cesium World Terrain, and optional OpenStreetMap 3D buildings through Cesium ion.

## Map Data Source

- Street/neighborhood imagery: OpenStreetMap raster tiles.
- Terrain elevation: Cesium World Terrain when `VITE_CESIUM_ION_TOKEN` is configured.
- 3D buildings: Cesium OSM Buildings when `VITE_CESIUM_ION_TOKEN` is configured.
- Address search: OpenStreetMap Nominatim lookup for user-entered locations.
- Cesium static assets/workers: jsDelivr by default, because the Cesium release download host does not send browser CORS headers for all files.

Create `.env.local` from `.env.example` and add a free Cesium ion token:

```bash
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
```

Without a token, the simulator still opens with street imagery and flight controls, but real terrain elevation and OSM 3D building streams are limited.

## Controls

- `W / S`: increase or decrease throttle
- `A / D`: roll
- `Arrow Up / Down`: pitch up or down
- `Q / E`: rudder yaw
- `Mouse drag`: camera look/orbit
- `Mouse wheel`: camera distance
- `Space`: air brake
- `C`: cycle camera mode
- `R`: recovery reset

Camera modes:

- Third-person chase
- Cockpit
- Free chase camera
- Cinematic chase camera

## Safety Model

There are no weapons, real-world target selection, or harmful location mechanics. Real streamed OSM buildings are not destructible; they remain inspection-only. Terrain/building contact triggers an "impact detected" recovery state that stops the event, shows a recovery cue, and moves the aircraft back into a safe flight envelope.

The Training Sandbox button moves the flight to a fictional offshore training area. That area includes generated generic block buildings, hangars, towers, crates, and walls that can safely break apart into placeholder fragments and smoke puffs. These objects do not represent real homes, schools, landmarks, or civilian buildings.

## Physics Model

The flight model is intentionally lightweight:

- Throttle-driven acceleration and deceleration
- Lift, drag, gravity, and airbrake effects
- Pitch, roll, rudder yaw, and banking turns
- Stall warnings at low speed or high angle of attack
- Airspeed, altitude MSL, altitude AGL, heading, and vertical speed telemetry
- Terrain sampling for low-altitude flight, takeoff, landing, and safe recovery

This is not full Microsoft Flight Simulator fidelity. It is an exploratory browser prototype focused on smooth navigation, map streaming, building interaction, and safe recovery behavior.

## Development

```bash
npm install
npm run dev
npm run build
```

The build command publishes Vite's generated `dev.html` to `index.html` and copies built assets into `assets/` so `/games/flight-simulator/` can be served as a static page.
