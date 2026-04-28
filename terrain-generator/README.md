# Terrain Generator

Terrain Generator is a production-focused procedural terrain editor built with Next.js, React, TypeScript, Three.js, React Three Fiber, Zustand, GLSL shaders, and Web Workers.

## Overview

The app generates editable 3D heightfield terrain in real time. Users can choose terrain styles, tune procedural noise parameters, apply erosion, brush-edit the result, preview material and water options, save presets, and export heightmaps, meshes, or parameter JSON.

## How It Works

- UI controls write terrain parameters into a Zustand store.
- A Web Worker performs noise generation and optional erosion away from the main thread.
- The renderer builds chunked Three.js terrain meshes from the returned heightfield.
- A custom GLSL material colors terrain by height and slope with directional shading.
- Export utilities convert the active terrain into PNG, OBJ, GLTF, or JSON.

## Tech Stack

- React + Next.js + TypeScript
- Three.js + React Three Fiber + Drei orbit controls
- Zustand for state and presets
- GLSL shader material for height/slope terrain rendering
- Web Workers for heightfield generation and erosion

## Usage

```bash
cd terrain-generator
npm install
npm run dev
```

Open the local URL printed by Next.js. For static GitHub Pages output:

```bash
npm run build
```

The exported site is written to `terrain-generator/out/`. The root `terrain-generator/index.html` redirects to that exported app.

## Parameters

- `Terrain Type`: mountains, hills, desert, island, or plateau/canyon shaping.
- `Noise Algorithm`: Perlin, Simplex, fBM, or ridged noise.
- `Scale`: controls the size of terrain features.
- `Octaves`: stacks detail layers.
- `Persistence`: controls how quickly octave amplitude fades.
- `Lacunarity`: controls frequency growth between octaves.
- `Seed`: deterministic terrain seed.
- `Height Multiplier`: final vertical scale.
- `Resolution`: heightfield density.
- `Erosion Strength`: how strongly erosion modifies the terrain.
- `Erosion Iterations`: number of erosion passes.

## Export

- `PNG Heightmap`: downloads a grayscale heightmap.
- `OBJ Mesh`: downloads a triangulated terrain mesh.
- `GLTF Mesh`: downloads a GLTF scene containing the terrain mesh.
- `JSON Parameters`: downloads the current generator settings and metadata.

## Notes

Normal parameter edits regenerate terrain live. Erosion is applied explicitly because it is heavier and intentionally iterative. Brush editing runs on the current heightfield and updates the visible mesh directly.
