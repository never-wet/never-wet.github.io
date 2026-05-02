# Galaxy Simulator Memory

## Project Shape

- Static React + Vite app inside `games/galaxy-simulator/`.
- Uses React Three Fiber and Three.js for the 3D viewport.
- Uses Zustand in `src/store/useSimulationStore.ts` for live simulation state.
- Build command: `npm run build`.
- Published static output lands in `index.html` and `assets/`.

## Physics Rules

- Unit system: AU, days, kg, solar masses, km.
- Gravity: Newtonian pairwise acceleration with softened distance.
- Integrator: fixed timestep Velocity Verlet.
- Default fixed timestep: 0.25 simulated days.
- Body cap: 140.
- Particle cap: 1400.
- Bodies store mass, radius, density, position, velocity, acceleration, temperature, luminosity, type, gravitational influence, render radius, and trail.
- Collision detection uses scaled collision radii so events are visible in an educational browser simulation.
- Mergers conserve approximate mass and linear momentum.
- Black holes use regular gravity plus capture/tidal disruption behavior.

## UI Rules

- Top HUD owns simulation time, play/pause, step, speed, scenario, camera mode, gravity multiplier, save/load, and reset.
- Left panel owns object creation, event tools, and visualization toggles.
- Right panel owns selected-object scientific data, prediction results, warnings, and mission log.
- Center canvas remains the primary surface.
- The tone should stay scientific, restrained, and dashboard-like.
- Default visual state should feel like a planetarium, not a debug scene.
- Simulation grid, velocity vectors, gravity field, and habitable-zone overlays are optional and should remain off by default unless a future request changes that.

## Visual Rules

- Planet, moon, and asteroid bodies should use UV texture maps instead of plain colored sphere materials.
- Star color follows temperature: red/orange cool stars, yellow sun-like stars, blue-white hot stars.
- Stars, supernova plasma, accretion disks, and nebulae use additive materials and bloom-friendly colors.
- The background should include deep space, nebula clouds, galaxies, dust, and a Milky Way-style band.
- Black holes should show a dark event horizon, photon-ring glow, accretion disk, and orbiting particles when enabled.
- Supernova shells should appear as glowing plasma volumes, not wireframe debug spheres.

## Event Logic

- Supernova requires a selected star.
- Supernova creates ejecta particles, a shockwave shell, outward impulse, and a neutron-star or black-hole remnant.
- Black Hole converts the selected body; if nothing is selected, it spawns an artificial black hole.
- Dust Disk seeds many small bodies around a selected star or black hole.
- Collision and merger logic lives in `src/lib/events/Collision.ts`.

## Prediction Logic

- Prediction clones the current body state.
- Prediction uses the same Velocity Verlet integration path.
- Prediction does not mutate live bodies.
- Forecast states: stable, unstable, collision, escape, decay, black-hole-capture.
- Prediction paths are rendered only when the visualization toggle is enabled.

## Performance Limits

- Keep body count under `physics.maxBodies`.
- Instanced meshes render asteroid/dust bodies when possible.
- Large scenario presets should stay under roughly 100-140 bodies.
- Particle systems are capped and use buffer geometry.
- High time speeds are capped by max substeps per frame.

## Future Improvements

- Web Worker prediction buffer.
- Barnes-Hut far-field approximation for hundreds or thousands of bodies.
- Adaptive timestep around close encounters.
- RK4 or symplectic higher-order integrator option.
- Real ephemeris import for Solar System bodies.
