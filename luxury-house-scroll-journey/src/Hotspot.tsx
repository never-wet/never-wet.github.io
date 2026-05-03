import { Html } from "@react-three/drei";
import { useState } from "react";
import type { HotspotData, StageId } from "@/PropertyData";

type HotspotProps = {
  data: HotspotData;
  activeStageId: StageId;
};

export function Hotspot({ data, activeStageId }: HotspotProps) {
  const [open, setOpen] = useState(false);
  const isActive = data.stageId === activeStageId;

  return (
    <Html
      center
      distanceFactor={8}
      position={data.position}
      transform={false}
      zIndexRange={[18, 4]}
      className={`hotspot ${isActive ? "is-active" : ""}`}
    >
      <button
        aria-expanded={open}
        aria-label={`${data.label} feature`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>{data.label}</span>
      </button>
      {open && isActive ? (
        <article className="hotspot__panel">
          <strong>{data.title}</strong>
          <p>{data.body}</p>
        </article>
      ) : null}
    </Html>
  );
}
