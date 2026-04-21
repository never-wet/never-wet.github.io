import type { CSSProperties } from 'react'
import { ScrollReveal } from './ScrollReveal'
import { useLocale } from '../i18n'

const supportNotes = [
  {
    title: 'Character pressure',
    detail: 'Track motives, fractures, and loyalties without leaving the manuscript.',
  },
  {
    title: 'Codex shelves',
    detail: 'Keep canon, lore, and cultural detail close instead of scattering it across apps.',
  },
  {
    title: 'Plot weaving',
    detail: 'See turning points, hidden pressure, and long arcs before they tangle.',
  },
  {
    title: 'World time',
    detail: 'Let moons, weather, rites, and holidays shape the rhythm of the draft.',
  },
]

export function CreativeSystemsGrid() {
  const { t } = useLocale()

  return (
    <div className="story-room">
      <ScrollReveal className="story-room__frame scroll-reveal--section">
        <div className="story-room__intro">
          <p className="story-room__eyebrow">{t('Creative support systems')}</p>
          <h3 className="story-room__title">{t('The room around the manuscript matters too.')}</h3>
          <p className="story-room__description">
            {t(
              'Loreline keeps codex space, plot tension, atmosphere, and world-specific time near the page without turning the product into a crowded dashboard.',
            )}
          </p>
        </div>

        <div className="story-room__panorama" aria-label={t('Support systems around the writing room')}>
          <article className="story-room__panel story-room__panel--canon">
            <p className="story-room__panel-label">{t('Canon shelves')}</p>
            <h4>{t('Private world knowledge stays ordered and searchable.')}</h4>
            <div className="story-room__shelf-list">
              <span>{t('History')}</span>
              <span>{t('Culture')}</span>
              <span>{t('Lore')}</span>
              <span>{t('Factions')}</span>
            </div>
          </article>

          <div className="story-room__centerpiece">
            <div className="story-room__halo" />
            <div className="story-room__desk">
              <div className="story-room__sheet story-room__sheet--left" />
              <div className="story-room__sheet story-room__sheet--center">
                <span>{t('Scene draft')}</span>
              </div>
              <div className="story-room__sheet story-room__sheet--right" />
            </div>
            <div className="story-room__orbit story-room__orbit--mood">{t('Atmosphere')}</div>
            <div className="story-room__orbit story-room__orbit--plot">{t('Plot threads')}</div>
            <div className="story-room__orbit story-room__orbit--time">{t('Calendar')}</div>
            <div className="story-room__orbit story-room__orbit--cast">{t('Cast pressure')}</div>
          </div>

          <article className="story-room__panel story-room__panel--ritual">
            <p className="story-room__panel-label">{t('World rhythm')}</p>
            <h4>{t('Time, weather, and rite calendars shape the story mood.')}</h4>
            <div className="story-room__calendar">
              <div>
                <span>{t('Moon')}</span>
                <strong>{t('Twin eclipse')}</strong>
              </div>
              <div>
                <span>{t('Weather')}</span>
                <strong>{t('Clear skies')}</strong>
              </div>
              <div>
                <span>{t('Holiday')}</span>
                <strong>{t('Festival of Stars')}</strong>
              </div>
            </div>
          </article>
        </div>

        <div className="story-room__notes">
          {supportNotes.map((note, index) => (
            <article className="story-room__note" key={note.title} style={{ '--note-delay': `${index * 40}ms` } as CSSProperties}>
              <p>{t(note.title)}</p>
              <span>{t(note.detail)}</span>
            </article>
          ))}
        </div>
      </ScrollReveal>
    </div>
  )
}
