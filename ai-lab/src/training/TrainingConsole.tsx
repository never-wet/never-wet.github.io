import { useMemo, useRef } from 'react'
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
import { LoaderCircle, Pause, Play, RotateCcw, Save } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { PanelFrame } from '../components/PanelFrame'
import { StatCard } from '../components/StatCard'
import { TagPill } from '../components/TagPill'
import { trainingManifest } from '../memory/trainingManifest'
import { useLabStore } from '../state/useLabStore'
import { validateBuilderFlow } from '../utils/builder'
import { formatMetric, formatPercent } from '../utils/format'
import { trainInBrowser } from './tfjsEngine'

export const TrainingConsole = () => {
  const stopRequestedRef = useRef(false)
  const {
    builder,
    datasets,
    training,
    selectTrainingPreset,
    loadPresetArchitecture,
    updateTrainingConfig,
    setTrainingStatus,
    pushTrainingMetric,
    commitTrainingRun,
    resetTrainingRun,
  } = useLabStore(
    useShallow((state) => ({
      builder: state.builder,
      datasets: state.datasets,
      training: state.training,
      selectTrainingPreset: state.selectTrainingPreset,
      loadPresetArchitecture: state.loadPresetArchitecture,
      updateTrainingConfig: state.updateTrainingConfig,
      setTrainingStatus: state.setTrainingStatus,
      pushTrainingMetric: state.pushTrainingMetric,
      commitTrainingRun: state.commitTrainingRun,
      resetTrainingRun: state.resetTrainingRun,
    })),
  )

  const validation = useMemo(() => validateBuilderFlow(builder), [builder])
  const preset = trainingManifest.presets.find((entry) => entry.id === training.presetId)
  const dataset = datasets.find((entry) => entry.presetId === training.presetId)
  const latestMetric = training.metrics[training.metrics.length - 1]

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

  return (
    <PanelFrame
      eyebrow="Training"
      title="In-browser model training"
      subtitle="TensorFlow.js runs the current builder flow locally, then persists completed models into IndexedDB."
      className="training-panel"
    >
      <div className="training-layout">
        <section className="training-sidebar">
          <div className="builder-section">
            <p className="section-kicker">Preset</p>
            <h3>Choose a browser task</h3>
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
                    <TagPill label={entry.taskType.replace('-', ' ')} muted />
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
            {dataset ? (
              <div className="sample-table">
                <div className="sample-table__header">
                  {dataset.schema.map((field) => (
                    <span key={field}>{field}</span>
                  ))}
                </div>
                {dataset.sampleRows.map((row, index) => (
                  <div key={`${dataset.id}-${index}`} className="sample-table__row">
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
                    Train
                  </>
                )}
              </button>

              <button type="button" className="secondary-button" onClick={resetTrainingRun}>
                <RotateCcw size={16} />
                Reset run
              </button>
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
            {training.status === 'training' ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
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
                    borderRadius: 12,
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
                      <small>{entry.confidence ? formatPercent(entry.confidence) : '—'}</small>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <p className="section-kicker">Validation</p>
                  <h3>Builder summary</h3>
                </div>
              </div>
              <div className="prediction-list">
                {validation.layerPlan.map((layer) => (
                  <div key={layer.id} className="prediction-row">
                    <strong>{layer.label}</strong>
                    <span>{layer.kind}</span>
                    <span>{layer.units ?? layer.inputUnits ?? '—'}</span>
                    <small>{layer.parameterEstimate} params</small>
                  </div>
                ))}
              </div>
            </div>
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
                  <div key={`row-${training.confusionMatrix?.labels[rowIndex]}`} className="confusion-grid__row">
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
        </section>
      </div>
    </PanelFrame>
  )
}
