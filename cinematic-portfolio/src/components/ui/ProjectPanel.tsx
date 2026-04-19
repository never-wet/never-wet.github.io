import { useSite } from "@/app/SiteProvider";
import { uiManifest } from "@/memory/uiManifest";

function MediaSurface({
  kind,
  label,
  caption,
  src,
  poster,
  fit = "cover",
}: {
  kind: "image" | "video" | "signal";
  label: string;
  caption: string;
  src?: string;
  poster?: string;
  fit?: "cover" | "contain";
}) {
  const isGif = Boolean(src?.toLowerCase().endsWith(".gif"));

  return (
    <figure className={`media-surface media-surface--${kind}`}>
      <div className="media-surface__visual">
        {kind === "signal" ? (
          <div className="signal-panel">
            <span />
            <span />
            <span />
          </div>
        ) : kind === "video" && src && !isGif ? (
          <video autoPlay loop muted playsInline poster={poster} style={{ objectFit: fit }}>
            <source src={src} />
          </video>
        ) : src ? (
          <img src={src} alt={label} style={{ objectFit: fit }} />
        ) : null}
      </div>
      <figcaption>
        <strong>{label}</strong>
        <p>{caption}</p>
      </figcaption>
    </figure>
  );
}

export function ProjectPanel() {
  const { activeProject, closeProject } = useSite();

  if (!activeProject) {
    return null;
  }

  return (
    <section className="project-panel" aria-label={`${activeProject.title} project scene`}>
      <div className="project-panel__backdrop" />
      <div className="project-panel__content">
        <div className="project-panel__header">
          <button type="button" className="project-panel__back" onClick={closeProject}>
            Return to atlas
          </button>
          <p className="eyebrow">{activeProject.sceneTheme}</p>
          <h2>{activeProject.title}</h2>
          <p className="project-panel__lead">{activeProject.chamberDescription}</p>
        </div>

        <div className="project-panel__grid">
          <div className="project-panel__column">
            <section className="project-panel__block">
              <h3>Overview</h3>
              <p>{activeProject.fullDescription}</p>
            </section>
            <section className="project-panel__block">
              <h3>Tech stack</h3>
              <div className="chip-row">
                {activeProject.techStack.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </section>
            <section className="project-panel__block">
              <h3>Project signals</h3>
              <div className="stat-list">
                {activeProject.stats.map((stat) => (
                  <div key={stat.label} className="stat-list__item">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="project-panel__column">
            <section className="project-panel__block">
              <h3>Media surfaces</h3>
              <div className="media-grid">
                {activeProject.media.map((media) => (
                  <MediaSurface key={media.id} {...media} />
                ))}
              </div>
            </section>
            <section className="project-panel__block">
              <h3>Next actions</h3>
              <div className="project-panel__links">
                {activeProject.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className={link.accent === "solid" ? "is-solid" : ""}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <p className="project-panel__hint">{uiManifest.instructions.back}</p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
