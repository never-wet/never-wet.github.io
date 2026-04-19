import { useSite } from "@/app/SiteProvider";
import { uiManifest } from "@/memory/uiManifest";

export function BootOverlay() {
  const { bootProgress, bootVisible } = useSite();

  return (
    <div className={`boot-overlay${bootVisible ? " is-visible" : ""}`} aria-hidden={!bootVisible}>
      <div className="boot-overlay__panel">
        <p className="eyebrow">{uiManifest.boot.eyebrow}</p>
        <h1>{uiManifest.boot.title}</h1>
        <p className="boot-overlay__status">
          {uiManifest.boot.statusLabel}
          <span>{bootProgress}%</span>
        </p>
        <div className="boot-overlay__bar">
          <span style={{ transform: `scaleX(${bootProgress / 100})` }} />
        </div>
        <p className="boot-overlay__hint">{uiManifest.boot.hint}</p>
      </div>
    </div>
  );
}
