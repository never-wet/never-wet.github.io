# Luxury House Scroll Journey

A cinematic real-estate walkthrough for a modern private residence. Scrolling controls a camera path from the entrance gate, through the driveway, into the house, through feature rooms, and into a final booking moment.

## Reference Style

The visual reference is a modern high-end villa: limestone and board-formed concrete masses, warm walnut surfaces, deep black gate steel, reflective glass, long axial driveway, clipped landscape, pool courtyard, and gallery-like interior lighting.

No external GLB model is required for this build. The residence is built as a modular architectural scene so it stays fast on GitHub Pages while still reading as expensive, cinematic, and spatial.

## Core Files

- `src/HouseScene.tsx` - React Three Fiber scene, architecture, lighting, interiors, pool, and post effects.
- `src/CameraPathController.ts` - predefined camera keyframes and smooth camera sampling.
- `src/ScrollTimeline.ts` - scroll-as-timeline controller with eased progress.
- `src/StageTextOverlay.tsx` - minimal stage copy, progress meter, nav, and final CTA.
- `src/Hotspot.tsx` - room feature hotspots with short reveal text.
- `src/PropertyData.ts` - stages, copy, hotspots, and reference direction.
- `memory.md` - design rules for future iterations.

## Commands

```bash
npm install
npm run dev
npm run build
npm run check:visual
```

`npm run build` publishes the static GitHub Pages output into this folder as `index.html` plus `assets/`.
