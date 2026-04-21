import { finalChecklist } from '../data/siteContent'
import { useLocale } from '../i18n'
import { ScrollReveal } from './ScrollReveal'

export function FinalCallToAction() {
  const { locale, t } = useLocale()
  const studioHref = `?view=studio&lang=${locale}`

  return (
    <section className="section" id="cta" aria-labelledby="cta-title">
      <div className="container">
        <ScrollReveal className="cta-panel scroll-reveal--section">
          <div className="cta-panel__content">
            <p className="cta-panel__eyebrow">{t('Final call to action')}</p>
            <h2 className="cta-panel__title" id="cta-title">
              {t('Give your story universe a place worthy of it.')}
            </h2>
            <p className="cta-panel__description">
              {t(
                'Loreline is positioned as a premium worldbuilding and story-development platform for creators who need depth, structure, privacy, and a writing experience that grows from the world instead of sitting apart from it.',
              )}
            </p>

            <div className="cta-panel__actions">
              <a className="button button--primary" href={studioHref}>
                {t('Open the writing studio')}
              </a>
              <a className="button button--secondary" href="#showcase">
                {t('Explore the storytelling workspace')}
              </a>
            </div>
          </div>

          <div className="cta-panel__sidebar">
            <p className="cta-panel__label">{t('Included in the experience')}</p>
            <ul className="cta-panel__list">
              {finalChecklist.map((item) => (
                <li key={item}>{t(item)}</li>
              ))}
            </ul>
            <p className="cta-panel__footnote">
              {t(
                'Designed for the creators building kingdoms, star systems, religions, histories, factions, and the stories that live inside them.',
              )}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
