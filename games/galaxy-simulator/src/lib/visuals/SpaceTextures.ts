import * as THREE from "three";
import { BodyType, CelestialBody, clamp } from "../physics/NBodyEngine";

type TextureKind =
  | "earth"
  | "mars"
  | "gas"
  | "ice"
  | "moon"
  | "rocky"
  | "asteroid";

const textureCache = new Map<string, THREE.CanvasTexture>();

export function starColorFromTemperature(temperatureK: number): string {
  if (temperatureK >= 12000) return "#b7d8ff";
  if (temperatureK >= 8000) return "#d7e8ff";
  if (temperatureK >= 5600) return "#fff3b4";
  if (temperatureK >= 3900) return "#ffd09a";
  return "#ff8a66";
}

export function getPlanetTexture(body: Pick<CelestialBody, "id" | "name" | "type" | "temperatureK" | "color">): THREE.CanvasTexture {
  const kind = textureKindForBody(body);
  const key = `planet:${kind}:${body.id}:${body.name}:${body.temperatureK}:${body.color}`;
  return cachedTexture(key, () => createPlanetTexture(kind, key, body.color));
}

export function getAsteroidTexture(): THREE.CanvasTexture {
  return cachedTexture("asteroid-shared", () => createPlanetTexture("asteroid", "asteroid-shared", "#a68f74"));
}

export function getDeepSpaceTexture(): THREE.CanvasTexture {
  return cachedTexture("deep-space-background", createDeepSpaceTexture);
}

export function getMilkyWayTexture(): THREE.CanvasTexture {
  return cachedTexture("milky-way-band", createMilkyWayTexture);
}

export function getNebulaTexture(seed: number): THREE.CanvasTexture {
  return cachedTexture(`nebula:${seed}`, () => createNebulaTexture(seed));
}

export function getGalaxySpriteTexture(seed: number): THREE.CanvasTexture {
  return cachedTexture(`galaxy-sprite:${seed}`, () => createGalaxySpriteTexture(seed));
}

export function getStarHaloTexture(): THREE.CanvasTexture {
  return cachedTexture("star-halo", () => createRadialGlowTexture("#ffffff", "#ffffff"));
}

export function getParticleTexture(): THREE.CanvasTexture {
  return cachedTexture("particle-soft-dot", () => createRadialGlowTexture("#ffffff", "#ffffff", 0.94));
}

export function getAccretionDiskTexture(): THREE.CanvasTexture {
  return cachedTexture("accretion-disk", createAccretionDiskTexture);
}

function textureKindForBody(body: Pick<CelestialBody, "name" | "type" | "temperatureK" | "color">): TextureKind {
  const name = body.name.toLowerCase();
  const color = body.color.toLowerCase();

  if (body.type === "moon") return "moon";
  if (body.type === "asteroid" || body.type === "dust") return "asteroid";
  if (name.includes("mars") || color.includes("ff6")) return "mars";
  if (name.includes("jupiter") || name.includes("saturn") || name.includes("gas")) return "gas";
  if (name.includes("ice") || name.includes("europa") || name.includes("titan") || body.temperatureK < 175) {
    return "ice";
  }
  if (name.includes("earth") || (body.temperatureK >= 230 && body.temperatureK <= 320)) return "earth";
  return "rocky";
}

function cachedTexture(key: string, factory: () => THREE.CanvasTexture): THREE.CanvasTexture {
  const existing = textureCache.get(key);
  if (existing) return existing;

  const texture = factory();
  textureCache.set(key, texture);
  return texture;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createPlanetTexture(kind: TextureKind, seedKey: string, fallbackColor: string): THREE.CanvasTexture {
  const canvas = createCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);

  const random = makeRandom(seedKey);
  if (kind === "earth") drawEarth(ctx, random);
  if (kind === "mars") drawMars(ctx, random);
  if (kind === "gas") drawGasGiant(ctx, random, fallbackColor);
  if (kind === "ice") drawIcyWorld(ctx, random);
  if (kind === "moon") drawMoon(ctx, random);
  if (kind === "rocky") drawRockyWorld(ctx, random, fallbackColor);
  if (kind === "asteroid") drawAsteroid(ctx, random);

  addSubtleLongitudeLighting(ctx, canvas.width, canvas.height);
  return createTexture(canvas);
}

function drawEarth(ctx: CanvasRenderingContext2D, random: () => number): void {
  const ocean = ctx.createLinearGradient(0, 0, 0, 256);
  ocean.addColorStop(0, "#164e83");
  ocean.addColorStop(0.48, "#0d2f63");
  ocean.addColorStop(1, "#061a3b");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 24; i += 1) {
    drawBlob(
      ctx,
      random,
      random() * 512,
      42 + random() * 172,
      16 + random() * 54,
      10 + random() * 32,
      random() > 0.45 ? "#3b7f45" : "#b39b5f",
      12 + Math.floor(random() * 10),
    );
  }

  ctx.globalAlpha = 0.44;
  ctx.fillStyle = "#f4fbff";
  for (let i = 0; i < 20; i += 1) {
    drawCloudBand(ctx, random() * 512, 30 + random() * 185, 40 + random() * 120, random);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(250, 252, 255, 0.78)";
  ctx.fillRect(0, 0, 512, 15);
  ctx.fillRect(0, 238, 512, 18);
}

function drawMars(ctx: CanvasRenderingContext2D, random: () => number): void {
  const base = ctx.createLinearGradient(0, 0, 512, 256);
  base.addColorStop(0, "#6d2d1c");
  base.addColorStop(0.45, "#c06a39");
  base.addColorStop(1, "#442019");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 42; i += 1) {
    const tone = random() > 0.48 ? "rgba(255, 187, 108, 0.26)" : "rgba(74, 28, 20, 0.34)";
    drawBlob(ctx, random, random() * 512, random() * 256, 16 + random() * 72, 5 + random() * 20, tone, 10);
  }
  drawCraters(ctx, random, 32, "rgba(54, 23, 18, 0.32)", "rgba(255, 205, 146, 0.18)");
}

function drawGasGiant(ctx: CanvasRenderingContext2D, random: () => number, fallbackColor: string): void {
  const palette = [
    "#ead6b3",
    "#c48e5d",
    "#8c5c45",
    "#f4e3c6",
    fallbackColor || "#d69b63",
    "#714b38",
  ];

  let y = 0;
  while (y < 256) {
    const height = 8 + random() * 22;
    const gradient = ctx.createLinearGradient(0, y, 512, y + height);
    const base = palette[Math.floor(random() * palette.length)];
    gradient.addColorStop(0, base);
    gradient.addColorStop(0.5, palette[Math.floor(random() * palette.length)]);
    gradient.addColorStop(1, base);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, 512, height + 1);
    y += height;
  }

  for (let i = 0; i < 34; i += 1) {
    ctx.globalAlpha = 0.1 + random() * 0.22;
    drawCloudBand(ctx, random() * 512, random() * 256, 80 + random() * 160, random);
  }
  ctx.globalAlpha = 1;

  const spot = ctx.createRadialGradient(350, 150, 4, 350, 150, 42);
  spot.addColorStop(0, "rgba(255, 221, 175, 0.95)");
  spot.addColorStop(0.42, "rgba(194, 82, 52, 0.72)");
  spot.addColorStop(1, "rgba(115, 48, 38, 0)");
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.ellipse(350, 150, 44, 22, -0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawIcyWorld(ctx: CanvasRenderingContext2D, random: () => number): void {
  const ice = ctx.createLinearGradient(0, 0, 512, 256);
  ice.addColorStop(0, "#f2fbff");
  ice.addColorStop(0.45, "#a8d5eb");
  ice.addColorStop(1, "#587a9c");
  ctx.fillStyle = ice;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = "rgba(20, 77, 108, 0.28)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 34; i += 1) {
    ctx.beginPath();
    let x = random() * 512;
    let y = random() * 256;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s += 1) {
      x += 14 + random() * 28;
      y += -16 + random() * 32;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 0.28;
  drawCraters(ctx, random, 20, "rgba(255,255,255,0.22)", "rgba(24,79,105,0.18)");
  ctx.globalAlpha = 1;
}

function drawMoon(ctx: CanvasRenderingContext2D, random: () => number): void {
  const base = ctx.createLinearGradient(0, 0, 512, 256);
  base.addColorStop(0, "#d8d3c9");
  base.addColorStop(0.5, "#8e8981");
  base.addColorStop(1, "#4d4b4a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);
  drawCraters(ctx, random, 72, "rgba(24, 23, 23, 0.34)", "rgba(255, 255, 255, 0.18)");
}

function drawRockyWorld(ctx: CanvasRenderingContext2D, random: () => number, fallbackColor: string): void {
  ctx.fillStyle = fallbackColor || "#8a7762";
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 58; i += 1) {
    const gray = Math.floor(70 + random() * 96);
    ctx.fillStyle = `rgba(${gray + 20}, ${gray + 12}, ${gray}, ${0.08 + random() * 0.18})`;
    drawBlob(ctx, random, random() * 512, random() * 256, 12 + random() * 52, 5 + random() * 22, ctx.fillStyle, 8);
  }
  drawCraters(ctx, random, 36, "rgba(16, 14, 13, 0.24)", "rgba(255, 236, 199, 0.12)");
}

function drawAsteroid(ctx: CanvasRenderingContext2D, random: () => number): void {
  const base = ctx.createLinearGradient(0, 0, 512, 256);
  base.addColorStop(0, "#9c8974");
  base.addColorStop(0.55, "#5e5348");
  base.addColorStop(1, "#2e2c29");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);
  drawCraters(ctx, random, 90, "rgba(10, 9, 8, 0.38)", "rgba(250, 229, 192, 0.12)");
}

function createDeepSpaceTexture(): THREE.CanvasTexture {
  const canvas = createCanvas(1024, 512);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);
  const random = makeRandom("deep-space");

  const base = ctx.createRadialGradient(512, 256, 40, 512, 256, 620);
  base.addColorStop(0, "#09112a");
  base.addColorStop(0.38, "#020817");
  base.addColorStop(1, "#00020a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  drawNebulaCloud(ctx, 250, 190, 360, "#315fb4", 0.22);
  drawNebulaCloud(ctx, 745, 310, 330, "#a94d8f", 0.16);
  drawNebulaCloud(ctx, 580, 105, 250, "#2e8d9d", 0.12);

  for (let i = 0; i < 2400; i += 1) {
    const size = random() > 0.965 ? 1.5 + random() * 1.6 : 0.4 + random() * 0.9;
    const alpha = 0.22 + random() * 0.74;
    ctx.fillStyle = `rgba(230, 242, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(random() * 1024, random() * 512, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return createTexture(canvas);
}

function createMilkyWayTexture(): THREE.CanvasTexture {
  const canvas = createCanvas(1024, 256);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);
  const random = makeRandom("milky-way");
  ctx.clearRect(0, 0, 1024, 256);

  const band = ctx.createLinearGradient(0, 0, 0, 256);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.32, "rgba(116, 168, 230, 0.13)");
  band.addColorStop(0.5, "rgba(255, 239, 205, 0.36)");
  band.addColorStop(0.68, "rgba(167, 88, 169, 0.16)");
  band.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, 1024, 256);

  for (let i = 0; i < 2600; i += 1) {
    const x = random() * 1024;
    const spread = Math.pow(random(), 1.8) * 72;
    const y = 128 + (random() > 0.5 ? spread : -spread) + (random() - 0.5) * 16;
    const alpha = 0.08 + random() * 0.38;
    ctx.fillStyle = `rgba(255, 247, 224, ${alpha})`;
    ctx.fillRect(x, y, 0.8 + random() * 1.9, 0.8 + random() * 1.9);
  }

  return createTexture(canvas);
}

function createNebulaTexture(seed: number): THREE.CanvasTexture {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);
  const random = makeRandom(`nebula-${seed}`);
  const colors = [
    ["#4f88ff", "#1bc7c7"],
    ["#ff6fae", "#8f6fff"],
    ["#ffb36b", "#d74f88"],
    ["#5ff2bb", "#4e76ff"],
  ][seed % 4];

  ctx.clearRect(0, 0, 512, 512);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 14; i += 1) {
    const cx = 180 + random() * 160;
    const cy = 160 + random() * 190;
    const radius = 80 + random() * 190;
    const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius);
    gradient.addColorStop(0, hexToRgba(colors[i % colors.length], 0.24 + random() * 0.22));
    gradient.addColorStop(0.5, hexToRgba(colors[(i + 1) % colors.length], 0.08 + random() * 0.1));
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  }
  ctx.globalCompositeOperation = "source-over";

  return createTexture(canvas);
}

function createGalaxySpriteTexture(seed: number): THREE.CanvasTexture {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);
  const random = makeRandom(`distant-galaxy-${seed}`);

  ctx.clearRect(0, 0, 512, 512);
  ctx.globalCompositeOperation = "lighter";
  const core = ctx.createRadialGradient(256, 256, 2, 256, 256, 90);
  core.addColorStop(0, "rgba(255, 244, 210, 0.94)");
  core.addColorStop(0.34, "rgba(132, 185, 255, 0.28)");
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3400; i += 1) {
    const arm = i % 2;
    const t = Math.pow(random(), 0.65);
    const radius = t * 230;
    const angle = t * 5.9 + arm * Math.PI + (random() - 0.5) * 0.72;
    const x = 256 + Math.cos(angle) * radius;
    const y = 256 + Math.sin(angle) * radius * 0.42 + (random() - 0.5) * 28;
    const alpha = (1 - t) * (0.16 + random() * 0.34);
    ctx.fillStyle = `rgba(215, 232, 255, ${alpha})`;
    ctx.fillRect(x, y, 0.8 + random() * 1.8, 0.8 + random() * 1.8);
  }
  ctx.globalCompositeOperation = "source-over";

  return createTexture(canvas);
}

function createRadialGlowTexture(innerColor: string, outerColor: string, coreOpacity = 1): THREE.CanvasTexture {
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 127);
  gradient.addColorStop(0, hexToRgba(innerColor, coreOpacity));
  gradient.addColorStop(0.22, hexToRgba(innerColor, 0.55));
  gradient.addColorStop(0.62, hexToRgba(outerColor, 0.14));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return createTexture(canvas);
}

function createAccretionDiskTexture(): THREE.CanvasTexture {
  const canvas = createCanvas(512, 64);
  const ctx = canvas.getContext("2d");
  if (!ctx) return createTexture(canvas);
  const random = makeRandom("accretion-disk");
  ctx.clearRect(0, 0, 512, 64);

  for (let x = 0; x < 512; x += 1) {
    const radial = x / 511;
    const alpha = Math.sin(radial * Math.PI) ** 0.7;
    const hot = radial < 0.34;
    ctx.fillStyle = hot
      ? `rgba(255, 243, 180, ${alpha * 0.82})`
      : radial < 0.72
        ? `rgba(255, 132, 55, ${alpha * 0.66})`
        : `rgba(82, 194, 255, ${alpha * 0.35})`;
    ctx.fillRect(x, 0, 1, 64);
  }

  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 520; i += 1) {
    const x = random() * 512;
    const y = 28 + (random() - 0.5) * 34;
    ctx.fillStyle = `rgba(255, 239, 182, ${0.08 + random() * 0.32})`;
    ctx.fillRect(x, y, 1 + random() * 3, 0.8 + random() * 2);
  }
  ctx.globalCompositeOperation = "source-over";

  const texture = createTexture(canvas);
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function drawCloudBand(
  ctx: CanvasRenderingContext2D,
  startX: number,
  y: number,
  length: number,
  random: () => number,
): void {
  ctx.beginPath();
  ctx.moveTo(startX, y);
  for (let i = 0; i < 9; i += 1) {
    const x = startX + (length / 8) * i;
    const waveY = y + Math.sin(i * 0.9 + random() * 2) * (4 + random() * 8);
    ctx.lineTo(x, waveY);
  }
  ctx.lineWidth = 2 + random() * 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.stroke();
}

function drawBlob(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fillStyle: string | CanvasGradient | CanvasPattern,
  points: number,
): void {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const wobble = 0.72 + random() * 0.52;
    const x = cx + Math.cos(angle) * rx * wobble;
    const y = cy + Math.sin(angle) * ry * wobble;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawCraters(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  count: number,
  shadow: string,
  highlight: string,
): void {
  for (let i = 0; i < count; i += 1) {
    const x = random() * 512;
    const y = random() * 256;
    const radius = 2 + random() * 17;
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - radius * 0.16, y - radius * 0.18, radius * 0.82, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function addSubtleLongitudeLighting(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const shade = ctx.createLinearGradient(0, 0, width, 0);
  shade.addColorStop(0, "rgba(0, 0, 0, 0.22)");
  shade.addColorStop(0.18, "rgba(255, 255, 255, 0.08)");
  shade.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
  shade.addColorStop(0.88, "rgba(0, 0, 0, 0.18)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
}

function drawNebulaCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number,
): void {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
  gradient.addColorStop(0, hexToRgba(color, opacity));
  gradient.addColorStop(0.45, hexToRgba(color, opacity * 0.36));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function makeRandom(seedInput: string | number): () => number {
  let seed = typeof seedInput === "number" ? seedInput : hashString(seedInput);
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
