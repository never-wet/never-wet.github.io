# Physics Engine Playground

A polished browser physics laboratory built with Next.js, React, TypeScript, Tailwind CSS, Matter.js, Three.js, React Three Fiber, and Rapier.

The app uses a hybrid layout: DOM panels for controls and a canvas/WebGL viewport for simulation. The motion is produced by real physics engines and force integration, not CSS animation.

## Tech Stack

- Next.js app router
- React + TypeScript
- Tailwind CSS
- Matter.js for 2D rigid bodies, collisions, constraints, springs, drag, and custom forces
- Three.js + React Three Fiber for 3D rendering
- Rapier via `@dimforge/rapier3d-compat` for 3D rigid-body physics
- Zustand for shared simulation state and saved presets
- Fixed timestep simulation loop for Matter.js

## How To Run

```bash
cd physics-engine-playground
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://127.0.0.1:3000`.

## Standalone HTML

There is also a single-file standalone version at `physics-engine-playground.html`. Open it directly in a browser for the HTML build. It uses Matter.js for 2D physics and Three.js plus cannon-es for real 3D rigid-body simulation.

## Experiments

- **Gravity Sandbox**: spawn balls and cubes, tune gravity direction and strength, drag bodies, reset the world.
- **Collision Lab**: compare mass, friction, restitution, velocity vectors, impact flashes, and energy readouts.
- **Pendulum / Spring Lab**: constraint-based pendulum and spring oscillator with damping and stiffness controls.
- **Wind / Aerodynamics**: bodies receive real wind forces, with stream particles showing airflow direction.
- **Orbit / Planet Gravity**: inverse-square attraction between bodies, orbital trails, and initial velocity tuning.
- **Magnet / Force Field**: attract and repel field points apply continuous forces to charged probe bodies.
- **Chain / Ragdoll Lab**: linked rigid bodies connected by constraints and draggable through the Matter mouse constraint.
- **3D Gravity Sandbox**: Rapier rigid bodies with spheres, cubes, capsules, collisions, shadows, trails, and orbit controls.

## Architecture

- `components/PhysicsWorld.tsx`: selects the correct simulation renderer for the active experiment.
- `components/SceneRenderer.tsx`: owns the central simulation viewport and debug overlay shell.
- `components/ExperimentSelector.tsx`: left-side experiment list.
- `components/ControlPanel.tsx`: right-side experiment controls.
- `components/ParameterSliders.tsx`: typed controls that update the live physics settings.
- `components/ObjectSpawner.tsx`: object type selection and spawn control.
- `components/DebugOverlay.tsx`: FPS, body count, timestep, collision count, and energy display.
- `components/PresetManager.tsx`: local saved parameter presets.
- `experiments/matter/MatterWorld2D.tsx`: Matter.js engine, fixed timestep loop, render pass, constraints, and custom forces.
- `experiments/three/ThreeGravityWorld.tsx`: React Three Fiber renderer with a direct Rapier 3D physics world.
- `experiments/presets.ts`: experiment definitions and default settings.
- `physics/usePlaygroundStore.ts`: Zustand state model.
- `physics/types.ts`: shared TypeScript types.
- `physics/constants.ts`: simulation constants.
- `docs/physics-engine-architecture-notes.md`: deeper engine notes.

## How To Add A New Physics Experiment

1. Add a new `ExperimentId` in `physics/types.ts`.
2. Add a preset in `experiments/presets.ts` with defaults for gravity, material properties, and experiment-specific parameters.
3. If it is 2D, extend `resetScene` and `applyExperimentForces` in `experiments/matter/MatterWorld2D.tsx`.
4. If it is 3D, add or extend a React Three Fiber scene under `experiments/three/`.
5. Add experiment-specific sliders in `components/ParameterSliders.tsx`.
6. Verify that debug vectors, trails, reset, pause/play, spawn, and stepping still work.

## Simulation Rules

- Physics state is stored as real bodies, masses, velocities, forces, contacts, and constraints.
- Matter.js runs on a stable fixed timestep.
- Continuous effects such as wind, orbital gravity, and magnetic fields are applied as forces before the physics update.
- Debug visuals are drawn from body state after simulation, not authored as separate fake animation.
- DOM controls mutate simulation parameters through Zustand.
