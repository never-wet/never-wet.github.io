"use client";

import * as THREE from "three";
import type { VehicleProfile } from "@/data/vehicles";

type AnalysisMarkersProps = {
  vehicle: VehicleProfile;
};

export function AnalysisMarkers({ vehicle }: AnalysisMarkersProps) {
  return (
    <group>
      {vehicle.labels.map((label) => (
        <group key={label.id} position={label.position}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={vehicle.accent2} transparent opacity={0.88} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.095, 28]} />
            <meshBasicMaterial color={vehicle.accent} transparent opacity={0.58} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
