"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { EntityProfile } from "@/data/entities";
import { useSystemStore } from "@/store/useSystemStore";

type DiagnosticSceneProps = {
  entity: EntityProfile;
  stateIndex: number;
  progress: number;
};

export function DiagnosticScene({ entity, stateIndex, progress }: DiagnosticSceneProps) {
  return (
    <Canvas
      className="diagnostic-canvas"
      camera={{ position: [0, 0.25, 7.3], fov: 42, near: 0.1, far: 80 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#030405"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 4, 5]} intensity={2.1} color={entity.secondaryColor} />
      <pointLight position={[-3, -1, 4]} intensity={12} color={entity.color} />
      <DiagnosticWorld entity={entity} stateIndex={stateIndex} progress={progress} />
    </Canvas>
  );
}

function DiagnosticWorld({ entity, stateIndex, progress }: DiagnosticSceneProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const ringRef = useRef<THREE.Group | null>(null);
  const scanRef = useRef<THREE.Mesh | null>(null);
  const transitionPulse = useSystemStore((state) => state.transitionPulse);
  const hoverZone = useSystemStore((state) => state.hoverZone);
  const pulseRef = useRef(transitionPulse);

  useFrame(({ clock, camera, pointer }) => {
    const elapsed = clock.getElapsedTime();
    const hoverBoost = hoverZone === "core" ? 0.14 : 0;
    const stateBoost = stateIndex * 0.045;

    if (pulseRef.current !== transitionPulse) {
      pulseRef.current = transitionPulse;
      if (groupRef.current) {
        groupRef.current.scale.setScalar(0.72);
      }
    }

    camera.position.x += (pointer.x * 0.46 - camera.position.x) * 0.035;
    camera.position.y += (0.25 + pointer.y * 0.22 - camera.position.y) * 0.035;
    camera.position.z += (7.3 - progress * 1.1 - camera.position.z) * 0.03;
    camera.lookAt(0, 0, 0);

    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * (0.12 + stateIndex * 0.035) + pointer.x * 0.18;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.28) * 0.13 + pointer.y * 0.1;
      const target = 1 + stateBoost + hoverBoost + Math.sin(elapsed * 1.4) * 0.018;
      groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = -elapsed * (0.18 + stateIndex * 0.045);
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(elapsed * 0.2) * 0.07;
    }

    if (scanRef.current) {
      scanRef.current.position.y = THREE.MathUtils.lerp(-1.65, 1.65, (Math.sin(elapsed * 1.7) + 1) / 2);
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity = 0.16 + stateIndex * 0.025;
    }
  });

  return (
    <group>
      <GridPlane color={entity.color} />
      <group ref={groupRef} position={[0, -0.1, 0]}>
        <CoreShape entity={entity} />
        <mesh ref={scanRef} rotation={[0, 0, 0]}>
          <boxGeometry args={[3.55, 0.012, 3.55]} />
          <meshBasicMaterial color={entity.color} transparent opacity={0.18} depthWrite={false} />
        </mesh>
        <group ref={ringRef}>
          {[1.62, 2.12, 2.68].map((radius, index) => (
            <mesh rotation={[Math.PI / 2, 0, index * 0.4]} key={radius}>
              <torusGeometry args={[radius, 0.006, 8, 128]} />
              <meshBasicMaterial
                color={index === 1 ? entity.secondaryColor : entity.color}
                transparent
                opacity={0.22 - index * 0.035}
              />
            </mesh>
          ))}
        </group>
        <DataSpokes entity={entity} />
      </group>
      <ParticleField entity={entity} />
      <Html className="core-label" position={[1.9, 1.35, 0]} transform distanceFactor={8}>
        <span>{entity.systemId}</span>
        <strong>{entity.classification}</strong>
      </Html>
    </group>
  );
}

function CoreShape({ entity }: { entity: EntityProfile }) {
  const materialProps = {
    color: entity.color,
    emissive: entity.color,
    emissiveIntensity: 0.45,
    metalness: 0.72,
    roughness: 0.18,
    transparent: true,
    opacity: 0.48
  };

  return (
    <group>
      <mesh>
        <CoreGeometry type={entity.core} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh scale={1.055}>
        <CoreGeometry type={entity.core} />
        <meshBasicMaterial color={entity.secondaryColor} wireframe transparent opacity={0.36} />
      </mesh>
    </group>
  );
}

function CoreGeometry({ type }: { type: EntityProfile["core"] }) {
  if (type === "torus") return <torusKnotGeometry args={[0.92, 0.18, 160, 18]} />;
  if (type === "tetra") return <tetrahedronGeometry args={[1.34, 0]} />;
  if (type === "dodeca") return <dodecahedronGeometry args={[1.18, 0]} />;
  if (type === "cube") return <boxGeometry args={[1.7, 1.7, 1.7, 4, 4, 4]} />;
  return <octahedronGeometry args={[1.32, 1]} />;
}

function DataSpokes({ entity }: { entity: EntityProfile }) {
  const spokes = useMemo(() => Array.from({ length: 18 }, (_, index) => index), []);

  return (
    <group>
      {spokes.map((index) => {
        const angle = (index / spokes.length) * Math.PI * 2;
        const length = 1.86 + (index % 4) * 0.18;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * length, Math.sin(angle) * length, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.42 + (index % 3) * 0.18, 0.006, 0.006]} />
            <meshBasicMaterial color={index % 2 ? entity.color : entity.secondaryColor} transparent opacity={0.32} />
          </mesh>
        );
      })}
    </group>
  );
}

function ParticleField({ entity }: { entity: EntityProfile }) {
  const seed = entity.rank * 31 + entity.systemId.length * 7;
  const points = useMemo(() => {
    const positions = new Float32Array(360 * 3);
    for (let index = 0; index < 360; index += 1) {
      const radius = 2.5 + seededNoise(index, seed) * 3.2;
      const angle = seededNoise(index + 211, seed) * Math.PI * 2;
      const height = (seededNoise(index + 503, seed) - 0.5) * 3.5;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = height;
      positions[index * 3 + 2] = Math.sin(angle) * radius * 0.42;
    }
    return positions;
  }, [seed]);

  const ref = useRef<THREE.Points | null>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.024;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial color={entity.color} size={0.018} transparent opacity={0.36} depthWrite={false} />
    </points>
  );
}

function seededNoise(index: number, seed: number) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function GridPlane({ color }: { color: string }) {
  return (
    <group position={[0, -2.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[9, 34, color, "#1a1d20"]} />
      <mesh position={[0, 0, -0.012]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="#050607" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
