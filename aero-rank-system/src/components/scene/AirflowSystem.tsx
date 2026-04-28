"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { VehicleProfile } from "@/data/vehicles";

type AirflowSystemProps = {
  vehicle: VehicleProfile;
  progress: number;
  booted: boolean;
};

type FlowLane = {
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  opacity: number;
  speed: number;
};

export function AirflowSystem({ vehicle, progress, booted }: AirflowSystemProps) {
  const lanes = useMemo(() => createFlowLanes(vehicle), [vehicle]);
  const intensity = booted ? Math.min(1, Math.max(0.18, progress * 2.8)) : 0.04;
  const pressureIntensity = booted ? Math.min(1, Math.max(0, (progress - 0.22) * 2.4)) : 0;

  return (
    <group>
      {lanes.map((lane, index) => (
        <Line
          key={`${vehicle.id}-${index}`}
          points={lane.points}
          color={vehicle.accent}
          lineWidth={index % 4 === 0 ? 1.15 : 0.72}
          transparent
          opacity={lane.opacity * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}
      <FlowParticles lanes={lanes} vehicle={vehicle} intensity={intensity} />
      <PressureZones vehicle={vehicle} intensity={pressureIntensity} />
    </group>
  );
}

function FlowParticles({
  lanes,
  vehicle,
  intensity
}: {
  lanes: FlowLane[];
  vehicle: VehicleProfile;
  intensity: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleCount = Math.round(40 + vehicle.flow.density * 34);
  const seeds = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, index) => ({
        lane: index % lanes.length,
        offset: (index * 0.61803398875) % 1,
        scale: 0.65 + ((index * 17) % 9) / 12
      })),
    [lanes.length, particleCount]
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    seeds.forEach((seed, index) => {
      const lane = lanes[seed.lane];
      const t = (state.clock.elapsedTime * lane.speed * vehicle.flow.speed * 0.08 + seed.offset) % 1;
      const point = lane.curve.getPoint(t);
      dummy.position.copy(point);
      dummy.scale.setScalar(0.018 * seed.scale * (0.8 + intensity * 0.6));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color={vehicle.accent2}
        transparent
        opacity={0.42 * intensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function PressureZones({ vehicle, intensity }: { vehicle: VehicleProfile; intensity: number }) {
  const color = new THREE.Color(vehicle.accent);

  return (
    <group>
      <mesh position={[-2.48, 0.58, 0]} scale={[0.34, 0.76, vehicle.width * 0.62]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.07 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.1, vehicle.height + 0.16, 0]} scale={[vehicle.length * 0.28, 0.08, vehicle.width * 0.34]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={vehicle.accent2}
          transparent
          opacity={0.08 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[2.72, 0.62, 0]} scale={[0.78 + vehicle.flow.wake, 0.48, vehicle.width * vehicle.flow.wakeSpread]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.055 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function createFlowLanes(vehicle: VehicleProfile): FlowLane[] {
  const lanes: FlowLane[] = [];
  const zSlots = [-1.18, -0.82, -0.48, -0.18, 0.18, 0.48, 0.82, 1.18];
  const laneTypes = ["roof", "side", "under", "side"] as const;

  zSlots.forEach((zSlot, index) => {
    laneTypes.forEach((type, typeIndex) => {
      if (type === "under" && Math.abs(zSlot) > 0.58) return;
      const points: THREE.Vector3[] = [];
      const seed = index * 0.72 + typeIndex * 1.13;
      const laneZ = zSlot * (type === "side" ? 1.04 : 0.82);

      for (let i = 0; i <= 84; i += 1) {
        const t = i / 84;
        const x = -5.8 + t * 11.6;
        const inBody = smoothstep(-2.65, -0.78, x) * (1 - smoothstep(1.1, 2.55, x));
        const wakeT = smoothstep(1.7, 5.7, x);
        const noseT = Math.exp(-Math.pow(x + 2.35, 2) * 1.3);
        const sign = laneZ === 0 ? 1 : Math.sign(laneZ);
        let y = 0.68;
        let z = laneZ;

        if (type === "roof") {
          y = 0.84 + Math.abs(zSlot) * 0.12;
          y += inBody * (vehicle.flow.roofLift * 0.64 + 0.18) * Math.sin(t * Math.PI);
          z += sign * inBody * vehicle.flow.split * 0.16;
        }

        if (type === "side") {
          y = 0.48 + (1 - Math.min(1, Math.abs(zSlot))) * 0.22;
          z += sign * (noseT * vehicle.flow.split * 0.28 + inBody * vehicle.flow.sideChannel * 0.34);
          y += inBody * 0.16 * vehicle.flow.attachment;
        }

        if (type === "under") {
          y = 0.22;
          y -= inBody * 0.055;
          z += sign * inBody * vehicle.flow.split * 0.1;
        }

        const wakeWave =
          Math.sin(x * (2.1 + vehicle.flow.turbulence * 6) + seed) *
          wakeT *
          vehicle.flow.turbulence *
          (0.44 + Math.abs(zSlot) * 0.28);
        const wakeLift =
          Math.cos(x * 1.4 + seed) * wakeT * vehicle.flow.wake * 0.16;

        z += wakeWave + sign * wakeT * vehicle.flow.wakeSpread * 0.12;
        y += wakeLift;
        points.push(new THREE.Vector3(x, y, z));
      }

      lanes.push({
        points,
        curve: new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.12),
        opacity: type === "roof" ? 0.38 : type === "under" ? 0.22 : 0.3,
        speed: type === "roof" ? 1.2 : type === "under" ? 0.92 : 1
      });
    });
  });

  return lanes;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}
