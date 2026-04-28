"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { VehicleProfile } from "@/data/vehicles";

type BlueprintVehicleProps = {
  vehicle: VehicleProfile;
  intensity: number;
};

export function BlueprintVehicle({ vehicle, intensity }: BlueprintVehicleProps) {
  const bodyGeometry = useMemo(() => createBlueprintGeometry(vehicle), [vehicle]);
  const wheelGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.TorusGeometry(0.36, 0.035, 8, 40)), []);

  return (
    <group position={[0, 0.02, 0]} renderOrder={20}>
      <lineSegments geometry={bodyGeometry}>
        <lineBasicMaterial
          color={vehicle.accent}
          transparent
          opacity={Math.max(0, Math.min(0.78, intensity))}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </lineSegments>
      {[-1.15, 1.15].map((x) =>
        [-1, 1].map((side) => (
          <lineSegments
            key={`${x}-${side}`}
            geometry={wheelGeometry}
            position={[x, 0.36, side * (vehicle.width * 0.5 + 0.04)]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <lineBasicMaterial
              color={vehicle.accent2}
              transparent
              opacity={Math.max(0, Math.min(0.62, intensity * 0.8))}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
            />
          </lineSegments>
        ))
      )}
    </group>
  );
}

function createBlueprintGeometry(vehicle: VehicleProfile) {
  const halfLength = vehicle.length * 0.5;
  const halfWidth = vehicle.width * 0.5;
  const roof = vehicle.height;
  const hood = vehicle.height * 0.34;
  const deck = vehicle.height * 0.42;
  const cabinFront = -vehicle.length * 0.16;
  const cabinRear = vehicle.length * 0.28;
  const lines: number[] = [];

  const push = (a: [number, number, number], b: [number, number, number]) => {
    lines.push(...a, ...b);
  };

  for (const side of [-1, 1]) {
    const z = side * halfWidth;
    const profile: [number, number, number][] = [
      [-halfLength, 0.18, z],
      [-halfLength * 0.72, hood, z],
      [cabinFront, roof * 0.78, z],
      [0.12, roof, z],
      [cabinRear, roof * 0.72, z],
      [halfLength * 0.78, deck, z],
      [halfLength, 0.22, z],
      [halfLength * 0.72, 0.1, z],
      [-halfLength * 0.76, 0.1, z],
      [-halfLength, 0.18, z]
    ];

    profile.forEach((point, index) => {
      const next = profile[(index + 1) % profile.length];
      push(point, next);
    });
  }

  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    const x = -halfLength + t * vehicle.length;
    const y = 0.18 + Math.sin(t * Math.PI) * vehicle.height * 0.42;
    push([x, y, -halfWidth], [x, y, halfWidth]);
  }

  push([-halfLength, 0.18, -halfWidth], [-halfLength, 0.18, halfWidth]);
  push([halfLength, 0.22, -halfWidth], [halfLength, 0.22, halfWidth]);
  push([cabinFront, roof * 0.78, -halfWidth * 0.54], [cabinFront, roof * 0.78, halfWidth * 0.54]);
  push([cabinRear, roof * 0.72, -halfWidth * 0.54], [cabinRear, roof * 0.72, halfWidth * 0.54]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  return geometry;
}
