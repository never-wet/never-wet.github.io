# Memory

## Saved Baseline

This is the UI/UX and feature baseline the user liked and wants preserved.
Future changes should keep this feel unless the user explicitly asks to redesign it.

## Product Identity

- Name: Global Route Intelligence Map.
- Purpose: A serious intelligence-dashboard map showing how the world is connected through aviation, shipping, trade, historical routes, and strategic chokepoints.
- Mood: dark, clean, operational, high-signal, not cartoonish, not decorative.
- Primary experience: the real map is the product. Panels support the map; they must not overpower it.

## Core UI

- Full-screen real MapLibre map with dark basemap.
- Default projection is `Flat` so every route and strait can be seen immediately.
- Globe toggle remains available for a curved world view.
- Route overlays are attached to the map surface, not floating in a parallax overlay.
- Top bar contains the brand/title, search field, and map mode toggle.
- Left panel contains route layer toggles, Key Paths, and Focus Points.
- Right panel contains selected route/marker details.
- Bottom ticker shows compact live route/status text.
- Map zoom controls are lifted above the bottom ticker so all buttons are visible.
- Scrollbars are thin, dark, and HUD-styled, not browser-default.

## Preserved Interactions

- Search supports routes, countries, airports, ports, chokepoints, and straits.
- Pressing Enter selects the top search result and closes the dropdown.
- Clicking a search result selects it and closes the dropdown.
- Clicking route lines, route labels, airport markers, port markers, or chokepoint markers opens the right detail panel.
- Layer toggles can show/hide Flight Paths, Shipping Routes, Historical Routes, and Chokepoints.
- Key Paths list provides one-click access to historical/trade paths such as Silk Road.
- Focus Points list provides one-click access to all chokepoints/straits.
- Clear button returns the map to the all-network overview.
- Animated particles move along active routes.

## Visual Rules

- Keep the restrained dark intelligence-map style.
- Use thin glowing route lines with color by layer:
  - Flight Paths: cyan/blue.
  - Shipping Routes: green.
  - Historical Routes: amber dashed lines.
  - Chokepoints: pink markers.
- Keep route labels visible enough to identify paths like Silk Road.
- Chokepoint labels should remain visible and should not disappear due to label collision.
- Do not add decorative blobs, marketing sections, or oversized hero UI.
- Do not let search results, map controls, or scrollbars block the main map experience.
- Panels should be compact, translucent, and readable.

## Current Data Baseline

- Flight paths: 6 records.
- Shipping routes: 11 records.
- Historical/trade paths: 6 records.
- Chokepoints/straits: 17 records.
- Total route records: 23.

## Required Named Historical Paths

- Silk Road.
- Eurasian Land Bridge.
- Trans-Saharan Trade Route.
- Indian Ocean Monsoon Trade.
- Incense Route.
- Tea Horse Road.

## Required Chokepoints And Straits

- Strait of Hormuz.
- Suez Canal.
- Panama Canal.
- Strait of Malacca.
- Bosporus Strait.
- Bab el-Mandeb.
- Strait of Gibraltar.
- Dover Strait.
- Taiwan Strait.
- Lombok Strait.
- Sunda Strait.
- Danish Straits.
- Dardanelles Strait.
- Bering Strait.
- Korea Strait.
- Mozambique Channel.
- Cape of Good Hope.

## Implementation Map

- `app/page.tsx` owns the dashboard shell, top search, layer controls, Key Paths, Focus Points, details panel, stats strip, and ticker.
- `components/RouteMap.tsx` owns MapLibre setup, map-native GeoJSON sources/layers, route labels, marker labels, click handling, projection toggle, overview fitting, and animated route particles.
- `lib/route-data.ts` owns all route and marker records.
- `lib/geo.ts` owns route interpolation and great-circle helpers.
- `store/useRouteMapStore.ts` owns layer visibility, selection, search query, map mode, and ticker state.
- `app/globals.css` owns the HUD styling, panel layout, map control placement, and scrollbar styling.

## Build And Export

- Project is a Next.js static export.
- Run `npm run build` inside `global-route-intelligence-map` to update the exported `index.html` and `_next` assets in the project folder.
- Keep the generated `index.html` present because the user specifically asked for an HTML file.
