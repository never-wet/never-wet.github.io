type SectionIntroProps = {
  eyebrow: string
  title: string
  description: string
  headingId: string
}

export function SectionIntro({ eyebrow, title, description, headingId }: SectionIntroProps) {
  return (
    <div className="section-intro">
      <p className="section-intro__eyebrow">{eyebrow}</p>
      <h2 className="section-intro__title" id={headingId}>
        {title}
      </h2>
      <p className="section-intro__description">{description}</p>
    </div>
  )
}
