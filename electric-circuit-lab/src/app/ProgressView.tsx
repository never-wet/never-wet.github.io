import { lessonIndex } from '../memory/lessonIndex'
import { quizIndex } from '../memory/quizIndex'
import { sampleCircuitIndex } from '../memory/contentRegistry'
import { useCircuitLab } from '../state/CircuitLabContext'
import { formatDateTime } from '../utils/format'

export const ProgressView = () => {
  const {
    state,
    loadSavedCircuit,
    setActiveLesson,
    setActiveQuiz,
    loadSample,
    renameSavedCircuit,
    deleteSavedCircuit,
  } = useCircuitLab()

  const completedLessons = lessonIndex.filter((lesson) => state.learning.completedLessonIds.includes(lesson.id))
  const passedQuizzes = quizIndex.filter((quiz) => state.practice.results[quiz.id]?.lastCorrect)

  return (
    <section className="page-stack">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h2>Track learning progress, saved work, and the circuits you come back to most.</h2>
          <p>
            Everything in this dashboard is stored locally in the browser so you can treat the site like a serious
            learning workspace and lab notebook.
          </p>
        </div>
      </div>

      <div className="hero-card-grid">
        <article className="stat-card">
          <span>Saved Circuits</span>
          <strong>{state.savedCircuits.length}</strong>
          <p>Autosave protects the current workspace, and named saves help you keep milestones.</p>
        </article>
        <article className="stat-card">
          <span>Completed Lessons</span>
          <strong>{completedLessons.length}</strong>
          <p>Move from beginner loops to logic and troubleshooting with visible progress.</p>
        </article>
        <article className="stat-card">
          <span>Passed Quizzes</span>
          <strong>{passedQuizzes.length}</strong>
          <p>Practice entries remember attempts, best score, and the most recent result.</p>
        </article>
        <article className="stat-card">
          <span>Recent Workspace</span>
          <strong>{state.currentCircuit.name}</strong>
          <p>Last updated {formatDateTime(state.currentCircuit.updatedAt)}</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Saved Circuits</span>
              <h3>Local Lab Files</h3>
            </div>
          </div>
          {state.savedCircuits.length > 0 ? (
            <div className="list-stack">
              {state.savedCircuits.map((circuit) => (
                <div className="list-row static-row saved-row" key={circuit.id}>
                  <button className="saved-row-main" onClick={() => loadSavedCircuit(circuit.id)} type="button">
                    <div>
                      <strong>{circuit.name}</strong>
                      <p>
                        {circuit.components.length} components - {circuit.wires.length} wires
                      </p>
                    </div>
                    <span className="tag">{formatDateTime(circuit.updatedAt)}</span>
                  </button>
                  <div className="inline-actions">
                    <button
                      className="ghost-button"
                      onClick={() => {
                        const name = window.prompt('Rename saved circuit', circuit.name)
                        if (name !== null) {
                          renameSavedCircuit(circuit.id, name)
                        }
                      }}
                      type="button"
                    >
                      Rename
                    </button>
                    <button
                      className="ghost-button danger"
                      onClick={() => {
                        if (window.confirm(`Delete "${circuit.name}" from local saved circuits?`)) {
                          deleteSavedCircuit(circuit.id)
                        }
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <strong>No saved files yet</strong>
              <p>Save from the builder or sandbox toolbar to populate this dashboard.</p>
            </div>
          )}
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Completed Lessons</span>
              <h3>Concept Mastery</h3>
            </div>
          </div>
          {completedLessons.length > 0 ? (
            <div className="list-stack">
              {completedLessons.map((lesson) => (
                <button className="list-row" key={lesson.id} onClick={() => setActiveLesson(lesson.id)} type="button">
                  <div>
                    <strong>{lesson.title}</strong>
                    <p>{lesson.summary}</p>
                  </div>
                  <span className="tag success">Complete</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <strong>Lessons will appear here</strong>
              <p>Mark lessons complete from the Learn section as you work through them.</p>
            </div>
          )}
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Starter Boards</span>
              <h3>Sample Workflow Launches</h3>
            </div>
          </div>
          <div className="list-stack">
            {sampleCircuitIndex.map((sample) => (
              <button className="list-row" key={sample.id} onClick={() => loadSample(sample.id)} type="button">
                <div>
                  <strong>{sample.title}</strong>
                  <p>{sample.summary}</p>
                </div>
                <span className="tag">{sample.learningFocus[0]}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Quiz Results</span>
              <h3>Practice Record</h3>
            </div>
          </div>
          {passedQuizzes.length > 0 ? (
            <div className="list-stack">
              {quizIndex.map((quiz) => {
                const result = state.practice.results[quiz.id]
                return (
                  <button className="list-row" key={quiz.id} onClick={() => setActiveQuiz(quiz.id)} type="button">
                    <div>
                      <strong>{quiz.title}</strong>
                      <p>
                        {result ? `${result.attempts} attempt${result.attempts === 1 ? '' : 's'}` : 'Not attempted yet'}
                      </p>
                    </div>
                    <span className={result?.lastCorrect ? 'tag success' : 'tag'}>
                      {result?.lastCorrect ? 'Passed' : 'Open'}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="empty-state compact">
              <strong>No quiz wins yet</strong>
              <p>Open Practice to start working through predictions, troubleshooting, and build checks.</p>
            </div>
          )}
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Persistence</span>
              <h3>What the Browser Saves</h3>
            </div>
          </div>
          <ul className="clean-list">
            <li>Current workspace and last opened board</li>
            <li>Named saved circuits and recent work</li>
            <li>Lesson completion and unlocked content</li>
            <li>Quiz attempts, results, and active challenge</li>
            <li>UI tabs, active section, and simulation preferences</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
