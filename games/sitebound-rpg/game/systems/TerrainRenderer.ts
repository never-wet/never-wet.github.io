import Phaser from "phaser";
import { TileId, TILE_SIZE, worldMap } from "../data/worldMap";

const CHUNK_TILES = 48;

type TerrainCategory = "natural" | "dirt" | "paved" | "water" | "bridge" | "cliff" | "fence";
type Direction = "n" | "e" | "s" | "w";

interface TileStyle {
  base: string;
  shade: string;
  light: string;
}

export class TerrainRenderer {
  static render(scene: Phaser.Scene) {
    const chunksX = Math.ceil(worldMap.width / CHUNK_TILES);
    const chunksY = Math.ceil(worldMap.height / CHUNK_TILES);

    for (let chunkY = 0; chunkY < chunksY; chunkY += 1) {
      for (let chunkX = 0; chunkX < chunksX; chunkX += 1) {
        const key = `terrain-surface-${chunkX}-${chunkY}`;

        if (!scene.textures.exists(key)) {
          scene.textures.addCanvas(key, createChunkCanvas(chunkX, chunkY));
        }

        const image = scene.add.image(chunkX * CHUNK_TILES * TILE_SIZE, chunkY * CHUNK_TILES * TILE_SIZE, key);
        image.setOrigin(0);
        image.setDepth(-100);
      }
    }
  }
}

function createChunkCanvas(chunkX: number, chunkY: number) {
  const startTileX = chunkX * CHUNK_TILES;
  const startTileY = chunkY * CHUNK_TILES;
  const widthTiles = Math.min(CHUNK_TILES, worldMap.width - startTileX);
  const heightTiles = Math.min(CHUNK_TILES, worldMap.height - startTileY);
  const canvas = document.createElement("canvas");
  canvas.width = widthTiles * TILE_SIZE;
  canvas.height = heightTiles * TILE_SIZE;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create terrain chunk canvas.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (let localY = 0; localY < heightTiles; localY += 1) {
    for (let localX = 0; localX < widthTiles; localX += 1) {
      drawTileBase(ctx, localX, localY, startTileX + localX, startTileY + localY);
    }
  }

  for (let localY = 0; localY < heightTiles; localY += 1) {
    for (let localX = 0; localX < widthTiles; localX += 1) {
      drawTileTransitions(ctx, localX, localY, startTileX + localX, startTileY + localY);
    }
  }

  return canvas;
}

function drawTileBase(ctx: CanvasRenderingContext2D, localX: number, localY: number, tileX: number, tileY: number) {
  const tile = tileAt(tileX, tileY);
  const style = tileStyle(tile);
  const x = localX * TILE_SIZE;
  const y = localY * TILE_SIZE;

  ctx.fillStyle = style.base;
  ctx.fillRect(x, y, TILE_SIZE + 0.5, TILE_SIZE + 0.5);

  if (tile === TileId.Grass || tile === TileId.Forest || tile === TileId.Meadow) {
    drawGrassDetails(ctx, x, y, tileX, tileY, style, tile === TileId.Meadow);
  } else if (tile === TileId.Path || tile === TileId.Sand) {
    drawDirtDetails(ctx, x, y, tileX, tileY, style);
  } else if (tile === TileId.Water) {
    drawWaterDetails(ctx, x, y, tileX, tileY, style);
  } else if (tile === TileId.Bridge || tile === TileId.Fence) {
    drawWoodDetails(ctx, x, y, tileX, tileY, style, tile === TileId.Fence);
  } else {
    drawStoneDetails(ctx, x, y, tileX, tileY, style, tile === TileId.Cliff);
  }
}

function drawTileTransitions(ctx: CanvasRenderingContext2D, localX: number, localY: number, tileX: number, tileY: number) {
  const tile = tileAt(tileX, tileY);
  const current = tileCategory(tile);
  const x = localX * TILE_SIZE;
  const y = localY * TILE_SIZE;

  for (const direction of ["n", "e", "s", "w"] as Direction[]) {
    const neighbor = tileCategory(tileAtOffset(tileX, tileY, direction));

    if (neighbor === current || current === "bridge" || neighbor === "bridge") {
      continue;
    }

    if (current === "water") {
      drawEdgeGradient(ctx, x, y, direction, "#e4c878", 0.38, 8);
      drawEdgeLine(ctx, x, y, direction, "#f5fbff", 0.2, 1);
    } else if (neighbor === "water") {
      drawEdgeGradient(ctx, x, y, direction, "#cfae69", 0.45, 9);
      drawEdgeLine(ctx, x, y, direction, "#174a68", 0.2, 1);
    } else if (current === "natural" && (neighbor === "dirt" || neighbor === "paved")) {
      drawEdgeGradient(ctx, x, y, direction, neighbor === "dirt" ? "#b98b55" : "#8d8788", 0.32, 9);
    } else if ((current === "dirt" || current === "paved") && neighbor === "natural") {
      drawEdgeGradient(ctx, x, y, direction, "#2f8b57", 0.34, 9);
      drawEdgeNoise(ctx, x, y, direction, "#62c06f", 0.16, tileX, tileY);
    } else if (neighbor === "cliff") {
      drawEdgeGradient(ctx, x, y, direction, "#251d2f", 0.28, 8);
    } else if (current === "cliff") {
      drawEdgeGradient(ctx, x, y, direction, "#8a789d", 0.22, 7);
    } else if (current === "dirt" && neighbor === "paved") {
      drawEdgeGradient(ctx, x, y, direction, "#a99f89", 0.22, 6);
    } else if (current === "paved" && neighbor === "dirt") {
      drawEdgeGradient(ctx, x, y, direction, "#b98b55", 0.2, 6);
    }
  }

  if (tile === TileId.Fence) {
    drawFenceRails(ctx, x, y, tileX, tileY);
  }
}

function drawGrassDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileX: number,
  tileY: number,
  style: TileStyle,
  meadow: boolean
) {
  const random = seededRandom(hash(tileX, tileY, 41));
  const marks = meadow ? 8 : 5;

  for (let index = 0; index < marks; index += 1) {
    const px = x + 3 + random() * 26;
    const py = y + 3 + random() * 26;
    ctx.fillStyle = alphaHex(random() > 0.55 ? style.light : style.shade, meadow ? 0.12 : 0.08);
    ctx.beginPath();
    ctx.ellipse(px, py, 1.2 + random() * 2.2, 0.8 + random() * 1.8, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  if (meadow) {
    ctx.fillStyle = alphaHex(random() > 0.5 ? "#fff0a8" : "#c5a7ff", 0.16);
    ctx.beginPath();
    ctx.ellipse(x + 7 + random() * 18, y + 7 + random() * 18, 1.4, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDirtDetails(ctx: CanvasRenderingContext2D, x: number, y: number, tileX: number, tileY: number, style: TileStyle) {
  const random = seededRandom(hash(tileX, tileY, 61));

  for (let index = 0; index < 7; index += 1) {
    ctx.fillStyle = alphaHex(random() > 0.5 ? style.light : style.shade, 0.1);
    ctx.beginPath();
    ctx.ellipse(x + random() * 32, y + random() * 32, 1.5 + random() * 3, 0.7 + random() * 1.6, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStoneDetails(ctx: CanvasRenderingContext2D, x: number, y: number, tileX: number, tileY: number, style: TileStyle, cliff: boolean) {
  const random = seededRandom(hash(tileX, tileY, 79));

  ctx.strokeStyle = alphaHex(style.shade, cliff ? 0.25 : 0.13);
  ctx.lineWidth = cliff ? 1.6 : 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 8 + random() * 18);
  ctx.lineTo(x + 32, y + 8 + random() * 18);
  ctx.stroke();

  if (random() > 0.42) {
    ctx.strokeStyle = alphaHex(style.light, 0.12);
    ctx.beginPath();
    ctx.moveTo(x + 5 + random() * 10, y + 5 + random() * 20);
    ctx.lineTo(x + 18 + random() * 11, y + 5 + random() * 20);
    ctx.stroke();
  }
}

function drawWaterDetails(ctx: CanvasRenderingContext2D, x: number, y: number, tileX: number, tileY: number, style: TileStyle) {
  const offset = ((tileX * 7 + tileY * 3) % 12) - 6;

  ctx.strokeStyle = alphaHex(style.light, 0.24);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + offset - 8, y + 9);
  ctx.bezierCurveTo(x + 8 + offset, y + 6, x + 18 + offset, y + 12, x + 40 + offset, y + 8);
  ctx.stroke();

  ctx.strokeStyle = alphaHex(style.shade, 0.14);
  ctx.beginPath();
  ctx.moveTo(x - offset - 5, y + 24);
  ctx.bezierCurveTo(x + 8 - offset, y + 21, x + 18 - offset, y + 27, x + 38 - offset, y + 23);
  ctx.stroke();
}

function drawWoodDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileX: number,
  tileY: number,
  style: TileStyle,
  fence: boolean
) {
  const random = seededRandom(hash(tileX, tileY, 103));

  ctx.strokeStyle = alphaHex(style.shade, 0.2);
  ctx.lineWidth = 1;

  for (let index = 0; index < (fence ? 2 : 4); index += 1) {
    const py = y + 5 + index * 7 + random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + 32, py + random() * 2 - 1);
    ctx.stroke();
  }
}

function drawFenceRails(ctx: CanvasRenderingContext2D, x: number, y: number, tileX: number, tileY: number) {
  const west = tileCategory(tileAt(tileX - 1, tileY)) === "fence";
  const east = tileCategory(tileAt(tileX + 1, tileY)) === "fence";
  const north = tileCategory(tileAt(tileX, tileY - 1)) === "fence";
  const south = tileCategory(tileAt(tileX, tileY + 1)) === "fence";

  ctx.fillStyle = alphaHex("#c99058", 0.42);
  ctx.fillRect(x + 13, y + 6, 6, 22);

  if (west) {
    ctx.fillRect(x, y + 12, 16, 3);
    ctx.fillRect(x, y + 20, 16, 2);
  }

  if (east) {
    ctx.fillRect(x + 16, y + 12, 16, 3);
    ctx.fillRect(x + 16, y + 20, 16, 2);
  }

  if (north) {
    ctx.fillRect(x + 10, y, 3, 14);
    ctx.fillRect(x + 20, y, 2, 14);
  }

  if (south) {
    ctx.fillRect(x + 10, y + 17, 3, 15);
    ctx.fillRect(x + 20, y + 17, 2, 15);
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

function drawEdgeNoise(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: Direction,
  color: string,
  alpha: number,
  tileX: number,
  tileY: number
) {
  const random = seededRandom(hash(tileX, tileY, 151));
  ctx.fillStyle = alphaHex(color, alpha);

  for (let index = 0; index < 4; index += 1) {
    const step = random() * TILE_SIZE;
    const inset = 2 + random() * 5;

    if (direction === "n") {
      ctx.fillRect(x + step, y + inset, 2, 2);
    } else if (direction === "s") {
      ctx.fillRect(x + step, y + TILE_SIZE - inset - 2, 2, 2);
    } else if (direction === "w") {
      ctx.fillRect(x + inset, y + step, 2, 2);
    } else {
      ctx.fillRect(x + TILE_SIZE - inset - 2, y + step, 2, 2);
    }
  }
}

function tileAtOffset(tileX: number, tileY: number, direction: Direction) {
  if (direction === "n") {
    return tileAt(tileX, tileY - 1);
  }

  if (direction === "s") {
    return tileAt(tileX, tileY + 1);
  }

  if (direction === "w") {
    return tileAt(tileX - 1, tileY);
  }

  return tileAt(tileX + 1, tileY);
}

function tileAt(tileX: number, tileY: number) {
  if (tileX < 0 || tileY < 0 || tileX >= worldMap.width || tileY >= worldMap.height) {
    return TileId.Cliff;
  }

  return worldMap.ground[tileY][tileX] as TileId;
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

function tileStyle(tile: TileId): TileStyle {
  switch (tile) {
    case TileId.Grass:
      return { base: "#2f8b57", shade: "#1d6c43", light: "#62c06f" };
    case TileId.Meadow:
      return { base: "#3d9b61", shade: "#2a774d", light: "#8ad66c" };
    case TileId.Path:
      return { base: "#b98b55", shade: "#8b6847", light: "#e0bd7c" };
    case TileId.Plaza:
      return { base: "#a99f89", shade: "#766f63", light: "#ddd0aa" };
    case TileId.RoadStone:
      return { base: "#667184", shade: "#444d62", light: "#9aa8ba" };
    case TileId.Water:
      return { base: "#226a94", shade: "#154766", light: "#64c7d8" };
    case TileId.Bridge:
      return { base: "#8e6143", shade: "#5d3e32", light: "#d3a16a" };
    case TileId.Forest:
      return { base: "#236648", shade: "#174733", light: "#58a76b" };
    case TileId.Sand:
      return { base: "#cfae69", shade: "#987b48", light: "#f2d88a" };
    case TileId.Ridge:
      return { base: "#7d7084", shade: "#544a63", light: "#b4a8bd" };
    case TileId.Cliff:
      return { base: "#4e425c", shade: "#2d2537", light: "#8a789d" };
    case TileId.Fence:
      return { base: "#725338", shade: "#3e2c22", light: "#c99058" };
    case TileId.Floor:
      return { base: "#7b6574", shade: "#4c3d4a", light: "#b78ca6" };
  }
}

function alphaHex(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

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

function hash(x: number, y: number, salt: number) {
  return Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 2246822519, 3266489917) ^ salt;
}
