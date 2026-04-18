import { contentRegistry } from "../memory/contentRegistry";
import type { AssetDefinition } from "../memory/types";

type Palette = string[];

const createCanvas = (size: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
};

const gradientFill = (ctx: CanvasRenderingContext2D, colors: Palette, size: number): void => {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / Math.max(colors.length - 1, 1), color);
  });
  ctx.fillStyle = gradient;
};

const drawGem = (ctx: CanvasRenderingContext2D, size: number, palette: Palette): void => {
  gradientFill(ctx, palette, size);
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.12);
  ctx.lineTo(size * 0.8, size * 0.38);
  ctx.lineTo(size * 0.66, size * 0.84);
  ctx.lineTo(size * 0.34, size * 0.84);
  ctx.lineTo(size * 0.2, size * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = size * 0.06;
  ctx.stroke();
};

const drawOrb = (ctx: CanvasRenderingContext2D, size: number, palette: Palette): void => {
  const glow = ctx.createRadialGradient(size * 0.5, size * 0.45, size * 0.1, size * 0.5, size * 0.5, size * 0.45);
  glow.addColorStop(0, palette[0]);
  glow.addColorStop(1, palette[1] ?? palette[0]);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
};

const drawBody = (
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: Palette,
  spikes = 0,
  winged = false,
  elite = false,
): void => {
  const mid = size * 0.5;
  gradientFill(ctx, palette, size);
  ctx.beginPath();
  for (let index = 0; index < 6 + spikes; index += 1) {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / (6 + spikes);
    const radius = size * (elite ? 0.26 : 0.22) * (index % 2 === 0 ? 1.25 : 0.88);
    const x = mid + Math.cos(angle) * radius;
    const y = mid + Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();

  if (winged) {
    ctx.fillStyle = palette[1] ?? palette[0];
    ctx.beginPath();
    ctx.ellipse(mid - size * 0.18, mid, size * 0.16, size * 0.08, -0.4, 0, Math.PI * 2);
    ctx.ellipse(mid + size * 0.18, mid, size * 0.16, size * 0.08, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#0d1020";
  ctx.beginPath();
  ctx.arc(mid - size * 0.08, mid - size * 0.02, size * 0.035, 0, Math.PI * 2);
  ctx.arc(mid + size * 0.08, mid - size * 0.02, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
};

const drawStar = (ctx: CanvasRenderingContext2D, size: number, palette: Palette, inner = 0.4): void => {
  gradientFill(ctx, palette, size);
  const mid = size * 0.5;
  ctx.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / 5;
    const radius = index % 2 === 0 ? size * 0.34 : size * inner * 0.34;
    const x = mid + Math.cos(angle) * radius;
    const y = mid + Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
};

const drawSprite = (definition: AssetDefinition): HTMLCanvasElement => {
  const canvas = createCanvas(definition.size);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const { size, palette, shape } = definition;
  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);
  ctx.translate(-size * 0.5, -size * 0.5);

  if (definition.glow) {
    ctx.shadowColor = definition.glow;
    ctx.shadowBlur = size * 0.12;
  }

  switch (shape) {
    case "crest-logo":
      gradientFill(ctx, palette, size);
      drawStar(ctx, size, palette, 0.45);
      ctx.save();
      ctx.shadowColor = "rgba(255, 194, 117, 0.75)";
      ctx.shadowBlur = size * 0.16;
      ctx.fillStyle = "rgba(255, 239, 202, 0.95)";
      ctx.font = `${size * 0.19}px Impact, Haettenschweiler, "Arial Black", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = size * 0.03;
      ctx.strokeStyle = palette[2] ?? "#23132b";
      ctx.strokeText("ASHFALL", size * 0.5, size * 0.77);
      ctx.fillText("ASHFALL", size * 0.5, size * 0.77);
      ctx.restore();
      break;
    case "player-runner":
      drawBody(ctx, size, palette, 2, false, true);
      ctx.fillStyle = palette[2] ?? "#2f6fff";
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.52, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "thorn-beast":
      drawBody(ctx, size, palette, 4, false, false);
      break;
    case "thorn-beast-elite":
      drawBody(ctx, size, palette, 5, false, true);
      break;
    case "skitter":
      drawBody(ctx, size, palette, 6, false, false);
      break;
    case "brute":
      drawBody(ctx, size, palette, 1, false, false);
      break;
    case "brute-elite":
      drawBody(ctx, size, palette, 2, false, true);
      break;
    case "caster":
      drawBody(ctx, size, palette, 2, true, false);
      break;
    case "caster-elite":
      drawBody(ctx, size, palette, 2, true, true);
      break;
    case "lancer":
      drawBody(ctx, size, palette, 3, false, false);
      ctx.fillStyle = palette[0];
      ctx.fillRect(size * 0.46, size * 0.04, size * 0.08, size * 0.32);
      break;
    case "wisp":
      drawOrb(ctx, size, palette);
      break;
    case "pod":
      drawGem(ctx, size, palette);
      break;
    case "boss-titan":
    case "boss-monarch":
    case "boss-revenant":
    case "boss-seraph":
    case "boss-final":
      drawBody(ctx, size, palette, 6, true, true);
      drawStar(ctx, size * 0.56, palette, 0.42);
      break;
    case "dart":
    case "petal-bolt":
    case "rail-bolt":
      gradientFill(ctx, palette, size);
      ctx.beginPath();
      ctx.moveTo(size * 0.18, size * 0.5);
      ctx.lineTo(size * 0.78, size * 0.28);
      ctx.lineTo(size * 0.92, size * 0.5);
      ctx.lineTo(size * 0.78, size * 0.72);
      ctx.closePath();
      ctx.fill();
      break;
    case "orbit-disc":
      drawOrb(ctx, size, palette);
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "mine":
      drawOrb(ctx, size, palette);
      ctx.fillStyle = palette[2] ?? "#451e19";
      ctx.fillRect(size * 0.4, size * 0.14, size * 0.2, size * 0.16);
      break;
    case "drone":
      drawBody(ctx, size, palette, 0, true, false);
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = size * 0.05;
      ctx.strokeRect(size * 0.28, size * 0.28, size * 0.44, size * 0.44);
      break;
    case "xp-small":
    case "xp-medium":
    case "xp-large":
      drawGem(ctx, size, palette);
      break;
    case "heal":
      drawOrb(ctx, size, palette);
      ctx.fillStyle = palette[2] ?? "#9b3857";
      ctx.fillRect(size * 0.44, size * 0.24, size * 0.12, size * 0.52);
      ctx.fillRect(size * 0.24, size * 0.44, size * 0.52, size * 0.12);
      break;
    case "magnet":
      drawStar(ctx, size, palette);
      break;
    case "hit-burst":
    case "explosion":
    case "shock-ring":
    case "chain":
    case "aura":
    case "beam":
      drawStar(ctx, size, palette);
      break;
    default:
      drawOrb(ctx, size, palette);
      break;
  }

  ctx.restore();
  return canvas;
};

export class SpriteLibrary {
  private readonly sprites = new Map<string, HTMLCanvasElement>();

  constructor() {
    for (const asset of Object.values(contentRegistry.assets)) {
      this.sprites.set(asset.id, drawSprite(asset));
    }
  }

  get(id: string): HTMLCanvasElement | null {
    return this.sprites.get(id) ?? null;
  }
}
