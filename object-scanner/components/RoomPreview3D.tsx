"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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

function RoomPointCloudMesh({ cloud }: { cloud: RoomPointCloud }) {
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
        size={cloud.mode === "full" ? 0.032 : 0.046}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

function RoomVoxelLayer({ cloud }: { cloud: RoomPointCloud }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const voxelCount = Math.min(cloud.count, cloud.mode === "full" ? 900 : 520);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || voxelCount <= 0) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const step = Math.max(1, Math.floor(cloud.count / voxelCount));

    for (let index = 0; index < voxelCount; index += 1) {
      const pointIndex = Math.min(cloud.count - 1, index * step);
      const offset = pointIndex * 3;
      const surfaceScale = cloud.surfaceIds[pointIndex] === 0 ? 1.5 : cloud.surfaceIds[pointIndex] === 1 ? 1.25 : 1;
      const size = cloud.sizes[pointIndex] * surfaceScale;
      matrix.compose(
        new THREE.Vector3(cloud.positions[offset], cloud.positions[offset + 1], cloud.positions[offset + 2]),
        new THREE.Quaternion(),
        new THREE.Vector3(size, size * (cloud.surfaceIds[pointIndex] === 0 ? 0.42 : 1), size),
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
      <meshStandardMaterial vertexColors transparent opacity={0.62} roughness={0.62} metalness={0.05} />
    </instancedMesh>
  );
}

function CameraPath({ path }: { path: Float32Array }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(path, 3));
    const material = new THREE.LineBasicMaterial({ color: "#ffbf5c", transparent: true, opacity: 0.92 });
    return new THREE.Line(geometry, material);
  }, [path]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      if (Array.isArray(line.material)) line.material.forEach((material) => material.dispose());
      else line.material.dispose();
    },
    [line],
  );

  return <primitive object={line} />;
}

function RoomBoundary() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.045} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.05, -3]}>
        <planeGeometry args={[6, 2.8]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.035} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-3, 0.05, 0]}>
        <planeGeometry args={[6, 2.8]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[3, 0.05, 0]}>
        <planeGeometry args={[6, 2.8]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[0, 0.05, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(6, 2.8, 6)]} />
        <lineBasicMaterial color="#37f8ff" transparent opacity={0.36} />
      </lineSegments>
    </group>
  );
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
      <RoomBoundary />
      <RoomPointCloudMesh cloud={cloud} />
      <RoomVoxelLayer cloud={cloud} />
      <CameraPath path={cloud.cameraPath} />
      <gridHelper args={[6, 24, "#37f8ff", "#142426"]} position={[0, -1.34, 0]} />
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
