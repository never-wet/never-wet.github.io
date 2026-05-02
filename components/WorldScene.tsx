"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { MutableRefObject, Suspense, useRef } from "react";
import * as THREE from "three";
import { AINPCGuide } from "./AINPCGuide";
import { BuildingPortal } from "./BuildingPortal";
import { DayNightCycle } from "./DayNightCycle";
import { usePlayerController } from "./PlayerController";
import { WorldHUD } from "./WorldHUD";
import { BuildingDestination, getEntrancePoint, runPortalTransition, WORLD_BUILDINGS } from "../lib/navigationSystem";
import { useWorldStore } from "../store/useWorldStore";

export function WorldScene() {
  return (
    <main className="stage-wrap">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [10, 10, 13], fov: 50, near: 0.1, far: 140 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <WorldContents />
        </Suspense>
      </Canvas>
      <WorldHUD />
    </main>
  );
}

function WorldContents() {
  const playerRef = useRef<THREE.Group | null>(null);
  const lookTarget = useRef(new THREE.Vector3(0, 1.2, 0));
  const controls = usePlayerController({ playerRef, lookTarget });
  const { camera } = useThree();
  const beginEnter = useWorldStore((state) => state.beginEnter);
  const openPortal = useWorldStore((state) => state.openPortal);

  const enterBuilding = (destination: BuildingDestination, group?: THREE.Group) => {
    const entrance = getEntrancePoint(destination, group);
    const distance = entrance.distanceTo(controls.playerPosition.current);

    if (distance > 3.15) {
      controls.walkTo(entrance);
      return;
    }

    beginEnter(destination.id);
    runPortalTransition({
      camera,
      lookTarget: lookTarget.current,
      destination,
      entrance,
      focus: group?.position.clone().setY(1.25) ?? new THREE.Vector3(...destination.position).setY(1.25),
      overlay: document.querySelector(".transition-overlay"),
      onComplete: () => openPortal(destination.id)
    });
  };

  return (
    <>
      <color attach="background" args={["#0a0b0d"]} />
      <fogExp2 attach="fog" args={["#0a0b0d", 0.026]} />
      <DayNightCycle />
      <directionalLight position={[-14, 8, -8]} intensity={1.1} color="#80fff5" />
      <Ground />
      {WORLD_BUILDINGS.map((building) => (
        <BuildingPortal key={building.id} destination={building} onEnter={enterBuilding} />
      ))}
      <AINPCGuide />
      <Player refTarget={playerRef} />
    </>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#111214" roughness={0.86} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[6.2, 6.2, 0.08, 48]} />
        <meshStandardMaterial color="#1b1d1d" roughness={0.78} metalness={0.16} />
      </mesh>
      <gridHelper args={[44, 22, "#2b2e2e", "#202222"]} position={[0, 0.105, 0]} />
      {WORLD_BUILDINGS.map((building) => (
        <Path key={building.id} destination={building} />
      ))}
    </group>
  );
}

function Path({ destination }: { destination: BuildingDestination }) {
  const [x, , z] = destination.position;
  const length = Math.hypot(x, z) - 5.5;

  return (
    <group position={[x * 0.5, 0.08, z * 0.5]} rotation={[0, Math.atan2(x, z), 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[1.28, 0.06, Math.max(length, 4)]} />
        <meshStandardMaterial color="#222523" roughness={0.72} metalness={0.11} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.06, 0.025, Math.max(length, 4)]} />
        <meshBasicMaterial color={destination.color} transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function Player({ refTarget }: { refTarget: MutableRefObject<THREE.Group | null> }) {
  const character = useWorldStore((state) => state.character);
  const accent = character.outfitColor === "#54e0d8" ? "#ffffff" : "#54e0d8";

  return (
    <group ref={refTarget} position={[0, 0, 1.8]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.33, 0.72, 5, 12]} />
        <meshStandardMaterial color={character.outfitColor} emissive="#54e0d8" emissiveIntensity={0.08} roughness={0.38} metalness={0.2} />
      </mesh>
      <mesh
        position={[0, character.hairStyle === "crest" ? 1.26 : 1.18, 0.02]}
        scale={[character.hairStyle === "crest" ? 0.72 : 1, character.hairStyle === "wave" ? 1.45 : 1, character.hairStyle === "crest" ? 1.18 : 1]}
        castShadow
      >
        <boxGeometry args={[0.46, 0.16, 0.42]} />
        <meshStandardMaterial color={character.hairColor} roughness={0.52} metalness={0.04} />
      </mesh>
      <mesh position={[0, 1.07, -0.3]} visible={character.accessory === "visor"}>
        <boxGeometry args={[0.42, 0.12, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} roughness={0.28} metalness={0.26} />
      </mesh>
      <mesh position={[0, 1.48, 0]} rotation={[Math.PI / 2, 0, 0]} visible={character.accessory === "halo"}>
        <torusGeometry args={[0.32, 0.015, 8, 48]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} roughness={0.28} metalness={0.26} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.035, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
