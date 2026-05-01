# Memory

## System Architecture

- `app/page.tsx` is the globe-first dashboard shell with layered overlay drawers.
- `components/GlobePanel.tsx` owns the MapLibre GL globe projection, satellite/reference tile layers, clustered GeoJSON event markers, progressive labels, and click selection.
- `components/FiltersPanel.tsx`, `NewsFeed.tsx`, `AIInsights.tsx`, and `SignalPanel.tsx` provide collapsible monitoring surfaces.
- `store/useIntelStore.ts` is the Zustand state store for filters, selected event, events, news, AI insights, live signals, logs, and connection status.
- `lib/api.ts` is the polling API service.
- `lib/ai.ts` classifies, summarizes, scores risk, detects clusters, and generates insights.
- `lib/geo.ts` resolves article text and coordinates into dashboard regions.

## Data Sources

- Guardian Content API for live news.
- USGS all-week earthquake GeoJSON for dense recent seismic infrastructure risk points.
- NASA EONET for open hazard events, including multiple recent geometry observations per event.
- National Weather Service active GeoJSON alerts, sampled into representative coverage points for US weather hazard density.
- Binance public market endpoint for market signals.
- Carbon Intensity API for energy signal monitoring.
- Esri World Imagery raster tiles for satellite-style land and water detail.
- Esri World Boundaries and Places reference tiles for country borders, place labels, lakes, and rivers.
- Esri World Transportation reference tiles for roads and deep city-level detail.
- CARTO Dark Matter/OpenStreetMap raster tiles as the high-zoom detail fallback over sparse imagery tiles.
- GDELT DOC and GDACS GeoRSS were researched but are not active in the static client because their public endpoints reject direct browser CORS requests.

## UI Rules

- Globe-first layout: top status bar, full-screen tiled WebGL globe, left filter drawer, right intelligence drawer, bottom signal drawer.
- No document-level vertical scrolling; drawers may scroll internally.
- Use dark neutral surfaces, compact typography, thin borders, and restrained category accents.
- The 3D globe is the primary visual surface and must not be compressed by permanent panels.
- The globe must use map-detail zoom: global view shows the whole Earth, medium zoom shows borders and country labels, close zoom shows states/regions plus lakes/rivers, and deep zoom shows cities, roads, coastlines, and satellite terrain.
- Do not simulate zoom by moving a camera toward a fixed low-resolution texture. Zoom must request higher-detail tiles, keep low-res tiles visible while replacements load, and fade between levels.
- Event markers must stay attached to geographic coordinates and break from clusters into individual points as zoom increases.
- Keep an unclustered micro-dot layer under clusters so the globe reads as a dense live monitor, while cluster circles remain clickable.
- Bottom logs are collapsed by default and horizontally scrollable when expanded.
- Avoid decorative clutter, bright gradients, and oversized marketing sections.

## AI Logic

- Classify events using keyword scoring across six categories.
- Score severity from source-specific signals and risk language.
- Convert severity into low, medium, high, or critical risk.
- Generate confidence from source reliability and recency.
- Group by region/category to detect trends and produce AI insight summaries.

## Performance Rules

- Poll every 18 seconds with no full reload.
- Store only normalized, deduped event objects.
- Filter visible events with memoized selectors in the page.
- Cap initial feed sizes and render clustered event markers.
- Keep MapLibre rendering isolated inside `GlobePanel`.
- Use MapLibre tile caching, visible-area tile loading, and GeoJSON clustering; do not load high-resolution tiles for the entire world.
- Keep event volume capped after normalization and dedupe; hundreds of points are fine, thousands should be avoided unless server-side tiling is added.
- Keep panel lists scrollable and capped so the dashboard stays smooth.
