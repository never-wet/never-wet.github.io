export const assistantMemory = {
  status: {
    release: 'finished-v1',
    summary:
      'Cortex Lab is a finished v1 browser AI workspace with a 3D graph, 2D canvas, builder, browser training, notes, run comparison, and local-first persistence.',
  },
  entryPoints: {
    userFacing: 'index.html',
    development: 'dev.html',
    note: 'Users should open the built app through index.html. dev.html is only for Vite development.',
  },
  coreWorkflow: [
    'Use Graph Workspace to explore relationships between notes, datasets, experiments, models, files, and folders.',
    'Use Canvas Workspace as a 2D planning and research board.',
    'Use Network Builder to define the actual trainable neural architecture.',
    'Use Model Trainer to choose or import a dataset, train locally, compare runs, and test saved models.',
    'Use Research Notes to document experiments with reusable note templates.',
    'Use Storage & Export to import/export workspace data, reset safely, and launch sample projects.',
  ],
  modes: {
    beginner:
      'Preset-focused, guided, and lighter on controls. Best default for learning and first-time use.',
    advanced:
      'Unlocks richer builder options and supports experiment-oriented architecture editing.',
  },
  importedFolderSystem: {
    behavior:
      'Users can import a whole folder. The graph creates folder and file nodes, nested folders start collapsed, and clicking a folder orb expands or collapses its children.',
    details: [
      'Imported folders and files are real graph node categories.',
      'File nodes can show text previews for text-like file types.',
      'Collapsed folders hide descendants in the graph until expanded.',
      'Imported folder trees route users to the Storage & Export / workspace context.',
    ],
  },
  trainerCapabilities: [
    'Built-in demo tasks: XOR, spiral classification, sine regression.',
    'Import CSV or JSON tabular datasets with target-field selection and validation.',
    'Train models fully in the browser with TensorFlow.js.',
    'Save trained models locally in IndexedDB.',
    'Run local inference with custom inputs.',
    'Compare saved model runs side by side.',
    'Load a saved run back into the builder.',
  ],
  noteSystem: {
    purpose:
      'Notes are meant to function like a research notebook, not just loose text fields.',
    templates: [
      'experiment-summary',
      'training-observation',
      'result-interpretation',
    ],
  },
  onboarding: {
    tutorial:
      'The tutorial explains graph, modes, canvas, builder, trainer, notes, and storage.',
    ideas:
      'The top toolbar includes an Ideas button with concrete project/use-case prompts.',
  },
  importantUXChoices: [
    'No rounded corners across the main product shell.',
    'Many internal scroll areas intentionally hide visible scrollbar bars.',
    'The graph is the primary visual map, but canvas is the Obsidian-like 2D whiteboard.',
    'Model Trainer is the clear replacement for the older Training Console naming.',
  ],
  boundaries: [
    'Best for small, local, browser-friendly experiments.',
    'Not intended for very large datasets or heavy production training.',
    'No backend is required for the core workflow.',
  ],
  orientationHint:
    'If a future assistant needs to understand the product quickly, start with assistantMemory.ts, memoryManifest.ts, contentRegistry.ts, defaultState.ts, types.ts, uiManifest.ts, graphIndex.ts, and trainingManifest.ts.',
} as const
