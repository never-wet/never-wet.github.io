import { CameraPathTracker } from "./CameraPathTracker";
import {
  calculateBounds,
  createDenseRoomPoints,
  createEmptyDenseSnapshot,
  surfaceToId,
  type DensePointCloudSnapshot,
} from "./DensePointCloudBuilder";
import type { RoomProcessedFrame, RoomScanMode } from "./RoomFrameProcessor";

export type ScanSessionStats = {
  frameCount: number;
  pointCount: number;
  coverage: number;
  trackingQuality: number;
  pathDistance: number;
};

const MAX_LIVE_POINTS: Record<RoomScanMode, number> = {
  quick: 56000,
  full: 96000,
};

const MAX_SNAPSHOT_POINTS: Record<RoomScanMode, number> = {
  quick: 30000,
  full: 52000,
};

const MAX_FRAMES: Record<RoomScanMode, number> = {
  quick: 160,
  full: 240,
};

export class ScanSessionStore {
  private mode: RoomScanMode;
  private readonly pathTracker = new CameraPathTracker();
  private frames: RoomProcessedFrame[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private surfaceIds: Float32Array;
  private confidences: Float32Array;
  private frameIds: Float32Array;
  private timestamps: Float32Array;
  private count = 0;
  private writeIndex = 0;
  private coverage = 0;
  private trackingQuality = 0;

  constructor(mode: RoomScanMode) {
    this.mode = mode;
    const capacity = MAX_LIVE_POINTS[mode];
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.surfaceIds = new Float32Array(capacity);
    this.confidences = new Float32Array(capacity);
    this.frameIds = new Float32Array(capacity);
    this.timestamps = new Float32Array(capacity);
  }

  reset(mode = this.mode) {
    this.mode = mode;
    const capacity = MAX_LIVE_POINTS[mode];
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.surfaceIds = new Float32Array(capacity);
    this.confidences = new Float32Array(capacity);
    this.frameIds = new Float32Array(capacity);
    this.timestamps = new Float32Array(capacity);
    this.frames = [];
    this.count = 0;
    this.writeIndex = 0;
    this.coverage = 0;
    this.trackingQuality = 0;
    this.pathTracker.reset();
  }

  addFrame(frame: RoomProcessedFrame) {
    this.frames.push(frame);
    if (this.frames.length > MAX_FRAMES[this.mode]) {
      this.frames.shift();
    }

    this.pathTracker.addPose(frame.pose, frame.timestamp, frame.quality.trackingScore);
    this.coverage = this.coverage * 0.86 + frame.quality.coverageScore * 0.14;
    this.trackingQuality = this.trackingQuality * 0.82 + frame.quality.trackingScore * 0.18;

    const densePoints = createDenseRoomPoints(frame, this.mode);
    densePoints.forEach((point) => {
      const pointIndex = this.count < MAX_LIVE_POINTS[this.mode] ? this.count : this.writeIndex;
      const offset = pointIndex * 3;
      this.positions[offset] = point.x;
      this.positions[offset + 1] = point.y;
      this.positions[offset + 2] = point.z;
      this.colors[offset] = Math.min(1, (point.r / 255) * 1.08);
      this.colors[offset + 1] = Math.min(1, (point.g / 255) * 1.08);
      this.colors[offset + 2] = Math.min(1, (point.b / 255) * 1.08);
      this.sizes[pointIndex] = point.size;
      this.surfaceIds[pointIndex] = surfaceToId(point.surface);
      this.confidences[pointIndex] = point.confidence;
      this.frameIds[pointIndex] = point.frameIndex;
      this.timestamps[pointIndex] = point.timestamp;

      if (this.count < MAX_LIVE_POINTS[this.mode]) {
        this.count += 1;
      } else {
        this.writeIndex = (this.writeIndex + 1) % MAX_LIVE_POINTS[this.mode];
      }
    });
  }

  getFrames() {
    return this.frames.slice();
  }

  getStats(): ScanSessionStats {
    return {
      frameCount: this.frames.length,
      pointCount: this.count,
      coverage: this.coverage,
      trackingQuality: this.trackingQuality,
      pathDistance: this.pathTracker.getTotalDistance(),
    };
  }

  getLiveSnapshot(): DensePointCloudSnapshot {
    if (this.count === 0) {
      const empty = createEmptyDenseSnapshot(this.mode);
      return {
        ...empty,
        cameraPath: this.pathTracker.getPathBuffer(),
        currentPose: this.pathTracker.getCurrentPose(),
      };
    }

    const snapshotCount = Math.min(this.count, MAX_SNAPSHOT_POINTS[this.mode]);
    const stride = this.count / snapshotCount;
    const positions = new Float32Array(snapshotCount * 3);
    const colors = new Float32Array(snapshotCount * 3);
    const sizes = new Float32Array(snapshotCount);
    const surfaceIds = new Float32Array(snapshotCount);
    const confidences = new Float32Array(snapshotCount);
    const frameIds = new Float32Array(snapshotCount);
    const timestamps = new Float32Array(snapshotCount);

    for (let index = 0; index < snapshotCount; index += 1) {
      const sourceIndex = Math.min(this.count - 1, Math.floor(index * stride));
      const sourceOffset = sourceIndex * 3;
      const targetOffset = index * 3;

      positions[targetOffset] = this.positions[sourceOffset];
      positions[targetOffset + 1] = this.positions[sourceOffset + 1];
      positions[targetOffset + 2] = this.positions[sourceOffset + 2];
      colors[targetOffset] = this.colors[sourceOffset];
      colors[targetOffset + 1] = this.colors[sourceOffset + 1];
      colors[targetOffset + 2] = this.colors[sourceOffset + 2];
      sizes[index] = this.sizes[sourceIndex];
      surfaceIds[index] = this.surfaceIds[sourceIndex];
      confidences[index] = this.confidences[sourceIndex];
      frameIds[index] = this.frameIds[sourceIndex];
      timestamps[index] = this.timestamps[sourceIndex];
    }

    return {
      positions,
      colors,
      sizes,
      surfaceIds,
      confidences,
      frameIds,
      timestamps,
      cameraPath: this.pathTracker.getPathBuffer(),
      currentPose: this.pathTracker.getCurrentPose(),
      count: snapshotCount,
      mode: this.mode,
      coverage: this.coverage,
      trackingQuality: this.trackingQuality,
      pathDistance: this.pathTracker.getTotalDistance(),
      bounds: calculateBounds(positions, snapshotCount),
    };
  }
}
