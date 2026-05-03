# Car Engine Lab Memory

## Project shape

- New portfolio project folder: `car-engine-lab`.
- Main app entry: `app/page.tsx`.
- Core shell: `components/EngineLab.tsx`.
- Engine content source: `data/engineData.ts`.
- Timeline and kinematics math: `lib/EngineAnimationController.ts`.

## Design intent

- The app should feel like an interactive engine lab, not an article.
- Main layout uses a left engine selector, center visualization canvas, right info panel, and bottom animation controls.
- 2D mode prioritizes clarity with color-coded cycle stages.
- 3D mode prioritizes component movement, orbit controls, cutaway/x-ray/explode views, and clickable parts.
- Comparison mode should make structure, efficiency, and power delivery differences immediately visible.

## Performance choices

- The 3D view is dynamically imported so the 2D mode can load first.
- Models are procedural optimized meshes rather than heavyweight GLB files.
- Device capability detection can keep weak devices in 2D by default.
