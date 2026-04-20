import { useState } from 'react'
import { componentIndex } from '../memory/componentIndex'

const categories = ['all', 'sources', 'passive', 'outputs', 'controls', 'logic', 'sensors', 'advanced'] as const

export const LibraryView = () => {
  const [category, setCategory] = useState<(typeof categories)[number]>('all')

  const visibleComponents =
    category === 'all' ? componentIndex : componentIndex.filter((component) => component.category === category)

  return (
    <section className="page-stack">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Component Library</span>
          <h2>Browse the catalog powering the builder, lessons, and simulation engine.</h2>
          <p>
            Each entry includes educational intent, terminal layout, editable parameters, phase-1 support notes, and
            examples so the library is useful both as a reference and as a source-of-truth for future expansion.
          </p>
        </div>
      </div>

      <div className="filter-row">
        {categories.map((entry) => (
          <button
            className={entry === category ? 'nav-pill is-active' : 'nav-pill'}
            key={entry}
            onClick={() => setCategory(entry)}
            type="button"
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="library-grid">
        {visibleComponents.map((component) => (
          <article className="library-card" key={component.id}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">{component.category}</span>
                <h3>{component.name}</h3>
              </div>
              <span className={component.simulationSupport === 'supported' ? 'tag success' : 'tag'}>
                {component.simulationSupport}
              </span>
            </div>
            <p>{component.educationalSummary}</p>
            <div className="tag-row">
              {component.terminals.map((terminal) => (
                <span className="tag" key={terminal.id}>
                  {terminal.label}
                </span>
              ))}
            </div>
            {component.formula && (
              <div className="inline-code">
                <strong>Formula:</strong>
                <code>{component.formula}</code>
              </div>
            )}
            <div className="detail-card">
              <h4>Examples</h4>
              <ul className="clean-list">
                {component.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
            <div className="detail-card">
              <h4>Validation Rules</h4>
              <ul className="clean-list">
                {component.validationRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
