import { estimateMotionFromFeatures, integrateCameraPose, type EstimatedMotion } from "./MotionEstimator";

export type CameraPose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  confidence: number;
};

export type TrackedFeaturePoint = {
  id: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  dx: number;
  dy: number;
  strength: number;
  age: number;
};

export type CoverageCell = {
  id: number;
  x: number;
  y: number;
  intensity: number;
};

export type MotionEstimate = EstimatedMotion;

export type MotionTrackResult = {
  features: TrackedFeaturePoint[];
  trackedFeatureCount: number;
  pose: CameraPose;
  motion: MotionEstimate;
  coverage: CoverageCell[];
  coverageScore: number;
  trackingScore: number;
};

type StoredFeature = {
  id: number;
  x: number;
  y: number;
  strength: number;
  luma: number;
  age: number;
};

type CandidateFeature = {
  x: number;
  y: number;
  strength: number;
  luma: number;
};

const COVERAGE_COLUMNS = 8;
const COVERAGE_ROWS = 6;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lumaAt(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const safeX = Math.max(0, Math.min(width - 1, x));
  const safeY = Math.max(0, Math.min(Math.floor(data.length / 4 / width) - 1, y));
  const index = (safeY * width + safeX) * 4;
  return (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
}

export class MotionTracker {
  private previousFeatures: StoredFeature[] = [];
  private nextFeatureId = 1;
  private pose: CameraPose = {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    confidence: 0,
  };
  private coverage = new Float32Array(COVERAGE_COLUMNS * COVERAGE_ROWS);

  reset() {
    this.previousFeatures = [];
    this.nextFeatureId = 1;
    this.pose = {
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      confidence: 0,
    };
    this.coverage.fill(0);
  }

  track(data: Uint8ClampedArray, width: number, height: number, frameIndex: number, maxFeatures: number): MotionTrackResult {
    const detected = this.detectFeatures(data, width, height, maxFeatures, frameIndex);
    const tracked = this.matchFeatures(detected, width, height);
    const trackedMatches = tracked.filter((feature) => feature.age > 1);
    const motion = estimateMotionFromFeatures(trackedMatches, width, height);
    const trackingScore = clamp(trackedMatches.length / Math.max(20, maxFeatures * 0.52));

    this.pose = integrateCameraPose(this.pose, motion, width, height);
    this.pose.confidence = trackingScore;

    this.updateCoverage(tracked, width, height, frameIndex, motion.magnitude);
    this.previousFeatures = tracked.map((feature) => ({
      id: feature.id,
      x: feature.x,
      y: feature.y,
      strength: feature.strength,
      luma: lumaAt(data, width, Math.round(feature.x), Math.round(feature.y)),
      age: feature.age,
    }));

    const coverageCells = Array.from(this.coverage, (intensity, id) => ({
      id,
      x: id % COVERAGE_COLUMNS,
      y: Math.floor(id / COVERAGE_COLUMNS),
      intensity: clamp(intensity),
    }));
    const coverageScore =
      coverageCells.reduce((sum, cell) => sum + Math.min(1, cell.intensity), 0) / (COVERAGE_COLUMNS * COVERAGE_ROWS);

    return {
      features: tracked,
      trackedFeatureCount: trackedMatches.length,
      pose: { ...this.pose },
      motion,
      coverage: coverageCells,
      coverageScore: clamp(coverageScore),
      trackingScore,
    };
  }

  private detectFeatures(data: Uint8ClampedArray, width: number, height: number, maxFeatures: number, frameIndex: number) {
    const candidates: CandidateFeature[] = [];
    const stride = Math.max(4, Math.floor(Math.min(width, height) / 34));

    for (let y = 5; y < height - 5; y += stride) {
      for (let x = 5; x < width - 5; x += stride) {
        const center = lumaAt(data, width, x, y);
        const gx = lumaAt(data, width, x + 3, y) - lumaAt(data, width, x - 3, y);
        const gy = lumaAt(data, width, x, y + 3) - lumaAt(data, width, x, y - 3);
        const diagonal = lumaAt(data, width, x + 2, y + 2) - lumaAt(data, width, x - 2, y - 2);
        const cornerScore = Math.abs(gx * gy) * 3.6 + Math.abs(diagonal) * 0.36 + Math.abs(center - 0.5) * 0.08;

        if (cornerScore > 0.035) {
          candidates.push({ x, y, strength: clamp(cornerScore * 4), luma: center });
        }
      }
    }

    candidates.sort((a, b) => b.strength - a.strength);
    const selected: CandidateFeature[] = [];
    const minDistance = Math.max(7, Math.min(width, height) * 0.055);

    for (const candidate of candidates) {
      if (selected.length >= maxFeatures) break;
      const tooClose = selected.some((feature) => Math.hypot(feature.x - candidate.x, feature.y - candidate.y) < minDistance);
      if (!tooClose) selected.push(candidate);
    }

    const fallbackTarget = Math.floor(maxFeatures * 0.46);
    for (let index = selected.length; index < fallbackTarget; index += 1) {
      const angle = index * 2.399963 + frameIndex * 0.08;
      const radius = 0.16 + (index % 9) * 0.042;
      selected.push({
        x: width * (0.5 + Math.cos(angle) * radius),
        y: height * (0.5 + Math.sin(angle) * radius * 0.76),
        strength: 0.22,
        luma: 0.5,
      });
    }

    return selected;
  }

  private matchFeatures(detected: CandidateFeature[], width: number, height: number) {
    const tracked: TrackedFeaturePoint[] = [];
    const usedPrevious = new Set<number>();
    const searchRadius = Math.max(10, Math.min(width, height) * 0.14);

    for (const current of detected) {
      let best: StoredFeature | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const previous of this.previousFeatures) {
        if (usedPrevious.has(previous.id)) continue;
        const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
        const lumaDelta = Math.abs(current.luma - previous.luma) * 35;
        const score = distance + lumaDelta - previous.strength * 3;
        if (distance < searchRadius && score < bestScore) {
          best = previous;
          bestScore = score;
        }
      }

      if (best) {
        usedPrevious.add(best.id);
        tracked.push({
          id: best.id,
          x: current.x,
          y: current.y,
          previousX: best.x,
          previousY: best.y,
          dx: current.x - best.x,
          dy: current.y - best.y,
          strength: current.strength,
          age: best.age + 1,
        });
      } else {
        tracked.push({
          id: this.nextFeatureId,
          x: current.x,
          y: current.y,
          previousX: current.x,
          previousY: current.y,
          dx: 0,
          dy: 0,
          strength: current.strength,
          age: 1,
        });
        this.nextFeatureId += 1;
      }
    }

    return tracked;
  }

  private updateCoverage(features: TrackedFeaturePoint[], width: number, height: number, frameIndex: number, magnitude: number) {
    for (let index = 0; index < this.coverage.length; index += 1) {
      this.coverage[index] *= 0.997;
    }

    for (const feature of features) {
      const column = Math.max(0, Math.min(COVERAGE_COLUMNS - 1, Math.floor((feature.x / width) * COVERAGE_COLUMNS)));
      const row = Math.max(0, Math.min(COVERAGE_ROWS - 1, Math.floor((feature.y / height) * COVERAGE_ROWS)));
      const index = row * COVERAGE_COLUMNS + column;
      this.coverage[index] = clamp(this.coverage[index] + 0.032 + feature.strength * 0.024);
    }

    const sweepColumn = Math.abs(Math.floor((this.pose.yaw * 2.7 + frameIndex * 0.18) % COVERAGE_COLUMNS));
    for (let row = 0; row < COVERAGE_ROWS; row += 1) {
      const index = row * COVERAGE_COLUMNS + sweepColumn;
      this.coverage[index] = clamp(this.coverage[index] + 0.01 + clamp(magnitude / 150, 0, 0.018));
    }
  }
}
