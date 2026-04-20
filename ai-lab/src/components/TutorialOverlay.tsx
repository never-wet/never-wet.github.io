import { BookOpenText, ChevronLeft, ChevronRight, X } from 'lucide-react'

import type { TutorialStep } from '../memory/tutorialManifest'

interface TutorialOverlayProps {
  visible: boolean
  step: TutorialStep
  stepIndex: number
  totalSteps: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onRestart: (index: number) => void
}

export const TutorialOverlay = ({
  visible,
  step,
  stepIndex,
  totalSteps,
  onClose,
  onPrevious,
  onNext,
  onRestart,
}: TutorialOverlayProps) => {
  if (!visible) {
    return null
  }

  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-overlay__backdrop" onClick={onClose} />
      <section className="tutorial-card">
        <header className="tutorial-card__header">
          <div className="tutorial-card__brand">
            <span className="tutorial-card__icon" aria-hidden="true">
              <BookOpenText size={18} />
            </span>
            <div>
              <p className="section-kicker">{step.eyebrow}</p>
              <h2 id="tutorial-title">{step.title}</h2>
            </div>
          </div>
          <button type="button" className="tutorial-card__close" onClick={onClose} aria-label="Close tutorial">
            <X size={16} />
          </button>
        </header>

        <div className="tutorial-card__body">
          <div className="tutorial-card__main">
            <p className="tutorial-card__summary">{step.summary}</p>
            <div className="tutorial-card__context">
              <span className="tutorial-card__label">Showing</span>
              <strong>{step.areaLabel}</strong>
            </div>
            <ul className="tutorial-card__list">
              {step.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <aside className="tutorial-card__steps" aria-label="Tutorial steps">
            {Array.from({ length: totalSteps }, (_, index) => (
              <button
                key={`${index + 1}`}
                type="button"
                className={index === stepIndex ? 'is-active' : ''}
                onClick={() => onRestart(index)}
              >
                <span>{index + 1}</span>
              </button>
            ))}
          </aside>
        </div>

        <footer className="tutorial-card__footer">
          <div className="tutorial-card__progress">
            Step {stepIndex + 1} of {totalSteps}
          </div>
          <div className="tutorial-card__actions">
            <button type="button" className="secondary-button" onClick={onPrevious} disabled={isFirst}>
              <ChevronLeft size={16} />
              Back
            </button>
            <button type="button" className="primary-button" onClick={isLast ? onClose : onNext}>
              {isLast ? 'Finish tutorial' : 'Next'}
              {isLast ? null : <ChevronRight size={16} />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
