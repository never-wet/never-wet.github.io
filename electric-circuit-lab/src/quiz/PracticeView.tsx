import { useEffect, useState } from 'react'
import { quizIndex } from '../memory/quizIndex'
import { useCircuitLab } from '../state/CircuitLabContext'
import { simulateCircuit } from '../simulation/engine'

export const PracticeView = () => {
  const { state, setActiveQuiz, submitQuizAnswer, loadSample, setActiveSection } = useCircuitLab()
  const quiz = quizIndex.find((entry) => entry.id === state.practice.activeQuizId) ?? quizIndex[0]
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const buildSimulation = quiz.kind === 'build-check' ? simulateCircuit(state.currentCircuit) : null
  const currentTypeCounts = state.currentCircuit.components.reduce<Record<string, number>>((accumulator, component) => {
    accumulator[component.typeId] = (accumulator[component.typeId] ?? 0) + 1
    return accumulator
  }, {})

  useEffect(() => {
    setSelectedChoice(null)
    setFeedback(null)
  }, [quiz.id])

  const checkBuildChallenge = () => {
    const currentTypes = new Set(state.currentCircuit.components.map((component) => component.typeId))
    const requirement = quiz.expectedBuild
    if (!requirement) {
      return
    }

    const hasRequiredTypes = requirement.requiredTypes.every((typeId) => currentTypes.has(typeId))
    const hasRequiredTypeCounts = Object.entries(requirement.requiredTypeCounts ?? {}).every(
      ([typeId, count]) => (currentTypeCounts[typeId] ?? 0) >= count,
    )
    const hasWireCount = state.currentCircuit.wires.length >= requirement.minimumWires
    const simulation = buildSimulation ?? simulateCircuit(state.currentCircuit)
    const passesLoop = requirement.mustBeClosedLoop ? simulation.isClosedCircuit : true
    const passesBranches = requirement.minimumBranches ? simulation.branchStates.length >= requirement.minimumBranches : true
    const passesPoweredTypes = (requirement.requiredPoweredTypes ?? []).every((typeId) =>
      state.currentCircuit.components.some(
        (component) =>
          component.typeId === typeId &&
          simulation.componentStates[component.id]?.status === 'powered',
      ),
    )
    const avoidsForbiddenTypes = !(requirement.forbiddenTypes ?? []).some((typeId) => currentTypes.has(typeId))
    const correct =
      hasRequiredTypes &&
      hasRequiredTypeCounts &&
      hasWireCount &&
      passesLoop &&
      passesBranches &&
      passesPoweredTypes &&
      avoidsForbiddenTypes

    submitQuizAnswer(quiz.id, correct)
    setFeedback({
      correct,
      message: correct
        ? quiz.explanation
        : `${quiz.hint} Make sure the board includes ${requirement.requiredTypes.join(', ')}, enough wiring, and the right powered result.`,
    })
  }

  const handleChoice = (choiceId: string) => {
    if (!quiz.correctChoiceId) {
      return
    }

    const correct = choiceId === quiz.correctChoiceId
    setSelectedChoice(choiceId)
    submitQuizAnswer(quiz.id, correct)
    setFeedback({
      correct,
      message: correct ? quiz.explanation : quiz.hint,
    })
  }

  const buildChecks =
    quiz.kind === 'build-check' && quiz.expectedBuild && buildSimulation
      ? [
          {
            label: 'Required types',
            passed: quiz.expectedBuild.requiredTypes.every((typeId) => currentTypeCounts[typeId] > 0),
            detail: quiz.expectedBuild.requiredTypes.join(', '),
          },
          ...Object.entries(quiz.expectedBuild.requiredTypeCounts ?? {}).map(([typeId, count]) => ({
            label: `${typeId} count`,
            passed: (currentTypeCounts[typeId] ?? 0) >= count,
            detail: `${currentTypeCounts[typeId] ?? 0}/${count}`,
          })),
          {
            label: 'Minimum wires',
            passed: state.currentCircuit.wires.length >= quiz.expectedBuild.minimumWires,
            detail: `${state.currentCircuit.wires.length}/${quiz.expectedBuild.minimumWires}`,
          },
          {
            label: 'Closed loop',
            passed: quiz.expectedBuild.mustBeClosedLoop ? buildSimulation.isClosedCircuit : true,
            detail: quiz.expectedBuild.mustBeClosedLoop ? (buildSimulation.isClosedCircuit ? 'closed' : 'open') : 'optional',
          },
          {
            label: 'Branch count',
            passed: quiz.expectedBuild.minimumBranches ? buildSimulation.branchStates.length >= quiz.expectedBuild.minimumBranches : true,
            detail: quiz.expectedBuild.minimumBranches ? `${buildSimulation.branchStates.length}/${quiz.expectedBuild.minimumBranches}` : 'optional',
          },
          {
            label: 'Powered outputs',
            passed: (quiz.expectedBuild.requiredPoweredTypes ?? []).every((typeId) =>
              state.currentCircuit.components.some(
                (component) =>
                  component.typeId === typeId &&
                  buildSimulation.componentStates[component.id]?.status === 'powered',
              ),
            ),
            detail:
              quiz.expectedBuild.requiredPoweredTypes && quiz.expectedBuild.requiredPoweredTypes.length > 0
                ? quiz.expectedBuild.requiredPoweredTypes.join(', ')
                : 'optional',
          },
        ]
      : []
  const result = state.practice.results[quiz.id]

  return (
    <section className="page-stack">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Practice and Feedback</span>
          <h2>Check understanding with prediction, troubleshooting, and build-based challenges.</h2>
          <p>
            The practice area uses the same data model as the learning and builder views, so a quiz can point to a live
            sample circuit or evaluate the workspace you are currently editing.
          </p>
        </div>
        <div className="hero-side-stat">
          <strong>{Object.keys(state.practice.results).length}</strong>
          <span>quizzes attempted</span>
        </div>
      </div>

      <div className="split-layout">
        <aside className="surface-card lesson-list">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Quiz List</span>
              <h3>Challenge Types</h3>
            </div>
          </div>
          <div className="list-stack">
            {quizIndex.map((entry) => {
              const result = state.practice.results[entry.id]
              const unlocked = state.practice.unlockedQuizIds.includes(entry.id)

              return (
                <button
                  key={entry.id}
                  className={entry.id === quiz.id ? 'lesson-pill is-active' : 'lesson-pill'}
                  disabled={!unlocked}
                  onClick={() => setActiveQuiz(entry.id)}
                  type="button"
                >
                  <div>
                    <strong>{entry.title}</strong>
                    <p>{entry.prompt}</p>
                  </div>
                  <span className={result?.lastCorrect ? 'tag success' : 'tag'}>{entry.kind}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <article className="surface-card lesson-detail">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{quiz.difficulty}</span>
              <h3>{quiz.title}</h3>
            </div>
            <div className="inline-actions">
              {quiz.sampleCircuitId && (
                <button className="ghost-button" onClick={() => loadSample(quiz.sampleCircuitId!)} type="button">
                  Load Related Circuit
                </button>
              )}
              {quiz.kind === 'build-check' && (
                <button className="ghost-button" onClick={() => setActiveSection('builder')} type="button">
                  Open Builder
                </button>
              )}
            </div>
          </div>

          <div className="challenge-panel">
            <p className="lead-paragraph">{quiz.prompt}</p>
            <div className="simulation-chip-row">
              <span className="tag">{quiz.kind}</span>
              <span className={result?.lastCorrect ? 'tag success' : 'tag'}>
                {result ? `${result.attempts} attempt${result.attempts === 1 ? '' : 's'}` : 'new'}
              </span>
            </div>

            {quiz.kind === 'build-check' && quiz.expectedBuild ? (
              <>
                <div className="detail-grid">
                  <div className="detail-card">
                    <h4>Build Requirements</h4>
                    <ul className="clean-list">
                      {quiz.expectedBuild.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <button className="primary-button" onClick={checkBuildChallenge} type="button">
                      Check Current Workspace
                    </button>
                  </div>

                  <div className="detail-card">
                    <h4>Live Build Checklist</h4>
                    <div className="list-stack">
                      {buildChecks.map((check) => (
                        <div className="list-row static-row checklist-row" key={check.label}>
                          <div>
                            <strong>{check.label}</strong>
                            <p>{check.detail}</p>
                          </div>
                          <span className={check.passed ? 'tag success' : 'tag'}>
                            {check.passed ? 'pass' : 'pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="choice-grid">
                {quiz.choices?.map((choice) => {
                  const isSelected = selectedChoice === choice.id
                  const isCorrect = feedback?.correct && quiz.correctChoiceId === choice.id

                  return (
                    <button
                      key={choice.id}
                      className={
                        isCorrect
                          ? 'choice-card is-correct'
                          : isSelected
                            ? 'choice-card is-selected'
                            : 'choice-card'
                      }
                      onClick={() => handleChoice(choice.id)}
                      type="button"
                    >
                      <strong>{choice.label}</strong>
                    </button>
                  )
                })}
              </div>
            )}

            <div className={feedback ? (feedback.correct ? 'feedback-card success' : 'feedback-card warning') : 'feedback-card'}>
              <strong>{feedback ? (feedback.correct ? 'Correct' : 'Try Again') : 'Hint'}</strong>
              <p>{feedback ? feedback.message : quiz.hint}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
