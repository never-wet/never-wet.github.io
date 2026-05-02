"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { CSSProperties, useMemo, useRef } from "react";
import * as THREE from "three";
import { BuildingDestination } from "../lib/navigationSystem";
import { useWorldStore } from "../store/useWorldStore";

type BuildingProps = {
  destination: BuildingDestination;
  onEnter: (destination: BuildingDestination, group: THREE.Group) => void;
};

export function Building({ destination, onEnter }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const activeBuildingId = useWorldStore((state) => state.activeBuildingId);
  const nearbyBuildingId = useWorldStore((state) => state.nearbyBuildingId);
  const setHoveredBuilding = useWorldStore((state) => state.setHoveredBuilding);
  const isActive = activeBuildingId === destination.id;
  const isNear = nearbyBuildingId === destination.id;

  const materials = useMemo(() => {
    const base = new THREE.MeshStandardMaterial({
      color: destination.base,
      emissive: destination.color,
      emissiveIntensity: 0.08,
      roughness: 0.62,
      metalness: 0.38
    });
    const accent = new THREE.MeshStandardMaterial({
      color: destination.color,
      emissive: destination.color,
      emissiveIntensity: 0.36,
      roughness: 0.25,
      metalness: 0.35
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: destination.color,
      emissive: destination.color,
      emissiveIntensity: 0.14,
      roughness: 0.22,
      metalness: 0.1,
      transparent: true,
      opacity: 0.58,
      transmission: 0.12
    });
    return { base, accent, glass };
  }, [destination.base, destination.color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = isActive ? 1.035 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.pow(0.001, delta));

    const glow = isNear ? 0.62 : isActive ? 0.4 : 0.08;
    materials.base.emissiveIntensity = THREE.MathUtils.lerp(materials.base.emissiveIntensity, glow, 0.12);
    materials.accent.emissiveIntensity = THREE.MathUtils.lerp(materials.accent.emissiveIntensity, isActive ? 0.9 : 0.36, 0.12);
    materials.glass.emissiveIntensity = THREE.MathUtils.lerp(materials.glass.emissiveIntensity, isActive ? 0.62 : 0.14, 0.12);
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHoveredBuilding(destination.id);
    document.body.classList.add("is-targeting");
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHoveredBuilding(null);
    document.body.classList.remove("is-targeting");
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (groupRef.current) onEnter(destination, groupRef.current);
  };

  return (
    <group
      ref={groupRef}
      position={destination.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <LookAtCenter />
      <BuildingGeometry destination={destination} materials={materials} />
      <mesh position={[0, 0.06, -destination.size[2] / 2 - 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.025, 48]} />
        <meshBasicMaterial color={destination.color} transparent opacity={isActive ? 0.5 : 0.2} />
      </mesh>
      <pointLight color={destination.color} intensity={isActive ? 1.85 : 0.75} distance={7} decay={1.8} />
      <Html
        center
        position={[0, destination.size[1] + 1.28, 0]}
        className={`world-label ${isActive ? "is-active" : ""} ${isNear ? "is-near" : ""}`}
        style={{ "--accent": destination.color } as CSSProperties}
      >
        <span>{destination.section}</span>
        <strong>{destination.name}</strong>
      </Html>
    </group>
  );
}

function LookAtCenter() {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current?.parent) return;
    ref.current.parent.rotation.y = Math.atan2(ref.current.parent.position.x, ref.current.parent.position.z);
    ref.current.parent.rotation.x = 0;
    ref.current.parent.rotation.z = 0;
  });

  return <group ref={ref} />;
}

function BuildingGeometry({
  destination,
  materials
}: {
  destination: BuildingDestination;
  materials: Record<"base" | "accent" | "glass", THREE.Material>;
}) {
  const [w, h, d] = destination.size;

  if (destination.shape === "portfolio") {
    return (
      <>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={materials.base} />
        <Box size={[w + 0.45, 0.16, d + 0.42]} position={[0, h + 0.08, 0]} material={materials.accent} />
        <Box size={[0.18, h + 0.9, d + 0.55]} position={[-w / 2 - 0.28, (h + 0.9) / 2, 0]} material={materials.accent} />
        <Box size={[0.18, h + 0.6, d + 0.55]} position={[w / 2 + 0.28, (h + 0.6) / 2, 0]} material={materials.accent} />
        {[-1, 0, 1].map((slot) => (
          <Box key={slot} size={[0.56, 1.7, 0.06]} position={[slot * 0.86, 1.7, -d / 2 - 0.045]} material={materials.glass} />
        ))}
        <Door destination={destination} material={materials.accent} />
      </>
    );
  }

  if (destination.shape === "ai") {
    return (
      <>
        <mesh position={[0, h * 0.33, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.85, 2.15, h * 0.66, 6]} />
          <primitive object={materials.base} attach="material" />
        </mesh>
        <mesh position={[0, h * 0.86, 0]} castShadow>
          <icosahedronGeometry args={[1.15, 1]} />
          <primitive object={materials.glass} attach="material" />
        </mesh>
        <Box size={[2.65, 0.12, 0.22]} position={[0, h + 1.48, 0]} material={materials.accent} />
        <Box size={[0.22, 0.12, 2.65]} position={[0, h + 1.48, 0]} material={materials.accent} />
        <Door destination={destination} material={materials.accent} />
      </>
    );
  }

  if (destination.shape === "terminal") {
    return (
      <>
        <Box size={[w, h, d]} position={[0, h / 2, 0]} material={materials.base} />
        {Array.from({ length: 5 }, (_, index) => (
          <Box key={index} size={[w + 0.08, 0.08, 0.09]} position={[0, 1 + index * 0.72, -d / 2 - 0.055]} material={materials.accent} />
        ))}
        {[-1, 0, 1].map((slot) => (
          <Box key={slot} size={[0.22, h * 0.78, 0.08]} position={[slot * 0.68, h * 0.5, -d / 2 - 0.07]} material={materials.glass} />
        ))}
        <Door destination={destination} material={materials.accent} />
      </>
    );
  }

  if (destination.shape === "music") {
    return (
      <>
        <Box size={[w, h * 0.72, d]} position={[0, h * 0.36, 0]} material={materials.base} />
        <Box size={[w * 0.72, 0.28, d + 0.55]} position={[0, h * 0.78, 0]} material={materials.accent} />
        {[-1, 1].map((slot) => (
          <mesh key={slot} position={[slot * 0.92, 1.25, -d / 2 - 0.085]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.12, 32]} />
            <primitive object={materials.glass} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, h + 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.62, 0.035, 8, 72]} />
          <primitive object={materials.accent} attach="material" />
        </mesh>
        <Door destination={destination} material={materials.accent} />
      </>
    );
  }

  if (destination.shape === "galaxy") {
    return (
      <>
        <mesh position={[0, h * 0.275, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.95, 2.25, h * 0.55, 32]} />
          <primitive object={materials.base} attach="material" />
        </mesh>
        <mesh position={[0, h * 0.55, 0]} castShadow>
          <sphereGeometry args={[1.65, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={materials.glass} attach="material" />
        </mesh>
        {[0, 1, 2].map((slot) => (
          <mesh key={slot} position={[0, h * 0.84 + slot * 0.08, 0]} rotation={[Math.PI / 2 + slot * 0.35, 0, slot * 0.5]}>
            <torusGeometry args={[1.95 + slot * 0.24, 0.025, 8, 96]} />
            <primitive object={materials.accent} attach="material" />
          </mesh>
        ))}
        <Door destination={destination} material={materials.accent} />
      </>
    );
  }

  return (
    <>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} material={materials.base} />
      <Box size={[w * 0.54, h + 0.7, d * 0.58]} position={[0.42, (h + 0.7) / 2, 0.22]} material={materials.base} />
      <mesh position={[0.42, h + 1.22, 0.22]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.55, 0.92, 4]} />
        <primitive object={materials.accent} attach="material" />
      </mesh>
      <Door destination={destination} material={materials.accent} />
    </>
  );
}

function Box({ size, position, material }: { size: [number, number, number]; position: [number, number, number]; material: THREE.Material }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Door({ destination, material }: { destination: BuildingDestination; material: THREE.Material }) {
  return (
    <>
      <Box size={[0.78, 1.28, 0.08]} position={[0, 0.68, -destination.size[2] / 2 - 0.08]} material={material} />
      <Box size={[1.14, 0.12, 0.12]} position={[0, 1.39, -destination.size[2] / 2 - 0.1]} material={material} />
    </>
  );
}
