"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { VehicleProfile } from "@/data/vehicles";
import { useVehicleStore } from "@/store/useVehicleStore";

type VehicleModelProps = {
  vehicle: VehicleProfile;
  progress: number;
  booted: boolean;
};

type PreparedModel = {
  model: THREE.Group;
  materials: THREE.Material[];
};

export function VehicleModel({ vehicle, progress, booted }: VehicleModelProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const shadowTexture = useTexture("./models/ferrari_ao.png");
  const gltf = useGLTF(vehicle.modelPath, "./draco/") as { scene: THREE.Group };
  const setCursorLabel = useVehicleStore((state) => state.setCursorLabel);
  const setHoverTarget = useVehicleStore((state) => state.setHoverTarget);

  const prepared = useMemo(() => prepareModel(gltf.scene, vehicle), [gltf.scene, vehicle]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const reveal = booted ? Math.min(1, 0.24 + progress * 3.4) : 0.06;
    const phaseSpin = progress * Math.PI * 1.08;
    const targetY = -0.18 + phaseSpin + Math.sin(state.clock.elapsedTime * 0.38) * 0.025;
    group.rotation.y += (targetY - group.rotation.y) * Math.min(1, delta * 3.2);
    group.rotation.x += ((progress > 0.62 ? -0.035 : 0) - group.rotation.x) * Math.min(1, delta * 2.4);
    group.position.y = Math.sin(state.clock.elapsedTime * 0.64) * 0.012;

    prepared.materials.forEach((material) => {
      material.transparent = true;
      material.opacity += (reveal - material.opacity) * Math.min(1, delta * 4.6);
    });
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(event) => {
        event.stopPropagation();
        setCursorLabel("VIEW");
        setHoverTarget("vehicle");
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setCursorLabel("SCAN");
        setHoverTarget("none");
      }}
    >
      <primitive object={prepared.model} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} renderOrder={1}>
        <planeGeometry args={[vehicle.length * 1.05, vehicle.width * 1.72]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.42}
          toneMapped={false}
          blending={THREE.MultiplyBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function prepareModel(source: THREE.Group, vehicle: VehicleProfile): PreparedModel {
  const model = clone(source) as THREE.Group;
  const materials: THREE.Material[] = [];

  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material = cloneMaterial(mesh.material, materials);
  });

  fitModel(model, vehicle);
  return { model, materials };
}

function cloneMaterial(
  material: THREE.Material | THREE.Material[],
  materials: THREE.Material[]
): THREE.Material | THREE.Material[] {
  if (Array.isArray(material)) {
    return material.map((entry) => cloneSingleMaterial(entry, materials));
  }

  return cloneSingleMaterial(material, materials);
}

function cloneSingleMaterial(material: THREE.Material, materials: THREE.Material[]) {
  const cloned = material.clone();
  cloned.transparent = true;
  cloned.opacity = 0.05;
  cloned.depthWrite = true;

  const standard = cloned as THREE.MeshStandardMaterial;
  if ("envMapIntensity" in standard) standard.envMapIntensity = 1.35;
  if ("roughness" in standard) standard.roughness = Math.min(0.58, standard.roughness + 0.04);
  if ("metalness" in standard) standard.metalness = Math.max(standard.metalness, 0.32);

  materials.push(cloned);
  return cloned;
}

function fitModel(model: THREE.Group, vehicle: VehicleProfile) {
  model.updateMatrixWorld(true);
  let baseBox = new THREE.Box3().setFromObject(model);
  let baseSize = baseBox.getSize(new THREE.Vector3());

  if (baseSize.z > baseSize.x * 1.08) {
    model.rotation.y -= Math.PI / 2;
    model.updateMatrixWorld(true);
    baseBox = new THREE.Box3().setFromObject(model);
    baseSize = baseBox.getSize(new THREE.Vector3());
  }

  model.rotation.y += vehicle.modelYaw || 0;
  model.updateMatrixWorld(true);

  const baseScale = vehicle.length / Math.max(0.001, Math.max(baseSize.x, baseSize.z));
  model.scale.set(
    baseScale * vehicle.modelScale[0],
    baseScale * vehicle.modelScale[1],
    baseScale * vehicle.modelScale[2]
  );

  model.updateMatrixWorld(true);
  const fittedBox = new THREE.Box3().setFromObject(model);
  const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
  model.position.x -= fittedCenter.x;
  model.position.z -= fittedCenter.z;
  model.position.y += 0.004 - fittedBox.min.y;
}

useGLTF.preload("./models/porsche_911_gt3.glb", "./draco/");
useGLTF.preload("./models/2021_ferrari_sf90_spider.glb", "./draco/");
useGLTF.preload("./models/lotus_emira_2022__www.vecarz.com.glb", "./draco/");
useGLTF.preload("./models/2021_bmw_m3_competition_g80.glb", "./draco/");
