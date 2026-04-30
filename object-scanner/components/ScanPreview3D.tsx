"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ScanPointCloud } from "@/utils/PointCloudBuilder";
import type { ViewCommandType } from "./ScanControls";

export type ViewCommand = {
  id: number;
  type: ViewCommandType;
};

type ScanPreview3DProps = {
  cloud: ScanPointCloud;
  autoRotate: boolean;
  command: ViewCommand | null;
};

function ScannerCameraControls({
  autoRotate,
  command,
}: {
  autoRotate: boolean;
  command: ViewCommand | null;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    camera.position.set(0, 0.2, 4.25);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.55;
    controls.maxDistance = 7.5;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.78;
    controls.autoRotateSpeed = 0.9;
    controls.target.set(0, 0, 0);
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
      camera.position.set(0, 0.2, 4.25);
      controls.target.set(0, 0, 0);
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

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

function ColoredPointCloud({ cloud }: { cloud: ScanPointCloud }) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3));
    nextGeometry.computeBoundingSphere();
    return nextGeometry;
  }, [cloud]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        attach="material"
        vertexColors
        size={cloud.mode === "detail" ? 0.028 : 0.036}
        sizeAttenuation
        transparent
        opacity={0.96}
        depthWrite={false}
      />
    </points>
  );
}

function VoxelSkin({ cloud }: { cloud: ScanPointCloud }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const voxelCount = Math.min(cloud.count, cloud.mode === "detail" ? 520 : 320);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || voxelCount <= 0) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const step = Math.max(1, Math.floor(cloud.count / voxelCount));

    for (let index = 0; index < voxelCount; index += 1) {
      const pointIndex = Math.min(cloud.count - 1, index * step);
      const offset = pointIndex * 3;
      const size = cloud.sizes[pointIndex] * 1.7;
      matrix.compose(
        new THREE.Vector3(cloud.positions[offset], cloud.positions[offset + 1], cloud.positions[offset + 2]),
        new THREE.Quaternion(),
        new THREE.Vector3(size, size, size),
      );
      mesh.setMatrixAt(index, matrix);
      color.setRGB(cloud.colors[offset], cloud.colors[offset + 1], cloud.colors[offset + 2]);
      mesh.setColorAt(index, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cloud, voxelCount]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, voxelCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors transparent opacity={0.7} roughness={0.48} metalness={0.08} />
    </instancedMesh>
  );
}

function RadarRings() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
      {[0.8, 1.35, 1.9].map((radius) => (
        <mesh key={radius}>
          <torusGeometry args={[radius, 0.004, 8, 96]} />
          <meshBasicMaterial color="#37f8ff" transparent opacity={0.34} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ cloud, autoRotate, command }: ScanPreview3DProps) {
  return (
    <>
      <color attach="background" args={["#050707"]} />
      <fog attach="fog" args={["#050707", 4.5, 9]} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[3, 4, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-3, 1.2, 2]} intensity={3.6} color="#37f8ff" />
      <pointLight position={[2.2, -1.6, -1.8]} intensity={2.4} color="#ffbf5c" />
      <group>
        <ColoredPointCloud cloud={cloud} />
        <VoxelSkin cloud={cloud} />
      </group>
      <RadarRings />
      <gridHelper args={[5.2, 28, "#1ee7f0", "#142426"]} position={[0, -1.38, 0]} />
      <ScannerCameraControls autoRotate={autoRotate} command={command} />
    </>
  );
}

export function ScanPreview3D({ cloud, autoRotate, command }: ScanPreview3DProps) {
  return (
    <section className="preview-stage" aria-label="3D scan preview">
      <Canvas
        camera={{ position: [0, 0.2, 4.25], fov: 48, near: 0.1, far: 80 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <Scene cloud={cloud} autoRotate={autoRotate} command={command} />
      </Canvas>
      <div className="preview-hud" aria-hidden="true">
        <span>Reconstruction</span>
        <strong>{cloud.count.toLocaleString()} color points</strong>
      </div>
    </section>
  );
}
