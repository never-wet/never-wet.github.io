# Sorting Algorithm Visualizer

An interactive educational sorting visualizer built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- Animated bar visualization for Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix, Shell, and Tim Sort.
- Reusable animation steps for compare, swap, overwrite, and mark-sorted events.
- Start, pause, resume, step-forward, reset, randomize, array size, and speed controls.
- Pseudocode highlighting synchronized with animation playback.
- Algorithm explanation, complexity, stability, and best-use-case panels.
- Optional side-by-side comparison mode with matching initial arrays and separate operation stats.

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Static Export

```bash
npm run publish
```

The publish script runs `next build`, copies the static export into this project folder, and removes the temporary `out/` directory so the app can be served from GitHub Pages at `/games/sorting-algorithm-visualizer/`.

## Architecture

- `lib/sortingAlgorithms.ts` owns algorithm metadata and pure step generation.
- `lib/animationSteps.ts` defines the step model and applies steps to an array.
- `store/useSortingStore.ts` owns playback state, requestAnimationFrame timing, comparison mode, and stats.
- Components render the UI from store state without directly running sorting logic.
