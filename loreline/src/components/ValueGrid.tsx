import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { valuePillars } from '../data/siteContent'
import { useLocale } from '../i18n'
import { ScrollReveal } from './ScrollReveal'
import { SectionIntro } from './SectionIntro'
import { ValueStoryStage } from './ValueStoryStage'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function ValueGrid() {
  const { t } = useLocale()
  const chapterRefs = useRef<Array<HTMLDivElement | null>>([])
  const stageStickyRefs = useRef<Array<HTMLDivElement | null>>([])
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [chapterProgresses, setChapterProgresses] = useState<number[]>(() => valuePillars.map(() => 0))
  const [chapterCardOffsets, setChapterCardOffsets] = useState<number[]>(() => valuePillars.map(() => 0))
  const [uniformCardHeight, setUniformCardHeight] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let frame = 0

    function updateActiveChapter() {
      frame = 0

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const anchor = viewportHeight * 0.56
      const supportsPinnedOverview = window.matchMedia('(min-width: 861px)').matches
      let nextActiveIndex = 0
      const nextProgresses = valuePillars.map(() => 0)
      const nextCardOffsets = valuePillars.map(() => 0)
      const nextUniformCardHeight = supportsPinnedOverview
        ? cardRefs.current.reduce((maxHeight, card) => Math.max(maxHeight, card?.scrollHeight ?? 0), 0)
        : 0

      chapterRefs.current.forEach((chapter, index) => {
        if (!chapter) {
          return
        }

        const rect = chapter.getBoundingClientRect()
        const stageSticky = stageStickyRefs.current[index]
        const card = cardRefs.current[index]

        let progress = 0

        if (supportsPinnedOverview && stageSticky) {
          const stageHeight = stageSticky.offsetHeight
          const pinTop = parseFloat(window.getComputedStyle(stageSticky).top) || viewportHeight * 0.1
          const travel = Math.max(rect.height - stageHeight, 1)

          progress = clamp((pinTop - rect.top) / travel, 0, 1)

          if (card) {
            nextCardOffsets[index] = progress * Math.max(stageHeight - card.offsetHeight, 0)
          }

          if (rect.top <= pinTop) {
            nextActiveIndex = index
          }
        } else {
          const travel = Math.max(rect.height * 0.82, 1)

          progress = clamp((anchor - rect.top) / travel, 0, 1)

          if (rect.top <= anchor) {
            nextActiveIndex = index
          }
        }

        nextProgresses[index] = progress
      })

      const firstChapter = chapterRefs.current[0]

      if (firstChapter) {
        const firstRect = firstChapter.getBoundingClientRect()
        const firstStageSticky = stageStickyRefs.current[0]
        const firstPinTop =
          supportsPinnedOverview && firstStageSticky
            ? parseFloat(window.getComputedStyle(firstStageSticky).top) || viewportHeight * 0.1
            : anchor

        if (firstRect.top > firstPinTop) {
          nextActiveIndex = 0
          nextProgresses[0] = 0
          nextCardOffsets[0] = 0
        }
      }

      setActiveIndex((current) => (current === nextActiveIndex ? current : nextActiveIndex))
      setChapterProgresses((current) =>
        current.length === nextProgresses.length &&
        current.every((value, index) => Math.abs(value - nextProgresses[index]) < 0.015)
          ? current
          : nextProgresses,
      )
      setChapterCardOffsets((current) =>
        current.length === nextCardOffsets.length &&
        current.every((value, index) => Math.abs(value - nextCardOffsets[index]) < 0.75)
          ? current
          : nextCardOffsets,
      )
      setUniformCardHeight((current) =>
        Math.abs(current - nextUniformCardHeight) < 1 ? current : nextUniformCardHeight,
      )
    }

    function requestUpdate() {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(updateActiveChapter)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [])

  function setChapterRef(index: number, node: HTMLDivElement | null) {
    chapterRefs.current[index] = node
  }

  function setStageStickyRef(index: number, node: HTMLDivElement | null) {
    stageStickyRefs.current[index] = node
  }

  function setCardRef(index: number, node: HTMLElement | null) {
    cardRefs.current[index] = node
  }

  return (
    <section className="section section--value-intro" id="value" aria-labelledby="value-title">
      <div className="container">
        <ScrollReveal className="scroll-reveal--section">
          <SectionIntro
            eyebrow={t('Product overview')}
            title={t('A connected creative system for building a world first and writing from inside it.')}
            description={t(
              'Loreline positions story development as an ecosystem. The world, the cast, the systems, the lore, the timeline, and the manuscript are treated as one serious body of work instead of separate apps pretending to collaborate.',
            )}
            headingId="value-title"
          />
        </ScrollReveal>

        <div className="value-story">
          <div className="value-story__chapters" aria-label={t('Core product pillars')}>
            {valuePillars.map((pillar, index) => {
              const state =
                index === activeIndex ? 'value-story__card--active' : index < activeIndex ? 'value-story__card--past' : 'value-story__card--upcoming'

              return (
                <div className="value-story__chapter" key={pillar.title} ref={(node) => setChapterRef(index, node)}>
                  <div className="value-story__chapter-layout">
                    <div className="value-story__chapter-copy">
                      <div className="value-story__chapter-copy-sticky">
                        <div
                          className="value-story__card-shell"
                          style={
                            {
                              '--chapter-card-offset': `${(chapterCardOffsets[index] ?? 0).toFixed(1)}px`,
                            } as CSSProperties
                          }
                        >
                          <article
                            className={`value-card value-story__card ${state}`}
                            aria-current={index === activeIndex}
                            ref={(node) => setCardRef(index, node)}
                            style={uniformCardHeight > 0 ? { minHeight: `${uniformCardHeight}px` } : undefined}
                          >
                            <p className="value-card__eyebrow">{t(pillar.eyebrow)}</p>
                            <h3 className="value-card__title">{t(pillar.title)}</h3>
                            <p className="value-card__description">{t(pillar.description)}</p>
                            <ul className="value-card__list">
                              {pillar.bullets.map((bullet) => (
                                <li key={bullet}>{t(bullet)}</li>
                              ))}
                            </ul>
                          </article>
                        </div>
                      </div>
                    </div>

                    <div className="value-story__chapter-stage" aria-hidden="true">
                      <div
                        className="value-story__chapter-stage-sticky"
                        ref={(node) => setStageStickyRef(index, node)}
                      >
                        <ValueStoryStage
                          activeIndex={index}
                          progress={chapterProgresses[index] ?? 0}
                          sceneId={pillar.sceneId}
                          variant="chapter"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
