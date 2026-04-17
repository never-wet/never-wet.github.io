import { useState } from "react";
import type { EscapeRoomDefinition, EscapeRoomTransition } from "../../memory/types";
import { SceneHotspotLayer } from "./SceneHotspotLayer";

export function EscapeRoomScene({
  room,
  currentSceneId,
  foundHotspotIds,
  transitions,
  onTransition,
  onInspect,
}: {
  room: EscapeRoomDefinition;
  currentSceneId: string;
  foundHotspotIds: string[];
  transitions: { definition: EscapeRoomTransition; available: boolean }[];
  onTransition: (sceneId: string) => void;
  onInspect: (hotspotId: string) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const scene = room.scenes.find((entry) => entry.id === currentSceneId) ?? room.scenes[0];

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{scene.title}</h2>
          <p>{scene.subtitle}</p>
        </div>
        <button type="button" className="button button--subtle" onClick={() => setZoomed((value) => !value)}>
          {zoomed ? "Reset Zoom" : "Zoom Inspect"}
        </button>
      </div>

      <SceneHotspotLayer
        scene={scene}
        foundHotspotIds={foundHotspotIds}
        onHotspotClick={onInspect}
        zoomed={zoomed}
      />

      <div className="room-transitions">
        {transitions.map(({ definition, available }) => (
          <button
            key={`${scene.id}-${definition.targetSceneId}`}
            type="button"
            className="button button--ghost"
            onClick={() => onTransition(definition.targetSceneId)}
            disabled={!available}
          >
            <span>{definition.label}</span>
            <small>{definition.description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
