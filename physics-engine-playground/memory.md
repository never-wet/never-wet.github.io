# Memory

## Project Vision

Build an interactive physics engine playground that feels like a modern science museum lab, engineering simulator, and sandbox. The app should invite experimentation with gravity, collisions, friction, restitution, mass, velocity, acceleration, springs, pendulums, constraints, wind, orbital gravity, force fields, chains, ragdolls, and 3D rigid bodies.

## Physics Engine Choices

- Use Matter.js for 2D rigid bodies, collisions, drag interaction, constraints, springs, pendulums, chains, ragdoll-style joints, and custom force experiments.
- Use Three.js and React Three Fiber for 3D rendering.
- Use Rapier through `@react-three/rapier` for 3D gravity, falling rigid bodies, and collision behavior.
- Use custom force application only where the engine needs domain-specific behavior, such as wind, field attraction, and orbital gravity.

## UI Rules

- Use a hybrid layout: canvas/WebGL for simulation, DOM for controls.
- Left side: experiment selector and object spawner.
- Center: large physics canvas or WebGL scene.
- Right side: parameter panel and saved presets.
- Top bar: play, pause, step, reset, save preset, and debug toggles.
- Keep controls clean, direct, and usable.
- Use icons for compact tool actions.
- Avoid a marketing landing page. The first screen is the actual lab.

## Simulation Rules

- Do not fake physics with CSS animation.
- Objects must have actual position, velocity, mass, forces, collision bodies, and constraints.
- Use real engine behavior wherever possible.
- Apply custom effects as real forces.
- Keep debug drawings derived from simulation state.
- Dragging should interact with physics bodies, not teleport decorative elements.

## Experiment List

- Gravity Sandbox
- Collision Lab
- Pendulum / Spring Lab
- Wind / Aerodynamics Lab
- Orbit / Planet Gravity
- Magnet / Force Field Lab
- Chain / Ragdoll Lab
- 3D Gravity Sandbox

## Performance Rules

- Use a stable fixed timestep for Matter.js.
- Limit trails to bounded histories.
- Publish metrics at intervals instead of every frame.
- Cap spawned bodies in 3D.
- Keep canvas drawing simple enough for smooth interaction.
- Avoid layout shifts inside controls.

## Things To Avoid

- Plain static demo pages.
- CSS-only fake physics.
- Full-canvas UI controls.
- Cluttered panels.
- Hidden controls that make experiments hard to understand.
- Unbounded particles, trails, or body counts.
- Large unrelated abstractions.
