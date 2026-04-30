"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CameraPose } from "@/utils/MotionTracker";
import type { RoomScanMode } from "@/utils/RoomFrameProcessor";

type PointCloudRendererProps = {
  positions: Float32Array;
  colors: Float32Array;
  sizes?: Float32Array;
  surfaceIds?: Float32Array;
  cameraPath?: Float32Array;
  currentPose?: CameraPose;
  count: number;
  mode: RoomScanMode;
  bounds?: {
    width: number;
    height: number;
    depth: number;
  };
  live?: boolean;
  showPath?: boolean;
  showBoundary?: boolean;
  showVoxels?: boolean;
};

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) material.forEach((item) => item.dispose());
  else material.dispose();
}

function DensePoints({ positions, colors, count, mode, live }: PointCloudRendererProps) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    nextGeometry.computeBoundingSphere();
    return nextGeometry;
  }, [colors, positions]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (count <= 0) return null;

  return (
    <points geometry={geometry}>
      <pointsMaterial
        attach="material"
        vertexColors
        size={live ? (mode === "full" ? 0.026 : 0.034) : mode === "full" ? 0.028 : 0.04}
        sizeAttenuation
        transparent
        opacity={live ? 0.92 : 0.96}
        depthWrite={false}
      />
    </points>
  );
}

function VoxelLayer({ positions, colors, sizes, surfaceIds, count, mode, live }: PointCloudRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const voxelCount = Math.min(count, live ? (mode === "full" ? 520 : 360) : mode === "full" ? 1000 : 620);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || voxelCount <= 0) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const step = Math.max(1, Math.floor(count / voxelCount));

    for (let index = 0; index < voxelCount; index += 1) {
      const pointIndex = Math.min(count - 1, index * step);
      const offset = pointIndex * 3;
      const surfaceId = surfaceIds?.[pointIndex] ?? 2;
      const surfaceScale = surfaceId === 0 ? 1.55 : surfaceId === 1 || surfaceId === 3 ? 1.22 : 1;
      const size = (sizes?.[pointIndex] ?? 0.04) * surfaceScale;

      matrix.compose(
        new THREE.Vector3(positions[offset], positions[offset + 1], positions[offset + 2]),
        new THREE.Quaternion(),
        new THREE.Vector3(size, surfaceId === 0 ? size * 0.38 : size, size),
      );
      mesh.setMatrixAt(index, matrix);
      color.setRGB(colors[offset], colors[offset + 1], colors[offset + 2]);
      mesh.setColorAt(index, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors, count, positions, sizes, surfaceIds, voxelCount]);

  if (voxelCount <= 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, voxelCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors transparent opacity={live ? 0.42 : 0.58} roughness={0.68} metalness={0.04} />
    </instancedMesh>
  );
}

function PathLine({ path }: { path: Float32Array }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(path, 3));
    const material = new THREE.LineBasicMaterial({ color: "#ffbf5c", transparent: true, opacity: 0.94 });
    return new THREE.Line(geometry, material);
  }, [path]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      disposeMaterial(line.material);
    },
    [line],
  );

  if (path.length < 6) return null;
  return <primitive object={line} />;
}

function poseFromPath(path?: Float32Array): CameraPose | null {
  if (!path || path.length < 3) return null;
  const lastOffset = path.length - 3;
  const previousOffset = Math.max(0, path.length - 6);
  const dx = path[lastOffset] - path[previousOffset];
  const dz = path[lastOffset + 2] - path[previousOffset + 2];

  return {
    x: path[lastOffset],
    y: path[lastOffset + 1],
    z: path[lastOffset + 2],
    yaw: Math.atan2(dx, dz),
    pitch: 0,
    roll: 0,
    confidence: 1,
  };
}

function CurrentCameraMarker({ pose }: { pose: CameraPose }) {
  return (
    <group position={[pose.x, -1.05, pose.z]} rotation={[0, pose.yaw, 0]}>
      <mesh>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial color="#ffbf5c" emissive="#ff8f2a" emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[0, 0.02, -0.24]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.085, 0.26, 18]} />
        <meshStandardMaterial color="#37f8ff" emissive="#37f8ff" emissiveIntensity={0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.18, 32]} />
        <meshBasicMaterial color="#ffbf5c" transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RoomBoundary({ bounds }: Pick<PointCloudRendererProps, "bounds">) {
  const width = Math.max(5.4, Math.min(12, (bounds?.width ?? 5.6) * 1.08));
  const height = Math.max(2.7, Math.min(5.2, (bounds?.height ?? 2.8) * 1.08));
  const depth = Math.max(5.4, Math.min(12, (bounds?.depth ?? 5.6) * 1.08));

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.045} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height * 0.5 - 1.35, -depth * 0.5]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.035} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-width * 0.5, height * 0.5 - 1.35, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[width * 0.5, height * 0.5 - 1.35, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshBasicMaterial color="#37f8ff" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[0, height * 0.5 - 1.35, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#37f8ff" transparent opacity={0.34} />
      </lineSegments>
      <gridHelper args={[Math.max(width, depth), 28, "#37f8ff", "#142426"]} position={[0, -1.34, 0]} />
    </group>
  );
}

export function PointCloudRenderer({
  positions,
  colors,
  sizes,
  surfaceIds,
  cameraPath,
  currentPose,
  count,
  mode,
  bounds,
  live = false,
  showPath = true,
  showBoundary = true,
  showVoxels = true,
}: PointCloudRendererProps) {
  const markerPose = currentPose ?? poseFromPath(cameraPath);

  return (
    <>
      {showBoundary && <RoomBoundary bounds={bounds} />}
      <DensePoints positions={positions} colors={colors} count={count} mode={mode} live={live} />
      {showVoxels && (
        <VoxelLayer
          positions={positions}
          colors={colors}
          sizes={sizes}
          surfaceIds={surfaceIds}
          count={count}
          mode={mode}
          live={live}
        />
      )}
      {showPath && cameraPath && <PathLine path={cameraPath} />}
      {showPath && markerPose && <CurrentCameraMarker pose={markerPose} />}
    </>
  );
}
