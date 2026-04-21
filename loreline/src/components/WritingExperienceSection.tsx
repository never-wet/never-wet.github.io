import { writingSignals } from '../data/siteContent'
import { useLocale } from '../i18n'
import { SectionIntro } from './SectionIntro'
import { ScrollReveal } from './ScrollReveal'

export function WritingExperienceSection() {
  const { t } = useLocale()

  return (
    <section className="section" id="writing" aria-labelledby="writing-title">
      <div className="container">
        <div className="writing-layout">
          <ScrollReveal className="writing-copy scroll-reveal--section">
            <SectionIntro
              eyebrow={t('Writing experience')}
              title={t('A manuscript room designed for immersion, supported by the world around it.')}
              description={t(
                'The writing experience is focused and quiet, but it never cuts itself off from the story universe. Characters, places, lore, and timeline logic remain available through deliberate, low-friction disclosure.',
              )}
              headingId="writing-title"
            />

            <div className="writing-signals">
              {writingSignals.map((signal, index) => (
                <ScrollReveal as="article" className="writing-signal" delay={100 + index * 70} key={signal.title}>
                  <h3>{t(signal.title)}</h3>
                  <p>{t(signal.description)}</p>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal className="writing-preview" delay={140}>
            <div className="writing-preview__chrome">
              <span className="hero-preview__dot" />
              <span className="hero-preview__dot" />
              <span className="hero-preview__dot" />
              <p className="hero-preview__path">{t('Manuscript / Chapter 08 / Council Chamber')}</p>
            </div>

            <div className="writing-preview__surface">
              <div className="writing-preview__manuscript">
                <p className="writing-preview__kicker">{t('Manuscript mode')}</p>
                <h3>{t('The council chamber was built to make every voice sound measured.')}</h3>
                <p>
                  {t(
                    'Even outrage became orderly in that room. Stone gave every sentence a judicial patience, and patience gave fear a respectable face. Mira laid the charter on the table and felt the whole city tighten behind the paper.',
                  )}
                </p>
                <p>
                  {t(
                    'This is where the worldbuilding earns its keep. Ritual law, district politics, faction memory, and personal betrayal all arrive inside the same paragraph because the manuscript grows from the world that produced it.',
                  )}
                </p>
              </div>

              <aside className="writing-preview__drawer">
                <p className="writing-preview__label">{t('Context drawer')}</p>
                <ul className="writing-preview__list">
                  <li>{t('Faction pressure: Bell Archivists vs River Merchants')}</li>
                  <li>{t('Location rule: Witnessed oaths require public registry')}</li>
                  <li>{t('Timeline note: Hearing begins two days before eclipse')}</li>
                </ul>
              </aside>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
