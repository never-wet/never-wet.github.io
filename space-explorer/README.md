# Space Explorer

A cinematic, educational 3D space website built with Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, and Zustand.

## Run

```bash
npm install
npm run dev
```

For the static GitHub Pages build:

```bash
npm run publish
```

## What Is Included

- Full-screen interactive Solar System scene
- Textured 3D spheres for the Sun, planets, Pluto, Ceres, and major moons
- Earth cloud and night-light layers
- Saturn ring texture
- Asteroid belt and simplified Kuiper belt particle bands
- Famous glowing stars: Sirius, Betelgeuse, Rigel, Vega, Polaris, Proxima Centauri, Alpha Centauri, Antares, Arcturus, and Canopus
- Object search, object list, facts panel, labels, orbit paths, zoom/focus, time controls, and distance measurement
- Real Scale and Compressed View toggle
- Measurement modes for visual exploration, real numeric data, and distance comparison

## Data Sources

- NASA/JPL Horizons API: `https://ssd.jpl.nasa.gov/api/horizons.api`
- NASA/JPL Horizons documentation: `https://ssd-api.jpl.nasa.gov/doc/horizons.html`
- NASA 3D Resources: `https://www.nasa.gov/stem-content/nasa-3d-resources/`
- NASA Pluto 3D resource texture: `https://science.nasa.gov/3d-resources/pluto/`
- NASA API portal: `https://api.nasa.gov/`
- NASA Exoplanet Archive TAP service: `https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html`
- Solar System Scope texture library: `https://www.solarsystemscope.com/textures/`

The local planet textures use 2K Solar System Scope maps based on NASA elevation and imagery data under CC BY 4.0. Pluto uses the NASA/JPL-Caltech map from NASA 3D Resources.

## Scale Modes

Real Solar System scale is too large to inspect comfortably in one browser scene, so the app supports:

- `Real Scale`: uses linear orbital distance scaling and true radius ratios, with tiny bodies kept raycastable.
- `Compressed View`: compresses orbital distances and boosts smaller bodies so the system is explorable.
- `Distance comparison`: lets users click two objects and read the real distance estimate in km, AU, or light-years.

When Compressed View is active, the UI displays: `Distances compressed for viewing.`

## NASA/JPL Integration Plan

`lib/nasaHorizons.ts` contains a service layer for Horizons vector requests:

- `buildHorizonsVectorUrl`
- `fetchHorizonsVectors`
- `parseHorizonsVectorResult`

The current static build uses local orbital elements for fast loading and offline-friendly GitHub Pages hosting. The next integration step is to call Horizons for selected Solar System bodies, cache daily vectors, and replace the local position approximation with returned ephemeris vectors.

The same file also includes `buildExoplanetArchiveTapUrl` for future NASA Exoplanet Archive queries.

## Limitations

- Planetary and moon positions are orbital-element approximations, not live Horizons vectors yet.
- Asteroid belt and Kuiper belt are simplified particle regions, not full small-body catalogs.
- Several major moons use realistic cratered or icy material variants until exact per-moon USGS/NASA global maps are added.
- Famous stars are positioned in a visual comparison gallery; their actual distances are shown numerically in light-years.

## File Map

- `components/SpaceScene.tsx`: full-screen layout, camera rig, object list, and 3D canvas shell
- `components/SolarSystem.tsx`: Sun, planets, moons, belts, and famous stars
- `components/Planet.tsx`: textured sphere rendering, Earth clouds, Venus atmosphere, Saturn rings
- `components/Star.tsx`: glowing Sun and famous-star rendering
- `components/OrbitPath.tsx`: elliptical orbit paths
- `components/MeasurementTool.tsx`: 3D measurement line and distance panel
- `components/ObjectInfoPanel.tsx`: facts, measurements, and size comparisons
- `components/TimeControls.tsx`: play/pause, simulated date, orbit/label/belt toggles
- `components/SearchPanel.tsx`: search, scale toggle, and measurement modes
- `data/solarSystemData.ts`: Solar System facts and orbital values
- `data/famousStarsData.ts`: famous star facts, temperatures, luminosities, and radii
- `lib/nasaHorizons.ts`: NASA/JPL integration hooks
- `lib/measurementUtils.ts`: scale, distance, size, and formatting utilities
- `memory.md`: design and implementation notes
