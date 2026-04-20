import { appManifest } from './appManifest'
import { canvasNodeManifest } from './canvasManifest'
import { graphClusters, nodeCategoryVisuals } from './graphIndex'
import { modelBlockIndex } from './modelBlockIndex'
import { trainingManifest } from './trainingManifest'
import { uiManifest } from './uiManifest'

export const contentRegistry = {
  app: {
    id: appManifest.id,
    title: appManifest.title,
    collections: appManifest.workspaceCollections,
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
  },
  ui: {
    tabs: uiManifest.bottomTabs.map((tab) => tab.id),
  },
} as const
