import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocale } from '../i18n'
import { SectionIntro } from './SectionIntro'
import { ScrollReveal } from './ScrollReveal'
import { workspaceViews } from '../data/siteContent'

const WORKSPACE_SWITCH_OUT_MS = 170
const WORKSPACE_SWITCH_IN_MS = 520

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function FeatureShowcase() {
  const { t } = useLocale()
  const showcaseRef = useRef<HTMLDivElement | null>(null)
  const introTrackRef = useRef<HTMLDivElement | null>(null)
  const introCopyRef = useRef<HTMLDivElement | null>(null)
  const controlsShellRef = useRef<HTMLDivElement | null>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const shellTrackRef = useRef<HTMLDivElement | null>(null)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaceViews[0].id)
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(null)
  const [workspacePhase, setWorkspacePhase] = useState<'steady' | 'switching-out' | 'switching-in'>('steady')
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [showcaseControlsOffset, setShowcaseControlsOffset] = useState(0)
  const [showcaseTrackHeight, setShowcaseTrackHeight] = useState(0)
  const switchTimeoutRef = useRef<number | null>(null)
  const settleTimeoutRef = useRef<number | null>(null)

  const activeWorkspace = workspaceViews.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaceViews[0]
  const highlightedWorkspaceId = pendingWorkspaceId ?? activeWorkspaceId

  function clearWorkspaceTimers() {
    if (switchTimeoutRef.current !== null) {
      window.clearTimeout(switchTimeoutRef.current)
      switchTimeoutRef.current = null
    }

    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current)
      settleTimeoutRef.current = null
    }
  }

  useEffect(() => clearWorkspaceTimers, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let frame = 0

    function updateShowcaseTravel() {
      frame = 0

      const showcase = showcaseRef.current
      const introTrack = introTrackRef.current
      const introCopy = introCopyRef.current
      const controlsShell = controlsShellRef.current
      const controls = controlsRef.current
      const shellTrack = shellTrackRef.current

      if (!showcase || !introTrack || !introCopy || !controlsShell || !controls || !shellTrack) {
        return
      }

      const supportsPinnedShowcase = window.matchMedia('(min-width: 1101px)').matches

      if (!supportsPinnedShowcase) {
        setShowcaseControlsOffset((current) => (Math.abs(current) < 0.75 ? current : 0))
        setShowcaseTrackHeight((current) => (Math.abs(current) < 1 ? current : 0))
        return
      }

      const introSticky = introTrack.querySelector<HTMLElement>('.showcase__intro')
      const shellPanel = shellTrack.querySelector<HTMLElement>('.workspace-shell')
      const pinTop =
        (introSticky ? parseFloat(window.getComputedStyle(introSticky).top) : Number.NaN) ||
        (window.innerHeight || document.documentElement.clientHeight) * 0.1
      const showcaseRect = showcase.getBoundingClientRect()
      const controlsStart = controlsShell.offsetTop
      const controlsHeight = controls.offsetHeight
      const shellHeight = Math.max(shellPanel?.offsetHeight ?? 0, shellPanel?.scrollHeight ?? 0, 1)
      const maxOffset = Math.max(shellHeight - controlsStart - controlsHeight, 0)
      const trackHeight = shellHeight + maxOffset
      const nextOffset = clamp(pinTop - showcaseRect.top, 0, maxOffset)

      setShowcaseTrackHeight((current) => (Math.abs(current - trackHeight) < 1 ? current : trackHeight))
      setShowcaseControlsOffset((current) => (Math.abs(current - nextOffset) < 0.75 ? current : nextOffset))
    }

    function requestUpdate() {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(updateShowcaseTravel)
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
  }, [activeWorkspaceId, isSupportOpen, isWorkspaceOpen, workspacePhase])

  function handleWorkspaceChange(nextWorkspaceId: string) {
    if (nextWorkspaceId === highlightedWorkspaceId) {
      return
    }

    clearWorkspaceTimers()
    setPendingWorkspaceId(nextWorkspaceId)
    setIsSupportOpen(false)

    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setActiveWorkspaceId(nextWorkspaceId)
      setPendingWorkspaceId(null)
      setWorkspacePhase('steady')
      return
    }

    setWorkspacePhase('switching-out')

    switchTimeoutRef.current = window.setTimeout(() => {
      setActiveWorkspaceId(nextWorkspaceId)
      setPendingWorkspaceId(null)
      setWorkspacePhase('switching-in')

      settleTimeoutRef.current = window.setTimeout(() => {
        setWorkspacePhase('steady')
      }, WORKSPACE_SWITCH_IN_MS)
    }, WORKSPACE_SWITCH_OUT_MS)
  }

  function handleRevealToggle() {
    setIsWorkspaceOpen((current) => {
      const next = !current

      if (!next) {
        setIsSupportOpen(false)
      }

      return next
    })
  }

  return (
    <section className="section section--showcase" id="showcase" aria-labelledby="showcase-title">
      <div className="container showcase" ref={showcaseRef}>
        <div
          className="showcase__intro-track"
          ref={introTrackRef}
          style={showcaseTrackHeight > 0 ? { minHeight: `${showcaseTrackHeight}px` } : undefined}
        >
          <ScrollReveal className="showcase__intro scroll-reveal--section">
            <div className="showcase__intro-copy" ref={introCopyRef}>
              <SectionIntro
                eyebrow={t('Interconnected workspace')}
                title={t('Worldbuilding, narrative structure, and manuscript writing all point into the same system.')}
                description={t(
                  'This is the core product difference. Characters connect to locations, locations connect to maps and culture, plot events connect to timeline logic, and the manuscript remains part of the same world architecture.',
                )}
                headingId="showcase-title"
              />
            </div>

            <div className="showcase__controls-shell" ref={controlsShellRef}>
              <div
                className="showcase__controls"
                ref={controlsRef}
                style={
                  showcaseControlsOffset > 0
                    ? { transform: `translate3d(0, ${showcaseControlsOffset.toFixed(1)}px, 0)` }
                    : undefined
                }
              >
                <div className="workspace-tabs" role="tablist" aria-label={t('Loreline workspace views')}>
                  {workspaceViews.map((workspace) => (
                    <button
                      aria-controls={`workspace-panel-${workspace.id}`}
                      aria-selected={workspace.id === highlightedWorkspaceId}
                      className={`workspace-tab ${workspace.id === highlightedWorkspaceId ? 'workspace-tab--active' : ''}`}
                      id={`workspace-tab-${workspace.id}`}
                      key={workspace.id}
                      onClick={() => handleWorkspaceChange(workspace.id)}
                      role="tab"
                      type="button"
                    >
                      <span className="workspace-tab__label">{t(workspace.label)}</span>
                      <span className="workspace-tab__description">{t(workspace.eyebrow)}</span>
                    </button>
                  ))}
                </div>

                <div className="showcase__actions">
                  <button
                    aria-expanded={isWorkspaceOpen}
                    className="button button--primary button--compact"
                    onClick={handleRevealToggle}
                    type="button"
                  >
                    {isWorkspaceOpen ? t('Hide workspace') : t('Reveal story system')}
                  </button>
                  <button
                    aria-expanded={isSupportOpen}
                    className="button button--ghost button--compact"
                    disabled={!isWorkspaceOpen}
                    onClick={() => setIsSupportOpen((current) => !current)}
                    type="button"
                  >
                    {isSupportOpen ? t('Hide linked detail') : t('Open linked detail')}
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div
          className="showcase__shell-track"
          ref={shellTrackRef}
          style={showcaseTrackHeight > 0 ? ({ minHeight: `${showcaseTrackHeight}px` } as CSSProperties) : undefined}
        >
          <div className="showcase__shell-pin">
            <ScrollReveal
              as="div"
              aria-busy={workspacePhase !== 'steady'}
              aria-labelledby={`workspace-tab-${activeWorkspace.id}`}
              className={`workspace-shell ${isWorkspaceOpen ? 'workspace-shell--open' : ''} ${
                isSupportOpen ? 'workspace-shell--support' : ''
              } workspace-shell--${workspacePhase}`}
              delay={120}
              id={`workspace-panel-${activeWorkspace.id}`}
              role="tabpanel"
              rootMargin="0px 0px -8% 0px"
              threshold={0.12}
              tabIndex={0}
            >
              <div className="workspace-shell__content" key={activeWorkspace.id}>
                <div className="workspace-shell__header">
                  <div>
                    <p className="workspace-shell__eyebrow">{activeWorkspace.eyebrow}</p>
                    <h3 className="workspace-shell__title">{activeWorkspace.title}</h3>
                  </div>
                  <div className="workspace-shell__chips" aria-label="Current workspace attributes">
                    {activeWorkspace.chips.map((chip) => (
                      <span className="chip" key={chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="workspace-shell__description">{activeWorkspace.description}</p>

                <div className="workspace-shell__body">
                  {!isWorkspaceOpen ? (
                    <div className="workspace-collapsed">
                      <div className="workspace-collapsed__card">
                        <p className="workspace-collapsed__label">{t('What stays visible first')}</p>
                        <h4>{t(activeWorkspace.documentTitle)}</h4>
                        <p>{t(activeWorkspace.documentExcerpt[0])}</p>
                      </div>
                      <div className="workspace-collapsed__note">
                        <p className="workspace-collapsed__label">{t('Only when needed')}</p>
                        <ul>
                          <li>{t('World and manuscript links on demand')}</li>
                          <li>{t('Plot, lore, and faction context without clutter')}</li>
                          <li>{t('Deeper system detail only when the user asks for it')}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="workspace-stage">
                      <aside className="workspace-stage__rail">
                        <p className="workspace-stage__label">{t(activeWorkspace.railTitle)}</p>
                        <ul className="workspace-stage__list">
                          {activeWorkspace.railItems.map((item) => (
                            <li key={item}>{t(item)}</li>
                          ))}
                        </ul>
                      </aside>

                      <article className="workspace-stage__editor">
                        <div className="workspace-stage__editor-bar">
                          <span>{t(activeWorkspace.documentKicker)}</span>
                          <span>{t('Synced across notes')}</span>
                        </div>
                        <h4>{t(activeWorkspace.documentTitle)}</h4>
                        {activeWorkspace.documentExcerpt.map((paragraph) => (
                          <p key={paragraph}>{t(paragraph)}</p>
                        ))}

                        <div className="workspace-stage__metrics">
                          {activeWorkspace.metrics.map((metric) => (
                            <div className="workspace-metric" key={metric.label}>
                              <span className="workspace-metric__value">{metric.value}</span>
                              <span className="workspace-metric__label">{t(metric.label)}</span>
                            </div>
                          ))}
                        </div>
                      </article>

                      {isSupportOpen ? (
                        <aside className="workspace-stage__support">
                          <p className="workspace-stage__label">{t(activeWorkspace.supportTitle)}</p>
                          <div className="workspace-stage__support-list">
                            {activeWorkspace.supportItems.map((item) => (
                              <article className="workspace-support-card" key={item.title}>
                                <h4>{t(item.title)}</h4>
                                <p>{t(item.detail)}</p>
                              </article>
                            ))}
                          </div>
                        </aside>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
