import { creativeSystems, type CreativeSystem } from '../data/siteContent'
import { useLocale } from '../i18n'
import { ScrollReveal } from './ScrollReveal'

function CreativeSystemPreview({ system }: { system: CreativeSystem }) {
  const { t } = useLocale()

  switch (system.id) {
    case 'characters':
      return (
        <div className="system-visual system-visual--characters" aria-hidden="true">
          <div className="system-characters__hub">{t('Pressure Map')}</div>
          <div className="system-avatar system-avatar--mira">
            <span>M</span>
            <small>Mira</small>
          </div>
          <div className="system-avatar system-avatar--tovan">
            <span>T</span>
            <small>Tovan</small>
          </div>
          <div className="system-avatar system-avatar--sera">
            <span>S</span>
            <small>Sera</small>
          </div>
          <div className="system-avatar system-avatar--ilen">
            <span>I</span>
            <small>Ilen</small>
          </div>
          <span className="system-characters__link system-characters__link--one" />
          <span className="system-characters__link system-characters__link--two" />
          <span className="system-characters__link system-characters__link--three" />
          <span className="system-characters__link system-characters__link--four" />
        </div>
      )
    case 'moodboard':
      return (
        <div className="system-visual system-visual--moodboard" aria-hidden="true">
            <div className="system-moodboard__grid">
            <div className="system-moodboard__tile system-moodboard__tile--hero">{t('Mountain bloom')}</div>
            <div className="system-moodboard__tile system-moodboard__tile--forest">{t('Temple glass')}</div>
            <div className="system-moodboard__tile system-moodboard__tile--field">{t('Harvest plain')}</div>
            <div className="system-moodboard__tile system-moodboard__tile--figure">{t('Ward robe')}</div>
            <div className="system-moodboard__tile system-moodboard__tile--vista">{t('Harbor light')}</div>
          </div>
          <div className="system-moodboard__swatches">
            <span>{t('Ink slate')}</span>
            <span>{t('Sea glass')}</span>
            <span>{t('Brass ember')}</span>
          </div>
        </div>
      )
    case 'wiki':
      return (
        <div className="system-visual system-visual--wiki" aria-hidden="true">
          <div className="system-wiki__entry">
            <span className="system-wiki__dot" />
            <strong>History</strong>
            <small>18 entries</small>
          </div>
          <div className="system-wiki__entry">
            <span className="system-wiki__dot" />
            <strong>Culture</strong>
            <small>09 entries</small>
          </div>
          <div className="system-wiki__entry">
            <span className="system-wiki__dot" />
            <strong>Lore</strong>
            <small>27 entries</small>
          </div>
          <div className="system-wiki__entry">
            <span className="system-wiki__dot" />
            <strong>Factions</strong>
            <small>11 entries</small>
          </div>
        </div>
      )
    case 'ambience':
      return (
        <div className="system-visual system-visual--ambience" aria-hidden="true">
          <div className="system-ambience__bars">
            {['s', 'm', 'l', 'xl', 'm', 'l', 'm', 's'].map((size, index) => (
              <span className={`system-ambience__bar system-ambience__bar--${size}`} key={`${size}-${index}`} />
            ))}
          </div>
          <div className="system-ambience__meta">
            <span>{t('Ambient player')}</span>
            <span>02:45 / 04:20</span>
          </div>
          <div className="system-ambience__themes">
            <span>{t('Rain room')}</span>
            <span>{t('Brass dusk')}</span>
            <span>{t('Quiet archive')}</span>
          </div>
        </div>
      )
    case 'plots':
      return (
        <div className="system-visual system-visual--plots" aria-hidden="true">
          <div className="system-plots__rail" />
          <div className="system-plot-card system-plot-card--one">
            <strong>Act II fracture</strong>
            <span>Mira / Tovan / Council</span>
          </div>
          <div className="system-plot-card system-plot-card--two">
            <strong>Quiet harbor</strong>
            <span>Rite clue surfaces</span>
          </div>
          <div className="system-plot-card system-plot-card--three">
            <strong>Shadow walker</strong>
            <span>False witness revealed</span>
          </div>
          <div className="system-plot-card system-plot-card--four">
            <strong>Execution bell</strong>
            <span>Plot thread resolves</span>
          </div>
          <span className="system-plots__connector system-plots__connector--one" />
          <span className="system-plots__connector system-plots__connector--two" />
          <span className="system-plots__connector system-plots__connector--three" />
        </div>
      )
    case 'calendar':
      return (
        <div className="system-visual system-visual--calendar" aria-hidden="true">
          <div className="system-calendar__header">
            <strong>{t('Aeon, Year 342')}</strong>
            <span>{t('Festival quarter')}</span>
          </div>
          <div className="system-calendar__row">
            <span>{t('Weather')}</span>
            <strong>{t('Clear skies')}</strong>
            <i className="system-calendar__icon system-calendar__icon--sun" />
          </div>
          <div className="system-calendar__row">
            <span>{t('Moons')}</span>
            <strong>{t('Twin eclipse')}</strong>
            <i className="system-calendar__icon system-calendar__icon--moon" />
          </div>
          <div className="system-calendar__row">
            <span>{t('Holiday')}</span>
            <strong>{t('Festival of Stars')}</strong>
            <i className="system-calendar__icon system-calendar__icon--lantern" />
          </div>
        </div>
      )
  }
}

export function CreativeSystemsGrid() {
  const { t } = useLocale()

  return (
    <div className="creative-systems">
      <ScrollReveal className="creative-systems__intro scroll-reveal--section">
        <p className="creative-systems__eyebrow">{t('Creative support systems')}</p>
        <h3 className="creative-systems__title">{t('Deep story work also needs atmosphere, codex space, plot weaving, and world-specific time.')}</h3>
        <p className="creative-systems__description">
          {t(
            'Loreline should feel like a full home for universe builders, so the serious creation systems around the manuscript live inside the same product language instead of being treated like throwaway extras.',
          )}
        </p>
      </ScrollReveal>

      <div className="systems-grid">
        {creativeSystems.map((system, index) => (
          <ScrollReveal
            as="article"
            className={`system-card system-card--${system.span} system-card--${system.id}`}
            delay={80 + index * 55}
            key={system.id}
          >
            <div className="system-card__copy">
              <p className="system-card__eyebrow">{t(system.eyebrow)}</p>
              <h3 className="system-card__title">{t(system.title)}</h3>
              <p className="system-card__description">{t(system.description)}</p>
              <ul className="system-card__list">
                {system.highlights.map((highlight) => (
                  <li key={highlight}>{t(highlight)}</li>
                ))}
              </ul>
            </div>

            <CreativeSystemPreview system={system} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}
