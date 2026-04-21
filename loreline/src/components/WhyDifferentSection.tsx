import { ComparisonTable } from './ComparisonTable'
import { useLocale } from '../i18n'
import { SectionIntro } from './SectionIntro'
import { ScrollReveal } from './ScrollReveal'

export function WhyDifferentSection() {
  const { t } = useLocale()

  return (
    <section className="section" id="difference" aria-labelledby="difference-title">
      <div className="container">
        <ScrollReveal className="scroll-reveal--section">
          <SectionIntro
            eyebrow={t('Why it is different')}
            title={t('Built against shallow tools, not as another version of them.')}
            description={t(
              'This product is not meant to feel like a prompt tool, a notes bucket, or a bare chapter editor with a graph layered on top. Its job is to unify worldbuilding depth and storytelling structure inside one controlled creative system.',
            )}
            headingId="difference-title"
          />
        </ScrollReveal>
        <ComparisonTable />
      </div>
    </section>
  )
}
