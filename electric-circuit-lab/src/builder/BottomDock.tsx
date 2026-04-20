import { lessonRegistry, quizRegistry } from '../memory/contentRegistry'
import { uiManifest } from '../memory/uiManifest'
import { useCircuitLab } from '../state/CircuitLabContext'
import { formatNumber } from '../utils/format'
import { SignalMonitor } from './SignalMonitor'

const truthTable = [
  { a: 0, b: 0, and: 0, or: 0, xor: 0 },
  { a: 0, b: 1, and: 0, or: 1, xor: 1 },
  { a: 1, b: 0, and: 0, or: 1, xor: 1 },
  { a: 1, b: 1, and: 1, or: 1, xor: 0 },
]

export const BottomDock = () => {
  const { state, setBottomPanelTab } = useCircuitLab()
  const lesson = lessonRegistry[state.learning.activeLessonId]
  const quiz = quizRegistry[state.practice.activeQuizId]

  return (
    <section className="workspace-dock">
      <div className="tab-row">
        {uiManifest.bottomTabs.map((tab) => (
          <button
            className={state.ui.bottomPanelTab === tab.id ? 'nav-pill is-active' : 'nav-pill'}
            key={tab.id}
            onClick={() => setBottomPanelTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.ui.bottomPanelTab === 'guide' && (
        <div className="dock-grid">
          <article className="dock-card">
            <h4>Active Lesson Guide</h4>
            <p>{lesson.summary}</p>
            <ol className="number-list">
              {lesson.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article className="dock-card">
            <h4>Current Practice Prompt</h4>
            <p>{quiz.prompt}</p>
            <div className="feedback-card">
              <strong>Hint</strong>
              <p>{quiz.hint}</p>
            </div>
          </article>
        </div>
      )}

      {state.ui.bottomPanelTab === 'log' && (
        <>
          <div className="dock-grid">
            <article className="dock-card">
              <h4>Simulation Log</h4>
              {state.simulationResult?.log.length ? (
                <ul className="clean-list">
                  {state.simulationResult.log.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <p>Run the simulation to populate the log with path and warning notes.</p>
              )}
            </article>
            <article className="dock-card">
              <h4>Voltage and Current Snapshot</h4>
              {state.simulationResult ? (
                <ul className="clean-list">
                  <li>Current: {formatNumber(state.simulationResult.estimatedCurrent, 3)} A</li>
                  <li>
                    Equivalent resistance: {formatNumber(state.simulationResult.estimatedEquivalentResistance, 2)} ohm
                  </li>
                  <li>Node hints: {state.simulationResult.nodeStates.length}</li>
                </ul>
              ) : (
                <p>The dock will summarize currents, resistance, and node states after a run.</p>
              )}
            </article>
          </div>
          <SignalMonitor circuit={state.currentCircuit} simulationResult={state.simulationResult} />
        </>
      )}

      {state.ui.bottomPanelTab === 'formula' && (
        <div className="dock-grid">
          <article className="dock-card">
            <h4>Core Formulas</h4>
            <ul className="clean-list">
              <li>
                <strong>Ohm&apos;s law:</strong> V = I x R
              </li>
              <li>
                <strong>Current:</strong> I = V / R
              </li>
              <li>
                <strong>Power:</strong> P = V x I
              </li>
              <li>
                <strong>Series resistance:</strong> Rtotal = R1 + R2 + ...
              </li>
              <li>
                <strong>Parallel resistance:</strong> 1 / Rtotal = 1 / R1 + 1 / R2 + ...
              </li>
            </ul>
          </article>

          <article className="dock-card">
            <h4>Logic Truth Table</h4>
            <table className="truth-table">
              <thead>
                <tr>
                  <th>A</th>
                  <th>B</th>
                  <th>AND</th>
                  <th>OR</th>
                  <th>XOR</th>
                </tr>
              </thead>
              <tbody>
                {truthTable.map((row) => (
                  <tr key={`${row.a}-${row.b}`}>
                    <td>{row.a}</td>
                    <td>{row.b}</td>
                    <td>{row.and}</td>
                    <td>{row.or}</td>
                    <td>{row.xor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      )}
    </section>
  )
}
