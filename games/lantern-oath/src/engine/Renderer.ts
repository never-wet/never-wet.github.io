import { PixelFactory } from "../lib/assets/pixelFactory";
import { contentRegistry } from "../memory/contentRegistry";
import { CANVAS_HEIGHT, CANVAS_WIDTH, TILE_SIZE, type RenderState } from "./GameSession";

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pixels = new PixelFactory();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is required.");
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: RenderState): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawMap(state);
    this.drawPortalDecorations(state);
    this.drawNodes(state);
    this.drawPickups(state);
    this.drawNpcs(state);
    this.drawEnemies(state);
    this.drawProjectiles(state);
    this.drawFloatingTexts(state);
    this.drawPlayer(state);
    this.drawBossBar(state);
    this.drawNightTint(state.timeMinutes);
    this.drawInteractionHint(state);
  }

  private drawMap(state: RenderState): void {
    const { map, cameraX, cameraY } = state;
    const startTileX = Math.floor(cameraX / TILE_SIZE) - 1;
    const endTileX = Math.ceil((cameraX + CANVAS_WIDTH) / TILE_SIZE) + 1;
    const startTileY = Math.floor(cameraY / TILE_SIZE) - 1;
    const endTileY = Math.ceil((cameraY + CANVAS_HEIGHT) / TILE_SIZE) + 1;

    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
        const cell = map.layout[tileY]?.[tileX] ?? "#";
        const tile = map.legend[cell as keyof typeof map.legend];
        const screenX = tileX * TILE_SIZE - cameraX;
        const screenY = tileY * TILE_SIZE - cameraY;
        this.drawTile(tile?.kind ?? "wall", screenX, screenY);
      }
    }
  }

  private drawTile(kind: string, x: number, y: number): void {
    const baseColors: Record<string, string> = {
      grass: "#567d44",
      flowers: "#688450",
      road: "#92764b",
      dirt: "#7a5b3d",
      wood: "#8f633e",
      stone: "#7c8691",
      wall: "#38493c",
      water: "#3a6f96",
      sand: "#cbb37a",
      crop: "#7aa64c",
      forestFloor: "#4c6837",
      marsh: "#476a57",
      bridge: "#7b5937",
      ore: "#5f7284",
      ruin: "#878077",
      cave: "#4e535d",
      roof: "#914d3f",
      glow: "#365a70",
    };

    this.paint(x, y, TILE_SIZE, TILE_SIZE, baseColors[kind] ?? "#000000");
    this.paint(x, y, TILE_SIZE, 1, "rgba(255,255,255,0.08)");
    this.paint(x, y + TILE_SIZE - 1, TILE_SIZE, 1, "rgba(0,0,0,0.18)");

    switch (kind) {
      case "grass":
        this.drawGrass(x, y, false);
        break;
      case "flowers":
        this.drawGrass(x, y, true);
        break;
      case "road":
        this.drawRoad(x, y);
        break;
      case "dirt":
        this.drawDirt(x, y);
        break;
      case "wood":
        this.drawWood(x, y);
        break;
      case "stone":
        this.drawStone(x, y);
        break;
      case "wall":
        this.drawWall(x, y);
        break;
      case "water":
        this.drawWater(x, y);
        break;
      case "sand":
        this.drawSand(x, y);
        break;
      case "crop":
        this.drawCrop(x, y);
        break;
      case "forestFloor":
        this.drawForestFloor(x, y);
        break;
      case "marsh":
        this.drawMarsh(x, y);
        break;
      case "bridge":
        this.drawBridge(x, y);
        break;
      case "ore":
        this.drawOre(x, y);
        break;
      case "ruin":
        this.drawRuin(x, y);
        break;
      case "cave":
        this.drawCave(x, y);
        break;
      case "roof":
        this.drawRoof(x, y);
        break;
      case "glow":
        this.drawGlow(x, y);
        break;
    }
  }

  private drawPortalDecorations(state: RenderState): void {
    const { map, cameraX, cameraY } = state;

    map.portals.forEach((portal) => {
      const target = contentRegistry.maps[portal.targetMapId];
      if (!target) {
        return;
      }

      const screenX = portal.x * TILE_SIZE - cameraX;
      const screenY = portal.y * TILE_SIZE - cameraY;

      if (screenX > CANVAS_WIDTH || screenY > CANVAS_HEIGHT || screenX + portal.width * TILE_SIZE < 0 || screenY + portal.height * TILE_SIZE < 0) {
        return;
      }

      if (map.theme !== "interior" && target.theme === "interior" && portal.width === 1 && portal.height === 1) {
        this.drawExteriorDoor(screenX, screenY, map.theme === "city");
        return;
      }

      if (map.theme === "interior" && target.theme !== "interior") {
        this.drawInteriorThreshold(screenX, screenY, portal.width);
        return;
      }

      if (target.theme === "dungeon" || target.theme === "mine" || target.theme === "ruin") {
        this.drawStoneGate(screenX, screenY, portal.width, portal.height);
        return;
      }

      const edgePortal =
        portal.x === 0 ||
        portal.y === 0 ||
        portal.x + portal.width >= map.width ||
        portal.y + portal.height >= map.height;

      if (edgePortal) {
        this.drawTravelMarker(screenX, screenY, portal.width, portal.height);
      }
    });
  }

  private drawNodes(state: RenderState): void {
    state.nodes.forEach((node) => {
      if (!node.available) {
        return;
      }
      this.pixels.drawSprite(this.ctx, node.spriteId, node.x - state.cameraX - 8, node.y - state.cameraY - 10, 16, 0);
    });
  }

  private drawPickups(state: RenderState): void {
    state.pickups.forEach((pickup) => {
      const x = pickup.x - state.cameraX - 8;
      const y = pickup.y - state.cameraY - 8;
      if (pickup.gold) {
        this.paint(x + 4, y + 4, 8, 8, "#f3d26a");
        this.paint(x + 5, y + 5, 6, 6, "#d79e42");
        this.paint(x + 6, y + 6, 4, 4, "#fff7aa");
      } else if (pickup.itemId) {
        const iconId = contentRegistry.items[pickup.itemId]?.iconId ?? "icon_key";
        this.pixels.drawSprite(this.ctx, iconId, x, y, 16, 0);
      }
    });
  }

  private drawNpcs(state: RenderState): void {
    state.npcs.forEach((npc) => {
      const screenX = npc.x - state.cameraX - 8;
      const screenY = npc.y - state.cameraY - 12;
      this.paint(screenX + 3, screenY + 13, 10, 3, "rgba(0,0,0,0.25)");
      this.pixels.drawSprite(this.ctx, npc.spriteId, screenX, screenY, 16, npc.frame, npc.facing === "left");

      if (npc.marker) {
        const markerSprite = npc.marker === "turnin" ? "turnin_marker" : npc.marker === "quest" ? "quest_marker" : "ui_logo_emblem";
        this.pixels.drawSprite(this.ctx, markerSprite, screenX, screenY - 10, 12, 0);
      }
    });
  }

  private drawEnemies(state: RenderState): void {
    state.enemies.forEach((enemy) => {
      const screenX = enemy.x - state.cameraX - 8;
      const screenY = enemy.y - state.cameraY - (enemy.elite ? 14 : 12);
      this.paint(screenX + 2, screenY + 13, enemy.elite ? 12 : 10, 3, "rgba(0,0,0,0.25)");
      this.pixels.drawSprite(this.ctx, enemy.spriteId, screenX, screenY, enemy.elite ? 20 : 16, enemy.frame, enemy.facing === "left");

      const barWidth = enemy.elite ? 20 : 16;
      const healthRatio = enemy.health / Math.max(enemy.maxHealth, 1);
      this.paint(screenX, screenY - 5, barWidth, 3, "#1a1a1a");
      this.paint(screenX + 1, screenY - 4, (barWidth - 2) * healthRatio, 1.5, enemy.elite ? "#f59b73" : "#9af5b5");
    });
  }

  private drawProjectiles(state: RenderState): void {
    state.projectiles.forEach((projectile) => {
      const x = projectile.x - state.cameraX;
      const y = projectile.y - state.cameraY;
      this.paint(x - projectile.radius, y - projectile.radius, projectile.radius * 2, projectile.radius * 2, projectile.owner === "player" ? "#fff0a8" : "#8fd0ff");
      this.paint(x - projectile.radius + 1, y - projectile.radius + 1, Math.max(1, projectile.radius * 2 - 2), Math.max(1, projectile.radius * 2 - 2), projectile.owner === "player" ? "#f3c965" : "#d6f7ff");
    });
  }

  private drawPlayer(state: RenderState): void {
    const screenX = state.player.x - state.cameraX - 8;
    const screenY = state.player.y - state.cameraY - 12;
    this.paint(screenX + 2, screenY + 13, 10, 3, "rgba(0,0,0,0.28)");
    this.pixels.drawSprite(
      this.ctx,
      "player_riven",
      screenX,
      screenY,
      state.player.dodging ? 18 : 16,
      state.player.animFrame,
      state.player.facing === "left",
    );
  }

  private drawFloatingTexts(state: RenderState): void {
    this.ctx.font = "8px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    state.floatingTexts.forEach((text) => {
      this.ctx.fillStyle = text.color;
      this.ctx.fillText(text.text, text.x - state.cameraX, text.y - state.cameraY);
    });
    this.ctx.textAlign = "left";
  }

  private drawBossBar(state: RenderState): void {
    const boss = state.enemies.find((enemy) => enemy.elite);
    if (!boss) {
      return;
    }

    const ratio = boss.health / Math.max(boss.maxHealth, 1);
    this.paint(96, 10, 320, 20, "rgba(12, 16, 24, 0.8)");
    this.paint(104, 18, 304, 6, "#2b1b22");
    this.paint(105, 19, 302 * ratio, 4, "#f59b73");
    this.ctx.fillStyle = "#fff3d1";
    this.ctx.font = "10px 'Courier New', monospace";
    this.ctx.fillText("The Hollow Stag", 182, 16);
  }

  private drawInteractionHint(state: RenderState): void {
    const hint = state.interactionHint;
    if (!hint) {
      return;
    }

    const bobOffset = Math.sin(state.animationMs / 180) * 2;
    const x = Math.round(hint.x - state.cameraX);
    const y = Math.round(hint.y - state.cameraY - 10 + bobOffset);
    const keyWidth = 12;
    const keyHeight = 12;
    const labelPadding = 4;

    this.ctx.font = "8px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const labelWidth = Math.max(24, Math.ceil(this.ctx.measureText(hint.label).width) + labelPadding * 2);
    const totalWidth = keyWidth + 4 + labelWidth;
    const originX = Math.round(Math.max(2, Math.min(CANVAS_WIDTH - totalWidth - 2, x - Math.floor(totalWidth / 2))));
    const originY = Math.round(Math.max(2, Math.min(CANVAS_HEIGHT - keyHeight - 2, y - 8)));

    this.paint(originX, originY, keyWidth, keyHeight, "#101726");
    this.paint(originX, originY, keyWidth, 1, "#f1d16c");
    this.paint(originX, originY + keyHeight - 1, keyWidth, 1, "#5a4222");
    this.paint(originX, originY, 1, keyHeight, "#f1d16c");
    this.paint(originX + keyWidth - 1, originY, 1, keyHeight, "#f1d16c");

    const labelX = originX + keyWidth + 4;
    this.paint(labelX, originY + 1, labelWidth, keyHeight - 2, "rgba(16, 23, 38, 0.95)");
    this.paint(labelX, originY + 1, labelWidth, 1, "#f1d16c");
    this.paint(labelX, originY + keyHeight - 2, labelWidth, 1, "#5a4222");
    this.paint(labelX, originY + 1, 1, keyHeight - 2, "#f1d16c");
    this.paint(labelX + labelWidth - 1, originY + 1, 1, keyHeight - 2, "#f1d16c");

    this.ctx.fillStyle = "#fff7dc";
    this.ctx.fillText(hint.key, originX + keyWidth / 2, originY + keyHeight / 2 + 0.5);
    this.ctx.fillText(hint.label, labelX + labelWidth / 2, originY + keyHeight / 2 + 0.5);

    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "alphabetic";
  }

  private drawNightTint(minutes: number): void {
    const hour = (minutes / 60) % 24;
    let alpha = 0;
    if (hour >= 19 || hour < 5) {
      alpha = 0.28;
    } else if (hour >= 17) {
      alpha = 0.14;
    } else if (hour < 7) {
      alpha = 0.12;
    }

    if (alpha <= 0) {
      return;
    }

    this.paint(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, `rgba(21, 29, 52, ${alpha})`);
  }

  private drawGrass(x: number, y: number, flowers: boolean): void {
    this.paint(x + 2, y + 4, 1, 4, "#6ea055");
    this.paint(x + 5, y + 2, 1, 5, "#7cad5b");
    this.paint(x + 10, y + 3, 1, 4, "#6ea055");
    this.paint(x + 13, y + 6, 1, 4, "#7cad5b");
    this.paint(x + 7, y + 10, 2, 2, "#446734");
    this.paint(x + 11, y + 12, 2, 2, "#446734");
    if (flowers) {
      this.paint(x + 3, y + 5, 2, 2, "#e4c47b");
      this.paint(x + 8, y + 8, 2, 2, "#d28bb8");
      this.paint(x + 12, y + 4, 1, 1, "#fff3b5");
      this.paint(x + 4, y + 11, 1, 1, "#fff3b5");
    }
  }

  private drawRoad(x: number, y: number): void {
    this.paint(x + 1, y + 5, 14, 1, "#7c643d");
    this.paint(x + 1, y + 10, 14, 1, "#7c643d");
    this.paint(x + 4, y + 3, 2, 2, "#a88959");
    this.paint(x + 11, y + 7, 2, 2, "#a88959");
    this.paint(x + 7, y + 12, 2, 2, "#b89a68");
  }

  private drawDirt(x: number, y: number): void {
    this.paint(x + 3, y + 4, 2, 2, "#694d34");
    this.paint(x + 10, y + 6, 2, 2, "#8a6848");
    this.paint(x + 6, y + 11, 3, 2, "#694d34");
    this.paint(x + 12, y + 12, 2, 1, "#9a7755");
  }

  private drawWood(x: number, y: number): void {
    this.paint(x, y + 3, TILE_SIZE, 1, "#b27d4b");
    this.paint(x, y + 7, TILE_SIZE, 1, "#6d472c");
    this.paint(x, y + 11, TILE_SIZE, 1, "#b27d4b");
    this.paint(x + 4, y + 1, 1, 14, "#785131");
    this.paint(x + 10, y + 2, 1, 12, "#785131");
    this.paint(x + 5, y + 7, 1, 1, "#ddbc7d");
    this.paint(x + 11, y + 11, 1, 1, "#ddbc7d");
  }

  private drawStone(x: number, y: number): void {
    this.paint(x, y + 7, TILE_SIZE, 1, "#616d79");
    this.paint(x + 7, y, 1, TILE_SIZE, "#616d79");
    this.paint(x + 2, y + 2, 4, 4, "#9ca5af");
    this.paint(x + 9, y + 9, 4, 4, "#909aa4");
    this.paint(x + 4, y + 11, 1, 2, "#b6bec6");
  }

  private drawWall(x: number, y: number): void {
    this.paint(x, y + 5, TILE_SIZE, 1, "#28352c");
    this.paint(x, y + 10, TILE_SIZE, 1, "#28352c");
    this.paint(x + 5, y, 1, 6, "#28352c");
    this.paint(x + 11, y + 5, 1, 6, "#28352c");
    this.paint(x + 2, y + 2, 2, 2, "#4e6452");
    this.paint(x + 9, y + 8, 2, 2, "#4e6452");
  }

  private drawWater(x: number, y: number): void {
    this.paint(x + 1, y + 4, 5, 1, "#87c7e7");
    this.paint(x + 8, y + 7, 6, 1, "#87c7e7");
    this.paint(x + 3, y + 11, 5, 1, "#69abc7");
    this.paint(x + 11, y + 12, 2, 1, "#dff8ff");
  }

  private drawSand(x: number, y: number): void {
    this.paint(x + 2, y + 4, 2, 2, "#e4d094");
    this.paint(x + 9, y + 5, 2, 2, "#d3bd7d");
    this.paint(x + 5, y + 10, 2, 2, "#e4d094");
    this.paint(x + 12, y + 12, 1, 1, "#bca266");
  }

  private drawCrop(x: number, y: number): void {
    this.paint(x, y + 4, TILE_SIZE, 1, "#5c7e39");
    this.paint(x, y + 9, TILE_SIZE, 1, "#5c7e39");
    this.paint(x + 2, y + 2, 2, 2, "#a8d56b");
    this.paint(x + 7, y + 6, 2, 2, "#a8d56b");
    this.paint(x + 11, y + 11, 2, 2, "#a8d56b");
  }

  private drawForestFloor(x: number, y: number): void {
    this.paint(x + 3, y + 3, 2, 2, "#5d8042");
    this.paint(x + 10, y + 4, 2, 2, "#5d8042");
    this.paint(x + 6, y + 9, 3, 2, "#3c512a");
    this.paint(x + 12, y + 11, 2, 2, "#3c512a");
  }

  private drawMarsh(x: number, y: number): void {
    this.paint(x + 2, y + 6, 5, 3, "#315244");
    this.paint(x + 10, y + 8, 4, 2, "#315244");
    this.paint(x + 5, y + 2, 1, 4, "#91b56f");
    this.paint(x + 11, y + 3, 1, 4, "#91b56f");
  }

  private drawBridge(x: number, y: number): void {
    this.paint(x, y + 2, TILE_SIZE, 1, "#533823");
    this.paint(x, y + 13, TILE_SIZE, 1, "#533823");
    this.paint(x + 3, y + 1, 1, 14, "#9d7245");
    this.paint(x + 7, y + 1, 1, 14, "#9d7245");
    this.paint(x + 11, y + 1, 1, 14, "#9d7245");
    this.paint(x + 4, y + 7, 1, 1, "#d7b27b");
    this.paint(x + 12, y + 9, 1, 1, "#d7b27b");
  }

  private drawOre(x: number, y: number): void {
    this.paint(x + 2, y + 8, 12, 5, "#465360");
    this.paint(x + 4, y + 3, 3, 5, "#8fd0ff");
    this.paint(x + 8, y + 5, 2, 6, "#d6f8ff");
    this.paint(x + 11, y + 4, 2, 4, "#8fd0ff");
  }

  private drawRuin(x: number, y: number): void {
    this.paint(x, y + 5, TILE_SIZE, 1, "#6d675f");
    this.paint(x, y + 10, TILE_SIZE, 1, "#6d675f");
    this.paint(x + 5, y, 1, 6, "#6d675f");
    this.paint(x + 10, y + 5, 1, 6, "#6d675f");
    this.paint(x + 3, y + 3, 1, 8, "#b3aca2");
    this.paint(x + 11, y + 9, 2, 1, "#b3aca2");
  }

  private drawCave(x: number, y: number): void {
    this.paint(x + 2, y + 2, 4, 3, "#636872");
    this.paint(x + 9, y + 4, 4, 3, "#636872");
    this.paint(x + 4, y + 10, 6, 3, "#3d4148");
    this.paint(x + 11, y + 11, 2, 2, "#767c87");
  }

  private drawRoof(x: number, y: number): void {
    this.paint(x, y + 2, TILE_SIZE, 2, "#5b2924");
    this.paint(x, y + 4, TILE_SIZE, 1, "#6c352d");
    this.paint(x, y + 9, TILE_SIZE, 1, "#6c352d");
    this.paint(x, y + 13, TILE_SIZE, 2, "#6a342c");
    this.paint(x + 1, y + 1, 14, 1, "#d7987b");
    this.paint(x + 2, y + 4, 4, 2, "#bf6f59");
    this.paint(x + 8, y + 4, 4, 2, "#bf6f59");
    this.paint(x + 4, y + 7, 4, 2, "#d08269");
    this.paint(x + 11, y + 7, 3, 2, "#d08269");
    this.paint(x + 2, y + 11, 4, 2, "#bf6f59");
    this.paint(x + 9, y + 11, 4, 2, "#bf6f59");
    this.paint(x + 3, y + 5, 1, 8, "#7b4036");
    this.paint(x + 9, y + 5, 1, 8, "#7b4036");
  }

  private drawGlow(x: number, y: number): void {
    this.paint(x + 3, y + 2, 2, 10, "#69c7ef");
    this.paint(x + 4, y + 4, 6, 2, "#d9f8ff");
    this.paint(x + 8, y + 8, 2, 6, "#69c7ef");
    this.paint(x + 9, y + 10, 4, 2, "#d9f8ff");
  }

  private drawExteriorDoor(x: number, y: number, cityStyle: boolean): void {
    const facade = cityStyle ? "#8b8d91" : "#b69563";
    const trim = cityStyle ? "#d8dce0" : "#e6cf92";
    const frame = cityStyle ? "#545a63" : "#6d472c";
    const door = cityStyle ? "#6d4c3f" : "#7d5235";
    const stoop = cityStyle ? "#8d8f95" : "#a58859";
    const stoopShadow = cityStyle ? "#545963" : "#5a3f2a";
    this.paint(x, y, TILE_SIZE, TILE_SIZE, facade);
    this.paint(x, y, TILE_SIZE, 2, "rgba(255,255,255,0.12)");
    this.paint(x + 2, y + 2, 12, 2, trim);
    this.paint(x + 3, y + 3, 10, 11, frame);
    this.paint(x + 4, y + 4, 8, 10, door);
    this.paint(x + 5, y + 5, 6, 2, "rgba(255,255,255,0.18)");
    this.paint(x + 10, y + 9, 1, 1, "#f3d26a");
    this.paint(x + 1, y + 13, 14, 1, "rgba(0,0,0,0.18)");
    this.paint(x + 4, y + 14, 8, 2, stoopShadow);
    this.paint(x + 3, y + 15, 10, 3, stoop);
    this.paint(x + 5, y + 15, 6, 1, "rgba(255,255,255,0.18)");
    this.paint(x + 2, y + 8, 1, 6, trim);
    this.paint(x + 13, y + 8, 1, 6, trim);
    this.paint(x + 2, y + 14, 1, 2, "#f3d26a");
    this.paint(x + 13, y + 14, 1, 2, "#f3d26a");
  }

  private drawInteriorThreshold(x: number, y: number, width: number): void {
    this.paint(x, y, width * TILE_SIZE, TILE_SIZE, "#6f5235");
    this.paint(x, y + 2, width * TILE_SIZE, 3, "#2a1c14");
    this.paint(x + 2, y + 9, width * TILE_SIZE - 4, 4, "#8d6b44");
    this.paint(x + 3, y + 10, width * TILE_SIZE - 6, 2, "#d4bb85");
  }

  private drawStoneGate(x: number, y: number, width: number, height: number): void {
    const pixelWidth = width * TILE_SIZE;
    const pixelHeight = height * TILE_SIZE;
    this.paint(x, y, pixelWidth, pixelHeight, "rgba(0,0,0,0)");
    this.paint(x, y, pixelWidth, 2, "#c8c4ba");
    this.paint(x, y + pixelHeight - 2, pixelWidth, 2, "#5d5a56");
    this.paint(x, y, 2, pixelHeight, "#c8c4ba");
    this.paint(x + pixelWidth - 2, y, 2, pixelHeight, "#c8c4ba");
    this.paint(x + 4, y + 4, pixelWidth - 8, pixelHeight - 8, "#1f2530");
    this.paint(x + pixelWidth / 2 - 1, y + 6, 2, pixelHeight - 12, "#76d7ff");
  }

  private drawTravelMarker(x: number, y: number, width: number, height: number): void {
    const pixelWidth = width * TILE_SIZE;
    const pixelHeight = height * TILE_SIZE;
    this.paint(x, y, pixelWidth, pixelHeight, "rgba(0,0,0,0)");
    if (pixelWidth >= pixelHeight) {
      this.paint(x + 2, y + 2, 2, pixelHeight - 4, "#f3d26a");
      this.paint(x + pixelWidth - 4, y + 2, 2, pixelHeight - 4, "#f3d26a");
    } else {
      this.paint(x + 2, y + 2, pixelWidth - 4, 2, "#f3d26a");
      this.paint(x + 2, y + pixelHeight - 4, pixelWidth - 4, 2, "#f3d26a");
    }
  }

  private paint(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }
}
