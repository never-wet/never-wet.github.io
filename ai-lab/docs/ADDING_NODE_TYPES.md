# Adding Node Types

## Goal

Node types are designed to be added without editing giant files.

To add a new node category, update the memory files first, then wire in any category-specific UI behavior.

## Required files

### 1. Add the type

Update `src/memory/types.ts`.

- extend `NodeCategory`
- extend related record unions if needed
- add new entity interfaces if the node points to new content

### 2. Add graph visuals

Update `src/memory/graphIndex.ts`.

Add a new entry to `nodeCategoryVisuals` with:

- label
- description
- cluster
- color
- accent
- size
- glow

This is what makes the node render correctly in the 3D graph.

### 3. Add behavior metadata

Update `src/memory/nodeTypeIndex.ts`.

Provide:

- detail title
- description
- default bottom tab
- quick action label
- relation hint

This powers the inspector panel and its quick-open behavior.

### 4. Seed or create content

If the node maps to a persistent record:

- add a new interface or record shape in `src/memory/types.ts`
- add default content in `src/memory/defaultState.ts`
- create graph nodes and links that point to the new entity with `entityKind` and `entityId`

## Optional integration points

Depending on the node type, you may also need to update:

- `src/components/InspectorPanel.tsx`
  Add a richer detail view for the new category.
- `src/components/WorkspaceSidebar.tsx`
  Show the new content collection in the side rail.
- `src/notes/NotesWorkbench.tsx`
  If notes should link to the new category in a special way.
- `src/training/TrainingConsole.tsx`
  If the node type represents a training or evaluation artifact.
- `src/state/useLabStore.ts`
  If creating or updating the new node type requires dedicated actions.

## Adding new builder block types

If the new node type is a builder block rather than a graph category:

1. Extend `BuilderBlockKind` in `src/memory/types.ts`
2. Add a block definition to `src/memory/modelBlockIndex.ts`
3. Update validation and parameter logic in `src/utils/builder.ts`
4. Update TensorFlow.js translation in `src/training/tfjsEngine.ts`

That path keeps builder editing, validation, and training aligned.

## Safe workflow

The lowest-risk order is:

1. Update the memory files
2. Seed a default node in `defaultState.ts`
3. Confirm it renders in the 3D graph
4. Add inspector or sidebar enhancements
5. Add any deeper training or note integration

That sequence makes it easier for future assistants to reason about what changed.
