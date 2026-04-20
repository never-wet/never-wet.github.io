import { componentRegistry, lessonRegistry, sampleCircuitIndex } from '../memory/contentRegistry'
import { uiManifest } from '../memory/uiManifest'
import { useCircuitLab } from '../state/CircuitLabContext'
import { formatDateTime, formatNumber } from '../utils/format'

export const InspectorPanel = () => {
  const {
    state,
    setInspectorTab,
    updateComponentParams,
    rotateSelected,
    flipSelected,
    deleteSelection,
    loadSample,
    loadSavedCircuit,
    markLessonComplete,
  } = useCircuitLab()

  const selectedComponents = state.currentCircuit.components.filter((component) =>
    state.selection.componentIds.includes(component.id),
  )
  const selectedComponent = selectedComponents.length === 1 ? selectedComponents[0] : null
  const activeLesson = lessonRegistry[state.learning.activeLessonId]

  return (
    <aside className="workspace-panel inspector-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Circuit</span>
          <h3>{state.currentCircuit.name}</h3>
        </div>
        <span className={state.simulationResult?.isClosedCircuit ? 'tag success' : 'tag'}>
          {state.simulationResult?.isClosedCircuit ? 'closed loop' : state.currentCircuit.mode}
        </span>
      </div>

      <div className="detail-card circuit-summary-card">
        <p>{state.currentCircuit.description}</p>
        <div className="tag-row">
          {state.currentCircuit.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="workspace-meta-grid">
          <div className="meta-stat">
            <span>Updated</span>
            <strong>{formatDateTime(state.currentCircuit.updatedAt)}</strong>
          </div>
          <div className="meta-stat">
            <span>Components</span>
            <strong>{state.currentCircuit.components.length}</strong>
          </div>
          <div className="meta-stat">
            <span>Wires</span>
            <strong>{state.currentCircuit.wires.length}</strong>
          </div>
          <div className="meta-stat">
            <span>Current</span>
            <strong>{formatNumber(state.simulationResult?.estimatedCurrent ?? 0, 3)} A</strong>
          </div>
        </div>
      </div>

      <div className="tab-row">
        {uiManifest.inspectorTabs.map((tab) => (
          <button
            key={tab.id}
            className={state.ui.inspectorTab === tab.id ? 'nav-pill is-active' : 'nav-pill'}
            onClick={() => setInspectorTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.ui.inspectorTab === 'inspector' && (
        <div className="inspector-scroll">
          {selectedComponent ? (
            <SelectedComponentInspector
              componentId={selectedComponent.id}
              deleteSelection={deleteSelection}
              flipSelected={flipSelected}
              rotateSelected={rotateSelected}
              updateComponentParams={updateComponentParams}
            />
          ) : selectedComponents.length > 1 ? (
            <div className="detail-card">
              <h4>Multi-selection</h4>
              <p>{selectedComponents.length} components selected on the board.</p>
              <div className="inline-actions">
                <button className="ghost-button" onClick={rotateSelected} type="button">
                  Rotate
                </button>
                <button className="ghost-button" onClick={flipSelected} type="button">
                  Flip
                </button>
                <button className="ghost-button danger" onClick={deleteSelection} type="button">
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="detail-card">
                <h4>Workbench focus</h4>
                <ul className="clean-list">
                  <li>Drag components from the left rail into the board.</li>
                  <li>Click a terminal, then another terminal, to route a wire.</li>
                  <li>Use Grid snap for cleaner diagrams or Freeform for quick sketching.</li>
                  <li>Run the simulator to surface path states, warnings, and current estimates.</li>
                </ul>
              </div>

              <div className="detail-card">
                <h4>Keyboard shortcuts</h4>
                <ul className="clean-list">
                  <li>`Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` redo</li>
                  <li>`Ctrl/Cmd+A` select all, `Ctrl/Cmd+D` duplicate selection</li>
                  <li>Arrow keys nudge selected components, `Shift+Arrow` moves faster</li>
                  <li>`Delete` removes the current selection</li>
                </ul>
              </div>

              <div className="detail-card">
                <h4>Starter boards</h4>
                <div className="list-stack">
                  {sampleCircuitIndex.slice(0, 3).map((sample) => (
                    <button className="list-row" key={sample.id} onClick={() => loadSample(sample.id)} type="button">
                      <div>
                        <strong>{sample.title}</strong>
                        <p>{sample.summary}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="detail-card">
                <h4>Saved versions</h4>
                {state.savedCircuits.length > 0 ? (
                  <div className="list-stack">
                    {state.savedCircuits.slice(0, 4).map((circuit) => (
                      <button
                        className="list-row"
                        key={circuit.id}
                        onClick={() => loadSavedCircuit(circuit.id)}
                        type="button"
                      >
                        <div>
                          <strong>{circuit.name}</strong>
                          <p>
                            {circuit.components.length} components - {circuit.wires.length} wires
                          </p>
                        </div>
                        <span className="tag">{formatDateTime(circuit.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <strong>No saved versions yet</strong>
                    <p>Use Save or Save a copy to keep local snapshots of your experiments.</p>
                  </div>
                )}
              </div>

              <div className="detail-card">
                <h4>Lab notes</h4>
                <p>
                  This workspace autosaves locally. Treat it like a sketchbook: load an example, tweak the values,
                  branch the circuit, and compare what the simulator reports.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {state.ui.inspectorTab === 'simulation' && (
        <div className="inspector-scroll">
          {state.simulationResult ? (
            <>
              <div className="detail-card">
                <h4>Simulation summary</h4>
                <ul className="clean-list">
                  <li>{state.simulationResult.isClosedCircuit ? 'Closed loop detected' : 'Open or inactive loop'}</li>
                  <li>Estimated current {formatNumber(state.simulationResult.estimatedCurrent, 3)} A</li>
                  <li>
                    Equivalent resistance {formatNumber(state.simulationResult.estimatedEquivalentResistance, 2)} ohm
                  </li>
                </ul>
              </div>

              <div className="detail-card">
                <h4>Warnings</h4>
                {state.simulationResult.warnings.length > 0 ? (
                  <div className="list-stack">
                    {state.simulationResult.warnings.map((warning) => (
                      <div className="list-row static-row" key={warning.id}>
                        <div>
                          <strong>{warning.severity.toUpperCase()}</strong>
                          <p>{warning.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No warnings. The current board fits the phase-1 simulator cleanly.</p>
                )}
              </div>

              <div className="detail-card">
                <h4>Branch summaries</h4>
                {state.simulationResult.branchStates.length > 0 ? (
                  <div className="list-stack">
                    {state.simulationResult.branchStates.map((branch) => (
                      <div className="list-row static-row" key={branch.id}>
                        <div>
                          <strong>{branch.label}</strong>
                          <p>
                            {formatNumber(branch.estimatedCurrent, 3)} A across about{' '}
                            {formatNumber(branch.estimatedResistance, 2)} ohm
                          </p>
                        </div>
                        <span className="tag">
                          {branch.componentIds.length} part{branch.componentIds.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No active branch summaries yet. Build a closed loop or a multi-branch circuit and run again.</p>
                )}
              </div>

              <div className="detail-card">
                <h4>Component states</h4>
                <div className="list-stack">
                  {state.currentCircuit.components.map((component) => {
                    const componentState = state.simulationResult?.componentStates[component.id]
                    if (!componentState) {
                      return null
                    }

                    return (
                      <div className="list-row static-row" key={component.id}>
                        <div>
                          <strong>{componentRegistry[component.typeId].name}</strong>
                          <p>{componentState.notes[0] ?? 'No note'}</p>
                        </div>
                        <span className={componentState.status === 'powered' ? 'tag success' : 'tag'}>
                          {componentState.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="detail-card">
                <h4>Simulation log</h4>
                {state.simulationResult.log.length > 0 ? (
                  <ul className="clean-list">
                    {state.simulationResult.log.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Run the circuit to capture path and validation notes here.</p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>No simulation run yet</strong>
              <p>Click Run to populate current estimates, warnings, and component state details.</p>
            </div>
          )}
        </div>
      )}

      {state.ui.inspectorTab === 'lesson' && (
        <div className="inspector-scroll">
          <div className="detail-card">
            <h4>{activeLesson.title}</h4>
            <p>{activeLesson.summary}</p>
            <ul className="clean-list">
              {activeLesson.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
            <div className="inline-actions">
              {activeLesson.sampleCircuitId ? (
                <button
                  className="ghost-button"
                  onClick={() => loadSample(activeLesson.sampleCircuitId as string)}
                  type="button"
                >
                  Load lesson circuit
                </button>
              ) : null}
              <button className="primary-button" onClick={() => markLessonComplete(activeLesson.id)} type="button">
                Complete lesson
              </button>
            </div>
          </div>

          <div className="detail-card">
            <h4>Build checklist</h4>
            <ol className="number-list">
              {activeLesson.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="detail-card">
            <h4>Common mistakes</h4>
            <ul className="clean-list">
              {activeLesson.commonMistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </aside>
  )
}

const SelectedComponentInspector = ({
  componentId,
  updateComponentParams,
  rotateSelected,
  flipSelected,
  deleteSelection,
}: {
  componentId: string
  updateComponentParams: (componentId: string, patch: Record<string, string | number | boolean>) => void
  rotateSelected: () => void
  flipSelected: () => void
  deleteSelection: () => void
}) => {
  const { state } = useCircuitLab()
  const component = state.currentCircuit.components.find((entry) => entry.id === componentId)

  if (!component) {
    return null
  }

  const definition = componentRegistry[component.typeId]
  const simulationState = state.simulationResult?.componentStates[component.id]

  return (
    <>
      <div className="detail-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{definition.category}</span>
            <h4>{definition.name}</h4>
          </div>
          <span className={definition.simulationSupport === 'supported' ? 'tag success' : 'tag'}>
            {definition.simulationSupport}
          </span>
        </div>
        <p>{definition.educationalSummary}</p>
        {simulationState && (
          <div className="simulation-chip-row">
            <span className={simulationState.status === 'powered' ? 'tag success' : 'tag'}>
              {simulationState.status}
            </span>
            {simulationState.current !== undefined && (
              <span className="tag">{formatNumber(simulationState.current, 3)} A</span>
            )}
            {simulationState.voltageDrop !== undefined && (
              <span className="tag">{formatNumber(simulationState.voltageDrop, 2)} V drop</span>
            )}
          </div>
        )}
        <div className="inline-actions">
          <button className="ghost-button" onClick={rotateSelected} type="button">
            Rotate
          </button>
          <button className="ghost-button" onClick={flipSelected} type="button">
            Flip
          </button>
          <button className="ghost-button danger" onClick={deleteSelection} type="button">
            Delete
          </button>
        </div>
      </div>

      {definition.parameters.length > 0 && (
        <div className="detail-card">
          <h4>Editable parameters</h4>
          <div className="form-stack">
            {definition.parameters.map((parameter) => {
              const value = component.params[parameter.id]

              if (parameter.type === 'boolean') {
                return (
                  <label className="form-row" key={parameter.id}>
                    <span>{parameter.label}</span>
                    <input
                      checked={Boolean(value)}
                      onChange={(event) =>
                        updateComponentParams(component.id, { [parameter.id]: event.target.checked })
                      }
                      type="checkbox"
                    />
                  </label>
                )
              }

              if (parameter.type === 'select') {
                return (
                  <label className="form-row" key={parameter.id}>
                    <span>{parameter.label}</span>
                    <select
                      onChange={(event) =>
                        updateComponentParams(component.id, { [parameter.id]: event.target.value })
                      }
                      value={String(value)}
                    >
                      {parameter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }

              return (
                <label className="form-row" key={parameter.id}>
                  <span>
                    {parameter.label}
                    {parameter.unit ? ` (${parameter.unit})` : ''}
                  </span>
                  <input
                    max={parameter.max}
                    min={parameter.min}
                    onChange={(event) =>
                      updateComponentParams(component.id, {
                        [parameter.id]:
                          parameter.type === 'number' ? Number(event.target.value) : event.target.value,
                      })
                    }
                    step={parameter.step}
                    type={parameter.type === 'number' ? 'number' : 'text'}
                    value={String(value)}
                  />
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="detail-card">
        <h4>Validation notes</h4>
        <ul className="clean-list">
          {definition.validationRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </>
  )
}
