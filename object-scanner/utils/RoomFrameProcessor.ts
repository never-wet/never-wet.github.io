import { MotionTracker, type CameraPose, type CoverageCell, type MotionEstimate, type TrackedFeaturePoint } from "./MotionTracker";

export type RoomScanMode = "quick" | "full";
export type RoomSurfaceKind = "floor" | "wall" | "object";

export type RoomScanPoint = {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  confidence: number;
  frameIndex: number;
  size: number;
  surface: RoomSurfaceKind;
};

export type RoomFrameQuality = {
  trackingScore: number;
  coverageScore: number;
  motionMagnitude: number;
  brightness: number;
  warning?: string;
};

export type RoomProcessedFrame = {
  frameIndex: number;
  timestamp: number;
  points: RoomScanPoint[];
  features: TrackedFeaturePoint[];
  trackedFeatureCount: number;
  pose: CameraPose;
  motion: MotionEstimate;
  coverage: CoverageCell[];
  quality: RoomFrameQuality;
};

type RoomModeSettings = {
  width: number;
  height: number;
  step: number;
  maxFeatures: number;
  maxPoints: number;
};

const SETTINGS: Record<RoomScanMode, RoomModeSettings> = {
  quick: {
    width: 160,
    height: 120,
    step: 7,
    maxFeatures: 84,
    maxPoints: 560,
  },
  full: {
    width: 216,
    height: 162,
    step: 5,
    maxFeatures: 150,
    maxPoints: 1100,
  },
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function luminance(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max <= 0 ? 0 : (max - min) / max;
}

function sampleLuma(data: Uint8ClampedArray, width: number, height: number, x: number, y: number) {
  const safeX = Math.max(0, Math.min(width - 1, x));
  const safeY = Math.max(0, Math.min(height - 1, y));
  const index = (safeY * width + safeX) * 4;
  return luminance(data[index], data[index + 1], data[index + 2]);
}

function classifySurface(x: number, y: number, width: number, height: number, texture: number, sat: number): RoomSurfaceKind {
  const nx = x / width - 0.5;
  const ny = y / height;
  if (ny > 0.68) return "floor";
  if (Math.abs(nx) > 0.34 || ny < 0.38) return "wall";
  if (texture > 0.38 || sat > 0.28) return "object";
  return "wall";
}

function projectRoomPoint(
  x: number,
  y: number,
  width: number,
  height: number,
  pose: CameraPose,
  surface: RoomSurfaceKind,
  confidence: number,
) {
  const nx = (x / width - 0.5) * 2;
  const ny = y / height;
  const viewDepth = surface === "floor" ? 1.2 + ny * 3 : surface === "wall" ? 2.4 + Math.abs(nx) * 1.7 : 1.3 + confidence * 1.2;
  const localX = nx * (surface === "wall" ? 2.5 : 1.1 + viewDepth * 0.26);
  const localY = surface === "floor" ? -1.22 + (1 - ny) * 0.16 : -1.08 + (1 - ny) * 2.4;
  const localZ = -viewDepth;
  const cos = Math.cos(pose.yaw);
  const sin = Math.sin(pose.yaw);

  return {
    x: pose.x + localX * cos - localZ * sin,
    y: localY,
    z: pose.z + localX * sin + localZ * cos,
  };
}

export class RoomFrameProcessor {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly tracker = new MotionTracker();

  constructor() {
    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("2D canvas processing is not available in this browser.");
    }
    this.context = context;
  }

  reset() {
    this.tracker.reset();
  }

  processFrame(video: HTMLVideoElement, mode: RoomScanMode, frameIndex: number): RoomProcessedFrame {
    const settings = SETTINGS[mode];
    const hasVideo = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0;

    if (!hasVideo) {
      return this.emptyFrame(frameIndex);
    }

    if (this.canvas.width !== settings.width || this.canvas.height !== settings.height) {
      this.canvas.width = settings.width;
      this.canvas.height = settings.height;
      this.reset();
    }

    this.context.drawImage(video, 0, 0, settings.width, settings.height);
    const image = this.context.getImageData(0, 0, settings.width, settings.height);
    const data = image.data;
    const tracking = this.tracker.track(data, settings.width, settings.height, frameIndex, settings.maxFeatures);
    const points: RoomScanPoint[] = [];
    let brightnessTotal = 0;
    let sampleCount = 0;

    for (let y = 4; y < settings.height - 4; y += settings.step) {
      for (let x = 4; x < settings.width - 4; x += settings.step) {
        const index = (y * settings.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const light = luminance(r, g, b);
        const sat = saturation(r, g, b);
        const edge =
          Math.abs(light - sampleLuma(data, settings.width, settings.height, x + settings.step, y)) +
          Math.abs(light - sampleLuma(data, settings.width, settings.height, x, y + settings.step));
        const centerWeight = 1 - Math.min(1, Math.hypot(x / settings.width - 0.5, y / settings.height - 0.5) * 1.45);
        const texture = clamp(edge * 3.4 + sat * 0.7 + Math.abs(light - 0.5) * 0.22);
        const fallbackSurface = y > settings.height * 0.68 || x < settings.width * 0.16 || x > settings.width * 0.84;
        const patternedSample = ((x * 3 + y * 5 + frameIndex * 11) / settings.step) % 5 < 1;
        const include = texture > 0.22 || fallbackSurface || (centerWeight > 0.5 && patternedSample);

        sampleCount += 1;
        brightnessTotal += light;
        if (!include) continue;

        const surface = classifySurface(x, y, settings.width, settings.height, texture, sat);
        const confidence = clamp(texture * 0.76 + tracking.trackingScore * 0.22 + centerWeight * 0.18, 0.08, 1);
        const world = projectRoomPoint(x, y, settings.width, settings.height, tracking.pose, surface, confidence);

        points.push({
          ...world,
          r,
          g,
          b,
          confidence,
          frameIndex,
          size: mode === "full" ? 0.035 + confidence * 0.018 : 0.045 + confidence * 0.024,
          surface,
        });
      }
    }

    const limitedPoints = this.limitPoints(points, settings.maxPoints, frameIndex);
    const brightness = sampleCount > 0 ? brightnessTotal / sampleCount : 0;
    const warning =
      tracking.motion.magnitude > 7
        ? "Move device slowly"
        : tracking.trackingScore < 0.18
          ? "Scan textured walls or objects"
          : tracking.coverageScore < 0.28
            ? "Scan walls, floor, and objects"
            : undefined;

    return {
      frameIndex,
      timestamp: performance.now(),
      points: limitedPoints,
      features: tracking.features,
      trackedFeatureCount: tracking.trackedFeatureCount,
      pose: tracking.pose,
      motion: tracking.motion,
      coverage: tracking.coverage,
      quality: {
        trackingScore: tracking.trackingScore,
        coverageScore: tracking.coverageScore,
        motionMagnitude: tracking.motion.magnitude,
        brightness,
        warning,
      },
    };
  }

  private emptyFrame(frameIndex: number): RoomProcessedFrame {
    return {
      frameIndex,
      timestamp: performance.now(),
      points: [],
      features: [],
      trackedFeatureCount: 0,
      pose: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, confidence: 0 },
      motion: { dx: 0, dy: 0, rotation: 0, magnitude: 0, directionLabel: "Hold steady" },
      coverage: [],
      quality: {
        trackingScore: 0,
        coverageScore: 0,
        motionMagnitude: 0,
        brightness: 0,
        warning: "Move device slowly",
      },
    };
  }

  private limitPoints(points: RoomScanPoint[], maxPoints: number, frameIndex: number) {
    if (points.length <= maxPoints) return points;

    const stride = points.length / maxPoints;
    const limited: RoomScanPoint[] = [];
    for (let index = 0; index < maxPoints; index += 1) {
      const offset = Math.floor((index * 19 + frameIndex * 7) % Math.max(1, stride));
      limited.push(points[Math.min(points.length - 1, Math.floor(index * stride + offset))]);
    }
    return limited;
  }
}
