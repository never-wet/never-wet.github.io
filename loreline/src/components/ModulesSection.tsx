import { useEffect, useRef, useState } from 'react'
import { CreativeSystemsGrid } from './CreativeSystemsGrid'
import { moduleCards } from '../data/siteContent'
import { useLocale } from '../i18n'
import { SectionIntro } from './SectionIntro'
import { ScrollReveal } from './ScrollReveal'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function ModulesSection() {
  const { t } = useLocale()
  const modules = moduleCards.slice(0, 4)
  const storyRef = useRef<HTMLDivElement | null>(null)
  const [floatIndex, setFloatIndex] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      const element = storyRef.current

      if (!element) {
        return
      }

      if (window.innerWidth <= 860) {
        setFloatIndex(0)
        return
      }

      const rect = element.getBoundingClientRect()
      const anchor = window.innerHeight * 0.5
      const progress = clamp((anchor - rect.top) / Math.max(rect.height, 1), 0, 1)
      const nextIndex = progress * (modules.length - 1)

      setFloatIndex((current) => (Math.abs(current - nextIndex) < 0.002 ? current : nextIndex))
    }

    const requestUpdate = () => {
      cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(update)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [modules.length])

  const activeIndex = Math.round(floatIndex)

  return (
    <section className="section" id="modules" aria-label={t('Worldbuilding modules')}>
      <div className="container">
        <ScrollReveal className="modules-section__intro-mobile scroll-reveal--section">
          <SectionIntro
            eyebrow={t('Worldbuilding modules')}
            title={t('Serious tools for building the whole fictional ecosystem.')}
            description={t(
              'Every module is part of the same product language. Characters affect factions, factions affect politics, politics reshape history, and the manuscript keeps drawing from all of it.',
            )}
            headingId="modules-title"
          />
        </ScrollReveal>

        <div className="modules-story" ref={storyRef}>
          <div className="modules-story__intro">
            <SectionIntro
              eyebrow={t('Worldbuilding modules')}
              title={t('Serious tools for building the whole fictional ecosystem.')}
              description={t(
                'Every module is part of the same product language. Characters affect factions, factions affect politics, politics reshape history, and the manuscript keeps drawing from all of it.',
              )}
              headingId="modules-title-desktop"
            />
          </div>

          <div className="modules-story__stage" aria-label={t('Worldbuilding module sequence')}>
            <div className="modules-story__frame">
              <div className="modules-story__viewport">
                {modules.map((module, index) => {
                  const relative = index - floatIndex
                  const distance = Math.abs(relative)
                  const translateY = relative * 72
                  const scale = 1 - Math.min(distance, 1.2) * 0.05
                  const opacity = clamp(1.02 - distance * 0.72, 0, 1)
                  const blur = distance * 7

                  return (
                    <article
                      aria-hidden={distance > 1.2}
                      className={`module-card modules-story__card ${index === activeIndex ? 'modules-story__card--active' : ''}`}
                      key={module.title}
                      style={{
                        filter: `blur(${blur}px)`,
                        opacity,
                        pointerEvents: index === activeIndex ? 'auto' : 'none',
                        transform: `translate3d(0, ${translateY}vh, 0) scale(${scale})`,
                        zIndex: Math.round(100 - distance * 10),
                      }}
                    >
                      <p className="module-card__eyebrow">{t(module.eyebrow)}</p>
                      <h3 className="module-card__title">{t(module.title)}</h3>
                      <p className="module-card__description">{t(module.description)}</p>
                      <ul className="module-card__list">
                        {module.points.map((point) => (
                          <li key={point}>{t(point)}</li>
                        ))}
                      </ul>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="modules-story__track" aria-hidden="true">
            {modules.map((module) => (
              <div className="modules-story__step" key={module.title} />
            ))}
          </div>
        </div>

        <div className="modules-grid modules-grid--mobile">
          {modules.map((module, index) => (
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
