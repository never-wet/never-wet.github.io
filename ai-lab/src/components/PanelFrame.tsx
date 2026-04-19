import type { PropsWithChildren, ReactNode } from 'react'

interface PanelFrameProps extends PropsWithChildren {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export const PanelFrame = ({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
  children,
}: PanelFrameProps) => (
  <section className={['panel-frame', className].filter(Boolean).join(' ')}>
    <header className="panel-frame__header">
      <div>
        {eyebrow ? <p className="panel-frame__eyebrow">{eyebrow}</p> : null}
        <h2 className="panel-frame__title">{title}</h2>
        {subtitle ? <p className="panel-frame__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="panel-frame__actions">{actions}</div> : null}
    </header>
    <div className="panel-frame__body">{children}</div>
  </section>
)
