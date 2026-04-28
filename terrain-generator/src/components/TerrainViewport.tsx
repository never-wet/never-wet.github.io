"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { type ComponentRef, Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { terrainTypeLabels } from "@/lib/presets";
import { useTerrainStore } from "@/store/useTerrainStore";
import { TerrainChunks } from "./TerrainChunks";

const defaultCameraPosition = new THREE.Vector3(82, 58, 82);
const defaultOrbitTarget = new THREE.Vector3(0, 8, 0);

function WaterPlane() {
  const terrain = useTerrainStore((state) => state.terrain);
  const waterEnabled = useTerrainStore((state) => state.parameters.waterEnabled);
  if (!terrain || !waterEnabled) return null;

  const range = Math.max(0.001, terrain.maxHeight - terrain.minHeight);
  const waterLevel = terrain.minHeight + range * 0.18;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, waterLevel, 0]} receiveShadow>
      <planeGeometry args={[terrain.size * 1.08, terrain.size * 1.08, 1, 1]} />
      <meshPhysicalMaterial
        color="#4f9ed7"
        transparent
        opacity={0.34}
        roughness={0.18}
        metalness={0.02}
        transmission={0.18}
        depthWrite={false}
      />
    </mesh>
  );
}

function CameraControls() {
  const cameraResetId = useTerrainStore((state) => state.cameraResetId);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.copy(defaultCameraPosition);
    camera.lookAt(defaultOrbitTarget);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.enabled = true;
      controls.target.copy(defaultOrbitTarget);
      controls.update();
    }
  }, [camera, cameraResetId]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={0.22}
      maxPolarAngle={1.38}
      minDistance={34}
      maxDistance={230}
      target={defaultOrbitTarget}
    />
  );
}

function SceneContents() {
  const parameters = useTerrainStore((state) => state.parameters);

  return (
    <>
      <color attach="background" args={["#11191f"]} />
      {parameters.fogEnabled ? <fog attach="fog" args={["#11191f", 96, 210]} /> : null}
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#dff8ee", "#40524b", 0.42]} />
      <directionalLight
        position={[-42, 72, 48]}
        intensity={2.6}
        castShadow={parameters.shadowsEnabled}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-82}
        shadow-camera-right={82}
        shadow-camera-top={82}
        shadow-camera-bottom={-82}
      />
      <TerrainChunks />
      <WaterPlane />
      <gridHelper args={[180, 30, new THREE.Color("#42564f"), new THREE.Color("#24312e")]} position={[0, -0.02, 0]} />
      <CameraControls />
    </>
  );
}

export function TerrainViewport() {
  const terrain = useTerrainStore((state) => state.terrain);
  const parameters = useTerrainStore((state) => state.parameters);
  const status = useTerrainStore((state) => state.status);
  const error = useTerrainStore((state) => state.error);
  const brush = useTerrainStore((state) => state.brush);
  const busy = status === "generating" || status === "eroding" || !terrain;

  return (
    <main className="viewport-shell">
      <Canvas
        shadows={parameters.shadowsEnabled}
        camera={{ position: [82, 58, 82], fov: 44, near: 0.1, far: 420 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>

      <div className="scene-overlay">
        <div className="scene-chip">
          <span className="eyebrow">{terrainTypeLabels[parameters.terrainType]}</span>
          <strong>{parameters.seed || "Untitled seed"}</strong>
        </div>

        <div className="scene-metrics" aria-live="polite">
          <div className="metric">
            <span className="metric-label">Grid</span>
            <span className="metric-value">
              {terrain ? `${terrain.width} x ${terrain.height}` : `${parameters.resolution} x ${parameters.resolution}`}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Worker</span>
            <span className="metric-value">{terrain ? `${terrain.generationTimeMs.toFixed(0)}ms` : "..."}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Height</span>
            <span className="metric-value">{terrain ? `${terrain.maxHeight.toFixed(1)}m` : "..."}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Erosion</span>
            <span className="metric-value">{terrain?.erosionApplied ? "Applied" : "Clean"}</span>
          </div>
        </div>

        {busy ? (
          <div className="busy-panel">
            <span className="spinner" />
            <strong>{status === "eroding" ? "Applying erosion" : "Generating terrain"}</strong>
          </div>
        ) : null}

        {brush.enabled ? <div className="brush-cursor">Brush: {brush.mode}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}
      </div>
    </main>
  );
}
