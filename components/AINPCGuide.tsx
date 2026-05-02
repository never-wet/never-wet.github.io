"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useWorldStore } from "../store/useWorldStore";

export function AINPCGuide() {
  const groupRef = useRef<THREE.Group | null>(null);
  const playerPosition = useWorldStore((state) => state.playerPosition);
  const openNpcChat = useWorldStore((state) => state.openNpcChat);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const player = new THREE.Vector3(...playerPosition);
    const distance = player.distanceTo(groupRef.current.position);
    groupRef.current.position.y = Math.sin(performance.now() * 0.0022) * 0.035;
    const desiredYaw = distance < 4.3
      ? Math.atan2(player.x - groupRef.current.position.x, player.z - groupRef.current.position.z)
      : Math.sin(performance.now() * 0.0008) * 0.35;
    groupRef.current.rotation.y = lerpAngle(groupRef.current.rotation.y, desiredYaw, 1 - Math.pow(0.001, delta));
  });

  return (
    <group ref={groupRef} position={[-2.7, 0, 2.4]} onClick={() => openNpcChat("intro")}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.31, 0.68, 5, 12]} />
        <meshStandardMaterial color="#1f2f34" emissive="#54e0d8" emissiveIntensity={0.1} roughness={0.58} metalness={0.18} />
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.25, 18, 14]} />
        <meshStandardMaterial color="#dfe8e5" emissive="#54e0d8" emissiveIntensity={0.16} roughness={0.34} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.018, 8, 64]} />
        <meshBasicMaterial color="#54e0d8" transparent opacity={0.46} />
      </mesh>
      <Html position={[0, 1.82, 0]} center className="npc-bubble is-visible">
        <small>Guide</small>
        <strong>Need help finding something?</strong>
        <p>Tap me for directions.</p>
      </Html>
    </group>
  );
}

function lerpAngle(a: number, b: number, t: number) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
}
