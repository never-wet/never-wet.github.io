# Galaxy Simulator

Galaxy Simulator is a NASA-inspired browser astrophysics sandbox built with React, Three.js, React Three Fiber, Zustand, and a physically-inspired N-body engine.

It is designed for interactive educational visualization: users can load scenario presets, create celestial bodies, inspect scientific data, trigger cosmic events, and view predictive future trajectories without modifying the live simulation.

Important: This simulator uses simplified astrophysics for interactive educational visualization. It is not intended for real mission planning.

## Physics Model

- Positions are modeled in astronomical units (AU).
- Velocities are modeled in AU/day and displayed as km/s.
- Mass is stored in kg and solar masses.
- Radii are stored in km, with separate render radii for usable visualization.
- Gravity uses Newtonian pairwise force accumulation: `F = G * m1 * m2 / r^2`.
- The gravitational constant uses AU, solar mass, and day units.
- Bodies track position, velocity, acceleration, density, temperature, luminosity, type, and gravitational influence.
- Black holes use Newtonian mass plus capture/tidal disruption behavior.

## Numerical Integrator

The live simulation uses a fixed timestep Velocity Verlet integrator:

1. compute acceleration at current positions
2. advance positions using velocity and acceleration
3. recompute acceleration at the new positions
4. advance velocity using the average acceleration

This is more stable for orbital motion than Euler integration and keeps x1, x10, x100, and x1000 time controls usable. Very high speeds are capped by a maximum substep count per frame so the browser stays responsive.

## Prediction System

When an object is selected, `PredictionEngine` clones the current body state and runs a separate forward simulation buffer. It samples the selected object's future position and renders a dotted prediction path.

Predictions can report:

- stable orbit detected
- orbit unstable
- collision predicted
- object will escape system
- orbit decay warning
- black hole capture likely

Prediction never mutates the live simulation.

## Cosmic Events

- Supernova: selected massive star collapses into a neutron star or black hole, creates ejecta particles, expands a shockwave shell, and imparts impulse to nearby bodies.
- Black Hole: selected object collapses into a black hole, with accretion particles and capture behavior.
- Collision / Merger: colliding bodies merge with approximate mass and momentum conservation, plus debris particles.
- Planetary Formation: the dust disk tool seeds low-mass bodies that can clump through the same collision path.
- Galaxy Collision: a preset sends two simplified star clusters through one another to form tidal-tail-like structures.

## Visual Model

- The default view is space-first: simulation grid, velocity vectors, gravity field, and habitable-zone overlays are optional toggles.
- Planets and moons use generated UV canvas textures for Earth-like, Mars-like, gas giant, icy, rocky, moon, and asteroid surfaces.
- Stars use temperature-based color, emissive materials, soft halos, point lights, and bloom post-processing.
- The background includes a generated deep-space sphere, starfield, Milky Way band, nebula clouds, distant galaxy sprites, dust particles, and asteroid belt particles.
- Black holes render with a dark event horizon, photon-ring glow, rotating accretion disk texture, and orbiting accretion particles.
- Supernova shells render as glowing plasma volumes with colorful particles instead of debug wireframes.

## Scenario Presets

- Solar System
- Binary Star System
- Black Hole Capture
- Supernova Event
- Galaxy Collision
- Custom Sandbox

Scenarios live in `src/lib/scenarios/`. Add a preset by creating bodies with `createCelestialBody`, returning a `ScenarioPreset`, and registering it in `SCENARIO_OPTIONS` plus `createScenario`.

## Controls

```bash
npm install
npm run dev
```

Build and publish static files into this folder:

```bash
npm run build
```

Open the published app at `/games/galaxy-simulator/`.

## Limitations

This is not a professional astrodynamics solver. It omits relativistic effects, real ephemerides, non-spherical gravity, radiation pressure, high-order perturbations, adaptive RK integrators, and validated mission-grade error bounds. Rendering radii and collision radii are scaled for interactive visualization, so contact timing is educational rather than physically exact.
