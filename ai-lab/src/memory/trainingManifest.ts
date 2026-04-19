import type { BrowserLimits, TrainingPresetDefinition } from './types'

export const trainingManifest: {
  browserLimits: BrowserLimits
  presets: TrainingPresetDefinition[]
} = {
  browserLimits: {
    maxGraphNodes: 180,
    maxGraphLinks: 320,
    maxEpochs: 400,
    maxPreviewRows: 8,
    recommendedTensorBudget: 12000,
  },
  presets: [
    {
      id: 'xor-lab',
      name: 'XOR Classifier',
      datasetId: 'dataset-xor',
      taskType: 'binary-classification',
      description: 'A tiny truth-table classic for understanding non-linearity.',
      narrative: 'Best for learning how hidden layers unlock separability.',
      recommendedMode: 'beginner',
      recommendedFlow: ['input', 'dense', 'dense', 'output'],
      defaultConfig: {
        epochs: 120,
        batchSize: 4,
        learningRate: 0.08,
        validationSplit: 0.25,
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metricKeys: ['accuracy'],
      },
    },
    {
      id: 'spiral-lab',
      name: 'Spiral Separation',
      datasetId: 'dataset-spiral',
      taskType: 'binary-classification',
      description: 'A harder 2D toy dataset that benefits from a richer hidden stack.',
      narrative: 'Helpful for seeing capacity, dropout, and normalization tradeoffs.',
      recommendedMode: 'advanced',
      recommendedFlow: ['input', 'dense', 'dense', 'dropout', 'output'],
      defaultConfig: {
        epochs: 140,
        batchSize: 16,
        learningRate: 0.02,
        validationSplit: 0.2,
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metricKeys: ['accuracy'],
      },
    },
    {
      id: 'sine-lab',
      name: 'Sine Regression',
      datasetId: 'dataset-sine',
      taskType: 'regression',
      description: 'A smooth regression task for visualizing curve fitting in the browser.',
      narrative: 'Useful when you want to inspect error curves and parameter counts.',
      recommendedMode: 'beginner',
      recommendedFlow: ['input', 'dense', 'dense', 'output'],
      defaultConfig: {
        epochs: 110,
        batchSize: 12,
        learningRate: 0.01,
        validationSplit: 0.2,
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metricKeys: [],
      },
    },
  ],
}
