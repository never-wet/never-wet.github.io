# Terrain Generator Memory

## Terrain Algorithms Used

- Perlin noise for smooth gradient terrain.
- Simplex noise for lower-artifact procedural variation.
- fBM for layered multi-octave detail.
- Ridged noise for mountain spines and sharp uplifts.
- Terrain presets combine base noise with style-specific shaping:
  - Mountains: ridged noise plus high-frequency fBM.
  - Hills: smooth fBM with soft contrast.
  - Desert: low-amplitude noise plus directional dune waves.
  - Island: radial falloff applied after procedural height generation.
  - Plateau / Canyon: terracing and carved ridged channels.
- Hydraulic erosion uses simplified water, sediment, flow, deposition, and evaporation passes.
- Thermal erosion uses talus-angle slope transfer to soften unstable cliffs.

## UI/UX Rules

- First screen is the working terrain editor, not a landing page.
- Layout is top bar, left control sidebar, main canvas.
- Controls are grouped into Terrain Type, Noise Settings, Erosion, Brush, Materials, Presets, and Export.
- Basic controls are visible first; deeper noise and render controls sit in collapsible sections.
- Sliders are used for numeric values, selects for option sets, toggles for binary features, and icon buttons for commands.
- Keep labels short and clear.
- Avoid clutter and nested cards.
- Preserve a dense, professional tool feel.

## Performance Decisions

- Terrain generation and erosion run in a Web Worker.
- React state stores typed height arrays and swaps complete terrain payloads.
- Terrain rendering is chunked so geometry work is bounded by chunk meshes.
- LOD quality controls mesh stride without recomputing the heightfield.
- Worker requests are debounced during slider movement.
- Rendering caps device pixel ratio for smoother WebGL performance.
- Brush edits copy and update the active heightfield locally, then recompute slopes.

## Parameter Ranges

- Resolution: 65, 129, 257, or 385 samples per side.
- Terrain size: 64 to 220 world units.
- Scale: 0.6 to 8.0.
- Octaves: 1 to 8.
- Persistence: 0.25 to 0.85.
- Lacunarity: 1.5 to 3.4.
- Height multiplier: 4 to 42 world units.
- Erosion strength: 0 to 1.
- Erosion iterations: 1 to 80.
- Brush radius: 1 to 16 world units.
- Brush intensity: 0.02 to 0.6 world units per stroke step.

## Design Principles

- Terrain must stay readable at a glance.
- Height color, slope darkening, water, fog, and shadows should clarify form rather than decorate it.
- Camera interaction should feel smooth and constrained.
- Export must use the actual active heightfield.
- Presets should preserve the complete parameter surface.

## Things To Avoid

- Fake terrain made from static images.
- CSS-only or non-interactive demos.
- Running erosion on every slider movement by default.
- Unbounded geometry resolution.
- Monochrome palettes that hide elevation differences.
- Full-canvas UI controls that fight orbit controls.
- Hidden export actions.
- Decorative copy that slows down tool use.
