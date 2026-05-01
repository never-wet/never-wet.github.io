# Favorite UI / UX Reference

## Global Route Intelligence Map

This is a saved favorite design direction from `global-route-intelligence-map`.
Use it later as a reference for projects that need a serious, useful, polished dashboard experience.

## What I Like About It

- Dark intelligence-dashboard mood.
- Real map as the main visual surface.
- Thin glowing lines attached to real geography.
- Compact panels that support the map instead of covering it.
- Search, filters, route details, key paths, and focus points all feel useful.
- The interface feels operational, clean, and serious.
- It has motion and life through animated route particles, but it is not cluttered.
- It shows global systems clearly: flights, shipping, historical trade paths, and chokepoints.

## Preserve This Feeling

- Keep layouts dense but readable.
- Keep controls compact and purposeful.
- Use dark glassy HUD panels with thin borders.
- Avoid cartoon styling, fake maps, oversized marketing sections, and random decoration.
- Let the real data visualization carry the page.
- Keep labels subtle but visible enough to understand what matters.
- Make search and selection quick: typing, pressing Enter, and clicking should feel immediate.
- Hide or soften anything that blocks the map, including dropdowns, scrollbars, and map controls.

## Reusable UI Pattern

- Top bar: product title, search, mode toggle.
- Left panel: layer toggles, favorites/key items, focus points.
- Right panel: selected item details and strategic importance.
- Bottom bar: compact live ticker/status feed.
- Main canvas: full-screen real-world visual surface.

## Favorite Features

- Real MapLibre map.
- Flat overview by default so all routes can be seen.
- Globe toggle for immersive inspection.
- Route layers:
  - Flight Paths.
  - Shipping Routes.
  - Historical Routes.
  - Chokepoints.
- Clickable route lines and labels.
- Clickable airport, port, and chokepoint markers.
- Search dropdown closes after selecting or pressing Enter.
- Key Paths list includes Silk Road and other historical paths.
- Focus Points list includes major straits and chokepoints.
- Thin styled scrollbars instead of browser-default scrollbars.
- Map controls lifted above the bottom ticker.

## Color Direction

- Background: very dark neutral.
- Flight: cyan/blue.
- Shipping: green.
- Historical paths: amber/gold.
- Chokepoints: pink/red.
- Text: soft white with muted gray secondary text.
- Borders: thin, low-contrast, slightly blue-green.

## Good Future Uses

Use this style for:

- Intelligence dashboards.
- Global monitoring tools.
- Finance or market maps.
- Logistics dashboards.
- Cyber/network operation maps.
- Infrastructure monitoring.
- Historical/geopolitical visualizations.

## Source Project

- Project folder: `global-route-intelligence-map`
- Project memory: `global-route-intelligence-map/memory.md`
- Main app shell: `global-route-intelligence-map/app/page.tsx`
- Map implementation: `global-route-intelligence-map/components/RouteMap.tsx`
- Route data: `global-route-intelligence-map/lib/route-data.ts`
