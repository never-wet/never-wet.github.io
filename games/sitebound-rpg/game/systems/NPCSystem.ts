import Phaser from "phaser";
import { npcs, type NPCDefinition, type NPCId } from "../data/npcs";
import { TILE_SIZE } from "../data/worldMap";
import { createCharacterAnimations, createCharacterTexture } from "./PlayerController";
import type { FacingDirection } from "../../store/useWorldStore";

export interface NPCRuntime {
  definition: NPCDefinition;
  sprite: Phaser.Physics.Arcade.Sprite;
  targetIndex: number;
  wait: number;
}

export class NPCSystem {
  private readonly runtimes = new Map<NPCId, NPCRuntime>();

  constructor(private readonly scene: Phaser.Scene) {
    for (const npc of npcs) {
      const key = `npc-${npc.id}`;

      createCharacterTexture(scene, key, npc.palette);
      createCharacterAnimations(scene, key);

      const sprite = scene.physics.add.sprite(tileCenter(npc.x), tileFoot(npc.y), key, directionFrame(npc.facing));
      sprite.body?.setSize(18, 16);
      sprite.body?.setOffset(7, 31);
      sprite.setImmovable(true);
      sprite.setDepth(sprite.y);

      this.runtimes.set(npc.id, {
        definition: npc,
        sprite,
        targetIndex: 0,
        wait: 0
      });
    }
  }

  update(deltaSeconds: number, player: Phaser.Physics.Arcade.Sprite) {
    for (const runtime of this.runtimes.values()) {
      const distance = Phaser.Math.Distance.Between(player.x, player.y, runtime.sprite.x, runtime.sprite.y);

      if (distance < 112) {
        this.face(runtime, player.x, player.y);
        runtime.sprite.setVelocity(0, 0);
        runtime.sprite.anims.stop();
        runtime.sprite.setFrame(directionFrame(runtime.definition.facing));
      } else {
        this.updateSchedule(runtime, deltaSeconds);
      }

      runtime.sprite.setDepth(runtime.sprite.y);
    }
  }

  getAll() {
    return [...this.runtimes.values()];
  }

  getRuntime(id: NPCId) {
    return this.runtimes.get(id) ?? null;
  }

  getNearby(player: Phaser.Physics.Arcade.Sprite, range = 58) {
    let nearest: NPCRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const runtime of this.runtimes.values()) {
      const distance = Phaser.Math.Distance.Between(player.x, player.y, runtime.sprite.x, runtime.sprite.y);

      if (distance < range && distance < nearestDistance) {
        nearest = runtime;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private updateSchedule(runtime: NPCRuntime, deltaSeconds: number) {
    const schedule = runtime.definition.schedule;

    if (!schedule || schedule.length < 2) {
      runtime.sprite.setVelocity(0, 0);
      return;
    }

    if (runtime.wait > 0) {
      runtime.wait -= deltaSeconds;
      runtime.sprite.setVelocity(0, 0);
      return;
    }

    const target = schedule[runtime.targetIndex];
    const targetX = tileCenter(target.x);
    const targetY = tileFoot(target.y);
    const dx = targetX - runtime.sprite.x;
    const dy = targetY - runtime.sprite.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 4) {
      runtime.targetIndex = (runtime.targetIndex + 1) % schedule.length;
      runtime.wait = 0.6 + (runtime.targetIndex % 2) * 0.4;
      runtime.sprite.setVelocity(0, 0);
      return;
    }

    const speed = 34;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    runtime.definition.facing = direction;
    runtime.sprite.setVelocity((dx / distance) * speed, (dy / distance) * speed);
    runtime.sprite.anims.play(`npc-${runtime.definition.id}-${direction}`, true);
  }

  private face(runtime: NPCRuntime, x: number, y: number) {
    const dx = x - runtime.sprite.x;
    const dy = y - runtime.sprite.y;
    const direction: FacingDirection = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    runtime.definition.facing = direction;
  }
}

function tileCenter(tileX: number) {
  return tileX * TILE_SIZE + TILE_SIZE / 2;
}

function tileFoot(tileY: number) {
  return tileY * TILE_SIZE + TILE_SIZE * 0.82;
}

function directionFrame(direction: FacingDirection) {
  switch (direction) {
    case "down":
      return 0;
    case "left":
      return 4;
    case "right":
      return 8;
    case "up":
      return 12;
  }
}
