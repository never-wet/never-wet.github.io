export type ParticleMode = "idle" | "image" | "text";

type TargetPoint = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
  group: number;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

type TextGlyph = {
  char: string;
  index: number;
  width: number;
};

type TextLine = {
  glyphs: TextGlyph[];
  width: number;
};

const DEFAULT_PARTICLE_COUNT = 8000;
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
  private readonly gl: WebGLRenderingContext;
  private readonly sampleCanvas = makeCanvas();
  private readonly sampleCtx: CanvasRenderingContext2D;
  private readonly program: WebGLProgram;
  private readonly positionBuffer: WebGLBuffer;
  private readonly colorBuffer: WebGLBuffer;
  private readonly sizeBuffer: WebGLBuffer;
  private readonly aPosition: number;
  private readonly aColor: number;
  private readonly aSize: number;
  private readonly uResolution: WebGLUniformLocation;
  private readonly uDpr: WebGLUniformLocation;

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
  private pop = new Float32Array(0);
  private state = new Uint8Array(0);
  private assignedGroup = new Int32Array(0);
  private renderPositions = new Float32Array(0);
  private renderColors = new Float32Array(0);
  private renderSizes = new Float32Array(0);

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    const sampleCtx = this.sampleCanvas.getContext("2d", { willReadFrequently: true });

    if (!gl || !sampleCtx) {
      throw new Error("WebGL and Canvas 2D are required for the particle system.");
    }

    this.canvas = canvas;
    this.gl = gl;
    this.sampleCtx = sampleCtx;
    this.program = this.createProgram();
    this.positionBuffer = this.createBuffer();
    this.colorBuffer = this.createBuffer();
    this.sizeBuffer = this.createBuffer();
    this.aPosition = gl.getAttribLocation(this.program, "a_position");
    this.aColor = gl.getAttribLocation(this.program, "a_color");
    this.aSize = gl.getAttribLocation(this.program, "a_size");

    const resolution = gl.getUniformLocation(this.program, "u_resolution");
    const dpr = gl.getUniformLocation(this.program, "u_dpr");

    if (!resolution || !dpr) {
      throw new Error("Particle shader uniforms could not be created.");
    }

    this.uResolution = resolution;
    this.uDpr = dpr;
    this.configureWebGL();
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
    const nextCount = Math.round(clamp(count, 2000, 14000));
    if (nextCount === this.count) return;

    this.count = nextCount;
    this.allocateParticles(nextCount);
    this.refreshTargets();
  }

  setCursorRadius(radius: number) {
    this.cursorRadius = clamp(radius, 40, 260);
  }

  setText(value: string) {
    const previousText = this.textValue;
    const previousLength = Array.from(previousText).length;
    const nextLength = Array.from(value).length;
    const appendedStart = value.startsWith(previousText) && nextLength > previousLength ? previousLength : null;

    this.textValue = value;
    this.textTargets = this.buildTextTargets(value);

    if (this.mode === "text") {
      this.applyTextTargets(this.textTargets, appendedStart);
    }
  }

  async setImageFile(file: File) {
    this.lastImageFile = file;
    const job = ++this.imageJob;
    const targets = await this.buildImageTargets(file);

    if (job !== this.imageJob) return;

    this.imageTargets = targets;
    if (this.mode === "image") {
      this.applyImageTargets(targets);
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

  private configureWebGL() {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.031, 0.031, 0.031, 1);
  }

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
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uResolution, this.width, this.height);
    this.gl.uniform1f(this.uDpr, this.dpr);
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
      assignedGroup: this.assignedGroup,
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
    this.pop = new Float32Array(nextCount);
    this.state = new Uint8Array(nextCount);
    this.assignedGroup = new Int32Array(nextCount);
    this.assignedGroup.fill(-1);
    this.renderPositions = new Float32Array(nextCount * 2);
    this.renderColors = new Float32Array(nextCount * 4);
    this.renderSizes = new Float32Array(nextCount);

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
        this.assignedGroup[i] = old.assignedGroup[i] ?? -1;
      } else {
        this.x[i] = randomRange(0, this.width);
        this.y[i] = randomRange(0, this.height);
        this.vx[i] = randomRange(-0.4, 0.4);
        this.vy[i] = randomRange(-0.4, 0.4);
        this.cr[i] = randomRange(180, 245);
        this.cg[i] = randomRange(205, 245);
        this.cb[i] = randomRange(220, 255);
        this.alpha[i] = randomRange(0.34, 0.82);
      }

      this.tr[i] = this.cr[i];
      this.tg[i] = this.cg[i];
      this.tb[i] = this.cb[i];
      this.targetAlpha[i] = randomRange(0.36, 0.88);
      this.size[i] = randomRange(0.68, 1.32);
      this.drift[i] = randomRange(0, Math.PI * 2);
      this.pop[i] = 0;
      this.state[i] = 0;
    }

    this.allocateGpuBuffers();
  }

  private allocateGpuBuffers() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.renderPositions.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.renderColors.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.renderSizes.byteLength, gl.DYNAMIC_DRAW);
  }

  private refreshTargets() {
    if (this.mode === "text") {
      this.applyTextTargets(this.textTargets, null);
      return;
    }

    if (this.mode === "image") {
      this.applyImageTargets(this.imageTargets);
      return;
    }

    this.scatterIdleTargets();
  }

  private applyImageTargets(points: TargetPoint[]) {
    this.activeTargets = points;

    if (!points.length) {
      this.scatterIdleTargets();
      return;
    }

    this.assignmentSeed = (this.assignmentSeed + 0.137) % 1;
    const pointCount = points.length;

    for (let i = 0; i < this.count; i += 1) {
      const normalized = (i * GOLDEN_RATIO + this.assignmentSeed) % 1;
      const point = points[Math.floor(normalized * pointCount)];
      const spread = pointCount < this.count ? 0.8 : 0.35;

      this.tx[i] = point.x + randomRange(-spread, spread);
      this.ty[i] = point.y + randomRange(-spread, spread);
      this.tr[i] = point.r;
      this.tg[i] = point.g;
      this.tb[i] = point.b;
      this.targetAlpha[i] = clamp(point.a / 255, 0.36, 1);
      this.assignedGroup[i] = -1;
      this.pop[i] *= 0.4;
      this.state[i] = 1;
    }
  }

  private applyTextTargets(points: TargetPoint[], appendedStart: number | null) {
    this.activeTargets = points;

    if (!points.length) {
      this.scatterIdleTargets();
      return;
    }

    const pointCount = points.length;
    const groupCount = Math.max(1, Array.from(this.textValue).length);

    for (let i = 0; i < this.count; i += 1) {
      const targetIndex = Math.min(pointCount - 1, Math.floor(((i + 0.5) / this.count) * pointCount));
      const point = points[targetIndex];
      const previousGroup = this.assignedGroup[i];
      const isFreshGlyph =
        appendedStart !== null && point.group >= appendedStart && previousGroup !== point.group;
      const groupMix = groupCount <= 1 ? 0 : point.group / Math.max(1, groupCount - 1);

      this.tx[i] = point.x;
      this.ty[i] = point.y;
      this.tr[i] = 218 + groupMix * 26;
      this.tg[i] = 235 - groupMix * 12;
      this.tb[i] = 244 - groupMix * 22;
      this.targetAlpha[i] = clamp(point.a / 255, 0.4, 1);
      this.assignedGroup[i] = point.group;
      this.state[i] = 1;

      if (isFreshGlyph) {
        const angle = randomRange(0, Math.PI * 2);
        const lift = randomRange(22, 74);
        this.x[i] = point.x + Math.cos(angle) * randomRange(4, 18);
        this.y[i] = point.y + lift + Math.sin(angle) * randomRange(3, 12);
        this.vx[i] = randomRange(-0.8, 0.8);
        this.vy[i] = randomRange(-1.8, -0.35);
        this.alpha[i] = 0;
        this.pop[i] = randomRange(0.82, 1.18);
      }
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
      this.targetAlpha[i] = randomRange(0.24, 0.62);
      this.assignedGroup[i] = -1;
      this.state[i] = 0;
    }
  }

  private buildTextTargets(value: string): TargetPoint[] {
    const chars = Array.from(value);
    if (!chars.some((char) => char.trim())) return [];

    const maxWidth = clamp(Math.round(this.width * 0.78), 340, 1320);
    const maxHeight = clamp(Math.round(this.height * 0.54), 220, 700);
    const visibleLength = Math.max(1, chars.filter((char) => char.trim()).length);
    let fontSize = clamp(maxWidth / Math.max(4, Math.min(visibleLength * 0.52, 12)), 54, 210);
    let lineHeight = fontSize * 1.06;
    let lines: TextLine[] = [];

    this.sampleCanvas.width = maxWidth;
    this.sampleCanvas.height = maxHeight;
    this.sampleCtx.setTransform(1, 0, 0, 1, 0, 0);

    for (let attempt = 0; attempt < 32; attempt += 1) {
      this.sampleCtx.font = `800 ${fontSize}px "Space Grotesk", "Inter", system-ui, sans-serif`;
      lines = this.layoutText(chars, maxWidth * 0.9, 4);
      lineHeight = fontSize * 1.06;
      const widest = lines.reduce((max, line) => Math.max(max, line.width), 0);
      const totalHeight = lines.length * lineHeight;

      if (widest <= maxWidth * 0.92 && totalHeight <= maxHeight * 0.82) {
        break;
      }

      fontSize *= 0.9;
    }

    this.sampleCtx.font = `800 ${fontSize}px "Space Grotesk", "Inter", system-ui, sans-serif`;
    this.sampleCtx.textAlign = "left";
    this.sampleCtx.textBaseline = "middle";
    this.sampleCtx.fillStyle = "rgba(255, 255, 255, 1)";

    const originX = (this.width - maxWidth) / 2;
    const originY = this.height * 0.52 - maxHeight / 2;
    const totalHeight = (lines.length - 1) * lineHeight;
    const desiredTargets = clamp(this.count * 1.45, 5000, 24000);
    const step = Math.max(1, Math.floor(Math.sqrt((maxWidth * maxHeight) / desiredTargets)));
    const points: TargetPoint[] = [];

    lines.forEach((line, lineIndex) => {
      let cursorX = maxWidth / 2 - line.width / 2;
      const y = maxHeight / 2 - totalHeight / 2 + lineIndex * lineHeight;

      for (const glyph of line.glyphs) {
        if (!glyph.char.trim()) {
          cursorX += glyph.width;
          continue;
        }

        this.sampleCtx.clearRect(0, 0, maxWidth, maxHeight);
        this.sampleCtx.fillText(glyph.char, cursorX, y);

        const padding = fontSize * 0.12;
        const boxLeft = Math.max(0, Math.floor(cursorX - padding));
        const boxTop = Math.max(0, Math.floor(y - fontSize * 0.72));
        const boxRight = Math.min(maxWidth, Math.ceil(cursorX + glyph.width + padding));
        const boxBottom = Math.min(maxHeight, Math.ceil(y + fontSize * 0.72));
        const boxWidth = Math.max(1, boxRight - boxLeft);
        const boxHeight = Math.max(1, boxBottom - boxTop);
        const data = this.sampleCtx.getImageData(boxLeft, boxTop, boxWidth, boxHeight).data;

        for (let py = 0; py < boxHeight; py += step) {
          for (let px = 0; px < boxWidth; px += step) {
            const index = (py * boxWidth + px) * 4;
            const alpha = data[index + 3];
            if (alpha < 42) continue;

            points.push({
              x: originX + boxLeft + px,
              y: originY + boxTop + py,
              r: 230,
              g: 236,
              b: 242,
              a: clamp(alpha * 0.94, 120, 255),
              group: glyph.index,
            });
          }
        }

        cursorX += glyph.width;
      }
    });

    return points;
  }

  private layoutText(chars: string[], maxWidth: number, maxLines: number): TextLine[] {
    const lines: TextLine[] = [];
    let glyphs: TextGlyph[] = [];
    let width = 0;

    const pushLine = () => {
      lines.push({ glyphs, width });
      glyphs = [];
      width = 0;
    };

    chars.forEach((char, index) => {
      if (char === "\n") {
        pushLine();
        return;
      }

      const measured = this.sampleCtx.measureText(char).width;
      const glyphWidth = char.trim() ? Math.max(1, measured) : Math.max(measured, this.sampleCtx.measureText("n").width * 0.42);

      if (glyphs.length && width + glyphWidth > maxWidth && lines.length < maxLines - 1) {
        pushLine();
      }

      glyphs.push({ char, index, width: glyphWidth });
      width += glyphWidth;
    });

    if (glyphs.length || !lines.length) {
      pushLine();
    }

    return lines;
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
    return this.extractImageTargets(drawWidth, drawHeight, originX, originY);
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

  private extractImageTargets(sourceWidth: number, sourceHeight: number, originX: number, originY: number): TargetPoint[] {
    const data = this.sampleCtx.getImageData(0, 0, sourceWidth, sourceHeight).data;
    const desiredTargets = clamp(this.count * 1.75, 7000, 26000);
    const step = Math.max(1, Math.floor(Math.sqrt((sourceWidth * sourceHeight) / desiredTargets)));
    const points: TargetPoint[] = [];

    for (let y = 0; y < sourceHeight; y += step) {
      for (let x = 0; x < sourceWidth; x += step) {
        const index = (y * sourceWidth + x) * 4;
        const alpha = data[index + 3];
        if (alpha < 36) continue;

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
          a: clamp(alpha * (0.58 + luminance * 0.42), 100, 255),
          group: -1,
        });
      }
    }

    if (points.length <= this.count * 1.35) {
      return points;
    }

    const sampled: TargetPoint[] = [];
    const stride = points.length / Math.min(points.length, Math.round(this.count * 1.35));
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

    if (!hasShape && now - this.lastIdleRetarget > 1150) {
      this.lastIdleRetarget = now;
      this.scatterIdleTargets();
    }

    this.updateParticles(step, now, hasShape);
    this.renderParticles(hasShape);
    this.frameId = window.requestAnimationFrame(this.animate);
  };

  private updateParticles(step: number, now: number, hasShape: boolean) {
    const attraction = hasShape ? 0.028 : 0.0062;
    const damping = hasShape ? 0.865 : 0.93;
    const radius = this.cursorRadius;
    const radiusSq = radius * radius;
    const pointerActive = this.pointerActive;
    const px = this.pointerX;
    const py = this.pointerY;
    const colorEase = hasShape ? 0.065 : 0.025;

    for (let i = 0; i < this.count; i += 1) {
      let vx = this.vx[i];
      let vy = this.vy[i];
      const x = this.x[i];
      const y = this.y[i];
      let targetX = this.tx[i];
      let targetY = this.ty[i];
      const pop = this.pop[i];

      if (pop > 0.001) {
        const phase = this.drift[i] + now * 0.018;
        targetX += Math.sin(phase) * pop * 7.5;
        targetY += Math.cos(phase * 1.16) * pop * 5.5 - Math.sin(pop * Math.PI) * 7.5;
        this.pop[i] = Math.max(0, pop - 0.022 * step);
      }

      vx += (targetX - x) * attraction * step;
      vy += (targetY - y) * attraction * step;

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
          const push = hasShape ? 3.85 : 2.5;
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
      this.alpha[i] += (this.targetAlpha[i] - this.alpha[i]) * 0.05 * step;
    }
  }

  private renderParticles(hasShape: boolean) {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < this.count; i += 1) {
      const positionIndex = i * 2;
      const colorIndex = i * 4;
      const interacting = this.state[i] === 2;
      const pop = this.pop[i];
      const alpha = clamp(this.alpha[i] * (interacting ? 1 : hasShape ? 0.82 : 0.62) + pop * 0.12, 0.04, 1);
      const baseSize = this.size[i] * (hasShape ? 6.4 : 5.2);

      this.renderPositions[positionIndex] = this.x[i];
      this.renderPositions[positionIndex + 1] = this.y[i];
      this.renderColors[colorIndex] = this.cr[i] / 255;
      this.renderColors[colorIndex + 1] = this.cg[i] / 255;
      this.renderColors[colorIndex + 2] = this.cb[i] / 255;
      this.renderColors[colorIndex + 3] = alpha;
      this.renderSizes[i] = baseSize + (interacting ? 5.2 : 0) + pop * 12;
    }

    gl.useProgram(this.program);
    gl.uniform2f(this.uResolution, this.width, this.height);
    gl.uniform1f(this.uDpr, this.dpr);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.renderPositions);
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.renderColors);
    gl.enableVertexAttribArray(this.aColor);
    gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.renderSizes);
    gl.enableVertexAttribArray(this.aSize);
    gl.vertexAttribPointer(this.aSize, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  private createProgram() {
    const gl = this.gl;
    const vertexShader = this.createShader(
      gl.VERTEX_SHADER,
      `
        attribute vec2 a_position;
        attribute vec4 a_color;
        attribute float a_size;
        uniform vec2 u_resolution;
        uniform float u_dpr;
        varying vec4 v_color;

        void main() {
          vec2 zeroToOne = a_position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;
          gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
          gl_PointSize = max(1.0, a_size * u_dpr);
          v_color = a_color;
        }
      `,
    );
    const fragmentShader = this.createShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        varying vec4 v_color;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float distanceFromCenter = length(uv);

          if (distanceFromCenter > 0.5) {
            discard;
          }

          float core = 1.0 - smoothstep(0.025, 0.15, distanceFromCenter);
          float glow = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
          float alpha = v_color.a * (glow * 0.42 + core * 0.72);
          vec3 color = mix(v_color.rgb * 0.42, v_color.rgb, max(core, 0.18));

          gl_FragColor = vec4(color, alpha);
        }
      `,
    );
    const program = gl.createProgram();

    if (!program) {
      throw new Error("Particle shader program could not be created.");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || "Unknown program link error.";
      gl.deleteProgram(program);
      throw new Error(info);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  private createShader(type: number, source: string) {
    const gl = this.gl;
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error("Particle shader could not be created.");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || "Unknown shader compile error.";
      gl.deleteShader(shader);
      throw new Error(info);
    }

    return shader;
  }

  private createBuffer() {
    const buffer = this.gl.createBuffer();

    if (!buffer) {
      throw new Error("Particle buffer could not be created.");
    }

    return buffer;
  }
}
