# Architecture

## Product Shape

Circuit Studio is a single-page React application with section-driven navigation instead of route-heavy page splitting. The same state model powers the home dashboard, lessons, practice views, component library, progress dashboard, and the interactive workspace.

## Core Layers

- `src/memory/`: compact source-of-truth data for app structure, components, lessons, quizzes, UI, persistence, and sample circuits
- `src/state/`: app state provider, local persistence, import/export helpers, and autosave
- `src/builder/`: palette, SVG board, wiring interactions, inspector, and bottom dock
- `src/simulation/`: hybrid phase-1 solver and validation pass
- `src/education/`, `src/quiz/`, `src/library/`, `src/app/`: section-level UI

## Builder Flow

1. Components are defined in `src/memory/componentIndex.ts`.
2. The left palette reads those definitions and lets the user drag a type onto the SVG board or add it at center.
3. `src/state/CircuitLabContext.tsx` creates a component instance with default parameters and inserts it into `currentCircuit`.
4. `src/builder/CircuitBoard.tsx` renders the workspace using SVG groups, terminal circles, and orthogonal wire paths.
5. Users wire the circuit by clicking one terminal to start a draft wire and a second terminal to finish it.
6. Components can be moved, rotated, flipped, deleted, and parameter-edited through shared state actions.

## Wiring Model

- Wires connect terminal endpoints, not free-floating points.
- Every terminal has a stable `componentId + terminalId` identity.
- The simulation engine resolves connected electrical nodes by unioning wire-connected endpoints.
- Because wires stay attached to terminals, moving a component automatically moves every connected wire path.

## Simulation Structure

- Validation runs first to catch duplicate wires, floating parts, missing components, and partial connections.
- The engine builds node groups from connected terminals.
- Sources and conductive edges are extracted from supported component instances.
- Phase-1 path search finds positive-to-return paths and estimates current or voltage behavior for simple educational networks.
- A second digital pass evaluates sensors and logic gates, then drives output indicators or LEDs from high and low node states.

See `docs/SIMULATION_OVERVIEW.md` for the detailed runtime model.

## Persistence

- Local persistence is handled in `src/state/persistence.ts`.
- `pickPersistedState()` strips transient UI-only fields such as draft wires and the current simulation result.
- `src/memory/saveSchema.ts` owns schema versioning and migration into the latest `PersistedCircuitLabState`.
- The app autosaves after edits and also supports manual save, duplicate, reset, JSON export, and JSON import.

## Main Source-of-Truth Files

- `src/memory/appManifest.ts`
- `src/memory/componentIndex.ts`
- `src/memory/simulationManifest.ts`
- `src/memory/lessonIndex.ts`
- `src/memory/quizIndex.ts`
- `src/memory/uiManifest.ts`
- `src/memory/storageKeys.ts`
- `src/memory/defaultState.ts`
- `src/memory/saveSchema.ts`
- `src/memory/types.ts`
- `src/memory/contentRegistry.ts`
- `src/memory/performanceConfig.ts`
