"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { FamousStar } from "../data/famousStarsData";
import type { SpaceObject } from "../data/solarSystemData";
import {
  getObjectScenePosition,
  getObjectSceneRadius,
  getTexturePath,
  isFamousStar,
  type ScaleMode,
} from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";

type StarProps = {
  object: FamousStar | SpaceObject;
  dateIso: string;
  scaleMode: ScaleMode;
  showLabels: boolean;
};

export function Star({ object, dateIso, scaleMode, showLabels }: StarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const texture = useTexture(
    getTexturePath(!isFamousStar(object) ? object.texture?.map : undefined) ??
      getTexturePath("sun.jpg") ??
      "./textures/sun.jpg"
  );
  const selectObject = useSpaceStore((state) => state.selectObject);
  const selectedObjectId = useSpaceStore((state) => state.selectedObjectId);
  const measurementIds = useSpaceStore((state) => state.measurementIds);
  const isPaused = useSpaceStore((state) => state.isPaused);

  const radius = getObjectSceneRadius(object, scaleMode);
  const position = getObjectScenePosition(object, dateIso, scaleMode);
  const isSelected = selectedObjectId === object.id || measurementIds.includes(object.id);

  const materialColor = useMemo(() => new THREE.Color(object.color), [object.color]);
  const sunTexture = useMemo(() => {
    const prepared = texture.clone();
    prepared.colorSpace = THREE.SRGBColorSpace;
    prepared.anisotropy = 8;
    prepared.needsUpdate = true;
    return prepared;
  }, [texture]);
  const emissiveIntensity = isFamousStar(object)
    ? Math.min(1.8 + Math.log10(object.luminositySolar + 1) * 0.44, 4.8)
    : 4.2;

  useFrame((_, delta) => {
    if (!groupRef.current || isPaused) return;
    groupRef.current.rotation.y += delta * (isFamousStar(object) ? 0.05 : 0.09);
    groupRef.current.rotation.z = Math.sin(Date.now() * 0.00018) * 0.015;
  });

  return (
    <group
      ref={groupRef}
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
      <pointLight color={object.color} intensity={isFamousStar(object) ? 1.3 : 7.2} distance={radius * 24} />
      <mesh>
        <sphereGeometry args={[radius, 96, 64]} />
        {isFamousStar(object) ? (
          <meshBasicMaterial color={materialColor} toneMapped={false} />
        ) : (
          <meshBasicMaterial map={sunTexture} color={materialColor} toneMapped={false} />
        )}
      </mesh>
      <mesh scale={1.9}>
        <sphereGeometry args={[radius, 64, 32]} />
        <meshBasicMaterial
          color={object.color}
          transparent
          opacity={isSelected ? 0.075 : isHovered ? 0.055 : 0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={3.2}>
        <sphereGeometry args={[radius, 48, 24]} />
        <meshBasicMaterial
          color={object.color}
          transparent
          opacity={Math.min(0.032, 0.006 * emissiveIntensity)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={Math.max(1.4, 0.5 + radius * 0.8)}>
        <sphereGeometry args={[Math.max(radius, 0.34), 24, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {showLabels || isHovered || isSelected ? (
        <Html center zIndexRange={[2, 0]} position={[0, radius * 1.52 + 0.7, 0]} className="space-label">
          <span className={isSelected ? "is-selected" : ""}>{object.name}</span>
        </Html>
      ) : null}
    </group>
  );
}
