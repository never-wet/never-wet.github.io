# Architecture

## Overview

Cortex Lab is organized around one local-first workspace store and a compact memory-file layer.

The app has four major product surfaces:

1. The 3D graph workspace
2. The neural network builder
3. The in-browser training console
4. The note and workspace management system

All of them read from the same source-of-truth state in `src/state/useLabStore.ts`.

## Main runtime flow

1. `src/app/LabApp.tsx` composes the toolbar, sidebars, graph, and bottom workbench tabs.
2. `src/state/useLabStore.ts` owns graph nodes, links, notes, datasets, builder flow, training state, and persistence actions.
3. `src/graph/ForceGraphPanel.tsx` renders the 3D graph from store data and writes node positions back when dragging ends.
4. `src/builder/BuilderCanvas.tsx` edits the flowchart model architecture and keeps it synchronized with the store.
5. `src/training/TrainingConsole.tsx` launches TensorFlow.js training using the validated builder chain.
6. `src/notes/NotesWorkbench.tsx` edits markdown notes and links them back into graph content.

## Memory-file architecture

These files are meant to be the first stop for future assistants:

- `src/memory/appManifest.ts`
  Global product identity, modes, and feature flags.
- `src/memory/graphIndex.ts`
  Graph categories, cluster placement, visual rules, and force defaults.
- `src/memory/nodeTypeIndex.ts`
  Behavior for category-specific detail views and quick actions.
- `src/memory/modelBlockIndex.ts`
  Neural builder blocks, descriptions, editable fields, and connection rules.
- `src/memory/trainingManifest.ts`
  Demo tasks, browser limits, and default training configs.
- `src/memory/uiManifest.ts`
  Workbench tabs and top-level layout surfaces.
- `src/memory/audioManifest.ts`
  Explicitly documents that audio is off by default.
- `src/memory/storageKeys.ts`
  Storage keys for workspace state, snapshots, and model saves.
- `src/memory/defaultState.ts`
  Demo workspace content and initial linked graph state.
- `src/memory/saveSchema.ts`
  Import/export schema versioning and normalization.
- `src/memory/contentRegistry.ts`
  Lightweight registry connecting graph, builder, training, and UI manifests.
- `src/memory/performanceConfig.ts`
  Graph, chart, and builder rendering defaults.
- `src/memory/types.ts`
  Shared TypeScript types across the app.

## State model

The workspace store contains:

- Graph nodes and links
- Notes, datasets, experiments, models, and result snapshots
- Builder nodes and edges
- Training status, metrics, predictions, and saved model references
- UI state such as search, filters, selected nodes, and active tabs

The store also owns higher-level workflows:

- Creating linked notes
- Loading preset architectures
- Updating graph node positions after dragging
- Committing completed training runs into model/result records

## Builder architecture

The builder is intentionally sequential-first.

`src/utils/builder.ts` validates the current builder flow by checking:

- exactly one input block
- exactly one output block
- one continuous model path
- no cycles
- one inbound and one outbound connection for intermediate trainable blocks

That validation produces a `layerPlan` and a parameter estimate. The parameter estimate is surfaced in both the builder and training console, and is also written into the architecture graph node summary.

## Training architecture

`src/training/sampleDatasets.ts` generates lightweight training datasets in memory.

`src/training/tfjsEngine.ts` then:

1. validates the builder flow
2. builds a TensorFlow.js sequential model
3. trains it in the browser
4. streams epoch metrics back into the store
5. generates prediction previews and a confusion matrix where applicable
6. saves completed models into IndexedDB

The store then creates a new model node and result node so training outcomes become part of the graph.

## Persistence model

There are three persistence layers:

- Zustand `persist` middleware writes the main workspace state to `localStorage`
- `src/utils/persistence.ts` mirrors workspace snapshots into IndexedDB
- TensorFlow.js saves completed models with the `indexeddb://` backend

Export/import wraps the workspace in a versioned JSON envelope so the project can be moved across machines or restored after resets.

## Styling

The visual system lives in:

- `src/index.css`
- `src/styles/app.css`

The UI is designed to feel like a restrained scientific lab:

- dark neutral background
- blue, mint, amber, and violet as controlled accents
- subtle gradients and glass panels
- IBM Plex typography for a technical but readable feel

## Performance notes

- Heavy workbench panels are lazy-loaded from `LabApp.tsx`
- The graph uses `react-force-graph-3d` instead of a custom engine
- Builder validation is synchronous and lightweight
- Training demos are intentionally small enough to stay practical in-browser
