import { contentRegistry } from "../memory/contentRegistry";
import type { DayPlan, PlayerRuntime, RunWeaponState, SceneId, WarningMessage } from "../memory/types";
import { Camera } from "./camera";
import { hash2D } from "./collision";
import { EntityManager } from "./entityManager";
import { SpriteLibrary } from "./assets";
import { resolveWeaponStats } from "../game/rules";

export interface RenderRunState {
  dayPlan: DayPlan;
  player: PlayerRuntime;
  weapons: RunWeaponState[];
  entities: EntityManager;
  warnings: WarningMessage[];
  flash: number;
  time: number;
}

export interface RenderFrameState {
  scene: SceneId;
  run: RenderRunState | null;
  time: number;
  reducedFlash: boolean;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 1280;
  private height = 720;
  private pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly sprites: SpriteLibrary,
  ) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }
    this.ctx = context;
    this.resize();
  }

  resize(): void {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.pixelRatio);
    this.canvas.height = Math.floor(this.height * this.pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  render(frame: RenderFrameState): void {
    const biome = contentRegistry.biomes[frame.run?.dayPlan.biomeId ?? "verdant-reach"];
    this.drawBackground(biome, frame.run?.player.position.x ?? 0, frame.run?.player.position.y ?? 0, frame.time);

    if (frame.run) {
      this.drawWorld(frame.run);
    } else {
      this.drawTitleBackdrop(frame.time);
    }

    if (frame.run && frame.run.flash > 0) {
      this.ctx.fillStyle = `rgba(255, 240, 210, ${frame.reducedFlash ? frame.run.flash * 0.1 : frame.run.flash * 0.22})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private drawBackground(
    biome: (typeof contentRegistry.biomes)[string],
    worldX: number,
    worldY: number,
    time: number,
  ): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, biome.palette[0]);
    gradient.addColorStop(0.52, biome.palette[1]);
    gradient.addColorStop(1, biome.palette[2]);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const arenaGlow = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.48,
      this.height * 0.08,
      this.width * 0.5,
      this.height * 0.48,
      this.height * 0.62,
    );
    arenaGlow.addColorStop(0, biome.palette[3]);
    arenaGlow.addColorStop(0.45, biome.palette[1]);
    arenaGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    this.ctx.save();
    this.ctx.globalAlpha = 0.09;
    this.ctx.fillStyle = arenaGlow;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    const parallaxOffsetX = worldX * 0.06;
    const parallaxOffsetY = worldY * 0.04;
    this.ctx.save();
    this.ctx.fillStyle = biome.fogColor;
    this.ctx.globalAlpha = 0.4;
    for (let index = 0; index < 14; index += 1) {
      const x = ((index * 163.7 + time * 9 - parallaxOffsetX) % (this.width + 320)) - 160;
      const y = ((index * 119.1 + time * 6 - parallaxOffsetY) % (this.height + 280)) - 140;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, 120 + (index % 3) * 18, 58 + (index % 4) * 10, index * 0.21, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    const grid = 220;
    const viewLeft = worldX - this.width * 0.5;
    const viewTop = worldY - this.height * 0.5;
    const startX = Math.floor(viewLeft / grid) - 1;
    const endX = Math.ceil((viewLeft + this.width) / grid) + 1;
    const startY = Math.floor(viewTop / grid) - 1;
    const endY = Math.ceil((viewTop + this.height) / grid) + 1;

    for (let gx = startX; gx <= endX; gx += 1) {
      for (let gy = startY; gy <= endY; gy += 1) {
        const noise = hash2D(gx, gy);
        if (noise < 0.6) {
          continue;
        }

        const worldTileX = gx * grid;
        const worldTileY = gy * grid;
        const screen = this.worldToScreen({ x: worldTileX, y: worldTileY });

        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.rotate((noise - 0.5) * 0.9);

        const radiusX = 42 + noise * 34;
        const radiusY = 18 + noise * 20;

        this.ctx.globalAlpha = 0.09 + noise * 0.03;
        this.ctx.fillStyle = biome.tileColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalAlpha = 0.11;
        this.ctx.strokeStyle = biome.parallaxColor;
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        if (noise > 0.88) {
          this.ctx.globalAlpha = 0.16;
          this.ctx.strokeStyle = biome.propColor;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(-radiusX * 0.45, radiusY * 0.35);
          this.ctx.lineTo(0, -radiusY * 0.75);
          this.ctx.lineTo(radiusX * 0.4, radiusY * 0.1);
          this.ctx.stroke();
        }

        this.ctx.restore();
      }
    }

    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    this.ctx.strokeStyle = biome.parallaxColor;
    this.ctx.lineWidth = 1;
    for (let band = -2; band <= 7; band += 1) {
      const y = ((band * 96 + time * 8 - parallaxOffsetY * 0.35) % (this.height + 180)) - 90;
      this.ctx.beginPath();
      this.ctx.moveTo(-40, y);
      this.ctx.bezierCurveTo(this.width * 0.18, y + 10, this.width * 0.54, y - 14, this.width + 40, y + 6);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawTitleBackdrop(time: number): void {
    const sprite = this.sprites.get("logo-main");
    if (!sprite) {
      return;
    }
    const size = 290 + Math.sin(time * 1.8) * 10;
    const x = Math.min(this.width * 0.82, this.width - size * 0.48);
    const y = Math.max(this.height * 0.34, size * 0.44);
    this.ctx.save();
    this.ctx.globalAlpha = 0.54;
    this.ctx.drawImage(sprite, x - size * 0.5, y - size * 0.5, size, size);
    this.ctx.restore();
  }

  private drawWorld(run: RenderRunState): void {
    const { entities, player } = run;

    const boundarySize = 1320;
    const boundaryCenter = this.worldToScreen({ x: 0, y: 0 });
    this.ctx.strokeStyle = "rgba(255,255,255,0.08)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(boundaryCenter.x, boundaryCenter.y, boundarySize, 0, Math.PI * 2);
    this.ctx.stroke();

    this.drawHazards(entities);
    this.drawPickups(entities);
    this.drawShrines(entities);
    this.drawMines(entities);
    this.drawBeams(entities);
    this.drawOrbitingWeapons(run);
    this.drawProjectiles(entities);
    this.drawEnemies(entities);
    this.drawDrones(run);
    this.drawPlayer(player);
    this.drawParticles(entities);
    this.drawDamageTexts(entities);
    this.drawVignette();
  }

  private drawHazards(entities: EntityManager): void {
    for (const hazard of entities.hazards) {
      const screen = this.worldToScreen(hazard.position);
      const ratio = hazard.warmup > 0 ? 1 - hazard.warmup / 1.2 : 1;
      this.ctx.save();
      this.ctx.globalAlpha = hazard.warmup > 0 ? 0.12 + ratio * 0.1 : 0.16;
      this.ctx.fillStyle = hazard.color;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, hazard.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 0.34;
      this.ctx.strokeStyle = hazard.warmup > 0 ? "#fff0d9" : "#ffffff";
      this.ctx.lineWidth = hazard.warmup > 0 ? 2 : 3;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, hazard.radius * (hazard.warmup > 0 ? ratio : 1), 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawPickups(entities: EntityManager): void {
    for (const pickup of entities.pickups) {
      const sprite = this.sprites.get(pickup.spriteId);
      const screen = this.worldToScreen(pickup.position);
      if (sprite) {
        this.ctx.drawImage(sprite, screen.x - 14, screen.y - 14, 28, 28);
      } else {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, pickup.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawShrines(entities: EntityManager): void {
    for (const shrine of entities.shrines) {
      const screen = this.worldToScreen(shrine.position);
      this.ctx.save();
      this.ctx.globalAlpha = 0.18;
      this.ctx.fillStyle = "rgba(255, 211, 156, 0.26)";
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, shrine.radius + 22, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = "#ffdba6";
      this.ctx.beginPath();
      this.ctx.moveTo(screen.x, screen.y - 20);
      this.ctx.lineTo(screen.x + 16, screen.y + 18);
      this.ctx.lineTo(screen.x - 16, screen.y + 18);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.strokeStyle = "rgba(255, 247, 224, 0.7)";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, shrine.radius + 8, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawMines(entities: EntityManager): void {
    for (const mine of entities.mines) {
      const screen = this.worldToScreen(mine.position);
      this.ctx.strokeStyle = "rgba(255, 207, 128, 0.35)";
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, mine.explosionRadius * 0.3, 0, Math.PI * 2);
      this.ctx.stroke();
      const sprite = this.sprites.get(mine.spriteId);
      if (sprite) {
        this.ctx.drawImage(sprite, screen.x - 18, screen.y - 18, 36, 36);
      }
    }
  }

  private drawProjectiles(entities: EntityManager): void {
    for (const projectile of entities.projectiles) {
      const screen = this.worldToScreen(projectile.position);
      const sprite = this.sprites.get(projectile.spriteId);
      if (sprite) {
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.rotate(Math.atan2(projectile.velocity.y, projectile.velocity.x));
        this.ctx.drawImage(sprite, -projectile.radius * 1.4, -projectile.radius * 1.4, projectile.radius * 2.8, projectile.radius * 2.8);
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = projectile.color;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, projectile.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawBeams(entities: EntityManager): void {
    for (const beam of entities.beams) {
      const start = this.worldToScreen(beam.origin);
      const end = this.worldToScreen(beam.target);
      this.ctx.strokeStyle = beam.color;
      this.ctx.lineWidth = beam.width;
      this.ctx.globalAlpha = 0.75;
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
  }

  private drawOrbitingWeapons(run: RenderRunState): void {
    const playerScreen = this.worldToScreen(run.player.position);

    const aura = run.weapons.find((weapon) => weapon.id === "thorn-aura");
    if (aura) {
      const stats = resolveWeaponStats(aura);
      this.ctx.strokeStyle = "rgba(178, 255, 175, 0.35)";
      this.ctx.lineWidth = 10;
      this.ctx.beginPath();
      this.ctx.arc(playerScreen.x, playerScreen.y, stats.radius * run.player.stats.areaMultiplier, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    const orbiters = run.weapons.find((weapon) => weapon.id === "sun-orbiters");
    if (!orbiters) {
      return;
    }
    const stats = resolveWeaponStats(orbiters);
    const count = Math.max(1, Math.round(stats.orbitals));
    const radius = stats.orbitRadius * run.player.stats.areaMultiplier;
    const sprite = this.sprites.get("weapon-sun-orbiters");
    for (let index = 0; index < count; index += 1) {
      const angle = orbiters.orbitAngle + (Math.PI * 2 * index) / count;
      const x = playerScreen.x + Math.cos(angle) * radius;
      const y = playerScreen.y + Math.sin(angle) * radius;
      if (sprite) {
        this.ctx.drawImage(sprite, x - stats.size, y - stats.size, stats.size * 2, stats.size * 2);
      }
    }
  }

  private drawEnemies(entities: EntityManager): void {
    for (const enemy of entities.enemies) {
      const definition = contentRegistry.enemies[enemy.definitionId];
      const screen = this.worldToScreen(enemy.position);
      const sprite = this.sprites.get(definition.spriteId);
      const size = enemy.radius * 2.8;

      this.ctx.save();
      this.ctx.fillStyle = enemy.boss
        ? "rgba(3, 5, 10, 0.42)"
        : enemy.elite
          ? "rgba(3, 5, 10, 0.34)"
          : "rgba(3, 5, 10, 0.26)";
      this.ctx.beginPath();
      this.ctx.ellipse(screen.x, screen.y + enemy.radius * 0.48, enemy.radius * 0.96, enemy.radius * 0.56, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (sprite) {
        this.ctx.save();
        this.ctx.globalAlpha = enemy.hitFlash > 0 ? 0.7 : 1;
        this.ctx.drawImage(sprite, screen.x - size * 0.5, screen.y - size * 0.5, size, size);
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, enemy.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      if (!enemy.boss) {
        this.ctx.save();
        const affixColor =
          enemy.affix === "explosive"
            ? "rgba(255, 157, 122, 0.36)"
            : enemy.affix === "hasted"
              ? "rgba(129, 245, 255, 0.34)"
              : enemy.affix === "bulwark"
                ? "rgba(255, 230, 171, 0.34)"
                : enemy.affix === "splitter"
                  ? "rgba(175, 255, 181, 0.34)"
                  : enemy.affix === "siphon"
                    ? "rgba(255, 144, 180, 0.34)"
                    : enemy.elite
                      ? "rgba(255, 250, 214, 0.22)"
                      : "rgba(5, 9, 16, 0.24)";
        this.ctx.strokeStyle = affixColor;
        this.ctx.lineWidth = enemy.elite || enemy.affix ? 2 : 1.5;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, enemy.radius + (enemy.elite ? 5 : 3), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }

      if (enemy.elite || enemy.boss) {
        const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
        this.ctx.fillStyle = "rgba(10, 14, 24, 0.8)";
        this.ctx.fillRect(screen.x - 24, screen.y - enemy.radius - 18, 48, 6);
        this.ctx.fillStyle = enemy.boss ? "#ffd166" : "#8cffad";
        this.ctx.fillRect(screen.x - 24, screen.y - enemy.radius - 18, 48 * hpRatio, 6);
        if (enemy.boss && enemy.phase > 0) {
          this.ctx.strokeStyle = enemy.phase === 1 ? "rgba(255, 182, 97, 0.4)" : "rgba(255, 103, 103, 0.42)";
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(screen.x, screen.y, enemy.radius + 12 + enemy.phase * 2, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      }
    }
  }

  private drawDrones(run: RenderRunState): void {
    const sprite = this.sprites.get("weapon-drone-sentinels");
    if (!sprite) {
      return;
    }
    for (const drone of run.entities.drones) {
      const x = run.player.position.x + Math.cos(drone.orbitAngle) * 118;
      const y = run.player.position.y + Math.sin(drone.orbitAngle) * 118;
      const screen = this.worldToScreen({ x, y });
      this.ctx.drawImage(sprite, screen.x - 16, screen.y - 16, 32, 32);
    }
  }

  private drawPlayer(player: PlayerRuntime): void {
    const screen = this.worldToScreen(player.position);
    const sprite = this.sprites.get("player-runner");
    const size = player.radius * 3.2;

    this.ctx.save();
    this.ctx.fillStyle = "rgba(3, 5, 10, 0.3)";
    this.ctx.beginPath();
    this.ctx.ellipse(screen.x, screen.y + player.radius * 0.52, player.radius * 1.08, player.radius * 0.6, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    if (sprite) {
      this.ctx.save();
      this.ctx.globalAlpha = player.hitFlash > 0 ? 0.65 : 1;
      this.ctx.drawImage(sprite, screen.x - size * 0.5, screen.y - size * 0.5, size, size);
      this.ctx.restore();
    }

    this.ctx.strokeStyle = "rgba(128, 241, 255, 0.6)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, player.radius + 4, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawParticles(entities: EntityManager): void {
    for (const particle of entities.particles) {
      const screen = this.worldToScreen(particle.position);
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawDamageTexts(entities: EntityManager): void {
    this.ctx.textAlign = "center";
    for (const text of entities.damageTexts) {
      const screen = this.worldToScreen(text.position);
      this.ctx.globalAlpha = Math.max(0, text.life / 0.75);
      this.ctx.fillStyle = text.color;
      this.ctx.font = text.crit
        ? '700 18px "Trebuchet MS", "Segoe UI", sans-serif'
        : '600 14px "Trebuchet MS", "Segoe UI", sans-serif';
      this.ctx.fillText(text.text, screen.x, screen.y);
    }
    this.ctx.globalAlpha = 1;
  }

  private drawVignette(): void {
    const gradient = this.ctx.createRadialGradient(this.width * 0.5, this.height * 0.45, this.height * 0.18, this.width * 0.5, this.height * 0.45, this.height * 0.75);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(4,6,12,0.42)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private worldToScreen(position: { x: number; y: number }): { x: number; y: number } {
    return {
      x: this.width * 0.5 + (position.x - this.camera.position.x) + this.camera.shakeOffset.x,
      y: this.height * 0.5 + (position.y - this.camera.position.y) + this.camera.shakeOffset.y,
    };
  }
}
