export interface MemoryFileDefinition {
  id: string
  file: string
  purpose: string
  covers: string[]
}

export const memoryManifest: MemoryFileDefinition[] = [
  {
    id: 'assistant-memory',
    file: 'assistantMemory.ts',
    purpose: 'Compact assistant-facing product memory describing the current release, workflows, UX decisions, and important expectations.',
    covers: ['assistant memory', 'product status', 'workflow', 'ux decisions'],
  },
  {
    id: 'app',
    file: 'appManifest.ts',
    purpose: 'Global app identity, modes, feature flags, and core workspace collections.',
    covers: ['branding', 'modes', 'feature flags', 'collections'],
  },
  {
    id: 'audio',
    file: 'audioManifest.ts',
    purpose: 'Optional audio cue policy and current silent-by-default settings.',
    covers: ['audio', 'ux policy'],
  },
  {
    id: 'canvas',
    file: 'canvasManifest.ts',
    purpose: 'Canvas defaults for node types, sizing, colors, zoom, and edge behavior.',
    covers: ['canvas cards', 'canvas colors', 'zoom', 'edge defaults'],
  },
  {
    id: 'content',
    file: 'contentRegistry.ts',
    purpose: 'High-level registry that summarizes the app’s available graph, builder, canvas, training, idea, and tutorial content.',
    covers: ['registry', 'counts', 'feature surface'],
  },
  {
    id: 'defaults',
    file: 'defaultState.ts',
    purpose: 'Seed workspace data for the default notes, datasets, experiments, graph, canvas, builder, and training state.',
    covers: ['seed data', 'default workspace', 'demo content'],
  },
  {
    id: 'graph',
    file: 'graphIndex.ts',
    purpose: 'Graph clusters, node category visuals, relation labels, and force-graph display behavior.',
    covers: ['3D graph', 'clusters', 'node visuals', 'relations'],
  },
  {
    id: 'ideas',
    file: 'ideaManifest.ts',
    purpose: 'User-facing project ideas shown in the Ideas overlay.',
    covers: ['idea prompts', 'use cases', 'starter projects'],
  },
  {
    id: 'memory',
    file: 'memoryManifest.ts',
    purpose: 'A compact map of every memory file and what it is responsible for.',
    covers: ['memory architecture', 'orientation'],
  },
  {
    id: 'blocks',
    file: 'modelBlockIndex.ts',
    purpose: 'Builder block catalog with labels, families, availability, and compatibility rules.',
    covers: ['builder blocks', 'compatibility', 'config fields'],
  },
  {
    id: 'node-types',
    file: 'nodeTypeIndex.ts',
    purpose: 'Inspector behavior and default tab routing for each graph node category.',
    covers: ['node semantics', 'inspector routing', 'quick actions'],
  },
  {
    id: 'note-templates',
    file: 'noteTemplates.ts',
    purpose: 'Reusable note templates for experiments, training observations, and result interpretation.',
    covers: ['notes', 'templates', 'research workflow'],
  },
  {
    id: 'performance',
    file: 'performanceConfig.ts',
    purpose: 'Render and interaction tuning for graph, chart, and builder performance.',
    covers: ['performance', 'graph tuning', 'chart limits'],
  },
  {
    id: 'save-schema',
    file: 'saveSchema.ts',
    purpose: 'Workspace export envelope, import normalization, and save versioning rules.',
    covers: ['persistence', 'import/export', 'migrations'],
  },
  {
    id: 'storage',
    file: 'storageKeys.ts',
    purpose: 'All localStorage and IndexedDB key names used by the app.',
    covers: ['storage keys', 'autosave', 'models'],
  },
  {
    id: 'training',
    file: 'trainingManifest.ts',
    purpose: 'Training presets, browser limits, and recommended builder flows for demo tasks.',
    covers: ['trainer presets', 'limits', 'recommended flows'],
  },
  {
    id: 'tutorial',
    file: 'tutorialManifest.ts',
    purpose: 'Step-by-step onboarding guidance for graph, canvas, modes, builder, trainer, notes, and storage.',
    covers: ['tutorial', 'onboarding', 'mode explanation'],
  },
  {
    id: 'types',
    file: 'types.ts',
    purpose: 'Shared TypeScript contracts for graph nodes, builder state, datasets, models, canvas, and UI.',
    covers: ['types', 'schema', 'state contracts'],
  },
  {
    id: 'ui',
    file: 'uiManifest.ts',
    purpose: 'Top-level tab labels, rail descriptions, and major UI surface definitions.',
    covers: ['tabs', 'layout', 'labels'],
  },
] as const
