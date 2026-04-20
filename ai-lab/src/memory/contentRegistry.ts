import { assistantMemory } from './assistantMemory'
import { appManifest } from './appManifest'
import { audioManifest } from './audioManifest'
import { canvasNodeManifest } from './canvasManifest'
import { graphClusters, nodeCategoryVisuals } from './graphIndex'
import { ideaManifest } from './ideaManifest'
import { memoryManifest } from './memoryManifest'
import { modelBlockIndex } from './modelBlockIndex'
import { noteTemplates } from './noteTemplates'
import { performanceConfig } from './performanceConfig'
import { SAVE_SCHEMA_VERSION } from './saveSchema'
import { storageKeys } from './storageKeys'
import { trainingManifest } from './trainingManifest'
import { tutorialManifest } from './tutorialManifest'
import { uiManifest } from './uiManifest'

export const contentRegistry = {
  assistant: assistantMemory,
  app: {
    id: appManifest.id,
    title: appManifest.title,
    collections: appManifest.workspaceCollections,
    modes: appManifest.modes.map((mode) => mode.id),
    featureFlags: appManifest.featureFlags,
  },
  graph: {
    categories: Object.keys(nodeCategoryVisuals),
    clusters: Object.keys(graphClusters),
  },
  builder: {
    blocks: Object.keys(modelBlockIndex),
  },
  canvas: {
    cardTypes: Object.keys(canvasNodeManifest),
  },
  training: {
    presets: trainingManifest.presets.map((preset) => preset.id),
    limits: trainingManifest.browserLimits,
  },
  notes: {
    templates: noteTemplates.map((template) => template.id),
  },
  ui: {
    tabs: uiManifest.bottomTabs.map((tab) => tab.id),
  },
  tutorial: {
    steps: tutorialManifest.map((step) => step.id),
  },
  ideas: {
    prompts: ideaManifest.map((idea) => idea.id),
  },
  storage: {
    schemaVersion: SAVE_SCHEMA_VERSION,
    keys: storageKeys,
  },
  performance: performanceConfig,
  audio: audioManifest,
  memory: {
    files: memoryManifest,
  },
} as const
