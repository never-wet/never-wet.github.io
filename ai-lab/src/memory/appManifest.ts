export const appManifest = {
  id: 'cortex-lab',
  title: 'Cortex Lab',
  subtitle: 'An Obsidian-inspired AI workspace for notes, graphs, models, and experiments.',
  modes: [
    {
      id: 'beginner',
      label: 'Beginner',
      description: 'Preset-focused, guided blocks, and lighter parameter surfaces.',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      description: 'Full builder controls, richer block palette, and experiment-first workflows.',
    },
  ],
  featureFlags: {
    graph3d: true,
    builder: true,
    browserTraining: true,
    noteGraph: true,
    exportImport: true,
    indexedDbModels: true,
    softAudio: false,
  },
  workspaceCollections: ['notes', 'datasets', 'experiments', 'models', 'results'],
} as const
