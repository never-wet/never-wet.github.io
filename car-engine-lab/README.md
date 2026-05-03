# Car Engine Lab

Interactive engine learning lab for the Never Wet homepage archive.

## What it includes

- Next.js, React, TypeScript, React Three Fiber, Three.js, and Framer Motion.
- Three learning modes: 2D explain, 3D interactive, and comparison.
- Engine coverage: I4, I6, V6, V8, boxer, rotary, diesel, hybrid, EV motor, turbocharged, and supercharged.
- Animated 2D SVG diagrams for piston, valve, spark, airflow, rotary, and EV motor cycles.
- Procedural optimized 3D models with moving pistons, crankshafts, rods, valves, rotors, turbo, supercharger, motor stator/rotor, transparency, x-ray, cutaway, and explode controls.
- Dynamic info panel, component selection, torque graph, timeline scrubber, and speed modes.

## Run

```bash
npm install
npm run dev
```

## Build for GitHub Pages

```bash
npm run build
```

The build exports static files and publishes them into the project folder root, matching the portfolio's existing project pattern.

## Notes

The 3D engine models are procedural mesh assemblies in `components/Engine3DView.tsx` instead of large GLB downloads. The `models/` folder is reserved for future GLB or compressed mesh assets if the lab later receives scan-quality engine models.
