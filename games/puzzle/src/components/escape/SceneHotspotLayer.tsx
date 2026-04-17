import type { SceneDefinition } from "../../memory/types";

function shapeClass(shape: string) {
  return `scene-element scene-element--${shape}`;
}

export function SceneHotspotLayer({
  scene,
  foundHotspotIds,
  onHotspotClick,
  zoomed = false,
  compareLabel,
}: {
  scene: SceneDefinition;
  foundHotspotIds: string[];
  onHotspotClick: (hotspotId: string) => void;
  zoomed?: boolean;
  compareLabel?: string;
}) {
  return (
    <section className={`scene-panel ${zoomed ? "scene-panel--zoomed" : ""}`}>
      <div className="scene-panel__header">
        <div>
          <strong>{scene.title}</strong>
          <p>{scene.subtitle}</p>
        </div>
        {compareLabel ? <span className="badge">{compareLabel}</span> : null}
      </div>

      <div className="scene-art" style={{ background: scene.backdrop }}>
        {scene.elements.map((element) => (
          <div
            key={element.id}
            className={shapeClass(element.shape)}
            aria-hidden="true"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.width}%`,
              height: `${element.height}%`,
              background: element.color,
              borderColor: element.border ?? "transparent",
              opacity: element.opacity ?? 1,
              transform: `translate(-50%, -50%) rotate(${element.rotation ?? 0}deg)`,
            }}
          />
        ))}

        {scene.hotspots.map((hotspot) => {
          const found = foundHotspotIds.includes(hotspot.id);

          return (
            <button
              key={hotspot.id}
              type="button"
              className={`scene-hotspot ${found ? "scene-hotspot--found" : ""}`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
              }}
              aria-label={hotspot.label}
              onClick={() => onHotspotClick(hotspot.id)}
            >
              <span>{found ? "Found" : hotspot.label}</span>
            </button>
          );
        })}
      </div>

      <p className="scene-panel__description">{scene.description}</p>
    </section>
  );
}
