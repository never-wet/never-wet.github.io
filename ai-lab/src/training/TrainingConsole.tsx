import { useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FileUp, LoaderCircle, Pause, Play, RotateCcw, Save, ScanSearch } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { PanelFrame } from '../components/PanelFrame'
import { StatCard } from '../components/StatCard'
import { TagPill } from '../components/TagPill'
import { trainingManifest } from '../memory/trainingManifest'
import type { DatasetRecord, ModelRecord } from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { summarizeLayerPlan, validateBuilderFlow } from '../utils/builder'
import {
  buildImportedDatasetRecord,
  parseDatasetFile,
  type ImportedDatasetDraft,
} from '../utils/datasets'
import { formatMetric, formatPercent } from '../utils/format'
import { generatePresetDataset } from './sampleDatasets'
import { runStoredModelInference, trainInBrowser, type BrowserInferenceResult } from './tfjsEngine'

const coerceNumber = (value: number | string | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const formatRunValue = (value: unknown, format: 'plain' | 'metric' | 'percent' = 'plain') => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  if (format === 'metric') {
    return formatMetric(typeof value === 'number' ? value : undefined)
  }

  if (format === 'percent') {
    return formatPercent(typeof value === 'number' ? value : undefined)
  }

  return String(value)
}

const formatTimestamp = (iso?: string) => {
  if (!iso) {
    return '-'
  }

  const date = new Date(iso)
  return Number.isNaN(date.valueOf()) ? '-' : date.toLocaleString()
}

type ComparisonRow = {
  label: string
  left: string
  right: string
  same: boolean
}

const createComparisonRows = (primary: ModelRecord, compare: ModelRecord): ComparisonRow[] => {
  const rows: ComparisonRow[] = [
    {
      label: 'Version',
      left: `v${primary.version}`,
      right: `v${compare.version}`,
      same: primary.version === compare.version,
    },
    {
      label: 'Saved',
      left: formatTimestamp(primary.updatedAt),
      right: formatTimestamp(compare.updatedAt),
      same: primary.updatedAt === compare.updatedAt,
    },
    {
      label: 'Preset',
      left: formatRunValue(primary.presetId),
      right: formatRunValue(compare.presetId),
      same: primary.presetId === compare.presetId,
    },
    {
      label: 'Dataset',
      left: formatRunValue(primary.datasetId),
      right: formatRunValue(compare.datasetId),
      same: primary.datasetId === compare.datasetId,
    },
    {
      label: 'Builder flow',
      left: formatRunValue(primary.builderTitle),
      right: formatRunValue(compare.builderTitle),
      same: primary.builderTitle === compare.builderTitle,
    },
    {
      label: 'Architecture',
      left: formatRunValue(primary.builderSignature),
      right: formatRunValue(compare.builderSignature),
      same: primary.builderSignature === compare.builderSignature,
    },
    {
      label: 'Parameters',
      left: formatRunValue(primary.parameterEstimate),
      right: formatRunValue(compare.parameterEstimate),
      same: primary.parameterEstimate === compare.parameterEstimate,
    },
    {
      label: 'Epochs',
      left: formatRunValue(primary.configSnapshot?.epochs),
      right: formatRunValue(compare.configSnapshot?.epochs),
      same: primary.configSnapshot?.epochs === compare.configSnapshot?.epochs,
    },
    {
      label: 'Batch size',
      left: formatRunValue(primary.configSnapshot?.batchSize),
      right: formatRunValue(compare.configSnapshot?.batchSize),
      same: primary.configSnapshot?.batchSize === compare.configSnapshot?.batchSize,
    },
    {
      label: 'Learning rate',
      left: formatRunValue(primary.configSnapshot?.learningRate),
      right: formatRunValue(compare.configSnapshot?.learningRate),
      same: primary.configSnapshot?.learningRate === compare.configSnapshot?.learningRate,
    },
    {
      label: 'Validation split',
      left: formatRunValue(primary.configSnapshot?.validationSplit),
      right: formatRunValue(compare.configSnapshot?.validationSplit),
      same: primary.configSnapshot?.validationSplit === compare.configSnapshot?.validationSplit,
    },
    {
      label: 'Loss',
      left: formatRunValue(primary.metrics?.loss, 'metric'),
      right: formatRunValue(compare.metrics?.loss, 'metric'),
      same: primary.metrics?.loss === compare.metrics?.loss,
    },
    {
      label: 'Accuracy',
      left: formatRunValue(primary.metrics?.accuracy, 'percent'),
      right: formatRunValue(compare.metrics?.accuracy, 'percent'),
      same: primary.metrics?.accuracy === compare.metrics?.accuracy,
    },
    {
      label: 'Validation loss',
      left: formatRunValue(primary.metrics?.valLoss, 'metric'),
      right: formatRunValue(compare.metrics?.valLoss, 'metric'),
      same: primary.metrics?.valLoss === compare.metrics?.valLoss,
    },
    {
      label: 'Validation accuracy',
      left: formatRunValue(primary.metrics?.valAccuracy, 'percent'),
      right: formatRunValue(compare.metrics?.valAccuracy, 'percent'),
      same: primary.metrics?.valAccuracy === compare.metrics?.valAccuracy,
    },
  ]

  return rows
}

interface InferenceWorkbenchProps {
  model?: ModelRecord
  presetId: string
  dataset?: DatasetRecord
  featureFields: string[]
  exampleRows: number[][]
}

const InferenceWorkbench = ({
  model,
  presetId,
  dataset,
  featureFields,
  exampleRows,
}: InferenceWorkbenchProps) => {
  const [values, setValues] = useState<number[]>(() =>
    featureFields.map((_, index) => exampleRows[0]?.[index] ?? 0),
  )
  const [result, setResult] = useState<BrowserInferenceResult | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [isRunning, setIsRunning] = useState(false)

  const applyExample = (row: number[]) => {
    setValues(featureFields.map((_, index) => row[index] ?? 0))
  }

  const runInference = async () => {
    if (!model?.storageKey) {
      return
    }

    setIsRunning(true)
    setError(undefined)

    try {
      const nextResult = await runStoredModelInference({
        storageKey: model.storageKey,
        presetId,
        dataset,
        inputs: values,
      })
      setResult(nextResult)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Inference failed.')
    } finally {
      setIsRunning(false)
    }
  }

  if (!model) {
    return <p className="muted-copy">Train a model to unlock the interactive browser sandbox.</p>
  }

  if (!model.storageKey) {
    return (
      <p className="muted-copy">
        This demo model is metadata only. Train a fresh run to save a local browser model that you
        can test here.
      </p>
    )
  }

  return (
    <div className="inference-workbench">
      <div className="inference-workbench__fields">
        {featureFields.map((field, index) => (
          <label key={field} className="field-group">
            <span>{field}</span>
            <input
              type="number"
              step={0.01}
              value={values[index] ?? 0}
              onChange={(event) => {
                const nextValues = [...values]
                nextValues[index] = Number(event.target.value)
                setValues(nextValues)
              }}
            />
          </label>
        ))}
      </div>

      <div className="inference-workbench__examples">
        <p className="section-kicker">Sample inputs</p>
        <div className="tag-row">
          {exampleRows.map((row, index) => (
            <button
              key={`sample-${index}`}
              type="button"
              className="canvas-chip"
              onClick={() => applyExample(row)}
            >
              {dataset ? `Row ${index + 1}` : `Sample ${index + 1}`}
            </button>
          ))}
        </div>
      </div>

      <div className="inference-workbench__actions">
        <button type="button" className="primary-button" onClick={() => void runInference()}>
          {isRunning ? <LoaderCircle size={16} className="spin" /> : <ScanSearch size={16} />}
          Predict
        </button>
      </div>

      {error ? <p className="warning-copy">{error}</p> : null}

      {result ? (
        <div className="inference-result">
          <div className="stat-grid">
            <StatCard
              label={result.taskType === 'regression' ? 'Prediction' : 'Predicted class'}
              value={
                result.taskType === 'regression'
                  ? formatMetric(result.value)
                  : (result.predictedLabel ?? '-')
              }
              accent="#86f1c8"
            />
            <StatCard
              label={result.taskType === 'regression' ? 'Raw output' : 'Confidence'}
              value={
                result.taskType === 'regression'
                  ? formatMetric(result.raw[0])
                  : formatPercent(result.confidence)
              }
              accent="#8ecfff"
            />
            <StatCard
              label="Model"
              value={model.title}
              accent="#c59aff"
            />
          </div>

          <div className="inference-result__raw">
            <strong>Raw output</strong>
            <span>{result.raw.map((value) => value.toFixed(4)).join(', ')}</span>
          </div>
        </div>
      ) : (
        <p className="muted-copy">
          Inspired by TensorFlow Playground and Teachable Machine: change the inputs, run a local
          prediction, and inspect what the saved model outputs.
        </p>
      )}
    </div>
  )
}

export const TrainingConsole = () => {
  const stopRequestedRef = useRef(false)
  const datasetFileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [compareModelId, setCompareModelId] = useState('')
  const [diffOnly, setDiffOnly] = useState(false)
  const [importDraft, setImportDraft] = useState<ImportedDatasetDraft | undefined>(undefined)
  const [importTitle, setImportTitle] = useState('')
  const [importTargetField, setImportTargetField] = useState('')
  const [importTaskType, setImportTaskType] = useState<'binary-classification' | 'regression'>(
    'binary-classification',
  )
  const [datasetImportError, setDatasetImportError] = useState<string | undefined>(undefined)

  const {
    builder,
    datasets,
    experiments,
    models,
    training,
    selectTrainingPreset,
    setActiveDataset,
    importDataset,
    loadPresetArchitecture,
    loadModelIntoBuilder,
    updateTrainingConfig,
    setTrainingStatus,
    pushTrainingMetric,
    commitTrainingRun,
    resetTrainingRun,
  } = useLabStore(
    useShallow((state) => ({
      builder: state.builder,
      datasets: state.datasets,
      experiments: state.experiments,
      models: state.models,
      training: state.training,
      selectTrainingPreset: state.selectTrainingPreset,
      setActiveDataset: state.setActiveDataset,
      importDataset: state.importDataset,
      loadPresetArchitecture: state.loadPresetArchitecture,
      loadModelIntoBuilder: state.loadModelIntoBuilder,
      updateTrainingConfig: state.updateTrainingConfig,
      setTrainingStatus: state.setTrainingStatus,
      pushTrainingMetric: state.pushTrainingMetric,
      commitTrainingRun: state.commitTrainingRun,
      resetTrainingRun: state.resetTrainingRun,
    })),
  )

  const validation = useMemo(() => validateBuilderFlow(builder), [builder])
  const architectureSummary = useMemo(
    () => summarizeLayerPlan(validation.layerPlan),
    [validation.layerPlan],
  )
  const preset = trainingManifest.presets.find((entry) => entry.id === training.presetId)
  const currentExperiment = experiments[0]
  const dataset =
    datasets.find((entry) => entry.id === currentExperiment?.datasetId) ??
    datasets.find((entry) => entry.presetId === training.presetId)
  const latestMetric = training.metrics[training.metrics.length - 1]
  const experimentModels = useMemo(
    () =>
      models
        .filter((entry) => entry.experimentId === currentExperiment?.id)
        .sort((left, right) => right.version - left.version),
    [models, currentExperiment?.id],
  )

  const activeModelId =
    selectedModelId && experimentModels.some((entry) => entry.id === selectedModelId)
      ? selectedModelId
      : (training.currentModelId &&
          experimentModels.some((entry) => entry.id === training.currentModelId)
          ? training.currentModelId
          : (experimentModels[0]?.id ?? ''))

  const activeModel = experimentModels.find((entry) => entry.id === activeModelId)

  const compareAgainstId =
    compareModelId &&
    compareModelId !== activeModelId &&
    experimentModels.some((entry) => entry.id === compareModelId)
      ? compareModelId
      : (experimentModels.find((entry) => entry.id !== activeModelId)?.id ?? '')

  const compareModel = experimentModels.find((entry) => entry.id === compareAgainstId)

  const comparisonRows = useMemo(() => {
    if (!activeModel || !compareModel) {
      return []
    }

    const rows = createComparisonRows(activeModel, compareModel)
    return diffOnly ? rows.filter((row) => !row.same) : rows
  }, [activeModel, compareModel, diffOnly])

  const activePresetId = activeModel?.presetId ?? training.presetId
  const activeDataset =
    (activeModel?.datasetId
      ? datasets.find((entry) => entry.id === activeModel.datasetId)
      : undefined) ?? dataset

  const featureFields = useMemo(() => {
    if (activeDataset) {
      const fields = activeDataset.schema.filter((field) => field !== activeDataset.targetField)

      if (fields.length > 0) {
        return fields
      }
    }

    const inputUnits = validation.layerPlan.find((layer) => layer.kind === 'input')?.inputUnits ?? 2
    return Array.from({ length: inputUnits }, (_, index) => `feature_${index + 1}`)
  }, [activeDataset, validation.layerPlan])

  const inferenceExamples = useMemo(() => {
    if (activeDataset) {
      return activeDataset.sampleRows
        .slice(0, 4)
        .map((row) => featureFields.map((field) => coerceNumber(row[field])))
    }

    return generatePresetDataset(activePresetId).previewInputs.slice(0, 4)
  }, [activeDataset, activePresetId, featureFields])

  const handleTrain = async () => {
    if (!preset) {
      return
    }

    if (training.status === 'training') {
      stopRequestedRef.current = true
      return
    }

    stopRequestedRef.current = false
    resetTrainingRun()
    setTrainingStatus('training', `Training ${preset.name} in the browser...`)

    try {
      const result = await trainInBrowser({
        presetId: training.presetId,
        dataset,
        flow: builder,
        config: training.config,
        shouldStop: () => stopRequestedRef.current,
        onEpoch: (metric, parameterEstimate) => pushTrainingMetric(metric, parameterEstimate),
      })

      commitTrainingRun(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Training failed in the browser.'
      setTrainingStatus('error', message)
    } finally {
      stopRequestedRef.current = false
    }
  }

  const handleDatasetFile = async (file?: File) => {
    if (!file) {
      return
    }

    try {
      const draft = await parseDatasetFile(file)
      setImportDraft(draft)
      setImportTitle(draft.title)
      setImportTargetField(draft.suggestedTargetField)
      setImportTaskType(draft.suggestedTaskType)
      setDatasetImportError(undefined)
    } catch (error) {
      setImportDraft(undefined)
      setDatasetImportError(error instanceof Error ? error.message : 'Dataset import failed.')
    }
  }

  const confirmDatasetImport = () => {
    if (!importDraft) {
      return
    }

    try {
      const importedDataset = buildImportedDatasetRecord({
        title: importTitle,
        draft: importDraft,
        targetField: importTargetField,
        taskType: importTaskType,
      })

      importDataset(importedDataset)
      setImportDraft(undefined)
      setImportTitle('')
      setImportTargetField('')
      setDatasetImportError(undefined)
    } catch (error) {
      setDatasetImportError(error instanceof Error ? error.message : 'Dataset import failed.')
    }
  }

  return (
    <PanelFrame
      eyebrow="Trainer"
      title="Train and test models"
      subtitle="Inspired by TensorFlow Playground, Teachable Machine, and W&B: build a network, train it locally, compare runs, and test saved models in the browser."
      className="training-panel"
    >
      <input
        ref={datasetFileInputRef}
        type="file"
        accept=".csv,application/json,.json,text/csv"
        hidden
        onChange={async (event) => {
          await handleDatasetFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />

      <div className="training-layout">
        <section className="training-sidebar">
          <div className="builder-section">
            <p className="section-kicker">Task</p>
            <h3>Choose a training recipe</h3>
            <div className="preset-stack">
              {trainingManifest.presets.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`preset-card${entry.id === training.presetId ? ' is-active' : ''}`}
                  onClick={() => selectTrainingPreset(entry.id)}
                >
                  <strong>{entry.name}</strong>
                  <small>{entry.narrative}</small>
                  <div className="tag-row">
                    <TagPill label={entry.taskType.replace(/-/g, ' ')} muted />
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => preset && loadPresetArchitecture(preset.id)}
            >
              Load recommended flow
            </button>
          </div>

          <div className="builder-section">
            <p className="section-kicker">Dataset</p>
            <h3>Select or import tabular data</h3>
            <label className="field-group">
              <span>Active dataset</span>
              <select
                value={dataset?.id ?? ''}
                onChange={(event) => setActiveDataset(event.target.value)}
              >
                {datasets.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title} {entry.source === 'imported' ? '(Imported)' : '(Built-in)'}
                  </option>
                ))}
              </select>
            </label>

            <div className="tag-row">
              <TagPill label={dataset?.source === 'imported' ? 'Imported dataset' : 'Built-in demo'} muted />
              <TagPill label={dataset?.taskType.replace(/-/g, ' ') ?? 'No dataset'} muted />
              <TagPill
                label={`${dataset?.rows?.length ?? dataset?.sampleRows.length ?? 0} rows`}
                muted
              />
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => datasetFileInputRef.current?.click()}
            >
              <FileUp size={16} />
              Import CSV or JSON
            </button>

            {importDraft ? (
              <div className="chart-card training-import-card">
                <div className="chart-card__header">
                  <div>
                    <p className="section-kicker">Import staging</p>
                    <h3>Validate before adding</h3>
                  </div>
                </div>

                <div className="field-grid">
                  <label className="field-group">
                    <span>Dataset title</span>
                    <input
                      value={importTitle}
                      onChange={(event) => setImportTitle(event.target.value)}
                    />
                  </label>

                  <label className="field-group">
                    <span>Target field</span>
                    <select
                      value={importTargetField}
                      onChange={(event) => setImportTargetField(event.target.value)}
                    >
                      {importDraft.schema.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field-group">
                    <span>Task type</span>
                    <select
                      value={importTaskType}
                      onChange={(event) =>
                        setImportTaskType(
                          event.target.value as 'binary-classification' | 'regression',
                        )
                      }
                    >
                      <option value="binary-classification">Binary classification</option>
                      <option value="regression">Regression</option>
                    </select>
                  </label>
                </div>

                <div className="tag-row">
                  {importDraft.schema.map((field) => (
                    <TagPill
                      key={field}
                      label={`${field}: ${importDraft.fieldKinds[field]}`}
                      muted
                    />
                  ))}
                </div>

                <div className="training-actions__buttons">
                  <button type="button" className="primary-button" onClick={confirmDatasetImport}>
                    Add dataset
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setImportDraft(undefined)
                      setDatasetImportError(undefined)
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            {datasetImportError ? <p className="warning-copy">{datasetImportError}</p> : null}
          </div>

          <div className="builder-section">
            <p className="section-kicker">Hyperparameters</p>
            <h3>Training config</h3>
            <div className="field-grid">
              <label className="field-group">
                <span>Epochs</span>
                <input
                  type="number"
                  min={1}
                  max={400}
                  value={training.config.epochs}
                  onChange={(event) =>
                    updateTrainingConfig({ epochs: Number(event.target.value) })
                  }
                />
              </label>
              <label className="field-group">
                <span>Batch size</span>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={training.config.batchSize}
                  onChange={(event) =>
                    updateTrainingConfig({ batchSize: Number(event.target.value) })
                  }
                />
              </label>
              <label className="field-group">
                <span>Learning rate</span>
                <input
                  type="number"
                  step={0.001}
                  min={0.0001}
                  max={0.5}
                  value={training.config.learningRate}
                  onChange={(event) =>
                    updateTrainingConfig({ learningRate: Number(event.target.value) })
                  }
                />
              </label>
              <label className="field-group">
                <span>Validation split</span>
                <input
                  type="number"
                  step={0.05}
                  min={0.1}
                  max={0.5}
                  value={training.config.validationSplit}
                  onChange={(event) =>
                    updateTrainingConfig({ validationSplit: Number(event.target.value) })
                  }
                />
              </label>
            </div>
          </div>

          <div className="builder-section">
            <p className="section-kicker">Dataset preview</p>
            <h3>{dataset?.title ?? 'No dataset selected'}</h3>
            <p>{dataset?.description}</p>
            <p className="muted-copy">
              Target field: {dataset?.targetField ?? '-'}{dataset ? ' | ' : ''}
              Source: {dataset?.source ?? '-'}
            </p>
            {dataset ? (
              <div className="sample-table">
                <div
                  className="sample-table__header"
                  style={{ gridTemplateColumns: `repeat(${dataset.schema.length}, minmax(0, 1fr))` }}
                >
                  {dataset.schema.map((field) => (
                    <span key={field}>{field}</span>
                  ))}
                </div>
                {dataset.sampleRows.map((row, index) => (
                  <div
                    key={`${dataset.id}-${index}`}
                    className="sample-table__row"
                    style={{ gridTemplateColumns: `repeat(${dataset.schema.length}, minmax(0, 1fr))` }}
                  >
                    {dataset.schema.map((field) => (
                      <span key={field}>{String(row[field])}</span>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="training-main">
          <div className="training-actions">
            <div className="tag-row">
              <TagPill
                label={training.status}
                accent={
                  training.status === 'completed'
                    ? '#74e2b6'
                    : training.status === 'error'
                      ? '#ff9c7f'
                      : '#8ecfff'
                }
              />
              <TagPill label={`~${training.parameterEstimate} params`} muted />
              <TagPill label={preset?.name ?? 'No task'} muted />
            </div>
            <div className="training-actions__buttons">
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleTrain()}
                disabled={!validation.valid}
              >
                {training.status === 'training' ? (
                  <>
                    <Pause size={16} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Train current model
                  </>
                )}
              </button>

              <button type="button" className="secondary-button" onClick={resetTrainingRun}>
                <RotateCcw size={16} />
                Reset run
              </button>

              {activeModel ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => loadModelIntoBuilder(activeModel.id)}
                >
                  Load run into builder
                </button>
              ) : null}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Current target</p>
                <h3>What this run will train</h3>
              </div>
            </div>
            <div className="training-summary-grid">
              <div className="training-summary-item">
                <strong>Builder flow</strong>
                <span>{builder.title}</span>
                <small>{architectureSummary || 'Build a valid model chain to train.'}</small>
              </div>
              <div className="training-summary-item">
                <strong>Dataset</strong>
                <span>{dataset?.title ?? 'No dataset selected'}</span>
                <small>
                  {dataset
                    ? `${dataset.source === 'imported' ? 'Imported' : 'Built-in'} ${dataset.taskType.replace(/-/g, ' ')} data.`
                    : 'Choose or import a dataset to continue.'}
                </small>
              </div>
              <div className="training-summary-item">
                <strong>Saved model ready to test</strong>
                <span>{activeModel?.title ?? 'No saved model yet'}</span>
                <small>
                  Train a completed run to unlock the interactive local inference sandbox below.
                </small>
              </div>
            </div>
          </div>

          <div className="stat-grid">
            <StatCard label="Epoch" value={String(training.currentEpoch)} accent="#8ecfff" />
            <StatCard label="Loss" value={formatMetric(latestMetric?.loss)} accent="#ffd36c" />
            <StatCard
              label="Accuracy"
              value={formatPercent(latestMetric?.accuracy)}
              accent="#86f1c8"
            />
            <StatCard
              label="Saved model"
              value={training.modelStorageKey ? 'IndexedDB' : 'Pending'}
              accent="#c59aff"
            />
          </div>

          <div className="training-callout">
            {training.status === 'training' ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{training.message}</span>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Metrics</p>
                <h3>Loss and accuracy</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={training.metrics}>
                <CartesianGrid stroke="#173040" strokeDasharray="3 3" />
                <XAxis dataKey="epoch" stroke="#6a8699" />
                <YAxis stroke="#6a8699" />
                <Tooltip
                  contentStyle={{
                    background: '#07121d',
                    border: '1px solid #1b3242',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#ffd76c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="valLoss" stroke="#ffa96d" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="accuracy" stroke="#74e2b6" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="valAccuracy"
                  stroke="#7cc7ff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="training-grid">
            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <p className="section-kicker">Predictions</p>
                  <h3>Preview outputs</h3>
                </div>
              </div>
              <div className="prediction-list">
                {training.predictions.length === 0 ? (
                  <p className="muted-copy">Train the model to populate prediction previews.</p>
                ) : (
                  training.predictions.map((entry) => (
                    <div key={entry.label} className="prediction-row">
                      <strong>{entry.label}</strong>
                      <span>{entry.expected}</span>
                      <span>{entry.predicted}</span>
                      <small>
                        {entry.confidence ? formatPercent(entry.confidence) : '-'}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <p className="section-kicker">Builder summary</p>
                  <h3>Trainable chain</h3>
                </div>
              </div>
              <div className="prediction-list">
                {validation.layerPlan.map((layer) => (
                  <div key={layer.id} className="prediction-row">
                    <strong>{layer.label}</strong>
                    <span>{layer.kind}</span>
                    <span>{layer.units ?? layer.inputUnits ?? '-'}</span>
                    <small>{layer.parameterEstimate} params</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Interactive sandbox</p>
                <h3>Test a saved model with custom inputs</h3>
              </div>
            </div>
            <InferenceWorkbench
              key={`${activeModel?.id ?? 'none'}-${activePresetId}-${activeDataset?.id ?? 'dataset'}`}
              model={activeModel}
              presetId={activePresetId}
              dataset={activeDataset}
              featureFields={featureFields}
              exampleRows={inferenceExamples}
            />
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Experiment runs</p>
                <h3>Compare saved versions</h3>
              </div>
              <TagPill label="W&B-style compare view" muted />
            </div>

            {experimentModels.length === 0 ? (
              <p className="muted-copy">
                Completed training runs will appear here so you can compare configs and metrics.
              </p>
            ) : (
              <>
                <div className="comparison-toolbar">
                  <label className="field-group">
                    <span>Primary run</span>
                    <select
                      value={activeModelId}
                      onChange={(event) => setSelectedModelId(event.target.value)}
                    >
                      {experimentModels.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field-group">
                    <span>Compare against</span>
                    <select
                      value={compareAgainstId}
                      onChange={(event) => setCompareModelId(event.target.value)}
                    >
                      {experimentModels
                        .filter((entry) => entry.id !== activeModelId)
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.title}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="toolbar-toggle comparison-toolbar__toggle">
                    <input
                      type="checkbox"
                      checked={diffOnly}
                      onChange={(event) => setDiffOnly(event.target.checked)}
                    />
                    Diff only
                  </label>

                  {activeModel ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => loadModelIntoBuilder(activeModel.id)}
                    >
                      Load primary into builder
                    </button>
                  ) : null}
                </div>

                {activeModel && compareModel ? (
                  <div className="comparison-table">
                    <div className="comparison-table__header">
                      <span>Field</span>
                      <span>{activeModel.title}</span>
                      <span>{compareModel.title}</span>
                    </div>
                    {comparisonRows.length === 0 ? (
                      <p className="muted-copy">
                        The selected runs have matching values for every displayed field.
                      </p>
                    ) : (
                      comparisonRows.map((row) => (
                        <div
                          key={row.label}
                          className={`comparison-table__row${row.same ? '' : ' is-different'}`}
                        >
                          <strong>{row.label}</strong>
                          <span>{row.left}</span>
                          <span>{row.right}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="muted-copy">
                    Save at least two runs to unlock side-by-side comparison.
                  </p>
                )}
              </>
            )}
          </div>

          {training.confusionMatrix ? (
            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <p className="section-kicker">Classification quality</p>
                  <h3>Confusion matrix</h3>
                </div>
              </div>
              <div className="confusion-grid">
                <div className="confusion-grid__header" />
                {training.confusionMatrix.labels.map((label) => (
                  <div key={`header-${label}`} className="confusion-grid__header">
                    {label}
                  </div>
                ))}
                {training.confusionMatrix.values.map((row, rowIndex) => (
                  <div
                    key={`row-${training.confusionMatrix?.labels[rowIndex]}`}
                    className="confusion-grid__row"
                  >
                    <div className="confusion-grid__header">
                      {training.confusionMatrix?.labels[rowIndex]}
                    </div>
                    {row.map((value, columnIndex) => (
                      <div key={`${rowIndex}-${columnIndex}`} className="confusion-grid__cell">
                        {value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {validation.issues.length > 0 ? (
            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <p className="section-kicker">Validation</p>
                  <h3>Builder issues to fix before training</h3>
                </div>
              </div>
              <div className="builder-validation">
                {validation.issues.map((issue) => (
                  <TagPill key={issue} label={issue} accent="#ff9c7f" />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </PanelFrame>
  )
}
