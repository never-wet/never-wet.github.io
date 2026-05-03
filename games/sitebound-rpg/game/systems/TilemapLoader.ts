import Phaser from "phaser";
import { TileId, TILE_SIZE, worldMap } from "../data/worldMap";

export const TILESET_KEY = "sitebound-tileset";
const SOURCE_TILE_SIZE = 512;
const TILESET_MARGIN = 2;
const TILESET_SPACING = 4;
type TerrainDetail = "grass" | "meadow" | "path" | "stone" | "water" | "bridge" | "cliff" | "fence";
type TerrainCategory = "natural" | "dirt" | "paved" | "water" | "bridge" | "cliff" | "fence";
type Direction = "n" | "e" | "s" | "w";

interface TileStyle {
  base: string;
  shade: string;
  light: string;
  detail: TerrainDetail;
}

interface NeighborCategories {
  n: TerrainCategory;
  e: TerrainCategory;
  s: TerrainCategory;
  w: TerrainCategory;
  ne: TerrainCategory;
  se: TerrainCategory;
  sw: TerrainCategory;
  nw: TerrainCategory;
}

interface TileVariant {
  tile: TileId;
  neighbors: NeighborCategories;
  index: number;
}

export class TilemapLoader {
  static create(scene: Phaser.Scene) {
    const autoTileset = createAutotiledTileset();

    if (!scene.textures.exists(TILESET_KEY)) {
      scene.textures.addCanvas(TILESET_KEY, autoTileset.canvas);
    }

    const map = scene.make.tilemap({
      data: autoTileset.data,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE
    });
    const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, TILESET_MARGIN, TILESET_SPACING);

    if (!tileset) {
      throw new Error("Could not create Sitebound tileset.");
    }

    const layer = map.createLayer(0, tileset, 0, 0);

    if (!layer) {
      throw new Error("Could not create Sitebound tile layer.");
    }

    layer.setCollision(autoTileset.collisionTiles);
    layer.setAlpha(0);
    layer.setDepth(-200);

    return {
      map,
      layer
    };
  }
}

function createAutotiledTileset() {
  const variants = new Map<string, TileVariant>();
  const data = worldMap.ground.map((row, y) =>
    row.map((rawTile, x) => {
      const tile = rawTile as TileId;
      const neighbors = getNeighborCategories(x, y);
      const key = variantKey(tile, neighbors);
      const existing = variants.get(key);

      if (existing) {
        return existing.index;
      }

      const variant = {
        tile,
        neighbors,
        index: variants.size + 1
      };

      variants.set(key, variant);
      return variant.index;
    })
  );

  const columns = Math.min(64, Math.max(1, variants.size));
  const rows = Math.ceil(variants.size / columns);
  const canvas = document.createElement("canvas");
  canvas.width = TILESET_MARGIN * 2 + columns * TILE_SIZE + (columns - 1) * TILESET_SPACING;
  canvas.height = TILESET_MARGIN * 2 + rows * TILE_SIZE + (rows - 1) * TILESET_SPACING;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create tileset canvas.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const variant of variants.values()) {
    const atlasX = TILESET_MARGIN + ((variant.index - 1) % columns) * (TILE_SIZE + TILESET_SPACING);
    const atlasY = TILESET_MARGIN + Math.floor((variant.index - 1) / columns) * (TILE_SIZE + TILESET_SPACING);
    drawAutotile(ctx, atlasX, atlasY, variant);
    padAtlasTile(ctx, atlasX, atlasY);
  }

  const collisionTiles = [...variants.values()]
    .filter((variant) => worldMap.collisionTiles.includes(variant.tile))
    .map((variant) => variant.index);

  return {
    canvas,
    data,
    collisionTiles
  };
}

function drawAutotile(ctx: CanvasRenderingContext2D, x: number, y: number, variant: TileVariant) {
  const style = tileStyle(variant.tile);

  drawTileBase(ctx, x, y, variant.tile, style);
  drawTransitionOverlays(ctx, x, y, variant, style);
  drawConnectedDetails(ctx, x, y, variant, style);
}

function padAtlasTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const pad = TILESET_MARGIN;

  ctx.drawImage(ctx.canvas, x, y, TILE_SIZE, 1, x, y - pad, TILE_SIZE, pad);
  ctx.drawImage(ctx.canvas, x, y + TILE_SIZE - 1, TILE_SIZE, 1, x, y + TILE_SIZE, TILE_SIZE, pad);
  ctx.drawImage(ctx.canvas, x, y, 1, TILE_SIZE, x - pad, y, pad, TILE_SIZE);
  ctx.drawImage(ctx.canvas, x + TILE_SIZE - 1, y, 1, TILE_SIZE, x + TILE_SIZE, y, pad, TILE_SIZE);

  ctx.drawImage(ctx.canvas, x, y, 1, 1, x - pad, y - pad, pad, pad);
  ctx.drawImage(ctx.canvas, x + TILE_SIZE - 1, y, 1, 1, x + TILE_SIZE, y - pad, pad, pad);
  ctx.drawImage(ctx.canvas, x, y + TILE_SIZE - 1, 1, 1, x - pad, y + TILE_SIZE, pad, pad);
  ctx.drawImage(ctx.canvas, x + TILE_SIZE - 1, y + TILE_SIZE - 1, 1, 1, x + TILE_SIZE, y + TILE_SIZE, pad, pad);
}

function drawTileBase(ctx: CanvasRenderingContext2D, x: number, y: number, tileId: TileId, style: TileStyle) {
  const source = createMaterialSource(tileId, style.base, style.shade, style.light, style.detail);

  ctx.drawImage(source, 0, 0, SOURCE_TILE_SIZE, SOURCE_TILE_SIZE, x, y, TILE_SIZE, TILE_SIZE);
}

function getNeighborCategories(x: number, y: number): NeighborCategories {
  return {
    n: tileCategory(tileAt(x, y - 1)),
    e: tileCategory(tileAt(x + 1, y)),
    s: tileCategory(tileAt(x, y + 1)),
    w: tileCategory(tileAt(x - 1, y)),
    ne: tileCategory(tileAt(x + 1, y - 1)),
    se: tileCategory(tileAt(x + 1, y + 1)),
    sw: tileCategory(tileAt(x - 1, y + 1)),
    nw: tileCategory(tileAt(x - 1, y - 1))
  };
}

function tileAt(x: number, y: number) {
  if (x < 0 || y < 0 || x >= worldMap.width || y >= worldMap.height) {
    return TileId.Cliff;
  }

  return worldMap.ground[y][x] as TileId;
}

function variantKey(tile: TileId, neighbors: NeighborCategories) {
  return [
    tile,
    neighbors.n,
    neighbors.e,
    neighbors.s,
    neighbors.w,
    neighbors.ne,
    neighbors.se,
    neighbors.sw,
    neighbors.nw
  ].join("|");
}

function tileStyle(tile: TileId): TileStyle {
  switch (tile) {
    case TileId.Grass:
      return { base: "#2f8b57", shade: "#1d6c43", light: "#62c06f", detail: "grass" };
    case TileId.Meadow:
      return { base: "#3d9b61", shade: "#2a774d", light: "#8ad66c", detail: "meadow" };
    case TileId.Path:
      return { base: "#b98b55", shade: "#8b6847", light: "#e0bd7c", detail: "path" };
    case TileId.Plaza:
      return { base: "#a99f89", shade: "#766f63", light: "#ddd0aa", detail: "stone" };
    case TileId.RoadStone:
      return { base: "#667184", shade: "#444d62", light: "#9aa8ba", detail: "stone" };
    case TileId.Water:
      return { base: "#226a94", shade: "#154766", light: "#64c7d8", detail: "water" };
    case TileId.Bridge:
      return { base: "#8e6143", shade: "#5d3e32", light: "#d3a16a", detail: "bridge" };
    case TileId.Forest:
      return { base: "#236648", shade: "#174733", light: "#58a76b", detail: "grass" };
    case TileId.Sand:
      return { base: "#cfae69", shade: "#987b48", light: "#f2d88a", detail: "path" };
    case TileId.Ridge:
      return { base: "#7d7084", shade: "#544a63", light: "#b4a8bd", detail: "stone" };
    case TileId.Cliff:
      return { base: "#4e425c", shade: "#2d2537", light: "#8a789d", detail: "cliff" };
    case TileId.Fence:
      return { base: "#725338", shade: "#3e2c22", light: "#c99058", detail: "fence" };
    case TileId.Floor:
      return { base: "#7b6574", shade: "#4c3d4a", light: "#b78ca6", detail: "stone" };
  }
}

function tileCategory(tile: TileId): TerrainCategory {
  if (tile === TileId.Water) {
    return "water";
  }

  if (tile === TileId.Bridge) {
    return "bridge";
  }

  if (tile === TileId.Cliff) {
    return "cliff";
  }

  if (tile === TileId.Fence) {
    return "fence";
  }

  if (tile === TileId.Path || tile === TileId.Sand) {
    return "dirt";
  }

  if (tile === TileId.Plaza || tile === TileId.RoadStone || tile === TileId.Ridge || tile === TileId.Floor) {
    return "paved";
  }

  return "natural";
}

function drawTransitionOverlays(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: TileVariant,
  style: TileStyle
) {
  const current = tileCategory(variant.tile);

  for (const direction of ["n", "e", "s", "w"] as Direction[]) {
    const neighbor = variant.neighbors[direction];

    if (neighbor === current || current === "bridge" || neighbor === "bridge") {
      continue;
    }

    if (current === "water" && neighbor !== "water") {
      drawEdgeGradient(ctx, x, y, direction, "#f2d88a", 0.45, 7);
      drawEdgeLine(ctx, x, y, direction, "#e8f7ff", 0.32, 2);
      continue;
    }

    if (neighbor === "water") {
      drawEdgeGradient(ctx, x, y, direction, "#cfae69", 0.58, 8);
      drawEdgeLine(ctx, x, y, direction, "#154766", 0.24, 2);
      continue;
    }

    if (neighbor === "cliff" && current !== "cliff") {
      drawEdgeGradient(ctx, x, y, direction, "#2d2537", 0.34, 8);
      continue;
    }

    if (current === "cliff" && neighbor !== "cliff") {
      drawEdgeGradient(ctx, x, y, direction, "#8a789d", 0.28, 6);
      continue;
    }

    if (current === "natural" && (neighbor === "dirt" || neighbor === "paved")) {
      drawEdgeGradient(ctx, x, y, direction, neighbor === "dirt" ? "#b98b55" : "#8c8b82", 0.42, 8);
      continue;
    }

    if ((current === "dirt" || current === "paved") && neighbor === "natural") {
      drawEdgeGradient(ctx, x, y, direction, "#3d9b61", 0.4, 8);
      drawEdgeNoise(ctx, x, y, direction, "#62c06f", 0.2);
      continue;
    }

    if (current === "dirt" && neighbor === "paved") {
      drawEdgeGradient(ctx, x, y, direction, "#a99f89", 0.28, 6);
      continue;
    }

    if (current === "paved" && neighbor === "dirt") {
      drawEdgeGradient(ctx, x, y, direction, "#b98b55", 0.26, 6);
    }
  }

  for (const corner of ["ne", "se", "sw", "nw"] as const) {
    const neighbor = variant.neighbors[corner];

    if (neighbor === current) {
      continue;
    }

    if (neighbor === "water" && current !== "water") {
      drawCornerBlend(ctx, x, y, corner, "#cfae69", 0.42);
    } else if (current === "water" && neighbor !== "water") {
      drawCornerBlend(ctx, x, y, corner, "#e8f7ff", 0.2);
    } else if (current === "natural" && (neighbor === "dirt" || neighbor === "paved")) {
      drawCornerBlend(ctx, x, y, corner, neighbor === "dirt" ? "#b98b55" : "#8c8b82", 0.24);
    }
  }

  if (variant.tile === TileId.Path || variant.tile === TileId.Sand) {
    drawPathShoulder(ctx, x, y, variant, style);
  }
}

function drawConnectedDetails(ctx: CanvasRenderingContext2D, x: number, y: number, variant: TileVariant, style: TileStyle) {
  if (variant.tile === TileId.Fence) {
    drawFenceConnections(ctx, x, y, variant, style);
    return;
  }

  if (variant.tile === TileId.Bridge) {
    drawBridgeConnections(ctx, x, y, variant);
    return;
  }

  if (variant.tile === TileId.Water) {
    drawWaterConnections(ctx, x, y, variant);
  }
}

function drawEdgeGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: Direction,
  color: string,
  alpha: number,
  size: number
) {
  let gradient: CanvasGradient;

  if (direction === "n") {
    gradient = ctx.createLinearGradient(0, y, 0, y + size);
    gradient.addColorStop(0, alphaHex(color, alpha));
    gradient.addColorStop(1, alphaHex(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, TILE_SIZE, size);
  } else if (direction === "s") {
    gradient = ctx.createLinearGradient(0, y + TILE_SIZE, 0, y + TILE_SIZE - size);
    gradient.addColorStop(0, alphaHex(color, alpha));
    gradient.addColorStop(1, alphaHex(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y + TILE_SIZE - size, TILE_SIZE, size);
  } else if (direction === "w") {
    gradient = ctx.createLinearGradient(x, 0, x + size, 0);
    gradient.addColorStop(0, alphaHex(color, alpha));
    gradient.addColorStop(1, alphaHex(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, TILE_SIZE);
  } else {
    gradient = ctx.createLinearGradient(x + TILE_SIZE, 0, x + TILE_SIZE - size, 0);
    gradient.addColorStop(0, alphaHex(color, alpha));
    gradient.addColorStop(1, alphaHex(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(x + TILE_SIZE - size, y, size, TILE_SIZE);
  }
}

function drawEdgeLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: Direction,
  color: string,
  alpha: number,
  size: number
) {
  ctx.fillStyle = alphaHex(color, alpha);

  if (direction === "n") {
    ctx.fillRect(x, y, TILE_SIZE, size);
  } else if (direction === "s") {
    ctx.fillRect(x, y + TILE_SIZE - size, TILE_SIZE, size);
  } else if (direction === "w") {
    ctx.fillRect(x, y, size, TILE_SIZE);
  } else {
    ctx.fillRect(x + TILE_SIZE - size, y, size, TILE_SIZE);
  }
}

function drawEdgeNoise(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, color: string, alpha: number) {
  ctx.fillStyle = alphaHex(color, alpha);

  for (let step = 0; step < TILE_SIZE; step += 7) {
    const inset = step % 2 === 0 ? 3 : 6;

    if (direction === "n") {
      ctx.fillRect(x + step, y + inset, 3, 3);
    } else if (direction === "s") {
      ctx.fillRect(x + step, y + TILE_SIZE - inset - 3, 3, 3);
    } else if (direction === "w") {
      ctx.fillRect(x + inset, y + step, 3, 3);
    } else {
      ctx.fillRect(x + TILE_SIZE - inset - 3, y + step, 3, 3);
    }
  }
}

function drawCornerBlend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  corner: "ne" | "se" | "sw" | "nw",
  color: string,
  alpha: number
) {
  const cx = corner === "ne" || corner === "se" ? x + TILE_SIZE : x;
  const cy = corner === "se" || corner === "sw" ? y + TILE_SIZE : y;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);

  gradient.addColorStop(0, alphaHex(color, alpha));
  gradient.addColorStop(1, alphaHex(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
}

function drawPathShoulder(ctx: CanvasRenderingContext2D, x: number, y: number, variant: TileVariant, style: TileStyle) {
  const current = tileCategory(variant.tile);

  ctx.strokeStyle = alphaHex(style.light, 0.22);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 16);
  ctx.quadraticCurveTo(x + 13, y + 11, x + 29, y + 15);
  ctx.stroke();

  for (const direction of ["n", "e", "s", "w"] as Direction[]) {
    if (variant.neighbors[direction] === current) {
      continue;
    }

    drawEdgeGradient(ctx, x, y, direction, "#2f8b57", 0.24, 5);
  }
}

function drawFenceConnections(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  variant: TileVariant,
  style: TileStyle
) {
  ctx.fillStyle = alphaHex(style.shade, 0.36);
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = style.light;

  const connectsWest = variant.neighbors.w === "fence";
  const connectsEast = variant.neighbors.e === "fence";
  const connectsNorth = variant.neighbors.n === "fence";
  const connectsSouth = variant.neighbors.s === "fence";

  ctx.fillRect(x + 13, y + 6, 6, 22);

  if (connectsWest) {
    ctx.fillRect(x, y + 11, 16, 4);
    ctx.fillRect(x, y + 20, 16, 3);
  }

  if (connectsEast) {
    ctx.fillRect(x + 16, y + 11, 16, 4);
    ctx.fillRect(x + 16, y + 20, 16, 3);
  }

  if (connectsNorth) {
    ctx.fillRect(x + 10, y, 4, 15);
    ctx.fillRect(x + 19, y, 3, 15);
  }

  if (connectsSouth) {
    ctx.fillRect(x + 10, y + 16, 4, 16);
    ctx.fillRect(x + 19, y + 16, 3, 16);
  }
}

function drawBridgeConnections(ctx: CanvasRenderingContext2D, x: number, y: number, variant: TileVariant) {
  if (variant.neighbors.n === "water" || variant.neighbors.s === "water") {
    drawEdgeLine(ctx, x, y, "w", "#5d3e32", 0.4, 2);
    drawEdgeLine(ctx, x, y, "e", "#5d3e32", 0.4, 2);
  }

  if (variant.neighbors.e === "water" || variant.neighbors.w === "water") {
    drawEdgeLine(ctx, x, y, "n", "#5d3e32", 0.4, 2);
    drawEdgeLine(ctx, x, y, "s", "#5d3e32", 0.4, 2);
  }
}

function drawWaterConnections(ctx: CanvasRenderingContext2D, x: number, y: number, variant: TileVariant) {
  for (const direction of ["n", "e", "s", "w"] as Direction[]) {
    if (variant.neighbors[direction] === "water") {
      continue;
    }

    drawEdgeGradient(ctx, x, y, direction, "#154766", 0.26, 5);
  }
}

function createMaterialSource(tileId: TileId, base: string, shade: string, light: string, detail: TerrainDetail) {
  const source = document.createElement("canvas");
  source.width = SOURCE_TILE_SIZE;
  source.height = SOURCE_TILE_SIZE;
  const ctx = source.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create source material canvas.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawMaterialBase(ctx, base, shade, light, tileId);

  if (detail === "water") {
    drawWaterMaterial(ctx, shade, light);
    return source;
  }

  if (detail === "bridge") {
    drawBridgeMaterial(ctx, shade, light, tileId);
    return source;
  }

  if (detail === "stone" || detail === "cliff") {
    drawStoneMaterial(ctx, shade, light, tileId, detail === "cliff");
    return source;
  }

  if (detail === "fence") {
    drawFenceMaterial(ctx, shade, light, tileId);
    return source;
  }

  if (detail === "path") {
    drawPathMaterial(ctx, shade, light, tileId);
    return source;
  }

  drawGrassMaterial(ctx, shade, light, tileId, detail === "meadow");
  return source;
}

function drawMaterialBase(ctx: CanvasRenderingContext2D, base: string, shade: string, light: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SOURCE_TILE_SIZE, SOURCE_TILE_SIZE);

  const random = seededRandom(seed * 739 + 17);

  for (let i = 0; i < 180; i += 1) {
    const x = random() * SOURCE_TILE_SIZE;
    const y = random() * SOURCE_TILE_SIZE;
    const size = 2 + random() * 9;
    const color = random() > 0.5 ? light : shade;
    ctx.fillStyle = alphaHex(color, 0.035 + random() * 0.035);
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * (0.5 + random() * 0.5), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrassMaterial(ctx: CanvasRenderingContext2D, shade: string, light: string, seed: number, meadow: boolean) {
  const random = seededRandom(seed * 911 + 91);
  const blades = meadow ? 54 : 34;

  for (let i = 0; i < blades; i += 1) {
    const x = 18 + random() * (SOURCE_TILE_SIZE - 36);
    const y = 18 + random() * (SOURCE_TILE_SIZE - 36);
    const height = 10 + random() * (meadow ? 20 : 14);
    ctx.strokeStyle = alphaHex(random() > 0.42 ? light : shade, meadow ? 0.24 : 0.16);
    ctx.lineWidth = 2 + random() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + random() * 8 - 4, y - height * 0.55, x + random() * 10 - 5, y - height);
    ctx.stroke();
  }

  if (meadow) {
    for (let i = 0; i < 10; i += 1) {
      const x = 20 + random() * (SOURCE_TILE_SIZE - 40);
      const y = 20 + random() * (SOURCE_TILE_SIZE - 40);
      ctx.fillStyle = alphaHex(i % 2 === 0 ? "#fff0a8" : "#c5a7ff", 0.24);
      ctx.beginPath();
      ctx.ellipse(x, y, 5 + random() * 8, 3 + random() * 5, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPathMaterial(ctx: CanvasRenderingContext2D, shade: string, light: string, seed: number) {
  const random = seededRandom(seed * 613 + 23);

  for (let i = 0; i < 55; i += 1) {
    const x = 12 + random() * (SOURCE_TILE_SIZE - 24);
    const y = 12 + random() * (SOURCE_TILE_SIZE - 24);
    const radius = 5 + random() * 15;
    ctx.fillStyle = alphaHex(random() > 0.55 ? light : shade, 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.38 + random() * 0.42), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = alphaHex(shade, 0.1);
  ctx.lineWidth = 7;
  for (let i = 0; i < 4; i += 1) {
    const y = 20 + random() * (SOURCE_TILE_SIZE - 40);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(135, y + random() * 50 - 25, 330, y + random() * 50 - 25, SOURCE_TILE_SIZE, y + random() * 36 - 18);
    ctx.stroke();
  }
}

function drawStoneMaterial(ctx: CanvasRenderingContext2D, shade: string, light: string, seed: number, cliff: boolean) {
  const random = seededRandom(seed * 431 + 41);
  const rows = cliff ? 5 : 4;
  const rowHeight = SOURCE_TILE_SIZE / rows;

  ctx.strokeStyle = alphaHex(shade, 0.56);
  ctx.lineWidth = cliff ? 13 : 9;

  for (let row = 1; row < rows; row += 1) {
    const y = row * rowHeight + random() * 24 - 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(120, y - 22, 260, y + 24, SOURCE_TILE_SIZE, y - 8);
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    const x = random() * SOURCE_TILE_SIZE;
    const y = random() * SOURCE_TILE_SIZE;
    const width = 32 + random() * 96;
    ctx.strokeStyle = alphaHex(i % 2 === 0 ? light : shade, cliff ? 0.3 : 0.22);
    ctx.lineWidth = 4 + random() * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + random() * 30 - 15);
    ctx.stroke();
  }

  if (cliff) {
    const shadow = ctx.createLinearGradient(0, 0, 0, SOURCE_TILE_SIZE);
    shadow.addColorStop(0, "rgba(0, 0, 0, 0)");
    shadow.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, SOURCE_TILE_SIZE, SOURCE_TILE_SIZE);
  }
}

function drawWaterMaterial(ctx: CanvasRenderingContext2D, shade: string, light: string) {
  const waveGradient = ctx.createLinearGradient(0, 0, 0, SOURCE_TILE_SIZE);
  waveGradient.addColorStop(0, alphaHex(light, 0.16));
  waveGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
  waveGradient.addColorStop(1, alphaHex(shade, 0.26));
  ctx.fillStyle = waveGradient;
  ctx.fillRect(0, 0, SOURCE_TILE_SIZE, SOURCE_TILE_SIZE);

  for (let i = 0; i < 9; i += 1) {
    const y = 42 + i * 54;
    ctx.strokeStyle = alphaHex(i % 2 === 0 ? light : shade, i % 2 === 0 ? 0.48 : 0.3);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.bezierCurveTo(80, y - 25, 160, y + 24, 260, y);
    ctx.bezierCurveTo(350, y - 22, 420, y + 18, SOURCE_TILE_SIZE + 30, y - 5);
    ctx.stroke();
  }
}

function drawBridgeMaterial(ctx: CanvasRenderingContext2D, shade: string, light: string, seed: number) {
  const random = seededRandom(seed * 337 + 7);

  for (let y = 0; y < SOURCE_TILE_SIZE; y += 78) {
    ctx.fillStyle = alphaHex(shade, 0.28);
    ctx.fillRect(0, y, SOURCE_TILE_SIZE, 10);
    ctx.fillStyle = alphaHex(light, 0.18);
    ctx.fillRect(0, y + 14, SOURCE_TILE_SIZE, 5);
  }

  for (let x = 28; x < SOURCE_TILE_SIZE; x += 84) {
    ctx.fillStyle = alphaHex(light, 0.22);
    ctx.fillRect(x, 18, 12 + random() * 8, SOURCE_TILE_SIZE - 36);
    ctx.fillStyle = alphaHex(shade, 0.22);
    ctx.fillRect(x + 24, 18, 5, SOURCE_TILE_SIZE - 36);
  }
}

function drawFenceMaterial(ctx: CanvasRenderingContext2D, shade: string, light: string, seed: number) {
  const random = seededRandom(seed * 229 + 3);
  ctx.fillStyle = alphaHex(shade, 0.28);
  ctx.fillRect(0, 178, SOURCE_TILE_SIZE, 154);

  for (let x = 0; x < SOURCE_TILE_SIZE; x += 72) {
    const plankWidth = 42 + random() * 12;
    ctx.fillStyle = alphaHex(light, 0.52);
    ctx.fillRect(x + 11, 70, plankWidth, 365);
    ctx.fillStyle = alphaHex(shade, 0.34);
    ctx.fillRect(x + 11 + plankWidth - 8, 70, 8, 365);
  }

  ctx.fillStyle = alphaHex(shade, 0.5);
  ctx.fillRect(0, 188, SOURCE_TILE_SIZE, 38);
  ctx.fillRect(0, 312, SOURCE_TILE_SIZE, 30);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function alphaHex(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
