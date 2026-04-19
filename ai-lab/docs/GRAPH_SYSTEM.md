# Graph System

## Core implementation

The graph is implemented in `src/graph/ForceGraphPanel.tsx` using:

- Three.js
- `react-force-graph-3d`
- `three-spritetext`

The app relies on the library for:

- force-directed layout
- orbit controls
- zoom and pan
- node dragging
- camera movement
- 3D link rendering

This avoids hand-building unstable physics or interaction layers.

## Data model

The graph reads from:

- `workspace.nodes`
- `workspace.links`

Each graph node is a `GraphNodeRecord` from `src/memory/types.ts`.

Important fields:

- `id`
- `title`
- `category`
- `cluster`
- `group`
- `entityKind`
- `entityId`
- `x`, `y`, `z`

The `entityKind` and `entityId` pair let the graph node map back to real content such as notes, datasets, experiments, or models.

## Category visuals

Category colors, glow, size, and cluster placement live in `src/memory/graphIndex.ts`.

That file is the source of truth for:

- node colors
- category labels
- visual groupings
- cluster anchors
- graph camera and force defaults

## Real 3D behavior

This is a real 3D graph, not a CSS imitation.

Key behaviors:

- nodes render as Three.js spheres
- labels render as sprite text
- links render in 3D space
- users can orbit around the graph
- users can zoom in and out
- users can drag nodes to new positions

## Node dragging

Dragging is provided by `react-force-graph-3d`.

When the drag ends, `onNodeDragEnd` writes the final `x`, `y`, and `z` back into the Zustand store through `updateGraphNodePosition`.

That means node layout is not just visual for the current frame. It becomes part of the saved local workspace state and survives refreshes, exports, and imports.

## Hover and selection

Hover and selection are handled by store-backed UI state:

- `hoveredNodeId`
- `selectedNodeId`
- `focusedNodeId`

The graph uses those values to:

- brighten the active node
- add a halo around neighbors
- thicken related links
- move the camera toward the focused node

## Filtering and grouping

`src/utils/graph.ts` filters graph content by:

- category toggles
- search query
- connected-neighbor mode

When searching, matches stay visible and their immediate neighbors are also kept visible for context.

## How graph nodes map to product content

Examples:

- note node -> markdown note in `workspace.notes`
- dataset node -> dataset metadata in `workspace.datasets`
- experiment node -> experiment record in `workspace.experiments`
- model node -> saved model metadata in `workspace.models`
- result node -> result snapshot in `workspace.results`
- layerGroup node -> current builder architecture summary

This mapping is why the graph is useful rather than decorative. Every node opens a meaningful part of the workspace.

## Scene customization

The graph scene adds a few lab-like touches on top of the library defaults:

- ambient and point lights
- a subtle grid helper for depth cues
- categorized colors and halos
- overlay controls for zoom-to-fit and focus

These are intentionally restrained so the graph stays readable.
