# Finishing Checklist

This document defines what Cortex Lab still needs before it should be called a finished v1 product instead of a prototype.

The current codebase already has the main pillars:

- 3D graph exploration
- 2D canvas workspace
- neural network builder
- browser training
- notes and linked workspace entities
- local persistence
- first-run tutorial

What is still missing is clarity, completeness of the end-to-end workflow, and product-hardening.

## Definition Of Done

Cortex Lab is finished enough for a v1 when a new user can:

1. understand the difference between graph, canvas, builder, training, and notes
2. build or load a model architecture
3. pick or import a dataset
4. train the model in the browser
5. test the trained model with custom inputs
6. save, reopen, export, and compare their work without confusion
7. recover from common errors without losing work

If any of those steps feel unclear or incomplete, the product is not finished yet.

## Must-Have Before V1

### 1. Complete the model workflow

- Add a dedicated `Test Model` or `Inference` panel so users can enter custom inputs after training and see live predictions.
- Make it obvious which builder flow is currently being trained.
- Add a `Load into builder` action for saved model versions or saved experiment architectures.
- Add a `train current builder` status summary so the user knows exactly what architecture and preset are active.

Why this matters:
Right now training feels like a demo console. A finished project needs a full loop from build to train to test to save.

Likely files:

- `src/training/TrainingConsole.tsx`
- `src/training/tfjsEngine.ts`
- `src/state/useLabStore.ts`
- `src/components/InspectorPanel.tsx`

### 2. Add real dataset workflows

- Support importing small CSV or JSON datasets.
- Add dataset validation with friendly errors.
- Add dataset preview tables with column typing and target-field selection.
- Add dataset-to-training compatibility checks.
- Add a clear difference between built-in demo datasets and user datasets.

Why this matters:
The app is supposed to be an AI lab, not only a preset sandbox.

Likely files:

- `src/training/`
- `src/components/WorkspaceSidebar.tsx`
- `src/state/useLabStore.ts`
- `src/memory/types.ts`

### 3. Tighten graph, canvas, and builder integration

- Clicking a graph node should consistently open the correct tool and entity.
- Canvas file cards should jump directly to the related note, dataset, experiment, or model view.
- Builder architectures should be representable as meaningful graph and canvas entities.
- Saved training runs should automatically create clearer model and result links across graph and canvas.
- Add one-click `send to canvas` and `send to graph` actions where relevant.

Why this matters:
The product vision is one connected workspace, not separate mini-tools.

Likely files:

- `src/graph/ForceGraphPanel.tsx`
- `src/canvas/CanvasWorkbench.tsx`
- `src/builder/BuilderCanvas.tsx`
- `src/state/useLabStore.ts`

### 4. Improve naming and UX clarity

- Rename confusing labels if needed:
  - `Training Console` -> `Model Trainer` or `Train Model`
  - `Workspace` -> `Storage & Export` or similar
- Add short inline descriptions to each major tab.
- Add visible empty states and “what this area is for” helper text.
- Add contextual hints for hidden interactions:
  - canvas card creation
  - edge linking
  - graph selection
  - builder connection rules

Why this matters:
A finished product should not depend on the user guessing the mental model.

Likely files:

- `src/memory/uiManifest.ts`
- `src/components/TopToolbar.tsx`
- `src/components/TutorialOverlay.tsx`
- `src/styles/app.css`

### 5. Make notes a stronger research notebook

- Add note-to-experiment and note-to-model quick-link actions.
- Add backlinks and linked references that are easier to inspect.
- Add markdown shortcuts or formatting helpers.
- Add note templates for experiment summary, training observations, and result interpretation.

Why this matters:
The app is partly an AI research notebook. Notes should feel central, not secondary.

Likely files:

- `src/notes/NotesWorkbench.tsx`
- `src/state/useLabStore.ts`
- `src/memory/defaultState.ts`

### 6. Finish persistence as a product feature

- Add a visible save/status explanation for what is stored locally.
- Add a `Reset saved workspace` control outside of crash-only recovery.
- Add autosave conflict-safe behavior for imports and resets.
- Add export/import coverage for:
  - full workspace JSON
  - `.canvas` files
  - model metadata
- Add save-schema migration coverage for new entities.

Why this matters:
Users need to trust that their work is safe and understandable.

Likely files:

- `src/utils/persistence.ts`
- `src/memory/saveSchema.ts`
- `src/memory/storageKeys.ts`
- `src/components/WorkspacePanel.tsx`

## Quality Gates Before Release

### 7. Add real testing

- Unit tests for:
  - builder validation
  - canvas import/export parsing
  - save-schema normalization
  - training preset logic
- Integration tests for:
  - build -> train -> save flow
  - import/export flow
  - tutorial opening and dismissal

Why this matters:
Without tests, this is still fragile and expensive to evolve.

### 8. Accessibility and keyboard support

- Keyboard navigation for tabs, panels, and canvas controls.
- Better focus states across all interactive elements.
- Screen-reader labels for graph/canvas/builder actions.
- Reduced-motion handling for graph and animated UI.
- Higher-contrast pass for all small text and muted states.

Why this matters:
A finished product should be usable, not only visually interesting.

### 9. Performance and stability hardening

- Measure graph performance on larger workspaces.
- Add caps and warnings for oversized browser training runs.
- Add safer error recovery in all major work areas.
- Reduce unnecessary rerenders in graph, canvas, and builder.
- Test persistence and training in fresh browser sessions.

Why this matters:
The current app works, but a finished product must stay stable under normal user stress.

### 10. Responsive polish

- Improve mobile and narrow-width layouts for canvas and training.
- Ensure floating panels collapse intelligently on smaller screens.
- Keep critical actions reachable without hunting.

Why this matters:
Right now the desktop experience is the primary target. A finished app should degrade more gracefully.

## Strongly Recommended For A Finished Feel

### 11. Sample projects and onboarding polish

- Add multiple starter workspaces, not only one default demo.
- Add guided example flows:
  - XOR classification
  - spiral classification
  - sine regression
- Let users load sample projects directly from the app.

### 12. Experiment comparison tools

- Compare model versions side by side.
- Compare metrics across experiments.
- Add a lightweight run history panel.
- Add result snapshots that explain what changed between runs.

### 13. Better model management

- Add saved model browser with version metadata.
- Add model deletion and cleanup.
- Add model export if practical.
- Add clearer display of parameter count, architecture summary, and last-used dataset.

### 14. Better canvas polish

- Add edge-label editing directly on the board.
- Add marquee grouping or multi-select affordances that feel more deliberate.
- Add card creation menu near the pointer.
- Add optional snap toggles and cleaner alignment helpers.

## Nice To Have After V1

- Collaboration or share links
- richer markdown editor
- image datasets or tiny vision demos
- confusion-matrix drilldowns
- audio cues
- theme customization
- plugin or extension system

These are useful, but they should not block calling the product finished if the core AI lab workflow is already complete and reliable.

## Recommended Build Order

1. Complete build -> train -> test -> save flow.
2. Add dataset import and validation.
3. Tighten graph/canvas/builder integration.
4. Improve naming, empty states, and clarity.
5. Add persistence controls and recovery polish.
6. Add tests, accessibility, and performance hardening.
7. Add comparison tools and advanced polish.

## Current Honest Status

Current status: strong prototype / vertical slice.

It becomes a finished v1 only after the core AI workflow is complete, clearly understandable, and stable for repeated real use.
