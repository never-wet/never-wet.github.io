# Space Explorer Memory

## Product Intent

Create a NASA Eyes-inspired browser experience that feels cinematic and educational, not like a cartoon or toy model. The 3D scene must stay primary. UI panels should support exploration without covering the view more than necessary.

## Visual Rules

- Use textured spheres for planets and moons.
- Use glow shells and additive light for stars.
- Keep the background immersive with starfield and Milky Way imagery.
- Avoid a gray debug grid as the main visual.
- Use dark NASA-style panels with restrained cyan, amber, red, and white accents.
- Always label compressed distance mode clearly.

## Data Rules

- Keep real numeric facts in `data/solarSystemData.ts` and `data/famousStarsData.ts`.
- Keep rendering scale and measurement logic in `lib/measurementUtils.ts`.
- Treat current orbital positions as an approximation until Horizons vectors are wired into runtime or cached builds.
- Use `lib/nasaHorizons.ts` as the integration boundary for JPL Horizons and future Exoplanet Archive work.

## Interaction Rules

- Clicking an object selects it, focuses the camera, and updates the information panel.
- Distance mode turns object clicks into a two-object measurement pair.
- Real Scale and Compressed View must remain available from the top UI.
- Search is the primary object navigation pattern; do not restore a permanent object sidebar.
- Object info is contextual only: compact, dismissible, and hidden in distance mode.
- Distance measurement stays inline: a 3D line, in-space label, and small toast only.
- The bottom bar stays minimal: date, play/pause, and speed.
- The app should never show a left panel, right panel, bottom bar, and measurement panel all at once.

## Deployment Notes

- This project is a static Next export for GitHub Pages.
- Texture paths are relative (`./textures/...`) so the build works from `/space-explorer/`.
- Run `npm run publish` before linking the project from the root homepage.
