"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Preload } from "@react-three/drei";
import * as THREE from "three";
import { AirflowSystem } from "@/components/scene/AirflowSystem";
import { AnalysisMarkers } from "@/components/scene/AnalysisMarkers";
import { BlueprintVehicle } from "@/components/scene/BlueprintVehicle";
import { VehicleModel } from "@/components/scene/VehicleModel";
import { WindTunnel } from "@/components/scene/WindTunnel";
import { vehicleById } from "@/data/vehicles";
import { useVehicleStore } from "@/store/useVehicleStore";

export function VehicleScene() {
  return (
    <Canvas
      className="vehicle-canvas"
      camera={{ position: [0, 1.35, 7.4], fov: 32, near: 0.1, far: 80 }}
      dpr={[1, 1.65]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05
      }}
      shadows
    >
      <SceneContent />
    </Canvas>
  );
}

function SceneContent() {
  const activeId = useVehicleStore((state) => state.activeId);
  const progress = useVehicleStore((state) => state.progress);
  const booted = useVehicleStore((state) => state.booted);
  const vehicle = vehicleById[activeId];
  const atmosphere = useMemo(() => new THREE.Color("#020306"), []);

  return (
    <>
      <color attach="background" args={[atmosphere]} />
      <fog attach="fog" args={["#020306", 8, 18]} />
      <CameraRig />
      <ambientLight intensity={0.32} />
      <hemisphereLight args={["#f8fbff", "#07111a", 1.4]} />
      <directionalLight position={[-3.6, 4.4, 5.5]} intensity={2.1} color="#ffffff" />
      <directionalLight position={[4.8, 2.3, -3.6]} intensity={1.4} color={vehicle.accent} />
      <pointLight position={[0, 2.4, 2.4]} intensity={2.6} color={vehicle.accent2} distance={7} />

      <group position={[0, -0.62, 0]}>
        <WindTunnel vehicle={vehicle} />
        <AirflowSystem vehicle={vehicle} progress={progress} booted={booted} />
        <Suspense fallback={<BlueprintVehicle vehicle={vehicle} intensity={1} />}>
          <VehicleModel key={vehicle.id} vehicle={vehicle} progress={progress} booted={booted} />
        </Suspense>
        <BlueprintVehicle vehicle={vehicle} intensity={booted ? Math.max(0.12, 0.75 - progress * 1.6) : 1} />
        <AnalysisMarkers vehicle={vehicle} />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.34}
          scale={8}
          blur={2.8}
          far={3}
          color="#05080d"
        />
      </group>
      <Preload all />
    </>
  );
}

function CameraRig() {
  const progress = useVehicleStore((state) => state.progress);
  const phaseIndex = useVehicleStore((state) => state.phaseIndex);
  const { camera, pointer } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(0, 0.58, 0), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const sideDrift = Math.sin(progress * Math.PI * 2) * 0.58;
    const phasePush = phaseIndex >= 3 ? -0.42 : 0;
    target.set(
      sideDrift + pointer.x * 0.34,
      1.28 + progress * 0.18 + pointer.y * 0.12,
      7.35 - progress * 1.08 + phasePush
    );
    camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    camera.lookAt(lookAt);
  });

  return null;
}
