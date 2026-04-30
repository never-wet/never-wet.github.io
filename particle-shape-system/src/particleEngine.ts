export type ParticleMode = "idle" | "image" | "text";

type TargetPoint = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

const DEFAULT_PARTICLE_COUNT = 9000;
const DEFAULT_RADIUS = 130;
const GOLDEN_RATIO = 0.618033988749895;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeCanvas(width = 1, height = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export class ParticleEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sampleCanvas = makeCanvas();
  private readonly sampleCtx: CanvasRenderingContext2D;
  private readonly glowSprite = makeCanvas(44, 44);

  private width = 1;
  private height = 1;
  private dpr = 1;
  private count = DEFAULT_PARTICLE_COUNT;
  private mode: ParticleMode = "text";
  private pointerX = 0;
  private pointerY = 0;
  private pointerActive = false;
  private cursorRadius = DEFAULT_RADIUS;
  private frameId = 0;
  private previousTime = 0;
  private lastIdleRetarget = 0;
  private assignmentSeed = 0;
  private imageJob = 0;
  private resizeTimer = 0;

  private textValue = "NEVER WET";
  private lastImageFile: File | null = null;
  private activeTargets: TargetPoint[] = [];
  private textTargets: TargetPoint[] = [];
  private imageTargets: TargetPoint[] = [];

  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private tx = new Float32Array(0);
  private ty = new Float32Array(0);
  private cr = new Float32Array(0);
  private cg = new Float32Array(0);
  private cb = new Float32Array(0);
  private tr = new Float32Array(0);
  private tg = new Float32Array(0);
  private tb = new Float32Array(0);
  private alpha = new Float32Array(0);
  private targetAlpha = new Float32Array(0);
  private size = new Float32Array(0);
  private drift = new Float32Array(0);
  private state = new Uint8Array(0);

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    const sampleCtx = this.sampleCanvas.getContext("2d", { willReadFrequently: true });

    if (!ctx || !sampleCtx) {
      throw new Error("Canvas 2D is not available.");
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.sampleCtx = sampleCtx;
    this.buildGlowSprite();
    this.resize();
    this.allocateParticles(this.count);
    this.setText(this.textValue);
    this.setMode("text");

    window.addEventListener("resize", this.handleResize, { passive: true });
    window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", this.handlePointerLeave, { passive: true });
    window.addEventListener("blur", this.handlePointerLeave, { passive: true });
  }

  start() {
    if (this.frameId) return;
    this.previousTime = performance.now();
    this.paintBackground(true);
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  dispose() {
    if (this.frameId) {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }

    window.clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("blur", this.handlePointerLeave);
  }

  setMode(mode: ParticleMode) {
    this.mode = mode;
    this.refreshTargets();
  }

  setParticleCount(count: number) {
    const nextCount = Math.round(clamp(count, 2500, 16000));
    if (nextCount === this.count) return;

    this.count = nextCount;
    this.allocateParticles(nextCount);
    this.refreshTargets();
  }

  setCursorRadius(radius: number) {
    this.cursorRadius = clamp(radius, 40, 260);
  }

  setText(value: string) {
    this.textValue = value;
    this.textTargets = this.buildTextTargets(value);
    if (this.mode === "text") {
      this.applyTargetPoints(this.textTargets);
    }
  }

  async setImageFile(file: File) {
    this.lastImageFile = file;
    const job = ++this.imageJob;
    const targets = await this.buildImageTargets(file);

    if (job !== this.imageJob) return;

    this.imageTargets = targets;
    if (this.mode === "image") {
      this.applyTargetPoints(targets);
    }
  }

  reset(defaultText = "NEVER WET") {
    this.imageJob += 1;
    this.lastImageFile = null;
    this.imageTargets = [];
    this.textValue = defaultText;
    this.textTargets = this.buildTextTargets(defaultText);
    this.mode = "idle";
    this.scatterIdleTargets();
  }

  private handleResize = () => {
    this.resize();
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.textTargets = this.buildTextTargets(this.textValue);
      if (this.lastImageFile) {
        void this.setImageFile(this.lastImageFile);
      }
      this.refreshTargets();
    }, 120);
  };

  private handlePointerMove = (event: PointerEvent) => {
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.pointerActive = true;
  };

  private handlePointerLeave = () => {
    this.pointerActive = false;
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width || window.innerWidth));
    const nextHeight = Math.max(1, Math.round(rect.height || window.innerHeight));
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);

    if (nextWidth === this.width && nextHeight === this.height && nextDpr === this.dpr) return;

    this.width = nextWidth;
    this.height = nextHeight;
    this.dpr = nextDpr;
    this.canvas.width = Math.round(nextWidth * nextDpr);
    this.canvas.height = Math.round(nextHeight * nextDpr);
    this.ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    this.paintBackground(true);
  }

  private allocateParticles(nextCount: number) {
    const oldCount = this.x.length;
    const old = {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      cr: this.cr,
      cg: this.cg,
      cb: this.cb,
      alpha: this.alpha,
    };

    this.x = new Float32Array(nextCount);
    this.y = new Float32Array(nextCount);
    this.vx = new Float32Array(nextCount);
    this.vy = new Float32Array(nextCount);
    this.tx = new Float32Array(nextCount);
    this.ty = new Float32Array(nextCount);
    this.cr = new Float32Array(nextCount);
    this.cg = new Float32Array(nextCount);
    this.cb = new Float32Array(nextCount);
    this.tr = new Float32Array(nextCount);
    this.tg = new Float32Array(nextCount);
    this.tb = new Float32Array(nextCount);
    this.alpha = new Float32Array(nextCount);
    this.targetAlpha = new Float32Array(nextCount);
    this.size = new Float32Array(nextCount);
    this.drift = new Float32Array(nextCount);
    this.state = new Uint8Array(nextCount);

    for (let i = 0; i < nextCount; i += 1) {
      if (i < oldCount) {
        this.x[i] = old.x[i];
        this.y[i] = old.y[i];
        this.vx[i] = old.vx[i];
        this.vy[i] = old.vy[i];
        this.cr[i] = old.cr[i];
        this.cg[i] = old.cg[i];
        this.cb[i] = old.cb[i];
        this.alpha[i] = old.alpha[i];
      } else {
        this.x[i] = randomRange(0, this.width);
        this.y[i] = randomRange(0, this.height);
        this.vx[i] = randomRange(-0.4, 0.4);
        this.vy[i] = randomRange(-0.4, 0.4);
        this.cr[i] = randomRange(180, 245);
        this.cg[i] = randomRange(205, 245);
        this.cb[i] = randomRange(220, 255);
        this.alpha[i] = randomRange(0.42, 0.95);
      }

      this.tr[i] = this.cr[i];
      this.tg[i] = this.cg[i];
      this.tb[i] = this.cb[i];
      this.targetAlpha[i] = randomRange(0.42, 0.95);
      this.size[i] = randomRange(0.55, 1.45);
      this.drift[i] = randomRange(0, Math.PI * 2);
      this.state[i] = 0;
    }
  }

  private refreshTargets() {
    if (this.mode === "text") {
      this.applyTargetPoints(this.textTargets);
      return;
    }

    if (this.mode === "image") {
      this.applyTargetPoints(this.imageTargets);
      return;
    }

    this.scatterIdleTargets();
  }

  private applyTargetPoints(points: TargetPoint[]) {
    this.activeTargets = points;

    if (!points.length) {
      this.scatterIdleTargets();
      return;
    }

    this.assignmentSeed = (this.assignmentSeed + 0.137) % 1;
    const pointCount = points.length;
    const spread = pointCount < this.count ? 0.85 : 0.45;

    for (let i = 0; i < this.count; i += 1) {
      const normalized = (i * GOLDEN_RATIO + this.assignmentSeed) % 1;
      const point = points[Math.floor(normalized * pointCount)];
      const jitterX = randomRange(-spread, spread);
      const jitterY = randomRange(-spread, spread);

      this.tx[i] = point.x + jitterX;
      this.ty[i] = point.y + jitterY;
      this.tr[i] = point.r;
      this.tg[i] = point.g;
      this.tb[i] = point.b;
      this.targetAlpha[i] = clamp(point.a / 255, 0.42, 1);
      this.state[i] = 1;
    }
  }

  private scatterIdleTargets() {
    this.activeTargets = [];

    for (let i = 0; i < this.count; i += 1) {
      this.tx[i] = randomRange(this.width * -0.04, this.width * 1.04);
      this.ty[i] = randomRange(this.height * 0.08, this.height * 0.94);
      this.tr[i] = randomRange(198, 255);
      this.tg[i] = randomRange(218, 252);
      this.tb[i] = randomRange(218, 255);
      this.targetAlpha[i] = randomRange(0.32, 0.78);
      this.state[i] = 0;
    }
  }

  private buildTextTargets(value: string): TargetPoint[] {
    const text = value.trim();
    if (!text) return [];

    const maxWidth = clamp(Math.round(this.width * 0.78), 360, 1320);
    const maxHeight = clamp(Math.round(this.height * 0.52), 220, 680);
    this.sampleCanvas.width = maxWidth;
    this.sampleCanvas.height = maxHeight;
    this.sampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.sampleCtx.clearRect(0, 0, maxWidth, maxHeight);

    let fontSize = clamp(maxWidth / Math.max(4, Math.min(text.length * 0.52, 12)), 62, 220);
    let lines: string[] = [text];
    let lineHeight = fontSize * 1.04;

    for (let attempt = 0; attempt < 28; attempt += 1) {
      this.sampleCtx.font = `800 ${fontSize}px "Space Grotesk", "Inter", system-ui, sans-serif`;
      lines = this.wrapText(text, maxWidth * 0.9, 4);
      lineHeight = fontSize * 1.04;
      const widest = lines.reduce((max, line) => Math.max(max, this.sampleCtx.measureText(line).width), 0);
      const totalHeight = lines.length * lineHeight;

      if (widest <= maxWidth * 0.92 && totalHeight <= maxHeight * 0.78) {
        break;
      }

      fontSize *= 0.9;
    }

    this.sampleCtx.clearRect(0, 0, maxWidth, maxHeight);
    this.sampleCtx.textAlign = "center";
    this.sampleCtx.textBaseline = "middle";
    this.sampleCtx.font = `800 ${fontSize}px "Space Grotesk", "Inter", system-ui, sans-serif`;
    this.sampleCtx.fillStyle = "rgba(255, 255, 255, 1)";

    const totalHeight = (lines.length - 1) * lineHeight;
    const centerY = maxHeight / 2;
    lines.forEach((line, index) => {
      const y = centerY - totalHeight / 2 + index * lineHeight;
      this.sampleCtx.fillText(line, maxWidth / 2, y);
    });

    const originX = (this.width - maxWidth) / 2;
    const originY = this.height * 0.52 - maxHeight / 2;
    return this.extractTargets(maxWidth, maxHeight, originX, originY, "text");
  }

  private wrapText(text: string, maxWidth: number, maxLines: number) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (this.sampleCtx.measureText(next).width <= maxWidth || !current) {
        current = next;
        continue;
      }

      lines.push(current);
      current = word;

      if (lines.length === maxLines - 1) {
        break;
      }
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
    }

    return lines.length ? lines : [text];
  }

  private async buildImageTargets(file: File): Promise<TargetPoint[]> {
    const loaded = await this.loadImage(file);
    const maxWidth = clamp(Math.round(this.width * 0.72), 340, 1080);
    const maxHeight = clamp(Math.round(this.height * 0.58), 260, 720);
    const scale = Math.min(maxWidth / loaded.width, maxHeight / loaded.height, 1);
    const drawWidth = Math.max(1, Math.round(loaded.width * scale));
    const drawHeight = Math.max(1, Math.round(loaded.height * scale));

    this.sampleCanvas.width = drawWidth;
    this.sampleCanvas.height = drawHeight;
    this.sampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.sampleCtx.clearRect(0, 0, drawWidth, drawHeight);
    this.sampleCtx.drawImage(loaded.source, 0, 0, drawWidth, drawHeight);
    loaded.cleanup();

    const originX = (this.width - drawWidth) / 2;
    const originY = this.height * 0.52 - drawHeight / 2;
    return this.extractTargets(drawWidth, drawHeight, originX, originY, "image");
  }

  private async loadImage(file: File): Promise<LoadedImage> {
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  }

  private extractTargets(
    sourceWidth: number,
    sourceHeight: number,
    originX: number,
    originY: number,
    source: "image" | "text",
  ): TargetPoint[] {
    const data = this.sampleCtx.getImageData(0, 0, sourceWidth, sourceHeight).data;
    const desiredTargets = clamp(this.count * 2.1, 9000, 30000);
    const step = Math.max(1, Math.floor(Math.sqrt((sourceWidth * sourceHeight) / desiredTargets)));
    const points: TargetPoint[] = [];

    for (let y = 0; y < sourceHeight; y += step) {
      for (let x = 0; x < sourceWidth; x += step) {
        const index = (y * sourceWidth + x) * 4;
        const alpha = data[index + 3];
        if (alpha < 36) continue;

        if (source === "image") {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

          points.push({
            x: originX + x,
            y: originY + y,
            r: clamp(r * 0.82 + 44, 36, 255),
            g: clamp(g * 0.84 + 38, 36, 255),
            b: clamp(b * 0.9 + 36, 36, 255),
            a: clamp(alpha * (0.58 + luminance * 0.42), 110, 255),
          });
        } else {
          const mixX = x / Math.max(1, sourceWidth);
          const mixY = y / Math.max(1, sourceHeight);

          points.push({
            x: originX + x,
            y: originY + y,
            r: 220 + mixX * 25,
            g: 232 - mixY * 18,
            b: 242 - mixX * 22,
            a: clamp(alpha * 0.9, 120, 255),
          });
        }
      }
    }

    if (points.length <= this.count * 1.4) {
      return points;
    }

    const sampled: TargetPoint[] = [];
    const stride = points.length / Math.min(points.length, Math.round(this.count * 1.4));
    for (let i = 0; i < points.length; i += stride) {
      sampled.push(points[Math.floor(i)]);
    }

    return sampled;
  }

  private animate = (now: number) => {
    const delta = now - this.previousTime;
    this.previousTime = now;
    const step = clamp(delta / 16.67, 0.45, 2.1);
    const hasShape = this.mode !== "idle" && this.activeTargets.length > 0;

    if (!hasShape && now - this.lastIdleRetarget > 1050) {
      this.lastIdleRetarget = now;
      this.scatterIdleTargets();
    }

    this.updateParticles(step, now, hasShape);
    this.renderParticles(hasShape);
    this.frameId = window.requestAnimationFrame(this.animate);
  };

  private updateParticles(step: number, now: number, hasShape: boolean) {
    const attraction = hasShape ? 0.026 : 0.0065;
    const damping = hasShape ? 0.865 : 0.93;
    const radius = this.cursorRadius;
    const radiusSq = radius * radius;
    const pointerActive = this.pointerActive;
    const px = this.pointerX;
    const py = this.pointerY;
    const colorEase = hasShape ? 0.055 : 0.025;

    for (let i = 0; i < this.count; i += 1) {
      let vx = this.vx[i];
      let vy = this.vy[i];
      const x = this.x[i];
      const y = this.y[i];

      vx += (this.tx[i] - x) * attraction * step;
      vy += (this.ty[i] - y) * attraction * step;

      if (!hasShape) {
        const wave = Math.sin(now * 0.00042 + this.drift[i]) * 0.012;
        vx += Math.cos(this.drift[i] + now * 0.00017) * wave * step;
        vy += Math.sin(this.drift[i] + now * 0.00021) * wave * step;
      }

      if (pointerActive) {
        const dx = x - px;
        const dy = y - py;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0.01 && distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / radius) ** 2;
          const push = hasShape ? 3.7 : 2.6;
          vx += (dx / dist) * force * push * step;
          vy += (dy / dist) * force * push * step;
          this.state[i] = 2;
        } else {
          this.state[i] = hasShape ? 1 : 0;
        }
      } else {
        this.state[i] = hasShape ? 1 : 0;
      }

      vx *= Math.pow(damping, step);
      vy *= Math.pow(damping, step);
      this.vx[i] = vx;
      this.vy[i] = vy;
      this.x[i] = x + vx * step;
      this.y[i] = y + vy * step;

      this.cr[i] += (this.tr[i] - this.cr[i]) * colorEase * step;
      this.cg[i] += (this.tg[i] - this.cg[i]) * colorEase * step;
      this.cb[i] += (this.tb[i] - this.cb[i]) * colorEase * step;
      this.alpha[i] += (this.targetAlpha[i] - this.alpha[i]) * 0.04 * step;
    }
  }

  private renderParticles(hasShape: boolean) {
    this.paintBackground(false);
    const ctx = this.ctx;
    const glowCadence = this.count > 12000 ? 4 : this.count > 8000 ? 3 : 2;

    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;

    for (let i = 0; i < this.count; i += 1) {
      const x = this.x[i];
      const y = this.y[i];

      if (x < -24 || x > this.width + 24 || y < -24 || y > this.height + 24) {
        continue;
      }

      const interacting = this.state[i] === 2;
      const baseSize = this.size[i] * (interacting ? 1.55 : hasShape ? 1.08 : 0.9);
      const alpha = clamp(this.alpha[i] * (interacting ? 1 : 0.82), 0.08, 1);
      const r = Math.round(this.cr[i]);
      const g = Math.round(this.cg[i]);
      const b = Math.round(this.cb[i]);

      if (i % glowCadence === 0) {
        const glowSize = baseSize * (interacting ? 12 : 8);
        ctx.globalAlpha = alpha * (interacting ? 0.32 : 0.18);
        ctx.drawImage(this.glowSprite, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${r} ${g} ${b})`;
      ctx.beginPath();
      ctx.arc(x, y, baseSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private paintBackground(clear: boolean) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = clear ? "#080808" : "rgba(8, 8, 8, 0.28)";
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private buildGlowSprite() {
    const ctx = this.glowSprite.getContext("2d");
    if (!ctx) return;

    const center = this.glowSprite.width / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.22, "rgba(210,236,255,0.42)");
    gradient.addColorStop(0.62, "rgba(255,188,154,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.glowSprite.width, this.glowSprite.height);
  }
}
