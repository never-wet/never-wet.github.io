# Project Context

## Product

Circuit Studio is a browser-based electric circuit learning and lab app built with React, TypeScript, and Vite.

It combines:

- guided lessons
- interactive visual circuit building
- terminal-based wiring
- phase-1 educational simulation
- quizzes and practice
- sandbox experimentation
- local persistence

## Hosting Model

This project is designed to live in `electric-circuit-lab/` and publish static output directly into that same folder for GitHub Pages style hosting.

## Important Directories

- `src/app/`: top-level app views and shell pieces
- `src/builder/`: circuit workspace, board, palette, inspector, signal monitor
- `src/education/`: lesson UI
- `src/quiz/`: practice and challenge UI
- `src/library/`: component reference UI
- `src/simulation/`: simulation engine and validation
- `src/state/`: app state and persistence
- `src/memory/`: runtime manifests and source-of-truth registries
- `memory/`: assistant handoff context and decisions
- `docs/`: architecture and extension docs

## Key Files

- `src/App.tsx`: app shell and section routing
- `src/app/AppHeader.tsx`: compact studio header
- `src/builder/WorkspaceView.tsx`: main dark studio layout
- `src/builder/CircuitBoard.tsx`: SVG board, pan, zoom, drag, wire interactions, particle motion
- `src/builder/ComponentPalette.tsx`: left examples and symbol browser
- `src/builder/InspectorPanel.tsx`: middle circuit information and inspector column
- `src/builder/SignalMonitor.tsx`: waveform monitor strip
- `src/builder/ComponentGlyph.tsx`: reusable circuit icon renderer
- `src/styles/app.css`: main visual system

## Build Workflow

- `npm install`
- `npm run build`

After build, local-only folders like `node_modules/` and `dist/` may be removed again to keep the repo clean.

## Important Constraint

There is already unrelated work in `ai-lab/`. Do not revert or disturb those changes while working on `electric-circuit-lab/`.
