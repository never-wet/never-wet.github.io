"use client";

import * as THREE from "three";
import { Building } from "./Building";
import { SpatialOverlay } from "./SpatialOverlay";
import { BuildingDestination } from "../lib/worldData";

type BuildingPortalProps = {
  destination: BuildingDestination;
  onEnter: (destination: BuildingDestination, group?: THREE.Group) => void;
};

export function BuildingPortal({ destination, onEnter }: BuildingPortalProps) {
  return (
    <>
      <Building destination={destination} onEnter={(building, group) => onEnter(building, group)} />
      <SpatialOverlay destination={destination} onEnter={(building) => onEnter(building)} />
    </>
  );
}
