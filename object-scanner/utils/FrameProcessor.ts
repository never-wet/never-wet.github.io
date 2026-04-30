export type ScanMode = "quick" | "detail";

export type RawScanPoint = {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  confidence: number;
  frameIndex: number;
  size: number;
};

export type FrameQuality = {
  objectScore: number;
  maskCoverage: number;
  edgeScore: number;
  brightness: number;
  warning?: string;
};

export type ProcessedFrame = {
  frameIndex: number;
  timestamp: number;
  points: RawScanPoint[];
  quality: FrameQuality;
};

type ModeSettings = {
  width: number;
  height: number;
  step: number;
  maxPoints: number;
  backgroundBlend: number;
};

const SETTINGS: Record<ScanMode, ModeSettings> = {
  quick: {
    width: 136,
    height: 102,
    step: 5,
    maxPoints: 280,
    backgroundBlend: 0.026,
  },
  detail: {
    width: 184,
    height: 138,
    step: 4,
    maxPoints: 620,
    backgroundBlend: 0.018,
  },
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function luminance(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getSaturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max <= 0 ? 0 : (max - min) / max;
}

export class FrameProcessor {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private background: Float32Array | null = null;
  private backgroundSize = "";

  constructor() {
    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("2D canvas processing is not available in this browser.");
    }
    this.context = context;
  }

  reset() {
    this.background = null;
    this.backgroundSize = "";
  }

  processFrame(video: HTMLVideoElement, mode: ScanMode, frameIndex: number): ProcessedFrame {
    const settings = SETTINGS[mode];
    const hasVideo = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0;

    if (!hasVideo) {
      return {
        frameIndex,
        timestamp: performance.now(),
        points: [],
        quality: {
          objectScore: 0,
          maskCoverage: 0,
          edgeScore: 0,
          brightness: 0,
          warning: "Move object closer / improve lighting",
        },
      };
    }

    if (this.canvas.width !== settings.width || this.canvas.height !== settings.height) {
      this.canvas.width = settings.width;
      this.canvas.height = settings.height;
      this.reset();
    }

    this.context.drawImage(video, 0, 0, settings.width, settings.height);
    const image = this.context.getImageData(0, 0, settings.width, settings.height);
    const data = image.data;
    const sizeKey = `${settings.width}x${settings.height}`;

    if (!this.background || this.backgroundSize !== sizeKey) {
      this.background = new Float32Array(data.length);
      for (let index = 0; index < data.length; index += 1) {
        this.background[index] = data[index];
      }
      this.backgroundSize = sizeKey;
    }

    const points: RawScanPoint[] = [];
    const left = Math.floor(settings.width * 0.16);
    const right = Math.floor(settings.width * 0.84);
    const top = Math.floor(settings.height * 0.12);
    const bottom = Math.floor(settings.height * 0.88);
    const cx = settings.width * 0.5;
    const cy = settings.height * 0.5;
    const guideRadius = Math.min(settings.width, settings.height) * 0.42;
    let objectPixels = 0;
    let totalPixels = 0;
    let edgeTotal = 0;
    let objectTotal = 0;
    let brightnessTotal = 0;

    for (let y = top; y < bottom; y += settings.step) {
      for (let x = left; x < right; x += settings.step) {
        const index = (y * settings.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const light = luminance(r, g, b);
        const saturation = getSaturation(r, g, b);
        const bg = this.background;
        const colorDelta =
          (Math.abs(r - bg[index]) + Math.abs(g - bg[index + 1]) + Math.abs(b - bg[index + 2])) / 3;

        const rightIndex = (y * settings.width + Math.min(x + settings.step, settings.width - 1)) * 4;
        const downIndex = (Math.min(y + settings.step, settings.height - 1) * settings.width + x) * 4;
        const edge =
          Math.abs(luminance(r, g, b) - luminance(data[rightIndex], data[rightIndex + 1], data[rightIndex + 2])) +
          Math.abs(luminance(r, g, b) - luminance(data[downIndex], data[downIndex + 1], data[downIndex + 2]));

        const centerDistance = Math.hypot((x - cx) / guideRadius, (y - cy) / guideRadius);
        const centerWeight = clamp(1 - centerDistance);
        const colorSignal = saturation * 1.25 + Math.abs(light - 0.5) * 0.24;
        const motionSignal = clamp(colorDelta / 68);
        const edgeSignal = clamp(edge * 4.1);
        const objectness = clamp(centerWeight * 0.42 + motionSignal * 0.34 + edgeSignal * 0.28 + colorSignal * 0.26);
        const fallbackSample = centerWeight > 0.58 && ((x + y + frameIndex * 7) / settings.step) % 4 < 1;
        const isObject = objectness > 0.48 || fallbackSample;

        totalPixels += 1;
        edgeTotal += edgeSignal;
        brightnessTotal += light;

        if (!isObject) continue;

        objectPixels += 1;
        objectTotal += objectness;

        const nx = ((x / settings.width) - 0.5) * 2;
        const ny = -((y / settings.height) - 0.5) * 2;
        const microMotion = Math.sin(frameIndex * 0.54 + x * 0.19 + y * 0.11) * 0.08;
        const depth = clamp(0.48 + centerWeight * 0.26 + edgeSignal * 0.2 + motionSignal * 0.16 - light * 0.08 + microMotion);
        const confidence = clamp(objectness * 0.92 + centerWeight * 0.18, 0.08, 1);

        points.push({
          x: nx,
          y: ny,
          z: depth * 2 - 1,
          r,
          g,
          b,
          confidence,
          frameIndex,
          size: mode === "detail" ? 0.022 + confidence * 0.014 : 0.026 + confidence * 0.018,
        });
      }
    }

    this.updateBackground(data, settings.backgroundBlend);

    const thinnedPoints = this.limitPoints(points, settings.maxPoints, frameIndex);
    const maskCoverage = totalPixels > 0 ? objectPixels / totalPixels : 0;
    const objectScore = objectPixels > 0 ? clamp(objectTotal / objectPixels) : 0;
    const edgeScore = totalPixels > 0 ? clamp(edgeTotal / totalPixels) : 0;
    const brightness = totalPixels > 0 ? clamp(brightnessTotal / totalPixels) : 0;
    const warning = maskCoverage < 0.08 || objectScore < 0.32 ? "Move object closer / improve lighting" : undefined;

    return {
      frameIndex,
      timestamp: performance.now(),
      points: thinnedPoints,
      quality: {
        objectScore,
        maskCoverage,
        edgeScore,
        brightness,
        warning,
      },
    };
  }

  private updateBackground(data: Uint8ClampedArray, alpha: number) {
    if (!this.background) return;

    for (let index = 0; index < data.length; index += 4) {
      this.background[index] = this.background[index] * (1 - alpha) + data[index] * alpha;
      this.background[index + 1] = this.background[index + 1] * (1 - alpha) + data[index + 1] * alpha;
      this.background[index + 2] = this.background[index + 2] * (1 - alpha) + data[index + 2] * alpha;
      this.background[index + 3] = 255;
    }
  }

  private limitPoints(points: RawScanPoint[], maxPoints: number, frameIndex: number) {
    if (points.length <= maxPoints) return points;

    const stride = points.length / maxPoints;
    const limited: RawScanPoint[] = [];
    for (let index = 0; index < maxPoints; index += 1) {
      const offset = Math.floor((index * 17 + frameIndex * 13) % Math.max(1, stride));
      limited.push(points[Math.min(points.length - 1, Math.floor(index * stride + offset))]);
    }
    return limited;
  }
}
