import type { CameraPose } from "./MotionTracker";
import { createDenseRoomPoints, surfaceToId } from "./DensePointCloudBuilder";
import type { DenseRoomPoint } from "./DensePointCloudBuilder";
import type { RoomProcessedFrame, RoomScanMode } from "./RoomFrameProcessor";

export type RoomPointCloud = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  surfaceIds: Float32Array;
  cameraPath: Float32Array;
  count: number;
  mode: RoomScanMode;
  coverage: number;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
};

const MAX_POINTS: Record<RoomScanMode, number> = {
  quick: 42000,
  full: 82000,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function selectPoints(points: DenseRoomPoint[], maxPoints: number) {
  if (points.length <= maxPoints) return points;
  const stride = points.length / maxPoints;
  const selected: DenseRoomPoint[] = [];
  for (let index = 0; index < maxPoints; index += 1) {
    selected.push(points[Math.floor(index * stride)]);
  }
  return selected;
}

function createFallbackPointCloud(mode: RoomScanMode): RoomPointCloud {
  return {
    positions: new Float32Array([0, 0, 0]),
    colors: new Float32Array([0.1, 0.86, 1]),
    sizes: new Float32Array([0.06]),
    surfaceIds: new Float32Array([2]),
    cameraPath: new Float32Array([0, -1.05, 0]),
    count: 1,
    mode,
    coverage: 0,
    bounds: {
      width: 0.01,
      height: 0.01,
      depth: 0.01,
    },
  };
}

export function buildRoomPointCloud(frames: RoomProcessedFrame[], mode: RoomScanMode): RoomPointCloud {
  const usefulFrames = frames.filter((frame) => frame.points.length > 0);
  const selected = selectPoints(usefulFrames.flatMap((frame) => createDenseRoomPoints(frame, mode)), MAX_POINTS[mode]);

  if (selected.length === 0) {
    return createFallbackPointCloud(mode);
  }

  const positions = new Float32Array(selected.length * 3);
  const colors = new Float32Array(selected.length * 3);
  const sizes = new Float32Array(selected.length);
  const surfaceIds = new Float32Array(selected.length);
  const poses = usefulFrames.map((frame) => frame.pose);
  const path = createCameraPath(poses);

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  selected.forEach((point, index) => {
    const offset = index * 3;
    positions[offset] = point.x;
    positions[offset + 1] = point.y;
    positions[offset + 2] = point.z;
    colors[offset] = clamp((point.r / 255) * 1.08);
    colors[offset + 1] = clamp((point.g / 255) * 1.08);
    colors[offset + 2] = clamp((point.b / 255) * 1.08);
    sizes[index] = point.size;
    surfaceIds[index] = surfaceToId(point.surface);

    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    minZ = Math.min(minZ, point.z);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    maxZ = Math.max(maxZ, point.z);
  });

  const width = Math.max(0.01, maxX - minX);
  const height = Math.max(0.01, maxY - minY);
  const depth = Math.max(0.01, maxZ - minZ);
  const scale = 5.2 / Math.max(width, depth, height * 1.5);
  const centerX = (minX + maxX) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;

  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = (positions[index] - centerX) * scale;
    positions[index + 1] = positions[index + 1] * scale;
    positions[index + 2] = (positions[index + 2] - centerZ) * scale;
  }

  for (let index = 0; index < path.length; index += 3) {
    path[index] = (path[index] - centerX) * scale;
    path[index + 1] *= scale;
    path[index + 2] = (path[index + 2] - centerZ) * scale;
  }

  const coverage =
    usefulFrames.reduce((sum, frame) => sum + frame.quality.coverageScore, 0) / Math.max(1, usefulFrames.length);

  return {
    positions,
    colors,
    sizes,
    surfaceIds,
    cameraPath: path,
    count: selected.length,
    mode,
    coverage: clamp(coverage),
    bounds: {
      width: width * scale,
      height: height * scale,
      depth: depth * scale,
    },
  };
}

function createCameraPath(poses: CameraPose[]) {
  const sampled = poses.filter((_, index) => index % 2 === 0);
  const path = new Float32Array(Math.max(1, sampled.length) * 3);

  if (sampled.length === 0) {
    path.set([0, -1.05, 0]);
    return path;
  }

  sampled.forEach((pose, index) => {
    const offset = index * 3;
    path[offset] = pose.x;
    path[offset + 1] = -1.05;
    path[offset + 2] = pose.z;
  });

  return path;
}
