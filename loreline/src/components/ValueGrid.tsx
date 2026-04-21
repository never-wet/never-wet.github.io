import { useLocale } from '../i18n'
import { ScrollReveal } from './ScrollReveal'
import { SectionIntro } from './SectionIntro'

export function ValueGrid() {
  const { t } = useLocale()

  return (
    <section className="section section--value-intro" id="value" aria-labelledby="value-title">
      <div className="container value-overview">
        <ScrollReveal className="value-overview__intro scroll-reveal--section">
          <SectionIntro
            eyebrow={t('Product overview')}
            title={t('One place for the world, the structure, and the manuscript to grow together.')}
            description={t(
              'Loreline is built for creators shaping full story universes. Characters, places, lore, timelines, and the manuscript stay inside one calm system, so worldbuilding and writing stop feeling like separate jobs.',
            )}
            headingId="value-title"
          />

          <div className="value-overview__threads" aria-label={t('Connected creative layers')}>
            <div className="value-overview__thread">
              <p className="value-overview__thread-label">{t('World')}</p>
              <p className="value-overview__thread-copy">{t('Places, factions, systems, and canon live in one continuous atlas instead of scattered notes.')}</p>
            </div>
            <div className="value-overview__thread">
              <p className="value-overview__thread-label">{t('Structure')}</p>
              <p className="value-overview__thread-copy">{t('Plot lines, chronology, pressure points, and reveals stay visible as part of the same architecture.')}</p>
            </div>
            <div className="value-overview__thread">
              <p className="value-overview__thread-label">{t('Manuscript')}</p>
              <p className="value-overview__thread-copy">{t('Scenes grow from the world around them, so drafting never drifts away from the logic underneath.')}</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="value-overview__visual scroll-reveal--section" delay={120}>
          <div className="value-overview__constellation" aria-hidden="true">
            <div className="value-overview__glow value-overview__glow--sun" />
            <div className="value-overview__glow value-overview__glow--moss" />

            <div className="value-overview__beam value-overview__beam--world" />
            <div className="value-overview__beam value-overview__beam--structure" />
            <div className="value-overview__beam value-overview__beam--manuscript" />

            <div className="value-overview__node value-overview__node--world">
              <span className="value-overview__node-label">{t('World')}</span>
              <span className="value-overview__node-note">{t('Atlas, lore, places')}</span>
            </div>

            <div className="value-overview__node value-overview__node--structure">
              <span className="value-overview__node-label">{t('Structure')}</span>
              <span className="value-overview__node-note">{t('Threads, causality, time')}</span>
            </div>

            <div className="value-overview__node value-overview__node--manuscript">
              <span className="value-overview__node-label">{t('Manuscript')}</span>
              <span className="value-overview__node-note">{t('Scenes written inside the same system')}</span>
            </div>

            <div className="value-overview__orbit value-overview__orbit--characters">{t('Characters')}</div>
            <div className="value-overview__orbit value-overview__orbit--timeline">{t('Timeline')}</div>
            <div className="value-overview__orbit value-overview__orbit--codex">{t('Codex')}</div>
            <div className="value-overview__orbit value-overview__orbit--factions">{t('Factions')}</div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
