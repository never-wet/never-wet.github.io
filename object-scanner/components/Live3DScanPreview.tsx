"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Maximize2, Minus, Plus, RotateCcw, RotateCw } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointCloudRenderer } from "@/components/PointCloudRenderer";
import type { DensePointCloudSnapshot } from "@/utils/DensePointCloudBuilder";
import type { RoomViewCommand } from "./RoomPreview3D";
import type { ViewCommandType } from "./ScanControls";

type Live3DScanPreviewProps = {
  snapshot: DensePointCloudSnapshot;
  showPath: boolean;
  command: RoomViewCommand | null;
  onCommand: (type: ViewCommandType) => void;
};

function LiveOrbitControls({ command }: { command: RoomViewCommand | null }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    camera.position.set(3.7, 2.45, 4.8);
    camera.lookAt(0, -0.25, -0.7);

    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = true;
    controls.minDistance = 1.3;
    controls.maxDistance = 11.5;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.78;
    controls.panSpeed = 0.62;
    controls.target.set(0, -0.25, -0.7);
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl.domElement]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !command) return;

    if (command.type === "reset") {
      camera.position.set(3.7, 2.45, 4.8);
      controls.target.set(0, -0.25, -0.7);
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

function LiveScene({ snapshot, showPath, command }: Omit<Live3DScanPreviewProps, "onCommand">) {
  return (
    <>
      <color attach="background" args={["#030606"]} />
      <fog attach="fog" args={["#030606", 6.2, 13]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3.5, 5, 4]} intensity={1.45} color="#ffffff" />
      <pointLight position={[-2, 1.2, 2]} intensity={3.8} color="#37f8ff" />
      <pointLight position={[2.4, 0.5, -3]} intensity={1.8} color="#ffbf5c" />
      <PointCloudRenderer
        positions={snapshot.positions}
        colors={snapshot.colors}
        sizes={snapshot.sizes}
        surfaceIds={snapshot.surfaceIds}
        cameraPath={snapshot.cameraPath}
        currentPose={snapshot.currentPose}
        count={snapshot.count}
        mode={snapshot.mode}
        bounds={snapshot.bounds}
        live
        showPath={showPath}
        showBoundary
        showVoxels
      />
      <LiveOrbitControls command={command} />
    </>
  );
}

export function Live3DScanPreview({ snapshot, showPath, command, onCommand }: Live3DScanPreviewProps) {
  return (
    <section className="live-room-preview" aria-label="Live 3D room scan preview">
      <Canvas
        camera={{ position: [3.7, 2.45, 4.8], fov: 50, near: 0.1, far: 100 }}
        dpr={[1, 1.35]}
        gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <LiveScene snapshot={snapshot} showPath={showPath} command={command} />
      </Canvas>
      <div className="live-preview-hud">
        <span>Live map</span>
        <strong>{snapshot.count.toLocaleString()} points</strong>
        <small>{snapshot.pathDistance.toFixed(1)} m path</small>
      </div>
      <div className="live-preview-controls" aria-label="Live 3D view controls">
        <button type="button" onClick={() => onCommand("zoom-in")} aria-label="Zoom live map in">
          <Plus size={14} />
        </button>
        <button type="button" onClick={() => onCommand("zoom-out")} aria-label="Zoom live map out">
          <Minus size={14} />
        </button>
        <button type="button" onClick={() => onCommand("rotate-left")} aria-label="Rotate live map left">
          <RotateCcw size={14} />
        </button>
        <button type="button" onClick={() => onCommand("rotate-right")} aria-label="Rotate live map right">
          <RotateCw size={14} />
        </button>
        <button type="button" onClick={() => onCommand("reset")} aria-label="Reset live map view">
          <Maximize2 size={14} />
        </button>
      </div>
    </section>
  );
}
