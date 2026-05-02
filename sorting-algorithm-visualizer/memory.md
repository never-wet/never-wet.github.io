# Sorting Algorithm Visualizer Memory

## Project Shape

- Standalone Next.js app inside `sorting-algorithm-visualizer/`.
- Uses static export with `output: "export"` and a `scripts/publish-static.mjs` copier, matching other Next projects in this repo.
- Homepage registration lives in `../igloo-home/projects.js` and the homepage featured list lives in `../shared/never-wet-homepage.js`.

## Implementation Notes

- Sorting functions never touch React or DOM state. They return `AnimationStep[]`.
- Supported step types: `compare`, `swap`, `overwrite`, and `markSorted`.
- Optional step fields carry `pivotIndex`, `activeRange`, and `pseudocodeLine` so the renderer can show pivots, active subarrays, and highlighted pseudocode.
- `store/useSortingStore.ts` is a small custom external store using `useSyncExternalStore`; no Zustand dependency is required.
- Playback uses `requestAnimationFrame` and maps speed to a step delay, with small batching at high speeds for arrays up to 200 elements.

## UX Notes

- Array size and algorithm controls lock during sorting or pause to keep generated steps aligned with the visual array.
- Speed remains live while sorting.
- Reset is always available.
- Step forward can initialize a paused run from idle state, then advance one animation step at a time.
