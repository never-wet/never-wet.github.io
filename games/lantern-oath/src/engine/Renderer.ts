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
    this.drawEnemyTelegraphs(state);
    this.drawNodes(state);
    this.drawPickups(state);
    this.drawNpcs(state);
    this.drawEnemies(state);
    this.drawProjectiles(state);
    this.drawFloatingTexts(state);
    this.drawPlayer(state);
    this.drawPlayerAttackEffect(state);
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
        const markerSprite =
          npc.marker === "turnin"
            ? "turnin_marker"
            : npc.marker === "quest"
              ? "quest_marker"
              : npc.marker === "job"
                ? "job_marker"
                : npc.marker === "shop"
                  ? "shop_marker"
                  : "ui_logo_emblem";
        this.pixels.drawSprite(this.ctx, markerSprite, screenX, screenY - 10, 12, 0);
      }
    });
  }

  private drawEnemyTelegraphs(state: RenderState): void {
    state.enemies.forEach((enemy) => {
      if (!enemy.telegraph) {
        return;
      }

      const centerX = enemy.x - state.cameraX;
      const centerY = enemy.y - state.cameraY;
      const { kind, progress, color, dirX, dirY, range } = enemy.telegraph;
      const directionLength = Math.hypot(dirX, dirY) || 1;
      const forwardX = dirX / directionLength;
      const forwardY = dirY / directionLength;
      const alpha = 0.12 + progress * 0.2;
      const strokeAlpha = 0.35 + progress * 0.35;

      switch (kind) {
        case "melee":
          this.drawTelegraphLane(centerX, centerY, forwardX, forwardY, range + 8, enemy.elite ? 16 : 12, color, alpha, strokeAlpha);
          break;
        case "projectile":
          this.drawTelegraphLane(centerX, centerY, forwardX, forwardY, Math.max(range, 72), 8, color, alpha * 0.8, strokeAlpha);
          break;
        case "charge":
          this.drawTelegraphLane(centerX, centerY, forwardX, forwardY, range + 18, enemy.elite ? 18 : 14, color, alpha * 1.05, strokeAlpha);
          break;
        case "spread":
          this.drawTelegraphFan(centerX, centerY, Math.atan2(forwardY, forwardX), range, color, alpha, strokeAlpha);
          break;
        case "nova":
          this.drawTelegraphRing(centerX, centerY, 16 + progress * range, 3, color, alpha * 0.85, strokeAlpha);
          break;
      }
    });
  }

  private drawTelegraphLane(
    centerX: number,
    centerY: number,
    dirX: number,
    dirY: number,
    length: number,
    width: number,
    color: string,
    fillAlpha: number,
    strokeAlpha: number,
  ): void {
    const perpX = -dirY;
    const perpY = dirX;
    const startX = centerX + dirX * 6;
    const startY = centerY + dirY * 6;
    const endX = centerX + dirX * length;
    const endY = centerY + dirY * length;
    const halfWidth = width / 2;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(startX + perpX * halfWidth, startY + perpY * halfWidth);
    this.ctx.lineTo(startX - perpX * halfWidth, startY - perpY * halfWidth);
    this.ctx.lineTo(endX - perpX * halfWidth, endY - perpY * halfWidth);
    this.ctx.lineTo(endX + perpX * halfWidth, endY + perpY * halfWidth);
    this.ctx.closePath();
    this.ctx.fillStyle = this.toRgba(color, fillAlpha);
    this.ctx.strokeStyle = this.toRgba(color, strokeAlpha);
    this.ctx.lineWidth = 1.5;
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawTelegraphFan(
    centerX: number,
    centerY: number,
    angle: number,
    radius: number,
    color: string,
    fillAlpha: number,
    strokeAlpha: number,
  ): void {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.arc(centerX, centerY, radius, angle - 0.42, angle + 0.42);
    this.ctx.closePath();
    this.ctx.fillStyle = this.toRgba(color, fillAlpha);
    this.ctx.strokeStyle = this.toRgba(color, strokeAlpha);
    this.ctx.lineWidth = 1.5;
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawTelegraphRing(
    centerX: number,
    centerY: number,
    radius: number,
    thickness: number,
    color: string,
    fillAlpha: number,
    strokeAlpha: number,
  ): void {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = this.toRgba(color, strokeAlpha);
    this.ctx.lineWidth = thickness;
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, Math.max(1, radius - thickness * 1.2), 0, Math.PI * 2);
    this.ctx.strokeStyle = this.toRgba(color, fillAlpha);
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawEnemies(state: RenderState): void {
    state.enemies.forEach((enemy) => {
      const screenX = enemy.x - state.cameraX - 8;
      const screenY = enemy.y - state.cameraY - (enemy.elite ? 14 : 12);
      this.paint(screenX + 2, screenY + 13, enemy.elite ? 12 : 10, 3, "rgba(0,0,0,0.25)");
      this.pixels.drawSprite(this.ctx, enemy.spriteId, screenX, screenY, enemy.elite ? 20 : 16, enemy.frame, enemy.facing === "left");

      if (enemy.hurtMs > 0 && Math.floor(enemy.hurtMs / 45) % 2 === 0) {
        this.paint(screenX + 1, screenY + 1, enemy.elite ? 18 : 14, enemy.elite ? 18 : 14, "rgba(255,243,209,0.22)");
      }

      const barWidth = enemy.elite ? 20 : 16;
      const healthRatio = enemy.health / Math.max(enemy.maxHealth, 1);
      this.paint(screenX, screenY - 5, barWidth, 3, "#1a1a1a");
      this.paint(screenX + 1, screenY - 4, (barWidth - 2) * healthRatio, 1.5, enemy.elite ? "#f59b73" : "#9af5b5");
    });
  }

  private drawProjectiles(state: RenderState): void {
    state.projectiles.forEach((projectile) => {
      const x = Math.round(projectile.x - state.cameraX);
      const y = Math.round(projectile.y - state.cameraY);
      this.drawProjectileTrail(x, y, projectile.vx, projectile.vy, projectile.spriteId);
      this.drawProjectileSprite(x, y, projectile.spriteId, projectile.vx, projectile.vy, projectile.radius);
    });
  }

  private drawProjectileTrail(x: number, y: number, vx: number, vy: number, spriteId: string): void {
    const stepX = vx === 0 ? 0 : Math.sign(vx);
    const stepY = vy === 0 ? 0 : Math.sign(vy);
    const colors: Record<string, [string, string]> = {
      arrow_amber: ["rgba(243, 210, 106, 0.45)", "rgba(255, 243, 181, 0.75)"],
      ember_orb: ["rgba(214, 83, 82, 0.4)", "rgba(255, 155, 115, 0.7)"],
      lantern_spark: ["rgba(143, 208, 255, 0.45)", "rgba(217, 248, 255, 0.82)"],
      moth_dust: ["rgba(195, 199, 160, 0.35)", "rgba(239, 245, 216, 0.68)"],
      salt_bolt: ["rgba(143, 208, 255, 0.4)", "rgba(214, 247, 255, 0.75)"],
      shard_shot: ["rgba(86, 174, 240, 0.4)", "rgba(196, 240, 255, 0.75)"],
      stag_flare: ["rgba(245, 155, 115, 0.38)", "rgba(236, 246, 255, 0.8)"],
    };
    const [outer, inner] = colors[spriteId] ?? ["rgba(255, 240, 168, 0.35)", "rgba(243, 201, 101, 0.7)"];
    this.paint(x - stepX * 5 - 1, y - stepY * 5 - 1, 2, 2, outer);
    this.paint(x - stepX * 3, y - stepY * 3, 1, 1, inner);
  }

  private drawProjectileSprite(x: number, y: number, spriteId: string, vx: number, vy: number, radius: number): void {
    const horizontal = Math.abs(vx) >= Math.abs(vy);
    const forward = horizontal ? Math.sign(vx || 1) : Math.sign(vy || 1);

    switch (spriteId) {
      case "arrow_amber":
        if (horizontal) {
          const left = forward >= 0 ? x - 5 : x + 1;
          this.paint(left, y - 1, 6, 2, "#8d603a");
          this.paint(forward >= 0 ? x + 1 : x - 2, y - 2, 2, 4, "#f3d26a");
          this.paint(forward >= 0 ? x - 6 : x + 4, y - 2, 2, 1, "#dfe7ea");
          this.paint(forward >= 0 ? x - 6 : x + 4, y + 1, 2, 1, "#dfe7ea");
        } else {
          const top = forward >= 0 ? y - 5 : y + 1;
          this.paint(x - 1, top, 2, 6, "#8d603a");
          this.paint(x - 2, forward >= 0 ? y + 1 : y - 2, 4, 2, "#f3d26a");
          this.paint(x - 2, forward >= 0 ? y - 6 : y + 4, 1, 2, "#dfe7ea");
          this.paint(x + 1, forward >= 0 ? y - 6 : y + 4, 1, 2, "#dfe7ea");
        }
        break;
      case "ember_orb":
        this.paint(x - 4, y - 4, 8, 8, "#6e2f2a");
        this.paint(x - 3, y - 3, 6, 6, "#d35252");
        this.paint(x - 2, y - 2, 4, 4, "#ff9b73");
        this.paint(x - 1, y - 1, 2, 2, "#fff0a8");
        this.paint(x - 5, y - 1, 1, 1, "#f59b73");
        this.paint(x + 4, y, 1, 1, "#f59b73");
        break;
      case "lantern_spark":
        this.paint(x - 1, y - 5, 2, 10, "#8fd0ff");
        this.paint(x - 5, y - 1, 10, 2, "#8fd0ff");
        this.paint(x - 3, y - 3, 6, 6, "#d9f8ff");
        this.paint(x - 1, y - 1, 2, 2, "#fff7dc");
        break;
      case "moth_dust":
        this.paint(x - 3, y - 2, 2, 2, "#baa17b");
        this.paint(x - 1, y - 3, 2, 2, "#d2bb97");
        this.paint(x + 1, y - 1, 2, 2, "#baa17b");
        this.paint(x - 2, y + 1, 2, 2, "#eff5d8");
        this.paint(x + 2, y + 1, 1, 1, "#5b4a44");
        break;
      case "salt_bolt":
        if (horizontal) {
          this.paint(x - 5, y - 1, 10, 2, "#5f94b0");
          this.paint(x - 2, y - 2, 4, 4, "#d7eef7");
        } else {
          this.paint(x - 1, y - 5, 2, 10, "#5f94b0");
          this.paint(x - 2, y - 2, 4, 4, "#d7eef7");
        }
        this.paint(x - 1, y - 1, 2, 2, "#ffffff");
        break;
      case "shard_shot":
        this.paint(x - 3, y - 5, 6, 10, "#56aef0");
        this.paint(x - 2, y - 4, 4, 8, "#87d8ff");
        this.paint(x - 1, y - 2, 2, 4, "#ffffff");
        break;
      case "stag_flare":
        this.paint(x - 5, y - 5, 10, 10, "#4a687f");
        this.paint(x - 4, y - 4, 8, 8, "#8fd0ff");
        this.paint(x - 3, y - 3, 6, 6, "#f59b73");
        this.paint(x - 2, y - 2, 4, 4, "#ecf6ff");
        this.paint(x - 1, y - 1, 2, 2, "#ffffff");
        break;
      default:
        this.paint(x - radius, y - radius, radius * 2, radius * 2, "#fff0a8");
        this.paint(x - radius + 1, y - radius + 1, Math.max(1, radius * 2 - 2), Math.max(1, radius * 2 - 2), "#f3c965");
        break;
    }
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

    if (state.player.hurtMs > 0 && Math.floor(state.player.hurtMs / 70) % 2 === 0) {
      this.paint(screenX + 1, screenY + 1, 14, 14, "rgba(255, 214, 214, 0.2)");
    }
  }

  private drawPlayerAttackEffect(state: RenderState): void {
    if (!state.player.attacking) {
      return;
    }

    const centerX = state.player.x - state.cameraX;
    const centerY = state.player.y - state.cameraY - 2;
    const direction = this.directionVector(state.player.facing);
    const range = state.player.attackRange;
    const color = state.player.attackColor;
    const progress = Math.max(0, Math.min(1, state.player.attackProgress));

    this.ctx.save();
    this.ctx.strokeStyle = this.toRgba(color, 0.35 + progress * 0.3);
    this.ctx.fillStyle = this.toRgba(color, 0.12 + progress * 0.14);

    switch (state.player.attackStyle) {
      case "slash": {
        const facingAngle = Math.atan2(direction.y, direction.x);
        const sweep = 1.2;
        const startAngle = facingAngle - 0.9 + progress * 0.22;
        const endAngle = startAngle + sweep;
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, range - 4, startAngle, endAngle);
        this.ctx.stroke();
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, range - 8, startAngle + 0.08, endAngle - 0.08);
        this.ctx.stroke();
        break;
      }
      case "thrust": {
        const tipX = centerX + direction.x * (range + 8);
        const tipY = centerY + direction.y * (range + 8);
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + direction.x * 5, centerY + direction.y * 5);
        this.ctx.lineTo(tipX, tipY);
        this.ctx.stroke();
        this.ctx.fillRect(tipX - 2, tipY - 2, 4, 4);
        break;
      }
      case "bow": {
        const flashX = centerX + direction.x * 14;
        const flashY = centerY + direction.y * 14;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(flashX, flashY);
        this.ctx.stroke();
        this.ctx.fillRect(flashX - 2, flashY - 2, 4, 4);
        break;
      }
      case "arcane": {
        const orbX = centerX + direction.x * 12;
        const orbY = centerY + direction.y * 12;
        this.ctx.beginPath();
        this.ctx.arc(orbX, orbY, 6 + progress * 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        break;
      }
    }

    this.ctx.restore();
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

  private directionVector(direction: "up" | "down" | "left" | "right"): { x: number; y: number } {
    if (direction === "up") return { x: 0, y: -1 };
    if (direction === "down") return { x: 0, y: 1 };
    if (direction === "left") return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  }

  private toRgba(hexColor: string, alpha: number): string {
    const safeAlpha = Math.max(0, Math.min(1, alpha));
    if (!hexColor.startsWith("#")) {
      return hexColor;
    }
    const hex = hexColor.slice(1);
    const normalized = hex.length === 3 ? hex.split("").map((part) => part + part).join("") : hex;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }

  private paint(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }
}
