# Physics Engine Architecture Notes

## Layout

The playground uses a hybrid architecture:

- DOM controls handle experiment selection, sliders, toggles, saved presets, and top-bar actions.
- Canvas/WebGL renders simulation worlds only.
- Zustand provides a single shared state surface for UI controls and physics renderers.

This keeps the simulator accessible and maintainable while allowing the physics viewport to stay fast.

## Matter.js 2D Loop

`experiments/matter/MatterWorld2D.tsx` owns a Matter engine and runs it with a fixed timestep of `1000 / 60` milliseconds. Each animation frame accumulates elapsed time and advances the engine in stable increments.

Per tick:

1. Runtime parameters are applied to gravity, materials, and constraints.
2. Experiment-specific forces are applied.
3. `Matter.Engine.update` advances real rigid-body state.
4. Trails are sampled from body positions.
5. The canvas render pass draws bodies, constraints, vectors, force arrows, collision flashes, and center-of-mass markers.

The renderer does not animate bodies independently. It reads from Matter body state.

## Matter.js Experiments

- Gravity and collisions rely on Matter gravity, body mass, friction, restitution, and wall colliders.
- Pendulum and spring motion use Matter constraints with stiffness, damping, and length.
- Wind applies continuous force to dynamic bodies and includes a small drag term.
- Orbit mode applies inverse-square attraction between bodies before each engine step.
- Magnet mode applies attract or repel force from field points based on body charge.
- Chain and ragdoll mode uses linked constraints between rigid bodies.

## Rapier 3D Scene

`experiments/three/ThreeGravityWorld.tsx` renders a 3D lab with React Three Fiber and owns a direct Rapier world through `@dimforge/rapier3d-compat`.

The scene includes:

- Dynamic cubes, spheres, and capsules.
- A fixed floor collider.
- Gravity controlled from the shared parameter panel.
- Real collision events.
- Orbit camera controls.
- Shadows, contact shadows, trails, and velocity vectors.

## State Boundaries

`physics/usePlaygroundStore.ts` stores:

- Active experiment.
- Physics material parameters.
- Force parameters.
- Debug toggles.
- Reset, spawn, and step signals.
- Metrics.
- Saved presets.

Physics engines own their internal body instances. The store owns user intent and shared parameters.

## Adding Engines Or Experiments

New experiments should be added through presets first. A preset gives the UI enough information to select defaults and explain the mode. Then add engine-specific setup and force logic. Keep each new mode grounded in actual body state, constraints, or force integration.
