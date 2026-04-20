import { appManifest } from '../memory/appManifest'
import { lessonIndex } from '../memory/lessonIndex'
import { quizIndex } from '../memory/quizIndex'
import { sampleCircuitIndex } from '../memory/contentRegistry'
import { useCircuitLab } from '../state/CircuitLabContext'
import { formatDateTime } from '../utils/format'

export const HomeView = () => {
  const { state, setActiveSection, loadSample, loadSavedCircuit } = useCircuitLab()

  const recentSaved = state.savedCircuits[0]
  const resumeCurrent = () => {
    if (state.lastOpenedWorkspaceId && state.savedCircuits.some((entry) => entry.id === state.lastOpenedWorkspaceId)) {
      loadSavedCircuit(state.lastOpenedWorkspaceId)
    }
    setActiveSection('builder')
  }

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Modern Browser Electronics Platform</span>
          <h2>Learn theory, wire circuits, run simulations, and practice troubleshooting without leaving the browser.</h2>
          <p>
            Circuit Studio combines a lesson hub, a real drag-and-drop circuit board, an educational hybrid simulator,
            a practice system, and a freeform sandbox so the same workspace can teach and test.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setActiveSection('builder')} type="button">
              Jump Into Builder
            </button>
            <button className="ghost-button" onClick={() => setActiveSection('learn')} type="button">
              Start a Lesson
            </button>
            <button className="ghost-button" onClick={resumeCurrent} type="button">
              Continue Building
            </button>
          </div>
        </div>

        <div className="hero-card-grid">
          <article className="stat-card highlight">
            <span>Sections</span>
            <strong>{appManifest.sections.length}</strong>
            <p>Home, lessons, builder, simulation, quizzes, sandbox, library, and progress.</p>
          </article>
          <article className="stat-card">
            <span>Current Workspace</span>
            <strong>{state.currentCircuit.name}</strong>
            <p>Last updated {formatDateTime(state.currentCircuit.updatedAt)}</p>
          </article>
          <article className="stat-card">
            <span>Completed Lessons</span>
            <strong>{state.learning.completedLessonIds.length}</strong>
            <p>Track progress and unlock the next concepts as you go.</p>
          </article>
          <article className="stat-card">
            <span>Quiz Attempts</span>
            <strong>{Object.values(state.practice.results).reduce((sum, result) => sum + result.attempts, 0)}</strong>
            <p>Instant feedback with retries, hints, and explanations.</p>
          </article>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Quick Start</span>
              <h3>Featured Launches</h3>
            </div>
          </div>
          <div className="quick-grid">
            {sampleCircuitIndex.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                className="quick-card"
                onClick={() => loadSample(sample.id)}
                type="button"
              >
                <strong>{sample.title}</strong>
                <p>{sample.summary}</p>
                <span>{sample.learningFocus.join(' / ')}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Learning Path</span>
              <h3>Featured Lessons</h3>
            </div>
            <button className="text-button" onClick={() => setActiveSection('learn')} type="button">
              Open Learn
            </button>
          </div>
          <div className="list-stack">
            {lessonIndex.slice(0, 4).map((lesson) => (
              <button
                key={lesson.id}
                className="list-row"
                onClick={() => setActiveSection('learn')}
                type="button"
              >
                <div>
                  <strong>{lesson.title}</strong>
                  <p>{lesson.summary}</p>
                </div>
                <span className="tag">{lesson.duration}</span>
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Practice</span>
              <h3>Challenge Queue</h3>
            </div>
            <button className="text-button" onClick={() => setActiveSection('practice')} type="button">
              Open Practice
            </button>
          </div>
          <div className="list-stack">
            {quizIndex.slice(0, 4).map((quiz) => (
              <div className="list-row static-row" key={quiz.id}>
                <div>
                  <strong>{quiz.title}</strong>
                  <p>{quiz.prompt}</p>
                </div>
                <span className="tag">{quiz.kind}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Saved Work</span>
              <h3>Continue from Recent Files</h3>
            </div>
            <button className="text-button" onClick={() => setActiveSection('progress')} type="button">
              Open Progress
            </button>
          </div>
          {recentSaved ? (
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
              <strong>No saved circuits yet</strong>
              <p>Build in the workspace, then use Save to keep versions locally in this browser.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
