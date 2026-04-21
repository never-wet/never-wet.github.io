import type { CSSProperties } from 'react'
import { useLocale } from '../i18n'
import { HeroStoryArtwork } from './HeroStoryArtwork'

const audienceTags = ['Fantasy writers', 'Sci-fi creators', 'RPG worldbuilders', 'Story architects']

export function Hero() {
  const { locale, t } = useLocale()
  const studioHref = `?view=studio&lang=${locale}`
  const heroStyle = {
    '--hero-background-image': "url('/hero-intro.jpg')",
    '--hero-background-image-mobile': "url('/hero-intro.jpg')",
  } as CSSProperties

  return (
    <section className="hero" id="top" style={heroStyle}>
      <div aria-hidden="true" className="hero__background-layer" style={heroStyle} />
      <div className="container hero__layout">
        <div className="hero__content">
          <p className="hero__eyebrow">{t('Worldbuilding studio')}</p>
          <h1 className="hero__headline">{t('Build worlds. Shape stories.')}</h1>

          <div className="hero__content-footer">
            <div className="hero__actions">
              <a className="button button--primary" href={studioHref}>
                {t('Open the writing studio')}
              </a>
              <a className="button button--secondary" href="#showcase">
                {t('Explore the workspace')}
              </a>
            </div>

            <div className="hero__audience-panel">
              <p className="hero__audience-label">{t('Built for whole universes')}</p>
              <div className="hero__audience" aria-label={t('Built for whole universes')}>
                {audienceTags.map((tag) => (
                  <span className="hero__audience-tag" key={tag}>
                    {t(tag)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-preview" aria-label={t('Preview of the Loreline story development environment')}>
          <div className="hero-preview__chrome">
            <span className="hero-preview__dot" />
            <span className="hero-preview__dot" />
            <span className="hero-preview__dot" />
          </div>

          <div className="hero-preview__artwork" aria-hidden="true">
            <HeroStoryArtwork />
          </div>

          <div className="hero-preview__body">
            <p className="hero-preview__summary">
              {t(
                'Loreline is a premium worldbuilding and story-development platform that keeps characters, places, lore, timelines, and manuscript scenes connected inside one calm creative workspace.',
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="hero__transition-veil" aria-hidden="true" />
    </section>
  )
}
