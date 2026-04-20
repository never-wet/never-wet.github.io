import { Lightbulb, X } from 'lucide-react'

import type { IdeaPrompt } from '../memory/ideaManifest'

interface IdeasOverlayProps {
  visible: boolean
  ideas: IdeaPrompt[]
  onClose: () => void
}

export const IdeasOverlay = ({ visible, ideas, onClose }: IdeasOverlayProps) => {
  if (!visible) {
    return null
  }

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="ideas-title">
      <div className="tutorial-overlay__backdrop" onClick={onClose} />
      <section className="tutorial-card ideas-card">
        <header className="tutorial-card__header">
          <div className="tutorial-card__brand">
            <span className="tutorial-card__icon" aria-hidden="true">
              <Lightbulb size={18} />
            </span>
            <div>
              <p className="section-kicker">Ideas</p>
              <h2 id="ideas-title">Things you can make with Cortex Lab</h2>
            </div>
          </div>
          <button type="button" className="tutorial-card__close" onClick={onClose} aria-label="Close ideas">
            <X size={16} />
          </button>
        </header>

        <div className="ideas-card__body">
          <p className="tutorial-card__summary">
            Use these as project prompts, class ideas, portfolio demos, or quick ways to understand what the app is actually for.
          </p>

          <div className="ideas-grid">
            {ideas.map((idea) => (
              <article key={idea.id} className="ideas-card__item">
                <div className="ideas-card__meta">
                  <span className="tutorial-card__label">{idea.category}</span>
                </div>
                <h3>{idea.title}</h3>
                <p>{idea.summary}</p>
                <div className="ideas-card__detail">
                  <strong>Start with</strong>
                  <span>{idea.startingPoint}</span>
                </div>
                <div className="ideas-card__detail">
                  <strong>Why it fits</strong>
                  <span>{idea.whyItFits}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
