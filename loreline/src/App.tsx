import { BrandLogo } from './components/BrandLogo'
import { DifferenceSignalCloud } from './components/DifferenceSignalCloud'
import { FeatureShowcase } from './components/FeatureShowcase'
import { FinalCallToAction } from './components/FinalCallToAction'
import { Hero } from './components/Hero'
import { LocaleProvider, localeOptions, useLocale } from './i18n'
import { ModulesSection } from './components/ModulesSection'
import { OwnershipSection } from './components/OwnershipSection'
import { StudioWorkspace } from './components/StudioWorkspace'
import { ValueGrid } from './components/ValueGrid'
import { WhyDifferentSection } from './components/WhyDifferentSection'
import { WritingExperienceSection } from './components/WritingExperienceSection'

const navItems = [
  { href: '#value', label: 'Overview' },
  { href: '#showcase', label: 'Workspace' },
  { href: '#modules', label: 'Modules' },
  { href: '#writing', label: 'Writing' },
  { href: '#difference', label: 'Difference' },
]

const footerPrimaryLinks = [
  { href: '#value', label: 'Overview' },
  { href: '#showcase', label: 'Workspace' },
  { href: '#modules', label: 'Systems' },
  { href: '#writing', label: 'Writing' },
  { href: '#difference', label: 'Compare' },
  { href: '?view=studio', label: 'Open studio' },
]

const footerSecondaryLinks = [
  { href: '#ownership', label: 'Creator trust' },
  { href: '#cta', label: 'Begin your world' },
]

const footerUtilityLinks = [
  { href: '?view=studio', label: 'Open studio', icon: 'studio' },
  { href: '#modules', label: 'View systems', icon: 'systems' },
  { href: '#ownership', label: 'Creator trust', icon: 'trust' },
  { href: '#top', label: 'Back to top', icon: 'top' },
] as const

function FooterIcon({ icon }: { icon: (typeof footerUtilityLinks)[number]['icon'] }) {
  if (icon === 'studio') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M7 17.5 16.7 7.8m0 0H10.9m5.8 0v5.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M6.8 6.8h5.1m5.3 5.3v5.1a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 17.2V8.6a1.8 1.8 0 0 1 1.8-1.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (icon === 'systems') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <circle cx="6.5" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8.4 8.3 10.6 14m4.9-5.7-2.2 5.7M8.5 7h6.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (icon === 'trust') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 4.8 18 7v4.6c0 3.4-2.4 6.4-6 7.6-3.6-1.2-6-4.2-6-7.6V7l6-2.2Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m9.3 12.2 1.8 1.8 3.6-4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 18.5V5.5m0 0-4 4m4-4 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function isStudioView() {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('view') === 'studio'
}

function AppShell() {
  const { locale, setLocale, t } = useLocale()
  const studioHref = `?view=studio&lang=${locale}`
  const resolveHref = (href: string) => (href === '?view=studio' ? studioHref : href)

  if (isStudioView()) {
    return <StudioWorkspace />
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <nav aria-label="Primary" className="topbar__nav-shell">
            {navItems.map((item) => (
              <a className="topbar__link" href={item.href} key={item.href}>
                {t(item.label)}
              </a>
            ))}
          </nav>

          <div className="topbar__identity-panel">
            <BrandLogo className="brand brand--topbar" href="#top" />
          </div>

          <div className="topbar__controls">
            <div className="topbar__actions-panel">
              <div className="topbar__locale-panel">
                <p className="topbar__actions-label">{t('Language')}</p>
                <div className="locale-switcher" aria-label={t('Language')} role="group">
                  {localeOptions.map((option) => (
                    <button
                      aria-pressed={locale === option.code}
                      className={`locale-switcher__button ${locale === option.code ? 'locale-switcher__button--active' : ''}`}
                      key={option.code}
                      lang={option.code}
                      onClick={() => setLocale(option.code)}
                      title={option.nativeLabel}
                      type="button"
                    >
                      {option.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="topbar__cta-panel">
              <div className="topbar__actions">
                <a className="button button--primary button--compact topbar__cta" href={studioHref}>
                  {t('Open studio')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <section className="section section--signal-intro" aria-labelledby="signal-intro-title">
          <div className="container">
            <DifferenceSignalCloud />
          </div>
        </section>
        <ValueGrid />
        <FeatureShowcase />
        <ModulesSection />
        <WritingExperienceSection />
        <OwnershipSection />
        <WhyDifferentSection />
        <FinalCallToAction />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__identity">
            <BrandLogo className="footer__brand brand--footer" href="#top" />
            <p className="footer__copy">{t('A premium worldbuilding and story-development platform for creators building entire fictional universes.')}</p>
          </div>

          <div className="footer__nav" role="navigation" aria-label="Footer">
            <div className="footer__link-row">
              {footerPrimaryLinks.map((item) => (
                <a href={resolveHref(item.href)} key={item.href}>
                  {t(item.label)}
                </a>
              ))}
            </div>
            <div className="footer__link-row footer__link-row--secondary">
              {footerSecondaryLinks.map((item) => (
                <a href={resolveHref(item.href)} key={item.href}>
                  {t(item.label)}
                </a>
              ))}
            </div>
          </div>

          <div className="footer__utilities" aria-label="Footer quick links">
            {footerUtilityLinks.map((item) => (
              <a
                className="footer__icon-link"
                href={resolveHref(item.href)}
                key={item.label}
                aria-label={t(item.label)}
                title={t(item.label)}
              >
                <FooterIcon icon={item.icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <LocaleProvider>
      <AppShell />
    </LocaleProvider>
  )
}

export default App
