"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { SpaceObject } from "../data/solarSystemData";
import {
  getObjectSceneRadius,
  getTexturePath,
  type ScaleMode,
} from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";

type PlanetProps = {
  object: SpaceObject;
  position: [number, number, number];
  scaleMode: ScaleMode;
  showLabels: boolean;
};

export function Planet({ object, position, scaleMode, showLabels }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const bodyMap = useTexture(getTexturePath(object.texture?.map ?? "moon.jpg") ?? "./textures/moon.jpg");
  const overlayMap = useTexture(
    getTexturePath(object.texture?.clouds ?? object.texture?.atmosphere ?? object.texture?.map ?? "moon.jpg") ??
      "./textures/moon.jpg"
  );
  const nightMap = useTexture(getTexturePath(object.texture?.night ?? object.texture?.map ?? "moon.jpg") ?? "./textures/moon.jpg");
  const ringMap = useTexture(getTexturePath(object.texture?.rings ?? "saturn-rings.png") ?? "./textures/saturn-rings.png");
  const selectObject = useSpaceStore((state) => state.selectObject);
  const selectedObjectId = useSpaceStore((state) => state.selectedObjectId);
  const measurementIds = useSpaceStore((state) => state.measurementIds);
  const isPaused = useSpaceStore((state) => state.isPaused);
  const radius = getObjectSceneRadius(object, scaleMode);
  const isSelected = selectedObjectId === object.id || measurementIds.includes(object.id);
  const bodyTexture = useMemo(() => prepareTexture(bodyMap), [bodyMap]);
  const overlayTexture = useMemo(() => prepareTexture(overlayMap), [overlayMap]);
  const nightTexture = useMemo(() => prepareTexture(nightMap), [nightMap]);
  const ringTexture = useMemo(() => prepareTexture(ringMap), [ringMap]);

  const axialTilt = useMemo(() => ((object.axialTiltDeg ?? 0) * Math.PI) / 180, [object.axialTiltDeg]);

  useFrame((_, delta) => {
    if (!groupRef.current || isPaused) return;
    const period = object.rotationPeriodHours || 24;
    const direction = period < 0 ? -1 : 1;
    const spin = direction * Math.min(0.34, 2.6 / Math.sqrt(Math.abs(period)));
    groupRef.current.rotation.y += delta * spin;
  });

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        selectObject(object.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={() => setIsHovered(false)}
    >
      <group ref={groupRef} rotation={[0, 0, axialTilt]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[radius, 96, 64]} />
          <meshStandardMaterial
            map={bodyTexture}
            roughness={object.kind === "planet" && object.id !== "mars" ? 0.72 : 0.94}
            metalness={0}
            emissive={object.id === "earth" ? new THREE.Color("#184c92") : new THREE.Color("#000000")}
            emissiveMap={object.id === "earth" ? nightTexture : undefined}
            emissiveIntensity={object.id === "earth" ? 0.22 : 0}
          />
        </mesh>

        {object.texture?.clouds || object.texture?.atmosphere ? (
          <mesh scale={object.texture?.clouds ? 1.018 : 1.025}>
            <sphereGeometry args={[radius, 96, 48]} />
            <meshStandardMaterial
              map={object.texture?.atmosphere ? overlayTexture : undefined}
              alphaMap={object.texture?.clouds ? overlayTexture : undefined}
              color={object.atmosphereColor ?? "#ffffff"}
              transparent
              opacity={object.texture?.clouds ? 0.36 : 0.42}
              depthWrite={false}
              roughness={0.85}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ) : null}

        {object.texture?.rings ? (
          <mesh rotation={[Math.PI / 2 + 0.2, 0, 0]}>
            <ringGeometry args={[radius * 1.42, radius * 2.36, 192]} />
            <meshBasicMaterial
              map={ringTexture}
              alphaMap={ringTexture}
              transparent
              opacity={0.86}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ) : null}

        {isSelected || isHovered ? (
          <mesh scale={1.16}>
            <sphereGeometry args={[radius, 64, 32]} />
            <meshBasicMaterial
              color="#8eeaff"
              transparent
              opacity={isSelected ? 0.13 : 0.075}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ) : null}
      </group>

      <mesh scale={Math.max(1, 0.54 / Math.max(radius, 0.001))}>
        <sphereGeometry args={[Math.max(radius, 0.28), 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showLabels || isHovered || isSelected ? (
        <Html center zIndexRange={[2, 0]} position={[0, radius + 0.58, 0]} className="space-label">
          <span className={isSelected ? "is-selected" : ""}>{object.name}</span>
        </Html>
      ) : null}
    </group>
  );
}

function prepareTexture(texture: THREE.Texture) {
  const prepared = texture.clone();
  prepared.colorSpace = THREE.SRGBColorSpace;
  prepared.anisotropy = 8;
  prepared.needsUpdate = true;
  return prepared;
}
