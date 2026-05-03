import type { CSSProperties, MouseEvent } from "react";
import { propertyStages } from "@/PropertyData";

type StageTextOverlayProps = {
  activeStageIndex: number;
  progress: number;
};

const navStageIds = ["gate", "exterior", "interior", "final"];

export function StageTextOverlay({ activeStageIndex, progress }: StageTextOverlayProps) {
  const stage = propertyStages[activeStageIndex] ?? propertyStages[0];
  const isFinal = stage.id === "final";
  const meterStyle = { "--meter-progress": progress } as CSSProperties;
  const stageStyle = {
    "--stage-shift": `${Math.round(progress * -32)}px`,
  } as CSSProperties;

  return (
    <div className="interface-layer" style={meterStyle}>
      <header className="residence-nav" aria-label="Private residence navigation">
        <a className="residence-brand" href="../" aria-label="Back to Never Wet home">
          <span>NW</span>
          <strong>Private Residence</strong>
        </a>
        <nav aria-label="Tour stages">
          {propertyStages
            .filter((item) => navStageIds.includes(item.id))
            .map((item) => (
              <button
                aria-current={item.id === stage.id ? "step" : undefined}
                key={item.id}
                onClick={() => scrollToProgress(item.progress)}
                type="button"
              >
                {item.eyebrow}
              </button>
            ))}
        </nav>
      </header>

      <section
        className={`stage-copy stage-copy--${stage.align}`}
        key={stage.id}
        style={stageStyle}
        aria-live="polite"
      >
        <p className="stage-copy__eyebrow">
          <span>{stage.number}</span>
          {stage.eyebrow}
        </p>
        <h1>{stage.title}</h1>
        <p>{stage.copy}</p>
        {isFinal ? (
          <div className="stage-copy__actions" aria-label="Private viewing actions">
            <a href="#residence" onClick={(event) => handleExplore(event)}>
              Explore Residence
            </a>
            <a href="mailto:studio@neverwet.dev?subject=Private%20Residence%20Viewing">
              Book Private Viewing
            </a>
            <a href="#gallery" onClick={(event) => handleGallery(event)}>
              View Gallery
            </a>
          </div>
        ) : null}
      </section>

      <aside className="journey-progress" aria-label="Scroll progress">
        <span>{Math.round(progress * 100).toString().padStart(2, "0")}</span>
        <i aria-hidden="true">
          <b />
        </i>
        <span>100</span>
      </aside>
    </div>
  );
}

function scrollToProgress(progress: number) {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  window.scrollTo({
    top: maxScroll * progress,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

function handleExplore(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  scrollToProgress(0);
}

function handleGallery(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  scrollToProgress(0.8);
}
