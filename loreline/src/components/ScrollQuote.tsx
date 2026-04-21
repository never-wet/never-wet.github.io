import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ownershipQuote } from '../data/siteContent'
import { useLocale } from '../i18n'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const GLYPH_REVEAL_WINDOW = 7

type QuoteToken =
  | {
      key: string
      type: 'space'
      value: string
    }
  | {
      glyphs: Array<{
        character: string
        revealIndex: number
      }>
      key: string
      type: 'word'
    }

export function ScrollQuote() {
  const { t } = useLocale()
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)
  const translatedQuote = t(ownershipQuote.quote)

  const { quoteReleaseHoldDistance, quoteRevealScrollDistance, quoteTokens, revealableGlyphCount } = useMemo(() => {
    let revealIndex = 0
    const tokens = (translatedQuote.match(/(\s+|[^\s]+)/g) ?? []).map<QuoteToken>((token, tokenIndex) => {
      if (/^\s+$/.test(token)) {
        return {
          key: `space-${tokenIndex}`,
          type: 'space',
          value: token,
        }
      }

      const glyphs = Array.from(token).map((character) => {
        const glyph = {
          character,
          revealIndex,
        }

        revealIndex += 1
        return glyph
      })

      return {
        glyphs,
        key: `word-${tokenIndex}`,
        type: 'word',
      }
    })

    const quoteRevealDistance = Math.max(revealIndex * 8, 1440)
    const quoteHoldDistance = Math.max(720, Math.round(quoteRevealDistance * 0.42))

    return {
      quoteReleaseHoldDistance: quoteHoldDistance,
      quoteRevealScrollDistance: quoteRevealDistance,
      quoteTokens: tokens,
      revealableGlyphCount: revealIndex,
    }
  }, [translatedQuote])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    function measureProgress() {
      const section = sectionRef.current

      if (!section) {
        return 0
      }

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const revealStart = viewportHeight * 0.16
      const revealTravel = Math.max(section.offsetHeight - viewportHeight - quoteReleaseHoldDistance, 1)
      const revealDistance = clamp(revealStart - rect.top, 0, revealTravel)
      return revealDistance / revealTravel
    }

    function updateProgress() {
      const nextProgress = measureProgress()
      setProgress((previous) => (Math.abs(previous - nextProgress) < 0.001 ? previous : nextProgress))
    }

    const initialProgress = measureProgress()
    setProgress(initialProgress)

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [quoteReleaseHoldDistance, quoteRevealScrollDistance])

  const revealCursor =
    -GLYPH_REVEAL_WINDOW + progress * (Math.max(revealableGlyphCount - 1, 0) + GLYPH_REVEAL_WINDOW * 2)

  return (
    <section
      className="scroll-quote"
      ref={sectionRef}
      style={
        {
          '--quote-reveal-distance': `${quoteRevealScrollDistance}px`,
          '--quote-release-hold': `${quoteReleaseHoldDistance}px`,
        } as CSSProperties
      }
    >
      <div className="scroll-quote__sticky">
        <figure className="scroll-quote__panel">
          <p className="scroll-quote__eyebrow">{t('Creative note')}</p>

          <blockquote className="scroll-quote__text">
            <span className="sr-only">{translatedQuote}</span>
            <span aria-hidden="true" className="scroll-quote__flow">
              {quoteTokens.map((token) =>
                token.type === 'space' ? (
                  <span className="scroll-quote__space" key={token.key}>
                    {token.value}
                  </span>
                ) : (
                  <span className="scroll-quote__word" key={token.key}>
                    {token.glyphs.map((glyph, glyphIndex) => {
                      const glyphProgress = clamp(
                        (revealCursor - glyph.revealIndex + GLYPH_REVEAL_WINDOW) / GLYPH_REVEAL_WINDOW,
                        0,
                        1,
                      )

                      return (
                        <span
                          className="scroll-quote__glyph"
                          key={`${token.key}-glyph-${glyphIndex}`}
                          style={
                            {
                              '--glyph-progress': glyphProgress.toFixed(3),
                            } as CSSProperties
                          }
                        >
                          {glyph.character}
                        </span>
                      )
                    })}
                  </span>
                ),
              )}
            </span>
          </blockquote>

          <figcaption className="scroll-quote__caption">
            <span>{t(ownershipQuote.caption)}</span>
            <a href={ownershipQuote.sourceUrl} rel="noreferrer" target="_blank">
              {t(ownershipQuote.sourceLabel)}
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
