import { CreativeSystemsGrid } from './CreativeSystemsGrid'
import { moduleCards } from '../data/siteContent'
import { useLocale } from '../i18n'
import { SectionIntro } from './SectionIntro'
import { ScrollReveal } from './ScrollReveal'

export function ModulesSection() {
  const { t } = useLocale()

  return (
    <section className="section" id="modules" aria-labelledby="modules-title">
      <div className="container">
        <ScrollReveal className="scroll-reveal--section">
          <SectionIntro
            eyebrow={t('Worldbuilding modules')}
            title={t('Serious tools for building the whole fictional ecosystem.')}
            description={t(
              'Every module is part of the same product language. Characters affect factions, factions affect politics, politics reshape history, and the manuscript keeps drawing from all of it.',
            )}
            headingId="modules-title"
          />
        </ScrollReveal>

        <div className="modules-grid">
          {moduleCards.slice(0, 4).map((module, index) => (
            <ScrollReveal as="article" className="module-card" delay={80 + index * 65} key={module.title}>
              <p className="module-card__eyebrow">{t(module.eyebrow)}</p>
              <h3 className="module-card__title">{t(module.title)}</h3>
              <p className="module-card__description">{t(module.description)}</p>
              <ul className="module-card__list">
                {module.points.map((point) => (
                  <li key={point}>{t(point)}</li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>

        <CreativeSystemsGrid />
      </div>
    </section>
  )
}
