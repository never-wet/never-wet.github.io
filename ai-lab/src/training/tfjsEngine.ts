import * as tf from '@tensorflow/tfjs'

import { storageKeys } from '../memory/storageKeys'
import type {
  BuilderFlowState,
  ConfusionMatrix,
  DatasetRecord,
  PredictionPreview,
  TrainingConfig,
  TrainingMetricPoint,
  TrainingTaskType,
  TrainingStatus,
} from '../memory/types'
import { validateBuilderFlow } from '../utils/builder'
import { generateDatasetBundle } from './sampleDatasets'

export interface BrowserTrainingResult {
  status: Extract<TrainingStatus, 'completed' | 'paused'>
  message: string
  metrics: TrainingMetricPoint[]
  predictions: PredictionPreview[]
  confusionMatrix?: ConfusionMatrix
  parameterEstimate: number
  modelStorageKey?: string
}

export interface BrowserInferenceResult {
  taskType: TrainingTaskType
  raw: number[]
  predictedLabel?: string
  confidence?: number
  probability?: number
  value?: number
}

interface TrainInBrowserParams {
  presetId: string
  dataset?: DatasetRecord
  flow: BuilderFlowState
  config: TrainingConfig
  shouldStop: () => boolean
  onEpoch: (metric: TrainingMetricPoint, parameterEstimate: number) => void | Promise<void>
}

type DenseActivation = NonNullable<Parameters<typeof tf.layers.dense>[0]['activation']>

const resolveActivation = (value: unknown, fallback: DenseActivation): DenseActivation =>
  (typeof value === 'string' ? value : fallback) as DenseActivation

const getMetric = (logs: tf.Logs | undefined, keys: string[]) => {
  if (!logs) {
    return undefined
  }

  for (const key of keys) {
    const value = logs[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return undefined
}

const buildModel = (
  flow: BuilderFlowState,
  config: TrainingConfig,
  presetId: string,
  dataset?: DatasetRecord,
) => {
  const validation = validateBuilderFlow(flow)

  if (!validation.valid) {
    throw new Error(validation.issues[0] ?? 'The builder flow is not trainable yet.')
  }

  const presetDataset = generateDatasetBundle(presetId, dataset)
  const model = tf.sequential()
  let firstTrainable = true

  for (const layer of validation.orderedNodes) {
    if (layer.kind === 'input') {
      continue
    }

    if (layer.kind === 'dense') {
      model.add(
        tf.layers.dense({
          units: Number(layer.config.units ?? 8),
          activation: resolveActivation(layer.config.activation, 'relu'),
          inputShape: firstTrainable ? [presetDataset.inputUnits] : undefined,
        }),
      )
      firstTrainable = false
      continue
    }

    if (layer.kind === 'activation') {
      model.add(
        tf.layers.activation({
          activation: resolveActivation(layer.config.activation, 'relu'),
        }),
      )
      continue
    }

    if (layer.kind === 'dropout') {
      model.add(
        tf.layers.dropout({
          rate: Number(layer.config.rate ?? 0.2),
        }),
      )
      continue
    }

    if (layer.kind === 'normalization') {
      model.add(tf.layers.batchNormalization({}))
      continue
    }

    if (layer.kind === 'reshape') {
      model.add(
        tf.layers.reshape({
          targetShape: [Number(layer.config.targetUnits ?? presetDataset.outputUnits)],
        }),
      )
      continue
    }

    if (layer.kind === 'output') {
      model.add(
        tf.layers.dense({
          units: Number(layer.config.units ?? presetDataset.outputUnits),
          activation: resolveActivation(
            layer.config.activation,
            presetDataset.taskType === 'regression' ? 'linear' : 'sigmoid',
          ),
        }),
      )
    }
  }

  model.compile({
    optimizer:
      config.optimizer === 'sgd'
        ? tf.train.sgd(config.learningRate)
        : tf.train.adam(config.learningRate),
    loss: config.loss,
    metrics: config.metricKeys,
  })

  return {
    model,
    validation,
    presetDataset,
  }
}

const createPredictions = async (
  model: tf.Sequential,
  presetId: string,
  dataset?: DatasetRecord,
): Promise<{
  predictions: PredictionPreview[]
  confusionMatrix?: ConfusionMatrix
}> => {
  const bundle = generateDatasetBundle(presetId, dataset)
  const previewTensor = tf.tensor2d(bundle.previewInputs)
  const previewOutput = model.predict(previewTensor) as tf.Tensor
  const previewValues = (await previewOutput.array()) as number[][]

  const predictions = previewValues.map((row, index) => {
    if (bundle.taskType === 'regression') {
      return {
        label: `Sample ${index + 1}`,
        expected: bundle.previewExpected[index][0].toFixed(3),
        predicted: row[0].toFixed(3),
      }
    }

    const probability = row[0]
    const predictedLabel = probability >= 0.5 ? bundle.labels[1] : bundle.labels[0]
    const expectedLabel =
      bundle.previewExpected[index][0] >= 0.5 ? bundle.labels[1] : bundle.labels[0]

    return {
      label: `Sample ${index + 1}`,
      expected: expectedLabel,
      predicted: predictedLabel,
      confidence: probability >= 0.5 ? probability : 1 - probability,
    }
  })

  previewTensor.dispose()
  previewOutput.dispose()

  if (bundle.taskType === 'regression') {
    return { predictions }
  }

  const allInput = tf.tensor2d(bundle.xTrain)
  const allPrediction = model.predict(allInput) as tf.Tensor
  const allValues = (await allPrediction.array()) as number[][]
  const confusion = [
    [0, 0],
    [0, 0],
  ]

  allValues.forEach((row, index) => {
    const expected = bundle.yTrain[index][0] >= 0.5 ? 1 : 0
    const predicted = row[0] >= 0.5 ? 1 : 0
    confusion[expected][predicted] += 1
  })

  allInput.dispose()
  allPrediction.dispose()

  return {
    predictions,
    confusionMatrix: {
      labels: bundle.labels,
      values: confusion,
    },
  }
}

export const runStoredModelInference = async ({
  storageKey,
  presetId,
  dataset,
  inputs,
}: {
  storageKey: string
  presetId: string
  dataset?: DatasetRecord
  inputs: number[]
}): Promise<BrowserInferenceResult> => {
  await tf.ready()

  const model = await tf.loadLayersModel(storageKey)
  const bundle = generateDatasetBundle(presetId, dataset)
  const inputTensor = tf.tensor2d([inputs])
  const outputTensor = model.predict(inputTensor) as tf.Tensor

  try {
    const output = (await outputTensor.array()) as number[][]
    const row = output[0] ?? []

    if (bundle.taskType === 'regression') {
      return {
        taskType: bundle.taskType,
        raw: row,
        value: row[0],
      }
    }

    const probability = row[0] ?? 0

    return {
      taskType: bundle.taskType,
      raw: row,
      predictedLabel: probability >= 0.5 ? bundle.labels[1] : bundle.labels[0],
      confidence: probability >= 0.5 ? probability : 1 - probability,
      probability,
    }
  } finally {
    inputTensor.dispose()
    outputTensor.dispose()
    model.dispose()
  }
}

export const trainInBrowser = async ({
  presetId,
  dataset,
  flow,
  config,
  shouldStop,
  onEpoch,
}: TrainInBrowserParams): Promise<BrowserTrainingResult> => {
  await tf.ready()

  const { model, validation, presetDataset } = buildModel(flow, config, presetId, dataset)
  const xs = tf.tensor2d(presetDataset.xTrain)
  const ys = tf.tensor2d(presetDataset.yTrain)
  const metrics: TrainingMetricPoint[] = []

  try {
    await model.fit(xs, ys, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: config.validationSplit,
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (shouldStop()) {
            model.stopTraining = true
          }

          const metric: TrainingMetricPoint = {
            epoch: epoch + 1,
            loss: getMetric(logs, ['loss']) ?? 0,
            accuracy: getMetric(logs, ['acc', 'accuracy']),
            valLoss: getMetric(logs, ['val_loss']),
            valAccuracy: getMetric(logs, ['val_acc', 'val_accuracy']),
          }

          metrics.push(metric)
          await onEpoch(metric, validation.parameterEstimate)
          await tf.nextFrame()
        },
      },
    })

    const stoppedEarly = shouldStop() || model.stopTraining
    const storageKey = stoppedEarly
      ? undefined
      : `indexeddb://${storageKeys.modelPrefix}-${Date.now().toString(36)}`

    if (storageKey) {
      await model.save(storageKey)
    }

    const predictionSummary = await createPredictions(model, presetId, dataset)

    return {
      status: stoppedEarly ? 'paused' : 'completed',
      message: stoppedEarly
        ? 'Training paused before finishing all epochs.'
        : 'Training completed and the browser model was saved locally.',
      metrics,
      predictions: predictionSummary.predictions,
      confusionMatrix: predictionSummary.confusionMatrix,
      parameterEstimate: validation.parameterEstimate,
      modelStorageKey: storageKey,
    }
  } finally {
    xs.dispose()
    ys.dispose()
    model.dispose()
  }
}
