"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointCloudRenderer } from "@/components/PointCloudRenderer";
import type { RoomPointCloud } from "@/utils/RoomPointCloudBuilder";
import type { ViewCommandType } from "./ScanControls";

export type RoomViewCommand = {
  id: number;
  type: ViewCommandType;
};

type RoomPreview3DProps = {
  cloud: RoomPointCloud;
  autoRotate: boolean;
  command: RoomViewCommand | null;
};

function RoomOrbitControls({ autoRotate, command }: { autoRotate: boolean; command: RoomViewCommand | null }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    camera.position.set(4.2, 2.7, 5.6);
    camera.lookAt(0, -0.2, 0);

    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 1.8;
    controls.maxDistance = 10.5;
    controls.rotateSpeed = 0.68;
    controls.zoomSpeed = 0.72;
    controls.panSpeed = 0.62;
    controls.autoRotateSpeed = 0.55;
    controls.target.set(0, -0.2, 0);
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl.domElement]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !command) return;

    if (command.type === "reset") {
      camera.position.set(4.2, 2.7, 5.6);
      controls.target.set(0, -0.2, 0);
      controls.update();
    }

    if (command.type === "zoom-in" || command.type === "zoom-out") {
      const factor = command.type === "zoom-in" ? 0.82 : 1.18;
      camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
      controls.update();
    }

    if (command.type === "rotate-left" || command.type === "rotate-right") {
      const angle = command.type === "rotate-left" ? -0.28 : 0.28;
      camera.position.sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).add(controls.target);
      controls.update();
    }
  }, [camera, command]);

  useFrame(() => controlsRef.current?.update());

  return null;
}

function RoomScene({ cloud, autoRotate, command }: RoomPreview3DProps) {
  return (
    <>
      <color attach="background" args={["#050707"]} />
      <fog attach="fog" args={["#050707", 5.5, 12]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 6, 5]} intensity={1.7} color="#ffffff" />
      <pointLight position={[-3, 1.2, 2]} intensity={4.8} color="#37f8ff" />
      <pointLight position={[2.4, 0.4, -3]} intensity={2.2} color="#ffbf5c" />
      <PointCloudRenderer
        positions={cloud.positions}
        colors={cloud.colors}
        sizes={cloud.sizes}
        surfaceIds={cloud.surfaceIds}
        cameraPath={cloud.cameraPath}
        count={cloud.count}
        mode={cloud.mode}
        bounds={cloud.bounds}
        showPath
        showBoundary
        showVoxels
      />
      <RoomOrbitControls autoRotate={autoRotate} command={command} />
    </>
  );
}

export function RoomPreview3D({ cloud, autoRotate, command }: RoomPreview3DProps) {
  return (
    <section className="preview-stage room-preview-stage" aria-label="3D room scan preview">
      <Canvas
        camera={{ position: [4.2, 2.7, 5.6], fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 1.65]}
        gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <RoomScene cloud={cloud} autoRotate={autoRotate} command={command} />
      </Canvas>
      <div className="preview-hud" aria-hidden="true">
        <span>Room reconstruction</span>
        <strong>{cloud.count.toLocaleString()} mapped points</strong>
      </div>
    </section>
  );
}
