import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export const Panel = ({ title, eyebrow, actions, className, children }: PanelProps) => (
  <section className={`panel ${className ?? ""}`.trim()}>
    {(title || eyebrow || actions) && (
      <header className="panel-header">
        <div>
          {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
          {title ? <h2>{title}</h2> : null}
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </header>
    )}
    {children}
  </section>
);
