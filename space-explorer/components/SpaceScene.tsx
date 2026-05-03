"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useTexture } from "@react-three/drei";
import dynamic from "next/dynamic";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  getObjectById,
  getObjectScenePosition,
  getObjectSceneRadius,
  getTexturePath,
  isFamousStar,
  type ScaleMode,
} from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";
import { MeasurementLine, MeasurementToast } from "./MeasurementTool";
import { SearchPanel } from "./SearchPanel";
import { SolarSystem } from "./SolarSystem";
import { TimeControls } from "./TimeControls";

const ObjectInfoPanel = dynamic(() => import("./ObjectInfoPanel").then((module) => module.ObjectInfoPanel), {
  ssr: false,
});

export default function SpaceScene() {
  const scaleMode = useSpaceStore((state) => state.scaleMode);
  const dateIso = useSpaceStore((state) => state.simulatedDateIso);
  const measurementMode = useSpaceStore((state) => state.measurementMode);
  const clearSelection = useSpaceStore((state) => state.clearSelection);

  return (
    <main className="space-explorer-app">
      <Canvas
        camera={{ position: [16, 10, 28], fov: 48, near: 0.05, far: 5000 }}
        shadows
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        dpr={[1, 1.65]}
        onPointerMissed={() => {
          if (measurementMode !== "distance") clearSelection();
        }}
      >
        <Suspense
          fallback={
            <Html center className="canvas-loader">
              Loading NASA-style textures...
            </Html>
          }
        >
          <SceneContent dateIso={dateIso} scaleMode={scaleMode} />
        </Suspense>
      </Canvas>

      <div className="scene-vignette" aria-hidden="true" />
      <SearchPanel />
      <ObjectInfoPanel />
      <MeasurementToast />
      <TimeControls />
    </main>
  );
}

function SceneContent({ dateIso, scaleMode }: { dateIso: string; scaleMode: ScaleMode }) {
  const controlsRef = useRef<any>(null);

  return (
    <>
      <color attach="background" args={["#02040b"]} />
      <fog attach="fog" args={["#02040b", 140, 1500]} />
      <ambientLight intensity={0.085} />
      <directionalLight position={[20, 16, 10]} intensity={0.16} color="#89bfff" />
      <SpaceBackground />
      <SolarSystem dateIso={dateIso} scaleMode={scaleMode} />
      <MeasurementLine scaleMode={scaleMode} />
      <CameraRig controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={1.4}
        maxDistance={1800}
        rotateSpeed={0.52}
        zoomSpeed={0.72}
        panSpeed={0.48}
      />
    </>
  );
}

function SpaceBackground() {
  const texture = useTexture(getTexturePath("milky-way.jpg") ?? "./textures/milky-way.jpg");
  const backgroundTexture = useMemo(() => {
    const prepared = texture.clone();
    prepared.colorSpace = THREE.SRGBColorSpace;
    prepared.needsUpdate = true;
    return prepared;
  }, [texture]);

  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[2100, 64, 40]} />
        <meshBasicMaterial map={backgroundTexture} side={THREE.BackSide} color="#9fb5ff" transparent opacity={0.72} />
      </mesh>
      <Stars radius={900} depth={180} count={6000} factor={4.8} saturation={0.62} fade speed={0.22} />
    </group>
  );
}

function CameraRig({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const camera = useThree((state) => state.camera);
  const focusedObjectId = useSpaceStore((state) => state.focusedObjectId);
  const scaleMode = useSpaceStore((state) => state.scaleMode);
  const dateIso = useSpaceStore((state) => state.simulatedDateIso);
  const desiredPositionRef = useRef(new THREE.Vector3(22, 12, 28));
  const lastFocusRef = useRef("");
  const activeFlightRef = useRef(true);

  useFrame(() => {
    const object = getObjectById(focusedObjectId);
    if (!object) return;

    const targetTuple = getObjectScenePosition(object, dateIso, scaleMode);
    const target = new THREE.Vector3(...targetTuple);
    const radius = getObjectSceneRadius(object, scaleMode);
    const isNewFocus = lastFocusRef.current !== focusedObjectId;

    if (isNewFocus) {
      lastFocusRef.current = focusedObjectId;
      activeFlightRef.current = true;
      const distance = isFamousStar(object)
        ? Math.max(16, radius * 5.8)
        : object.kind === "star"
          ? 30
          : Math.max(3.4, Math.min(radius * 7 + 3.2, scaleMode === "real" ? 80 : 22));
      const offset = new THREE.Vector3(distance * 0.92, distance * 0.42, distance);
      desiredPositionRef.current.copy(target).add(offset);
    }

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }

    if (activeFlightRef.current) {
      camera.position.lerp(desiredPositionRef.current, 0.12);
      if (camera.position.distanceTo(desiredPositionRef.current) < 0.12) {
        activeFlightRef.current = false;
      }
    }
  });

  return null;
}
