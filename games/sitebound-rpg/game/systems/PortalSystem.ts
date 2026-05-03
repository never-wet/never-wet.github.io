import Phaser from "phaser";
import { portals, type PortalDefinition } from "../data/portals";
import { TILE_SIZE } from "../data/worldMap";
import { useWorldStore } from "../../store/useWorldStore";
import { DialogueSystem } from "./DialogueSystem";

export class PortalSystem {
  constructor(private readonly scene: Phaser.Scene, private readonly dialogue: DialogueSystem) {}

  getNearbyPortal(player: Phaser.Physics.Arcade.Sprite, range = 54) {
    let nearest: PortalDefinition | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const portal of portals) {
      const doorX = portal.door.x * TILE_SIZE + TILE_SIZE / 2;
      const doorY = portal.door.y * TILE_SIZE + TILE_SIZE / 2;
      const distance = Phaser.Math.Distance.Between(player.x, player.y, doorX, doorY);

      if (distance < range && distance < nearestDistance) {
        nearest = portal;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  enter(portal: PortalDefinition, player: Phaser.Physics.Arcade.Sprite) {
    const store = useWorldStore.getState();

    if (portal.lockedBy && !store.unlocked[portal.id] && !store.unlocked[portal.lockedBy]) {
      const reason =
        portal.id === "observatory"
          ? "Warden Sol still needs proof from the circuit duel before the observatory lift opens."
          : "The Archive Gate needs all three signal shards before the lock will answer.";
      this.dialogue.openLockedPortal(portal.name, reason);
      return false;
    }

    this.scene.cameras.main.fadeOut(240, 13, 16, 22);
    this.scene.time.delayedCall(260, () => {
      player.setPosition(tileCenter(portal.interior.spawn.x), tileFoot(portal.interior.spawn.y));
      player.setVelocity(0, 0);
      store.visitPortal(portal.id);
      store.setCurrentInterior(portal.id);
      store.clearPath();
      store.pushNotification(`${portal.name} entered.`);
      this.scene.cameras.main.fadeIn(260, 13, 16, 22);
    });

    return true;
  }

  exit(portal: PortalDefinition, player: Phaser.Physics.Arcade.Sprite) {
    const store = useWorldStore.getState();

    this.scene.cameras.main.fadeOut(220, 13, 16, 22);
    this.scene.time.delayedCall(240, () => {
      player.setPosition(tileCenter(portal.door.x), tileFoot(portal.door.y));
      player.setVelocity(0, 0);
      store.setCurrentInterior(null);
      store.clearPath();
      store.pushNotification(`Returned from ${portal.name}.`);
      this.scene.cameras.main.fadeIn(240, 13, 16, 22);
    });
  }
}

function tileCenter(tileX: number) {
  return tileX * TILE_SIZE + TILE_SIZE / 2;
}

function tileFoot(tileY: number) {
  return tileY * TILE_SIZE + TILE_SIZE * 0.82;
}
