import type { ProcessedFrame, RawScanPoint, ScanMode } from "./FrameProcessor";

export type ScanPointCloud = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
  mode: ScanMode;
  quality: number;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
};

const MAX_POINTS: Record<ScanMode, number> = {
  quick: 9000,
  detail: 18000,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function hashNoise(seed: number) {
  return Math.sin(seed * 12.9898) * 43758.5453 % 1;
}

function selectPoints(points: RawScanPoint[], maxPoints: number) {
  if (points.length <= maxPoints) return points;

  const stride = points.length / maxPoints;
  const selected: RawScanPoint[] = [];
  for (let index = 0; index < maxPoints; index += 1) {
    selected.push(points[Math.floor(index * stride)]);
  }
  return selected;
}

export function buildPointCloud(frames: ProcessedFrame[], mode: ScanMode): ScanPointCloud {
  const usefulFrames = frames.filter((frame) => frame.points.length > 0);
  const allPoints = usefulFrames.flatMap((frame) => frame.points);
  const selected = selectPoints(allPoints, MAX_POINTS[mode]);
  const pointCount = Math.max(selected.length, 1);
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);
  const sizes = new Float32Array(pointCount);
  const lastFrameIndex = Math.max(1, ...usefulFrames.map((frame) => frame.frameIndex));

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  if (selected.length === 0) {
    positions.set([0, 0, 0]);
    colors.set([0.08, 0.85, 1]);
    sizes.set([0.045]);
    return {
      positions,
      colors,
      sizes,
      count: 1,
      mode,
      quality: 0,
      bounds: {
        width: 0.01,
        height: 0.01,
        depth: 0.01,
      },
    };
  }

  selected.forEach((point, index) => {
    const normalizedFrame = point.frameIndex / lastFrameIndex - 0.5;
    const sweepAngle = normalizedFrame * (mode === "detail" ? 1.35 : 0.95);
    const sourceDepth = point.z * 0.58 + Math.sin(point.x * 3.5 + point.frameIndex * 0.33) * 0.08;
    const radial = 1.03 + Math.abs(sourceDepth) * 0.12;
    const jitter = (hashNoise(index + point.frameIndex * 31) - 0.5) * (mode === "detail" ? 0.025 : 0.04);
    const preX = point.x * radial + jitter;
    const preY = point.y * 1.22 + jitter * 0.38;
    const preZ = sourceDepth * 1.2 + (point.confidence - 0.5) * 0.12;
    const cos = Math.cos(sweepAngle);
    const sin = Math.sin(sweepAngle);
    const x = preX * cos + preZ * sin;
    const y = preY;
    const z = preZ * cos - preX * sin;
    const offset = index * 3;

    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;

    colors[offset] = clamp((point.r / 255) * 1.08);
    colors[offset + 1] = clamp((point.g / 255) * 1.08);
    colors[offset + 2] = clamp((point.b / 255) * 1.08);
    sizes[index] = point.size;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  });

  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;
  const width = Math.max(0.01, maxX - minX);
  const height = Math.max(0.01, maxY - minY);
  const depth = Math.max(0.01, maxZ - minZ);
  const scale = 2.55 / Math.max(width, height, depth);

  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = (positions[index] - centerX) * scale;
    positions[index + 1] = (positions[index + 1] - centerY) * scale;
    positions[index + 2] = (positions[index + 2] - centerZ) * scale;
  }

  const averageQuality =
    usefulFrames.reduce((sum, frame) => sum + frame.quality.objectScore + frame.quality.maskCoverage, 0) /
    Math.max(1, usefulFrames.length * 2);

  return {
    positions,
    colors,
    sizes,
    count: selected.length,
    mode,
    quality: clamp(averageQuality),
    bounds: {
      width: width * scale,
      height: height * scale,
      depth: depth * scale,
    },
  };
}
