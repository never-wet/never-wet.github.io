import { differenceSignals } from '../data/siteContent'
import { useLocale } from '../i18n'
import { ScrollReveal } from './ScrollReveal'

export function DifferenceSignalCloud() {
  const { t } = useLocale()

  return (
    <div className="difference-cloud" aria-label="Loreline positioning signals">
      <ScrollReveal className="difference-cloud__core scroll-reveal--section" once={false} rootMargin="-6% 0px -14% 0px" threshold={0.12}>
        <p className="difference-cloud__eyebrow">{t('What Loreline holds in place')}</p>
        <h3 className="difference-cloud__title">{t('A story system should stay disciplined around the work, not noisy around the user.')}</h3>
        <p className="difference-cloud__description">
          {t(
            'The world stays connected, the writing room stays calm, and the product posture stays creator-first. Those principles are part of the experience, not pasted on afterward.',
          )}
        </p>
      </ScrollReveal>

      <div className="difference-cloud__orbits" aria-hidden="true">
        {differenceSignals.map((signal, index) => (
          <ScrollReveal
            as="div"
            className={`difference-cloud__signal-wrap difference-cloud__signal-wrap--${signal.id}`}
            delay={120 + index * 70}
            key={signal.id}
            once={false}
            rootMargin="-8% 0px -18% 0px"
            threshold={0.08}
          >
            <span className="difference-cloud__signal">{t(signal.label)}</span>
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}
