import { ownershipPoints } from '../data/siteContent'
import { useLocale } from '../i18n'
import { ScrollQuote } from './ScrollQuote'
import { SectionIntro } from './SectionIntro'
import { ScrollReveal } from './ScrollReveal'

export function OwnershipSection() {
  const { t } = useLocale()

  return (
    <section className="section" id="ownership" aria-labelledby="ownership-title">
      <div className="container">
        <ScrollReveal className="scroll-reveal--section">
          <SectionIntro
            eyebrow={t('Creator ownership, privacy, and focus')}
            title={t("A serious story workspace should protect the creator's attention and sense of ownership.")}
            description={t(
              'The product direction here is intentionally different from shallow AI tooling. It should feel private, calm, and built for the long, careful work of creating a world that actually holds together.',
            )}
            headingId="ownership-title"
          />
        </ScrollReveal>

        <div className="ownership-grid">
          {ownershipPoints.map((point, index) => (
            <ScrollReveal as="article" className="ownership-card" delay={80 + index * 70} key={point.title}>
              <h3>{t(point.title)}</h3>
              <p>{t(point.description)}</p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollQuote />
      </div>
    </section>
  )
}
