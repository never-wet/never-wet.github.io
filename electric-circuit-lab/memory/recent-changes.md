# Recent Changes

## Workspace Redesign

- Reworked the builder into a dark multi-pane studio layout.
- Moved the waveform monitor into the main stage area above the board.
- Changed the header into a compact dark app bar.

## Board and Components

- Restyled the board to use a dark grid with brighter active wires.
- Restyled component symbols back to dark bodies with colored outlines.
- Fixed overlapping component text by moving labels into small chips outside the symbol body.

## Simulation Visuals

- Added a scope-style monitor strip with generated traces.
- Added animated particle flow along energized wires.
- Added small orbiting particles around powered components.
- Added a toolbar toggle for atom motion using the existing `highlightCurrent` preference.

## Component Browser

- Added a reusable `ComponentGlyph` renderer.
- Switched the left component browser to circuit symbol buttons by category.
- Updated the top quick-add strip to use symbol icons too.

## Notes For Future Work

- The atom motion is an educational visualization, not literal atomic or electron-level simulation.
- The current circuit icons are custom inline SVG glyphs, not a third-party symbol pack.
- If more realism is desired later, keep the current motion layer optional and lightweight.
