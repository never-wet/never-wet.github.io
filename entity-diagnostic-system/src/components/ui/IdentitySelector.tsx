"use client";

import type { CSSProperties } from "react";
import type { EntityProfile } from "@/data/entities";
import { useSystemStore } from "@/store/useSystemStore";

type IdentitySelectorProps = {
  entities: EntityProfile[];
  activeId: string;
};

export function IdentitySelector({ entities, activeId }: IdentitySelectorProps) {
  const setEntity = useSystemStore((state) => state.setEntity);
  const setPreviewEntity = useSystemStore((state) => state.setPreviewEntity);
  const setHoverZone = useSystemStore((state) => state.setHoverZone);

  return (
    <section className="identity-selector" aria-label="Entity selection matrix" data-system-reveal>
      {entities.map((entity) => (
        <button
          type="button"
          key={entity.id}
          className={entity.id === activeId ? "is-active" : ""}
          style={{ "--selector-color": entity.color } as CSSProperties}
          onClick={() => setEntity(entity.id)}
          onPointerEnter={() => {
            setPreviewEntity(entity.id);
            setHoverZone("identity");
          }}
          onPointerLeave={() => {
            setPreviewEntity(null);
            setHoverZone("none");
          }}
          data-cursor="SELECT"
        >
          <span>{String(entity.rank).padStart(2, "0")}</span>
          <strong>{entity.name}</strong>
          <small>{entity.classification}</small>
          <i>{entity.trustScore}</i>
        </button>
      ))}
    </section>
  );
}
