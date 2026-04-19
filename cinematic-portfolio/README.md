# Never Wet // Project Atlas

A scroll-driven 3D personal website built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, GSAP, and a lightweight memory-file architecture.

## What it is

This app turns a portfolio into a cinematic world instead of a flat project grid:

- smooth camera travel through a surreal floating environment
- large project chambers for `Lantern Oath`, `Midnight Pawn`, and `Reels Pull`
- hover-reactive 3D objects and click-to-enter fullscreen project scenes
- subtle procedural ambient audio with persistent sound controls
- compact source-of-truth files under `src/memory/`

## Run locally

```bash
npm install
npm run dev
```

`dev.html` is the source entry used by Vite during development.

## Build

```bash
npm run build
```

The production build outputs to `dist/` and also publishes a ready-to-serve static `index.html` plus `assets/` and `media/` into the project root.

## First files to read later

If you or another coding assistant comes back later, start here:

- `memory/START_HERE.md`
- `docs/ARCHITECTURE.md`
- `docs/ADDING_PROJECTS.md`
- `src/memory/siteManifest.ts`
- `src/memory/projectIndex.ts`
- `src/memory/sceneIndex.ts`
- `src/memory/contentRegistry.ts`

## Key folders

- `src/app/`: provider layer and app shell
- `src/components/`: canvas systems and UI overlays
- `src/scenes/`: non-project world scenes and environment layers
- `src/projects/`: project-specific 3D chambers
- `src/animation/`: camera path and scroll rig
- `src/audio/`: procedural audio provider
- `src/memory/`: compact source-of-truth manifests
- `memory/`: ultra-short handoff memory for future sessions
- `docs/`: architecture and extension guides
