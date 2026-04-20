# Circuit Studio

Circuit Studio is a browser-based electric circuit platform built with React, TypeScript, and Vite. It combines guided lessons, a visual circuit builder, a phase-1 educational simulator, quizzes and troubleshooting challenges, a component library, a sandbox workspace, and local persistence in one app.

## Features

- Learn mode with progressive lessons, goals, steps, and linked sample circuits
- SVG-based builder with drag and drop placement, terminal-to-terminal wiring, zoom, pan, rotate, flip, grid snap, and freeform layout
- Hybrid simulation engine for batteries, voltage sources, resistors, LEDs, lamps, switches, push buttons, grounds, output indicators, diodes, logic gates, and threshold sensors
- Quiz and practice system with multiple choice, prediction, troubleshooting, and build-check challenge types
- Sandbox workflow with blank boards, local save and load, duplication, reset, JSON export, and JSON import
- Component library and progress dashboard backed by compact memory/source-of-truth files

## Run Locally

```bash
npm install
npm run dev
```

## Build Static Output

```bash
npm run build
```

`npm run build` compiles the app, builds Vite output from `dev.html`, and publishes the static `index.html`, `assets/`, and `favicon.svg` into this folder for direct GitHub Pages hosting.

## Main Structure

```text
electric-circuit-lab/
  memory/
  docs/
  public/
  scripts/
  src/
    app/
    builder/
    education/
    library/
    memory/
    quiz/
    simulation/
    state/
    styles/
    utils/
```

## Main Memory Files

- `src/memory/appManifest.ts`: app metadata, sections, and feature flags
- `src/memory/componentIndex.ts`: component definitions, parameters, terminals, validation rules, and phase support
- `src/memory/simulationManifest.ts`: simulation scope, phases, outputs, and warning categories
- `src/memory/lessonIndex.ts`: lesson ordering, difficulty, goals, steps, and linked sample circuits
- `src/memory/quizIndex.ts`: quiz definitions, prompt types, hints, and build requirements
- `src/memory/uiManifest.ts`: workspace modes, tabs, panels, and toolbar action labels
- `src/memory/storageKeys.ts`: browser storage keys
- `src/memory/defaultState.ts`: initial app state and default progress
- `src/memory/saveSchema.ts`: persisted schema versioning and migration
- `src/memory/types.ts`: shared TypeScript interfaces
- `src/memory/contentRegistry.ts`: registries plus sample circuit definitions
- `src/memory/performanceConfig.ts`: board defaults, zoom limits, and autosave timing

## Assistant Memory Folder

- `memory/README.md`: what this folder is for and how to read it
- `memory/project-context.md`: app purpose, key files, workflow, and constraints
- `memory/design-direction.md`: current UI direction and captured user preferences
- `memory/recent-changes.md`: latest implementation notes and handoff context

## Where Key Behavior Lives

- Builder and board rendering: `src/builder/`
- Simulation engine: `src/simulation/engine.ts`
- Practice logic: `src/quiz/PracticeView.tsx`
- Persistence and imports or exports: `src/state/persistence.ts`
- Shared state orchestration: `src/state/CircuitLabContext.tsx`

## Docs

- `docs/ARCHITECTURE.md`
- `docs/ADDING_COMPONENTS.md`
- `docs/SIMULATION_OVERVIEW.md`
