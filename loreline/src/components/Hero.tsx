import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { useLocale } from '../i18n'
import { HeroStoryArtwork } from './HeroStoryArtwork'
import heroIntro from '../assets/hero-intro.jpg'

const audienceTags = ['Fantasy writers', 'Sci-fi creators', 'RPG worldbuilders', 'Story architects']
const MIN_DESKTOP_HERO_FIT_RATIO = 0.62
const COMPACT_DESKTOP_VIEWPORT_HEIGHT = 920
const COMPACT_DESKTOP_ASPECT_RATIO = 1.62

export function Hero() {
  const { locale, t } = useLocale()
  const heroRef = useRef<HTMLElement | null>(null)
  const layoutRef = useRef<HTMLDivElement | null>(null)
  const studioHref = `?view=studio&lang=${locale}`
  const heroStyle = {
    '--hero-background-image': `url('${heroIntro}')`,
    '--hero-background-image-mobile': `url('${heroIntro}')`,
  } as CSSProperties

  useLayoutEffect(() => {
    const heroElement = heroRef.current
    const layoutElement = layoutRef.current

    if (!heroElement || !layoutElement) {
      return
    }

    let frame = 0
    const topbarElement = document.querySelector<HTMLElement>('.topbar')

    const setHeroVariable = (name: string, value: string) => {
      if (heroElement.style.getPropertyValue(name) !== value) {
        heroElement.style.setProperty(name, value)
      }
    }

    const setHeroDensity = (density: 'balanced' | 'compact') => {
      if (heroElement.dataset.heroDensity !== density) {
        heroElement.dataset.heroDensity = density
      }
    }

    const getViewportSize = () => ({
      height: Math.round(window.visualViewport?.height ?? window.innerHeight),
      width: Math.round(window.visualViewport?.width ?? window.innerWidth),
    })

    const updateHeroFit = () => {
      const { height: viewportHeight, width: viewportWidth } = getViewportSize()
      const topbarHeight = Math.ceil(topbarElement?.getBoundingClientRect().height ?? 0)
      const shouldLockDesktopHero = viewportWidth > 1100
      const shouldPreferCompactDesktop =
        shouldLockDesktopHero &&
        (viewportHeight <= COMPACT_DESKTOP_VIEWPORT_HEIGHT ||
          viewportWidth / Math.max(viewportHeight, 1) >= COMPACT_DESKTOP_ASPECT_RATIO)

      document.documentElement.style.setProperty('--topbar-overlay-depth', `${topbarHeight}px`)
      setHeroVariable('--topbar-overlay-depth', `${topbarHeight}px`)
      setHeroVariable('--hero-fit-ratio', '1')
      setHeroDensity(shouldPreferCompactDesktop ? 'compact' : 'balanced')

      // Let the browser recalculate with the reset ratio before measuring.
      void layoutElement.offsetHeight

      if (shouldLockDesktopHero) {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const heroStyles = window.getComputedStyle(heroElement)
          const availableHeight =
            viewportHeight - parseFloat(heroStyles.paddingTop) - parseFloat(heroStyles.paddingBottom)
          const layoutHeight = layoutElement.getBoundingClientRect().height

          if (layoutHeight <= availableHeight + 1) {
            break
          }

          if (heroElement.dataset.heroDensity !== 'compact' && attempt >= 2) {
            setHeroDensity('compact')

            // Re-measure after compacting the layout before reducing further.
            void layoutElement.offsetHeight
            continue
          }

          const currentRatio = Number.parseFloat(heroElement.style.getPropertyValue('--hero-fit-ratio')) || 1
          const nextRatio = Math.max(
            MIN_DESKTOP_HERO_FIT_RATIO,
            Math.min(1, currentRatio * (availableHeight / layoutHeight) * 0.995),
          )

          if (Math.abs(nextRatio - currentRatio) < 0.01) {
            break
          }

          setHeroVariable('--hero-fit-ratio', nextRatio.toFixed(4))
        }
      }

      const resolvedHeroStyles = window.getComputedStyle(heroElement)
      const measuredHeight =
        layoutElement.getBoundingClientRect().height +
        parseFloat(resolvedHeroStyles.paddingTop) +
        parseFloat(resolvedHeroStyles.paddingBottom)

      const nextMeasuredHeight = shouldLockDesktopHero
        ? viewportHeight
        : Math.max(viewportHeight, Math.ceil(measuredHeight))

      setHeroVariable('--hero-measured-min-height', `${nextMeasuredHeight}px`)
    }

    const scheduleHeroFit = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateHeroFit)
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleHeroFit()
    })

    resizeObserver.observe(layoutElement)

    if (topbarElement) {
      resizeObserver.observe(topbarElement)
    }

    scheduleHeroFit()
    window.addEventListener('resize', scheduleHeroFit)
    window.visualViewport?.addEventListener('resize', scheduleHeroFit)
    document.fonts.ready.then(scheduleHeroFit).catch(() => {})

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleHeroFit)
      window.visualViewport?.removeEventListener('resize', scheduleHeroFit)
    }
  }, [locale])

  return (
    <section className="hero" id="top" ref={heroRef} style={heroStyle}>
      <div aria-hidden="true" className="hero__background-layer" style={heroStyle} />
      <div className="container hero__layout" ref={layoutRef}>
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
