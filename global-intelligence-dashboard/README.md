# Global Intelligence Dashboard

Real-time situational awareness dashboard inspired by worldmonitor.app. It is built with Next.js, React, TypeScript, MapLibre GL, Zustand, and client-side polling so the exported GitHub Pages version still receives live data.

## Data Sources

- Guardian Content API: global news headlines and article metadata using the public `api-key=test` endpoint.
- USGS all-week earthquake GeoJSON: dense recent seismic activity for a richer global signal field.
- NASA EONET: open natural event monitoring for wildfires, severe storms, volcanoes, and other hazards.
- National Weather Service active alerts: GeoJSON weather alert polygons sampled into representative markers for US hazard density.
- Binance public market endpoint: crypto market prices and 24h movement signals.
- UK Carbon Intensity API: energy grid carbon intensity telemetry.
- Esri World Imagery raster tiles for satellite-style Earth detail.
- Esri World Boundaries and Places reference tiles for country borders, region labels, lakes, rivers, and city names.
- Esri World Transportation reference tiles for road and transportation detail at deeper zoom levels.
- CARTO Dark Matter/OpenStreetMap raster tiles as a high-zoom fallback so city roads and labels remain visible where satellite tiles are sparse.

GDELT DOC and GDACS GeoRSS were researched for additional global density, but they are not enabled in the static browser client because the public endpoints reject direct browser CORS requests. They can be added later through a server-side proxy or deployed API route.

If one feed fails or rate-limits, the dashboard keeps the remaining sources live and marks the top status as degraded/offline only when the ingest cycle cannot produce usable events.

## Update System

The browser polls the API service every 18 seconds. Updates are merged into the Zustand store. The globe renders through MapLibre WebGL with both clustered and unclustered GeoJSON event sources, so hotspots remain readable while hundreds of micro-dots stay visible.

The globe uses a tile-based LOD system, not a fixed planet texture. As zoom increases, MapLibre requests higher-detail raster tiles for the visible area only, keeps lower-detail tiles visible until replacements arrive, caches recent tile levels, and fades tile changes smoothly. Country labels appear at medium zoom, city and water labels at closer zoom, and roads/urban detail at deep zoom.

The event layer intentionally keeps a faint unclustered micro-dot pass under the cluster layer. This creates the denser "monitor wall" view while preserving clickable clusters and selected-event details.

## UI Model

- The tiled 3D globe is the primary surface.
- Filters live in a left drawer, hidden by default.
- News, AI insights, and event details share a right drawer with tabs.
- Signals and logs live in a collapsed bottom drawer.
- Page-level vertical scrolling is disabled; drawers own their own scrolling.

## AI Logic

The AI layer is a local heuristic model designed for a static public site without exposing private API keys. It:

- classifies incoming text into geopolitics, economy, conflict, infrastructure, energy, or technology;
- scores risk from severity, source confidence, recency, and risk keywords;
- detects region/category clusters;
- generates trend direction, confidence level, and insight summaries.

## Run Locally

```bash
npm install
npm run dev
```

Open the printed local URL.

## Build Static HTML

```bash
npm run build
```

The build exports the Next app and copies the generated `index.html` plus static assets into `global-intelligence-dashboard/` for GitHub Pages.
