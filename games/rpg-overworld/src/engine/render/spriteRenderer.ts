import { contentRegistry } from "../../memory/contentRegistry";
import type { AssetColorRamp, Direction, OverworldInteraction } from "../../memory/types";

const defaultPalette: AssetColorRamp = {
  primary: "#253148",
  secondary: "#5a413d",
  accent: "#e1be72",
  ink: "#f7eedf",
  light: "#8fd7ff",
};

const paletteForAsset = (assetId?: string): AssetColorRamp =>
  (assetId ? contentRegistry.assetsById[assetId]?.palette : undefined) ?? defaultPalette;

const paletteForActor = (actorId?: string) => {
  const actor = actorId ? contentRegistry.charactersById[actorId] : undefined;
  return paletteForAsset(actor?.portraitAssetId);
};

const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, alpha = 0.22) => {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawPixelRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke?: string,
) => {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, Math.floor(width / 12));
    ctx.strokeRect(x, y, width, height);
  }
};

export const drawHumanoidSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  palette: AssetColorRamp,
  facing: Direction,
  accentGlow = false,
) => {
  const bodyW = size * 0.42;
  const bodyH = size * 0.44;
  const head = size * 0.24;
  const feetY = y + size * 0.82;
  const left = x + (size - bodyW) / 2;
  const bodyTop = y + size * 0.3;

  drawShadow(ctx, x + size / 2, y + size * 0.9, size * 0.22, size * 0.09, 0.25);

  if (accentGlow) {
    ctx.save();
    ctx.fillStyle = `${palette.light}22`;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.46, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPixelRect(ctx, left, bodyTop, bodyW, bodyH, palette.primary, palette.ink);
  drawPixelRect(ctx, left + bodyW * 0.12, bodyTop + bodyH * 0.18, bodyW * 0.76, bodyH * 0.4, palette.secondary);
  drawPixelRect(ctx, left + bodyW * 0.18, feetY - size * 0.16, bodyW * 0.2, size * 0.16, palette.ink);
  drawPixelRect(ctx, left + bodyW * 0.62, feetY - size * 0.16, bodyW * 0.2, size * 0.16, palette.ink);

  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.22, head * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.ink;
  if (facing === "left") {
    ctx.fillRect(x + size * 0.4, y + size * 0.21, size * 0.06, size * 0.04);
  } else if (facing === "right") {
    ctx.fillRect(x + size * 0.54, y + size * 0.21, size * 0.06, size * 0.04);
  } else {
    ctx.fillRect(x + size * 0.42, y + size * 0.21, size * 0.05, size * 0.04);
    ctx.fillRect(x + size * 0.53, y + size * 0.21, size * 0.05, size * 0.04);
  }
};

const drawChestSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, palette: AssetColorRamp) => {
  drawShadow(ctx, x + size / 2, y + size * 0.82, size * 0.24, size * 0.08, 0.2);
  drawPixelRect(ctx, x + size * 0.22, y + size * 0.4, size * 0.56, size * 0.28, palette.secondary, palette.ink);
  drawPixelRect(ctx, x + size * 0.22, y + size * 0.26, size * 0.56, size * 0.18, palette.primary, palette.ink);
  drawPixelRect(ctx, x + size * 0.46, y + size * 0.42, size * 0.08, size * 0.18, palette.accent);
};

const drawDoorSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, palette: AssetColorRamp) => {
  drawShadow(ctx, x + size / 2, y + size * 0.82, size * 0.28, size * 0.08, 0.22);
  drawPixelRect(ctx, x + size * 0.18, y + size * 0.18, size * 0.64, size * 0.58, palette.primary, palette.ink);
  drawPixelRect(ctx, x + size * 0.34, y + size * 0.32, size * 0.32, size * 0.44, palette.secondary);
  drawPixelRect(ctx, x + size * 0.58, y + size * 0.52, size * 0.06, size * 0.06, palette.accent);
};

const drawObeliskSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, palette: AssetColorRamp, now: number) => {
  const glow = (Math.sin(now / 220) + 1) * 0.5;
  drawShadow(ctx, x + size / 2, y + size * 0.82, size * 0.24, size * 0.08, 0.18);
  drawPixelRect(ctx, x + size * 0.36, y + size * 0.18, size * 0.28, size * 0.52, palette.primary, palette.ink);
  ctx.fillStyle = `${palette.light}${glow > 0.6 ? "55" : "33"}`;
  ctx.fillRect(x + size * 0.42, y + size * 0.28, size * 0.16, size * 0.2);
};

const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, text: string) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.1, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b1018";
  ctx.font = `bold ${Math.max(10, Math.floor(size * 0.18))}px 'Trebuchet MS', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + size / 2, y + size * 0.1);
};

export const drawInteractionSprite = (
  ctx: CanvasRenderingContext2D,
  interaction: OverworldInteraction,
  x: number,
  y: number,
  size: number,
  facing: Direction,
  now: number,
  highlighted = false,
) => {
  const palette =
    paletteForActor(interaction.actorId) ??
    paletteForAsset(interaction.kind === "travel" ? "icon-map" : interaction.kind === "shop" ? "icon-pack" : "icon-star");

  if (highlighted) {
    ctx.save();
    ctx.strokeStyle = `${palette.light}aa`;
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.strokeRect(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
    ctx.restore();
  }

  if (interaction.kind === "npc" || interaction.kind === "shop") {
    drawHumanoidSprite(ctx, x, y, size, palette, facing, interaction.kind === "shop");
    drawBubble(ctx, x, y, size, interaction.kind === "shop" ? palette.accent : palette.light, interaction.kind === "shop" ? "$" : "!");
    return;
  }

  if (interaction.kind === "travel") {
    drawDoorSprite(ctx, x, y, size, palette);
    drawBubble(ctx, x, y, size, palette.light, ">");
    return;
  }

  if (/crate|chest|cache|reliquary/i.test(interaction.label)) {
    drawChestSprite(ctx, x, y, size, palette);
    drawBubble(ctx, x, y, size, palette.accent, "+");
    return;
  }

  drawObeliskSprite(ctx, x, y, size, palette, now);
  drawBubble(ctx, x, y, size, interaction.kind === "message" ? palette.light : palette.accent, interaction.kind === "message" ? "?" : "!");
};

export const drawPlayerSprite = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  facing: Direction,
  now: number,
) => {
  const palette = paletteForAsset("portrait-rowan");
  const lift = Math.sin(now / 160) * size * 0.015;
  drawHumanoidSprite(ctx, x, y - lift, size, palette, facing, true);

  ctx.save();
  ctx.strokeStyle = `${palette.light}bb`;
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.strokeRect(x + size * 0.1, y + size * 0.08, size * 0.8, size * 0.84);
  ctx.restore();
};
