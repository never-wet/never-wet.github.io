# Entity Diagnostic System

A system-driven interactive interface inspired by ranked identity analysis sites. The project behaves as a fixed diagnostic machine instead of a standard webpage: scroll changes machine state, clicks lock identities, hover previews data, and the center 3D core reacts to every transition.

## Tech Stack

- Next.js, React, TypeScript
- Three.js with React Three Fiber and Drei
- GSAP ScrollTrigger for the timeline system
- Zustand for the system state manager

## System Architecture

The app is organized around a state machine defined in `src/lib/stateMachine.ts`.

```text
STATE 0: BOOT
STATE 1: IDENTIFICATION
STATE 2: ANALYSIS
STATE 3: PROFILE
STATE 4: COMPARISON
STATE 5: OUTPUT
```

`src/hooks/useSystemTimeline.ts` initializes the GSAP timeline from `src/animations/timelines.ts`. Scroll progress is written into Zustand, which recalculates the active state index and exposes it to the UI and Three.js scene.

## Identity Logic

Entity profiles live in `src/data/entities.ts`. Each profile owns its rank, classification, trust/value scores, color system, metrics, comparison values, and 3D core geometry. The active profile controls CSS variables through `src/lib/theme.ts`, so the whole interface changes identity color as one system.

## UI Logic

- `DiagnosticSystem.tsx` composes the fixed viewport, state rail, panels, selector, scroll driver, boot overlay, and 3D scene.
- `SystemChrome.tsx` shows global state and live readouts.
- `IdentitySelector.tsx` locks or previews identities.
- `ReadoutPanels.tsx` presents score bars, comparison columns, and output data.
- `DiagnosticScene.tsx` renders the reactive core object, scan plane, rings, particles, and grid floor.

## Transitions

- Scroll drives state progression through fixed visual bands.
- State rail buttons scroll to state bands rather than route to pages.
- Identity switching updates the global color system and pulses the 3D core.
- Hovering an identity previews data and then returns to the locked identity when the pointer leaves.
- Boot progresses through grid, line, buffer, wireframe, and analysis-ready readouts before revealing the live system.

## Extending The System

1. Add a new entity object to `src/data/entities.ts`.
2. Choose a single accent color and secondary highlight.
3. Provide metrics and comparison values as short technical readouts.
4. Assign one of the existing core geometries: `octa`, `dodeca`, `torus`, `tetra`, or `cube`.
5. Keep profile copy short, uppercase, and diagnostic.

## Running Locally

```bash
npm install
npm run dev
```

Open the URL printed by Next, usually `http://127.0.0.1:3000`.

## Static Export

```bash
npm run build
```

The build exports the Next app and publishes the static files into `entity-diagnostic-system/`, so the main homepage can link directly to `./entity-diagnostic-system/`.
