import { trainingManifest } from '../memory/trainingManifest'
import type { DatasetRecord, TrainingPresetDefinition, TrainingTaskType } from '../memory/types'

export interface GeneratedDatasetBundle {
  preset: TrainingPresetDefinition
  taskType: TrainingTaskType
  xTrain: number[][]
  yTrain: number[][]
  previewInputs: number[][]
  previewExpected: number[][]
  labels: string[]
  inputUnits: number
  outputUnits: number
}

const createXorBundle = (): GeneratedDatasetBundle => {
  const preset = trainingManifest.presets.find((entry) => entry.id === 'xor-lab')
  if (!preset) {
    throw new Error('Missing XOR preset.')
  }

  const base = [
    { x: [0, 0], y: [0] },
    { x: [0, 1], y: [1] },
    { x: [1, 0], y: [1] },
    { x: [1, 1], y: [0] },
  ]

  const xTrain: number[][] = []
  const yTrain: number[][] = []

  for (let repeat = 0; repeat < 32; repeat += 1) {
    for (const row of base) {
      xTrain.push([...row.x])
      yTrain.push([...row.y])
    }
  }

  return {
    preset,
    taskType: preset.taskType,
    xTrain,
    yTrain,
    previewInputs: base.map((row) => row.x),
    previewExpected: base.map((row) => row.y),
    labels: ['False', 'True'],
    inputUnits: 2,
    outputUnits: 1,
  }
}

const createSpiralBundle = (): GeneratedDatasetBundle => {
  const preset = trainingManifest.presets.find((entry) => entry.id === 'spiral-lab')
  if (!preset) {
    throw new Error('Missing spiral preset.')
  }

  const xTrain: number[][] = []
  const yTrain: number[][] = []

  for (let classId = 0; classId < 2; classId += 1) {
    for (let step = 0; step < 120; step += 1) {
      const t = step / 120
      const radius = 0.12 + t * 0.88
      const angle = classId * Math.PI + 4 * Math.PI * t
      const noise = (Math.random() - 0.5) * 0.14
      xTrain.push([
        radius * Math.sin(angle) + noise,
        radius * Math.cos(angle) + noise,
      ])
      yTrain.push([classId])
    }
  }

  return {
    preset,
    taskType: preset.taskType,
    xTrain,
    yTrain,
    previewInputs: xTrain.slice(0, 8),
    previewExpected: yTrain.slice(0, 8),
    labels: ['Class 0', 'Class 1'],
    inputUnits: 2,
    outputUnits: 1,
  }
}

const createSineBundle = (): GeneratedDatasetBundle => {
  const preset = trainingManifest.presets.find((entry) => entry.id === 'sine-lab')
  if (!preset) {
    throw new Error('Missing sine preset.')
  }

  const xTrain: number[][] = []
  const yTrain: number[][] = []

  for (let step = 0; step < 160; step += 1) {
    const x = (step / 160) * Math.PI * 2
    const noise = (Math.random() - 0.5) * 0.08
    xTrain.push([x / Math.PI])
    yTrain.push([Math.sin(x) + noise])
  }

  const previewInputs = [0, 0.5, 1, 1.5, 2].map((value) => [value])
  const previewExpected = previewInputs.map(([value]) => [Math.sin(value * Math.PI)])

  return {
    preset,
    taskType: preset.taskType,
    xTrain,
    yTrain,
    previewInputs,
    previewExpected,
    labels: ['y'],
    inputUnits: 1,
    outputUnits: 1,
  }
}

export const generatePresetDataset = (presetId: string): GeneratedDatasetBundle => {
  if (presetId === 'xor-lab') {
    return createXorBundle()
  }

  if (presetId === 'spiral-lab') {
    return createSpiralBundle()
  }

  return createSineBundle()
}

export const generateDatasetBundle = (
  presetId: string,
  dataset?: DatasetRecord,
): GeneratedDatasetBundle => {
  if (!dataset || dataset.source !== 'imported' || !dataset.rows?.length) {
    return generatePresetDataset(presetId)
  }

  const preset =
    trainingManifest.presets.find((entry) => entry.id === presetId) ??
    trainingManifest.presets.find((entry) => entry.taskType === dataset.taskType) ??
    trainingManifest.presets[0]

  const featureFields = dataset.schema.filter((field) => field !== dataset.targetField)
  const xTrain = dataset.rows.map((row) =>
    featureFields.map((field) => Number(row[field])),
  )

  if (dataset.taskType === 'regression') {
    const yTrain = dataset.rows.map((row) => [Number(row[dataset.targetField])])
    return {
      preset,
      taskType: dataset.taskType,
      xTrain,
      yTrain,
      previewInputs: xTrain.slice(0, 8),
      previewExpected: yTrain.slice(0, 8),
      labels: [dataset.targetField],
      inputUnits: featureFields.length,
      outputUnits: 1,
    }
  }

  const labels = dataset.classLabels ?? ['Class 0', 'Class 1']
  const labelToIndex = new Map(labels.map((label, index) => [label, index]))
  const yTrain = dataset.rows.map((row) => [
    labelToIndex.get(String(row[dataset.targetField])) ?? 0,
  ])

  return {
    preset,
    taskType: dataset.taskType,
    xTrain,
    yTrain,
    previewInputs: xTrain.slice(0, 8),
    previewExpected: yTrain.slice(0, 8),
    labels,
    inputUnits: featureFields.length,
    outputUnits: 1,
  }
}
