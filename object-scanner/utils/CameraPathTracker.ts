import type { CameraPose } from "./MotionTracker";

export type CameraPathSample = CameraPose & {
  timestamp: number;
  quality: number;
  distance: number;
};

const PATH_HEIGHT = -1.05;

function clonePose(pose: CameraPose): CameraPose {
  return {
    x: pose.x,
    y: pose.y,
    z: pose.z,
    yaw: pose.yaw,
    pitch: pose.pitch,
    roll: pose.roll,
    confidence: pose.confidence,
  };
}

export class CameraPathTracker {
  private samples: CameraPathSample[] = [];
  private totalDistance = 0;
  private currentPose: CameraPose = {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    confidence: 0,
  };

  reset() {
    this.samples = [];
    this.totalDistance = 0;
    this.currentPose = {
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      confidence: 0,
    };
  }

  addPose(pose: CameraPose, timestamp: number, quality: number) {
    const previous = this.samples.at(-1);
    const nextPose = clonePose(pose);
    this.currentPose = nextPose;

    if (!previous) {
      this.samples.push({ ...nextPose, timestamp, quality, distance: 0 });
      return;
    }

    const segmentDistance = Math.hypot(nextPose.x - previous.x, nextPose.z - previous.z);
    const shouldStore = segmentDistance > 0.018 || timestamp - previous.timestamp > 420 || Math.abs(nextPose.yaw - previous.yaw) > 0.018;
    if (!shouldStore) return;

    this.totalDistance += segmentDistance;
    this.samples.push({
      ...nextPose,
      timestamp,
      quality,
      distance: this.totalDistance,
    });

    if (this.samples.length > 520) {
      this.samples.shift();
    }
  }

  getCurrentPose() {
    return clonePose(this.currentPose);
  }

  getTotalDistance() {
    return this.totalDistance;
  }

  getSamples() {
    return this.samples.slice();
  }

  getPathBuffer(maxSamples = 360) {
    const source =
      this.samples.length > maxSamples
        ? this.samples.filter((_, index) => index % Math.ceil(this.samples.length / maxSamples) === 0).slice(-maxSamples)
        : this.samples;
    const path = new Float32Array(Math.max(1, source.length) * 3);

    if (source.length === 0) {
      path.set([0, PATH_HEIGHT, 0]);
      return path;
    }

    source.forEach((sample, index) => {
      const offset = index * 3;
      path[offset] = sample.x;
      path[offset + 1] = PATH_HEIGHT;
      path[offset + 2] = sample.z;
    });

    return path;
  }
}
