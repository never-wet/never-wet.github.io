"use client";

import { Html } from "@react-three/drei";
import { CSSProperties } from "react";
import { BuildingDestination } from "../lib/worldData";
import { useWorldStore } from "../store/useWorldStore";

type SpatialOverlayProps = {
  destination: BuildingDestination;
  onEnter: (destination: BuildingDestination) => void;
};

export function SpatialOverlay({ destination, onEnter }: SpatialOverlayProps) {
  const nearbyBuildingId = useWorldStore((state) => state.nearbyBuildingId);
  const activeBuildingId = useWorldStore((state) => state.activeBuildingId);
  const selectedBuildingId = useWorldStore((state) => state.selectedBuildingId);
  const selectBuilding = useWorldStore((state) => state.selectBuilding);
  const openNpcChat = useWorldStore((state) => state.openNpcChat);
  const visible =
    nearbyBuildingId === destination.id ||
    activeBuildingId === destination.id ||
    selectedBuildingId === destination.id;

  if (!visible) return null;

  return (
    <Html
      center
      position={[destination.position[0], destination.size[1] + 0.86, destination.position[2]]}
      className="spatial-card is-visible"
      style={{ "--accent": destination.color } as CSSProperties}
    >
      <small>{destination.section}</small>
      <strong>{destination.name}</strong>
      <p>{destination.hint}</p>
      <div className="spatial-actions">
        <button className="glass-button" type="button" onClick={() => onEnter(destination)}>
          Enter
        </button>
        <button
          className="glass-button"
          type="button"
          onClick={() => {
            selectBuilding(destination.id);
            openNpcChat(destination.id);
          }}
        >
          Guide
        </button>
      </div>
    </Html>
  );
}
