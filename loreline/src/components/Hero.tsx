import { heroStats } from '../data/siteContent'
import { useLocale } from '../i18n'
import { HeroStoryArtwork } from './HeroStoryArtwork'

const previewObjects = ['Characters', 'Locations', 'Factions', 'Timeline', 'Lore', 'Manuscript']

export function Hero() {
  const { locale, t } = useLocale()
  const studioHref = `?view=studio&lang=${locale}`

  return (
    <section className="hero" id="top">
      <div className="container hero__layout">
        <div className="hero__content">
          <p className="hero__eyebrow">{t('Premium worldbuilding and story development platform')}</p>
          <h1 className="hero__headline">{t('Build worlds. Shape stories. Keep every thread connected.')}</h1>
          <p className="hero__subheadline">
            {t(
              'Loreline is a home for fantasy writers, sci-fi creators, RPG worldbuilders, and story architects building entire fictional universes. Characters, places, lore, systems, timelines, and manuscript pages all live inside the same serious creative workspace.',
            )}
          </p>

          <div className="hero__actions">
            <a className="button button--primary" href={studioHref}>
              {t('Open the writing studio')}
            </a>
            <a className="button button--secondary" href="#showcase">
              {t('Explore the workspace')}
            </a>
          </div>

          <div className="hero__signals" aria-label={t('Core product strengths')}>
            {heroStats.map((stat) => (
              <article className="signal-card" key={stat.label}>
                <p className="signal-card__label">{t(stat.label)}</p>
                <p className="signal-card__detail">{t(stat.detail)}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-preview" aria-label={t('Preview of the Loreline story development environment')}>
          <div className="hero-preview__chrome">
            <span className="hero-preview__dot" />
            <span className="hero-preview__dot" />
            <span className="hero-preview__dot" />
            <p className="hero-preview__path">{t('World / Empire of Salt / Story Nexus')}</p>
          </div>

          <div className="hero-preview__artwork">
            <HeroStoryArtwork />
          </div>

          <div className="hero-preview__body">
            <aside className="hero-preview__rail">
              <p className="hero-preview__label">{t('Linked layers')}</p>
              <ul className="hero-preview__scene-list">
                {previewObjects.map((scene) => (
                  <li key={scene}>{t(scene)}</li>
                ))}
              </ul>
            </aside>

            <article className="hero-preview__editor">
              <div className="hero-preview__meta">
                <span>{t('4 kingdoms')}</span>
                <span>{t('19 factions')}</span>
                <span>{t('132 linked entries')}</span>
              </div>
              <p className="hero-preview__kicker">{t('Story nexus')}</p>
              <h2 className="hero-preview__title">{t('The manuscript grows from the world instead of sitting beside it.')}</h2>
              <p className="hero-preview__excerpt">
                {t(
                  'Character motives, sacred rites, faction pressure, travel routes, and historical fractures all remain attached to the scenes that depend on them. The story stops feeling fragile because the world beneath it has real structure.',
                )}
              </p>
              <p className="hero-preview__excerpt hero-preview__excerpt--muted">
                {t(
                  'It is planning space, lore archive, narrative engine, manuscript room, and private creative sanctuary in one connected environment.',
                )}
              </p>
            </article>
          </div>

          <aside className="hero-preview__note">
            <p className="hero-preview__label">{t('World note')}</p>
            <h3>{t('The moon calendar changes how every rite, route, and chapter deadline behaves.')}</h3>
            <p>
              {t(
                'Systems like religion, law, magic, technology, and custom time are treated as first-class story material, not afterthoughts.',
              )}
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
