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
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      const element = storyRef.current

      if (!element) {
        return
      }

      if (window.innerWidth <= 860) {
        setActiveIndex(0)
        return
      }

      const rect = element.getBoundingClientRect()
      const totalTravel = Math.max(rect.height - window.innerHeight, 1)
      const traveled = clamp(window.innerHeight * 0.5 - rect.top, 0, totalTravel)
      const segment = totalTravel / modules.length
      const nextIndex = clamp(Math.floor(traveled / Math.max(segment, 1)), 0, modules.length - 1)

      setActiveIndex((current) => (current === nextIndex ? current : nextIndex))
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
                  const isActive = index === activeIndex
                  const hasPassed = index < activeIndex
                  const isNext = index === activeIndex + 1

                  let translateY = 132
                  let scale = 0.985
                  let opacity = 0
                  let blur = 10

                  if (hasPassed) {
                    translateY = -132
                    scale = 0.975
                    opacity = 0
                    blur = 10
                  } else if (isActive) {
                    translateY = 0
                    scale = 1
                    opacity = 1
                    blur = 0
                  } else if (isNext) {
                    translateY = 132
                    scale = 0.988
                    opacity = 0.14
                    blur = 7
                  }

                  return (
                    <article
                      aria-hidden={!isActive}
                      className={`module-card modules-story__card ${isActive ? 'modules-story__card--active' : ''}`}
                      key={module.title}
                      style={{
                        filter: `blur(${blur}px)`,
                        opacity,
                        pointerEvents: isActive ? 'auto' : 'none',
                        transform: `translate3d(0, ${translateY}vh, 0) scale(${scale})`,
                        zIndex: isActive ? 3 : hasPassed ? 1 : 2,
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
