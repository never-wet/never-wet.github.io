"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { famousStars } from "../data/famousStarsData";
import { solarSystemObjects, solarSystemObjectsById, type SpaceObject } from "../data/solarSystemData";
import {
  degreesToRadians,
  getMoonOrbitSceneRadius,
  getObjectScenePosition,
  getOrbitSceneRadiusAU,
  getOrbitalAngle,
  type ScaleMode,
} from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";
import { OrbitPath } from "./OrbitPath";
import { Planet } from "./Planet";
import { Star } from "./Star";

type SolarSystemProps = {
  dateIso: string;
  scaleMode: ScaleMode;
};

const sun = solarSystemObjectsById.get("sun");
const primaryObjects = solarSystemObjects.filter((object) => !object.parentId && object.id !== "sun");
const solidPrimaryObjects = primaryObjects.filter((object) => object.kind !== "belt");
const beltObjects = primaryObjects.filter((object) => object.kind === "belt");

export function SolarSystem({ dateIso, scaleMode }: SolarSystemProps) {
  const showOrbits = useSpaceStore((state) => state.showOrbits);
  const showLabels = useSpaceStore((state) => state.showLabels);
  const showBelts = useSpaceStore((state) => state.showBelts);

  const moonsByParent = useMemo(() => {
    return solarSystemObjects.reduce<Record<string, SpaceObject[]>>((groups, object) => {
      if (!object.parentId) return groups;
      groups[object.parentId] = [...(groups[object.parentId] ?? []), object];
      return groups;
    }, {});
  }, []);

  return (
    <group>
      {sun ? <Star object={sun} dateIso={dateIso} scaleMode={scaleMode} showLabels={showLabels} /> : null}

      {showOrbits
        ? solidPrimaryObjects.map((object) => (
            <OrbitPath key={`orbit-${object.id}`} object={object} scaleMode={scaleMode} />
          ))
        : null}

      {showBelts
        ? beltObjects.map((object) => (
            <BeltBand key={object.id} object={object} scaleMode={scaleMode} showLabels={showLabels} />
          ))
        : null}

      {solidPrimaryObjects.map((object) => {
        const position = getObjectScenePosition(object, dateIso, scaleMode);
        const moons = moonsByParent[object.id] ?? [];

        return (
          <group key={object.id}>
            <Planet object={object} position={position} scaleMode={scaleMode} showLabels={showLabels} />
            <group position={position}>
              {showOrbits
                ? moons.map((moon) => (
                    <OrbitPath key={`moon-orbit-${moon.id}`} object={moon} scaleMode={scaleMode} moonOrbit opacity={0.22} />
                  ))
                : null}
              {moons.map((moon) => (
                <Planet
                  key={moon.id}
                  object={moon}
                  position={getMoonRelativePosition(moon, dateIso, scaleMode)}
                  scaleMode={scaleMode}
                  showLabels={showLabels}
                />
              ))}
            </group>
          </group>
        );
      })}

      {famousStars.map((star) => (
        <Star key={star.id} object={star} dateIso={dateIso} scaleMode={scaleMode} showLabels={showLabels} />
      ))}
    </group>
  );
}

function getMoonRelativePosition(
  object: SpaceObject,
  dateIso: string,
  scaleMode: ScaleMode
): [number, number, number] {
  const radius = getMoonOrbitSceneRadius(object, scaleMode);
  const angle = getOrbitalAngle(object, dateIso);
  const tilt = degreesToRadians(object.orbitalTiltDeg ?? 0);
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * Math.sin(tilt) * radius,
    Math.sin(angle) * Math.cos(tilt) * radius,
  ];
}

function BeltBand({
  object,
  scaleMode,
  showLabels,
}: {
  object: SpaceObject;
  scaleMode: ScaleMode;
  showLabels: boolean;
}) {
  const selectObject = useSpaceStore((state) => state.selectObject);
  const selectedObjectId = useSpaceStore((state) => state.selectedObjectId);
  const radius = getOrbitSceneRadiusAU(object.semiMajorAxisAU ?? 0, scaleMode);
  const isKuiper = object.id === "kuiper-belt";
  const count = isKuiper ? 950 : 1250;
  const width = scaleMode === "real" ? (isKuiper ? 150 : 32) : isKuiper ? 24 : 8;
  const selected = selectedObjectId === object.id;

  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const randomA = seeded(index * 11.31 + (isKuiper ? 3 : 0));
      const randomB = seeded(index * 3.71 + 9);
      const angle = randomA * Math.PI * 2;
      const localRadius = radius + (randomB - 0.5) * width;
      const lift = (seeded(index * 8.83 + 2) - 0.5) * (isKuiper ? 2.6 : 0.8);
      data[index * 3] = Math.cos(angle) * localRadius;
      data[index * 3 + 1] = lift;
      data[index * 3 + 2] = Math.sin(angle) * localRadius;
    }
    return data;
  }, [count, isKuiper, radius, width]);

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        selectObject(object.id);
      }}
    >
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={object.color}
          size={isKuiper ? 0.15 : 0.09}
          transparent
          opacity={selected ? 0.72 : 0.42}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, Math.max(width * 0.5, 1.4), 8, 256]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {showLabels ? (
        <Html center zIndexRange={[2, 0]} position={[radius, 1.8, 0]} className="space-label space-label--belt">
          <span className={selected ? "is-selected" : ""}>{object.name}</span>
        </Html>
      ) : null}
    </group>
  );
}

function seeded(value: number) {
  return Math.abs(Math.sin(value * 12.9898) * 43758.5453) % 1;
}
