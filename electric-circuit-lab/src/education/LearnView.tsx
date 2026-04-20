import { lessonIndex } from '../memory/lessonIndex'
import { componentRegistry, quizRegistry } from '../memory/contentRegistry'
import { useCircuitLab } from '../state/CircuitLabContext'

export const LearnView = () => {
  const { state, setActiveLesson, markLessonComplete, loadSample, setActiveSection, setActiveQuiz } = useCircuitLab()
  const lesson = lessonIndex.find((entry) => entry.id === state.learning.activeLessonId) ?? lessonIndex[0]
  const challengeQuiz = lesson.relatedQuizId ? quizRegistry[lesson.relatedQuizId] : undefined
  const nextLesson = lessonIndex[lessonIndex.findIndex((entry) => entry.id === lesson.id) + 1]

  return (
    <section className="page-stack">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Guided Learning</span>
          <h2>Lessons that connect concepts to a live circuit board.</h2>
          <p>
            Every lesson is written to move from explanation to experimentation. Load the linked sample circuit, edit
            values, and then verify what happened in simulation instead of treating the theory as static text.
          </p>
        </div>
        <div className="hero-side-stat">
          <strong>{state.learning.completedLessonIds.length}</strong>
          <span>lessons completed</span>
        </div>
      </div>

      <div className="split-layout">
        <aside className="surface-card lesson-list">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Roadmap</span>
              <h3>Lesson Path</h3>
            </div>
          </div>
          <div className="list-stack">
            {lessonIndex.map((entry) => {
              const unlocked = state.learning.unlockedLessonIds.includes(entry.id)
              const completed = state.learning.completedLessonIds.includes(entry.id)

              return (
                <button
                  key={entry.id}
                  className={entry.id === lesson.id ? 'lesson-pill is-active' : 'lesson-pill'}
                  disabled={!unlocked}
                  onClick={() => setActiveLesson(entry.id)}
                  type="button"
                >
                  <div>
                    <strong>{entry.title}</strong>
                    <p>{entry.summary}</p>
                  </div>
                  <span className={completed ? 'tag success' : 'tag'}>{completed ? 'Done' : entry.duration}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <article className="surface-card lesson-detail">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{lesson.difficulty}</span>
              <h3>{lesson.title}</h3>
            </div>
            <div className="inline-actions">
              {lesson.sampleCircuitId && (
                <button className="ghost-button" onClick={() => loadSample(lesson.sampleCircuitId!)} type="button">
                  Load Sample Circuit
                </button>
              )}
              {challengeQuiz && (
                <button className="ghost-button" onClick={() => setActiveQuiz(challengeQuiz.id)} type="button">
                  Open Challenge
                </button>
              )}
              <button className="primary-button" onClick={() => markLessonComplete(lesson.id)} type="button">
                Mark Complete
              </button>
            </div>
          </div>

          <p className="lead-paragraph">{lesson.summary}</p>

          <div className="detail-grid">
            <div className="detail-card">
              <h4>Learning Goals</h4>
              <ul className="clean-list">
                {lesson.goals.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </div>
            <div className="detail-card">
              <h4>Core Concepts</h4>
              <div className="tag-row">
                {lesson.concepts.map((concept) => (
                  <span className="tag" key={concept}>
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h4>Step by Step</h4>
            <ol className="number-list">
              {lesson.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <h4>Checkpoints</h4>
              <ul className="clean-list">
                {lesson.checkpoints.map((checkpoint) => (
                  <li key={checkpoint}>{checkpoint}</li>
                ))}
              </ul>
            </div>
            <div className="detail-card">
              <h4>Common Mistakes</h4>
              <ul className="clean-list">
                {lesson.commonMistakes.map((mistake) => (
                  <li key={mistake}>{mistake}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="detail-card">
            <h4>Component Links</h4>
            <div className="tag-row">
              {lesson.exampleComponentIds.map((componentId) => (
                <button
                  className="tag interactive"
                  key={componentId}
                  onClick={() => setActiveSection('library')}
                  type="button"
                >
                  {componentRegistry[componentId].name}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-card callout-card">
            <h4>Challenge Prompt</h4>
            <p>{lesson.challengePrompt}</p>
            {challengeQuiz && (
              <div className="inline-actions">
                <button className="ghost-button" onClick={() => setActiveQuiz(challengeQuiz.id)} type="button">
                  Try {challengeQuiz.title}
                </button>
              </div>
            )}
          </div>

          {nextLesson && (
            <div className="detail-card">
              <h4>Next Up</h4>
              <p>{nextLesson.title}</p>
              <p>{nextLesson.summary}</p>
              <div className="inline-actions">
                <button className="ghost-button" onClick={() => setActiveLesson(nextLesson.id)} type="button">
                  Preview Next Lesson
                </button>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
