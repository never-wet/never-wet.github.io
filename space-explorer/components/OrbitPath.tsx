"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { SpaceObject } from "../data/solarSystemData";
import {
  getMoonOrbitSceneRadius,
  getOrbitSceneRadiusAU,
  type ScaleMode,
} from "../lib/measurementUtils";

type OrbitPathProps = {
  object: SpaceObject;
  scaleMode: ScaleMode;
  moonOrbit?: boolean;
  opacity?: number;
};

export function OrbitPath({ object, scaleMode, moonOrbit = false, opacity = 0.32 }: OrbitPathProps) {
  const points = useMemo(() => {
    const pointCount = moonOrbit ? 112 : 220;
    const eccentricity = moonOrbit ? 0 : object.eccentricity ?? 0;
    const a = moonOrbit
      ? getMoonOrbitSceneRadius(object, scaleMode)
      : getOrbitSceneRadiusAU(object.semiMajorAxisAU ?? 0, scaleMode);
    const b = a * Math.sqrt(Math.max(1 - eccentricity * eccentricity, 0.02));

    return Array.from({ length: pointCount + 1 }, (_, index) => {
      const theta = (index / pointCount) * Math.PI * 2;
      return new THREE.Vector3(a * (Math.cos(theta) - eccentricity), 0, b * Math.sin(theta));
    });
  }, [moonOrbit, object, scaleMode]);

  return (
    <Line
      points={points}
      color={object.color}
      transparent
      opacity={opacity}
      lineWidth={moonOrbit ? 0.55 : 0.72}
      depthWrite={false}
    />
  );
}
