"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { VehicleProfile } from "@/data/vehicles";

type WindTunnelProps = {
  vehicle: VehicleProfile;
};

export function WindTunnel({ vehicle }: WindTunnelProps) {
  const floorGrid = useMemo(() => createGridGeometry(), []);
  const ribGrid = useMemo(() => createRibGeometry(), []);

  return (
    <group>
      <lineSegments geometry={floorGrid} position={[0, 0.012, 0]}>
        <lineBasicMaterial color="#b8c7d9" transparent opacity={0.16} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={ribGrid}>
        <lineBasicMaterial color="#cfe8ff" transparent opacity={0.18} depthWrite={false} />
      </lineSegments>
      <mesh position={[-5.85, 0.92, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 1.95]} />
        <meshBasicMaterial
          color={vehicle.accent}
          transparent
          opacity={0.055}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[5.85, 0.92, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 1.95]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.026}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12.4, 5.6]} />
        <meshStandardMaterial color="#03070d" metalness={0.36} roughness={0.62} opacity={0.72} transparent />
      </mesh>
    </group>
  );
}

function createGridGeometry() {
  const lines: number[] = [];
  for (let x = -6; x <= 6.001; x += 0.5) {
    lines.push(x, 0, -2.7, x, 0, 2.7);
  }
  for (let z = -2.5; z <= 2.501; z += 0.5) {
    lines.push(-6.2, 0, z, 6.2, 0, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  return geometry;
}

function createRibGeometry() {
  const lines: number[] = [];
  for (let x = -5.8; x <= 5.801; x += 1.45) {
    lines.push(x, 0.02, -2.62, x, 2.08, -2.62);
    lines.push(x, 2.08, -2.62, x, 2.08, 2.62);
    lines.push(x, 2.08, 2.62, x, 0.02, 2.62);
  }
  lines.push(-5.8, 0.02, -2.62, 5.8, 0.02, -2.62);
  lines.push(-5.8, 0.02, 2.62, 5.8, 0.02, 2.62);
  lines.push(-5.8, 2.08, -2.62, 5.8, 2.08, -2.62);
  lines.push(-5.8, 2.08, 2.62, 5.8, 2.08, 2.62);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  return geometry;
}
