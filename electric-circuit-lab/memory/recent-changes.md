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
- Made the live scope traces move continuously.
- Scaled the scope panels down to give the board more working room.
- Added animated particle flow along energized wires.
- Added small orbiting particles around powered components.
- Added a toolbar toggle for atom motion using the existing `highlightCurrent` preference.

## Simulation Depth

- Added branch summaries so the inspector can report multi-branch current paths instead of only one total current number.
- Added DC steady-state approximations for capacitors and inductors.
- Added a simplified transistor-as-switch model driven by base threshold relative to emitter.
- Improved simulator notes so advanced parts explain when they are using an educational approximation.

## Component Browser

- Added a reusable `ComponentGlyph` renderer.
- Switched the left component browser to circuit symbol buttons by category.
- Kept the actual circuit symbols on the board clean and lightweight.
- Left the top quick-add strip text-based so icons only live in the side browser.

## Builder Workflow

- Added bounded undo/redo history for circuit edits.
- Grouped component dragging into a single undo step instead of one step per pointer move.
- Added `Undo` and `Redo` buttons plus `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, and `Ctrl/Cmd+Y` shortcuts.
- Added `Ctrl/Cmd+A` select-all, `Ctrl/Cmd+D` duplicate selection, arrow-key nudging, and `Esc` cancel or clear behavior.

## Learning and Practice

- Expanded the lesson path with capacitor/inductor, transistor, and troubleshooting lessons.
- Added checkpoints, common mistakes, and linked challenge follow-ups to lessons.
- Expanded the quiz set with capacitor, transistor, short-circuit, and parallel-branch challenges.
- Added live build-check progress in the Practice view so requirements update before submitting.

## Save and Workflow Polish

- Added global status banners for save, load, import, rename, undo, redo, and reset actions.
- Added rename and delete flows for saved circuits in the Progress dashboard.
- Added more starter-board access from the dashboard and updated the studio header actions.

## Notes For Future Work

- The atom motion is an educational visualization, not literal atomic or electron-level simulation.
- The current circuit icons are custom inline SVG glyphs, not a third-party symbol pack.
- If more realism is desired later, keep the current motion layer optional and lightweight.
