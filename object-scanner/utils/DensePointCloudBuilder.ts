import type { CameraPose } from "./MotionTracker";
import type { RoomProcessedFrame, RoomScanMode, RoomScanPoint, RoomSurfaceKind } from "./RoomFrameProcessor";

export type DenseRoomPoint = RoomScanPoint & {
  timestamp: number;
};

export type DensePointCloudSnapshot = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  surfaceIds: Float32Array;
  confidences: Float32Array;
  frameIds: Float32Array;
  timestamps: Float32Array;
  cameraPath: Float32Array;
  currentPose: CameraPose;
  count: number;
  mode: RoomScanMode;
  coverage: number;
  trackingQuality: number;
  pathDistance: number;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
};

const EMPTY_POSE: CameraPose = {
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  confidence: 0,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function signedJitter(seed: number, radius: number) {
  return (pseudoRandom(seed) - 0.5) * radius;
}

export function surfaceToId(surface: RoomSurfaceKind) {
  if (surface === "floor") return 0;
  if (surface === "wall") return 1;
  if (surface === "ceiling") return 3;
  return 2;
}

export function createEmptyDenseSnapshot(mode: RoomScanMode): DensePointCloudSnapshot {
  return {
    positions: new Float32Array(),
    colors: new Float32Array(),
    sizes: new Float32Array(),
    surfaceIds: new Float32Array(),
    confidences: new Float32Array(),
    frameIds: new Float32Array(),
    timestamps: new Float32Array(),
    cameraPath: new Float32Array([0, -1.05, 0]),
    currentPose: { ...EMPTY_POSE },
    count: 0,
    mode,
    coverage: 0,
    trackingQuality: 0,
    pathDistance: 0,
    bounds: {
      width: 0.01,
      height: 0.01,
      depth: 0.01,
    },
  };
}

export function calculateBounds(positions: Float32Array, count: number) {
  if (count === 0) {
    return {
      width: 0.01,
      height: 0.01,
      depth: 0.01,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    minX = Math.min(minX, positions[offset]);
    minY = Math.min(minY, positions[offset + 1]);
    minZ = Math.min(minZ, positions[offset + 2]);
    maxX = Math.max(maxX, positions[offset]);
    maxY = Math.max(maxY, positions[offset + 1]);
    maxZ = Math.max(maxZ, positions[offset + 2]);
  }

  return {
    width: Math.max(0.01, maxX - minX),
    height: Math.max(0.01, maxY - minY),
    depth: Math.max(0.01, maxZ - minZ),
  };
}

export function createDenseRoomPoints(frame: RoomProcessedFrame, mode: RoomScanMode) {
  const densePoints: DenseRoomPoint[] = [];
  const duplicationLimit = mode === "full" ? 2 : 1;

  frame.points.forEach((point, pointIndex) => {
    densePoints.push({ ...point, timestamp: frame.timestamp });

    const confidence = clamp(point.confidence);
    const surfaceIsLarge = point.surface === "floor" || point.surface === "wall" || point.surface === "ceiling";
    const shouldThicken = surfaceIsLarge || (mode === "full" && point.surface === "object" && confidence > 0.38);
    if (!shouldThicken) return;

    const copyCount = surfaceIsLarge ? duplicationLimit : 1;
    for (let copyIndex = 0; copyIndex < copyCount; copyIndex += 1) {
      const seed = frame.frameIndex * 997 + pointIndex * 37 + copyIndex * 131;
      const spread = point.surface === "object" ? 0.045 : point.surface === "wall" ? 0.095 : 0.075;
      const jitterX = signedJitter(seed + 3, spread);
      const jitterY = signedJitter(seed + 7, point.surface === "floor" ? 0.018 : 0.07);
      const jitterZ = signedJitter(seed + 11, spread);
      const floorY = point.surface === "floor" ? -1.2 + signedJitter(seed + 19, 0.025) : point.y + jitterY;
      const ceilingY = point.surface === "ceiling" ? 1.28 + signedJitter(seed + 23, 0.035) : floorY;

      densePoints.push({
        ...point,
        x: point.x + jitterX,
        y: ceilingY,
        z: point.z + jitterZ,
        confidence: confidence * 0.78,
        size: point.size * 0.72,
        timestamp: frame.timestamp,
      });
    }
  });

  return densePoints;
}
