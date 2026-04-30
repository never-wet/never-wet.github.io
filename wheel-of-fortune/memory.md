# Wheel of Fortune Memory

## Project Shape

- Framework: Next.js app router with React and TypeScript.
- Rendering: Canvas wheel in `components/Wheel.tsx`.
- Spin math: `lib/spinLogic.ts`.
- Static publishing: `scripts/publish-static.mjs` mirrors the pattern used by other exported Next projects in this repo.

## Spin Contract

1. Select a random segment index first.
2. Calculate the final rotation that places that segment under the fixed top pointer.
3. Animate toward that exact rotation with angular velocity and friction.
4. Clamp only at the end to avoid floating-point drift.

## Performance Note

Live rotation stays inside `Wheel.tsx` refs and redraws the canvas directly during `requestAnimationFrame`. Do not pipe per-frame rotation into React state; React should update on spin start and spin completion only.

## Homepage Wiring

The main homepage and project hub read from `igloo-home/projects.js`. Keep the Wheel of Fortune entry in that list so both pages surface the app automatically.
