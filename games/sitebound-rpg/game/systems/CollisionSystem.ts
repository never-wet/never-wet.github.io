import Phaser from "phaser";
import type { PortalDefinition } from "../data/portals";
import { isWalkableTile, TileId, TILE_SIZE, worldMap, type WorldObjectDefinition } from "../data/worldMap";

export class CollisionSystem {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private readonly debugRects: Array<{ x: number; y: number; width: number; height: number; label: string }> = [];
  private readonly debugGraphics: Phaser.GameObjects.Graphics;
  private readonly debugLabels: Phaser.GameObjects.Text[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    portals: PortalDefinition[],
    objects: WorldObjectDefinition[]
  ) {
    this.group = scene.physics.add.staticGroup();
    this.debugGraphics = scene.add.graphics();
    this.debugGraphics.setDepth(9900);
    this.createBuildingColliders(portals);
    this.createObjectColliders(objects);
  }

  addCollider(sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene.physics.add.collider(sprite, this.group);
  }

  renderDebug(enabled: boolean, player?: Phaser.Physics.Arcade.Sprite) {
    this.debugGraphics.clear();

    if (!enabled) {
      this.setDebugLabelsVisible(0);
      return;
    }

    const camera = this.scene.cameras.main;
    const startX = Math.max(0, Math.floor(camera.worldView.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.worldView.y / TILE_SIZE) - 1);
    const endX = Math.min(worldMap.width - 1, Math.ceil((camera.worldView.x + camera.worldView.width) / TILE_SIZE) + 1);
    const endY = Math.min(worldMap.height - 1, Math.ceil((camera.worldView.y + camera.worldView.height) / TILE_SIZE) + 1);
    let labelIndex = 0;

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const tile = worldMap.ground[y][x];
        const worldX = x * TILE_SIZE;
        const worldY = y * TILE_SIZE;

        this.debugGraphics.fillStyle(tileDebugColor(tile), isWalkableTile(tile) ? 0.08 : 0.18);
        this.debugGraphics.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
        this.debugGraphics.lineStyle(1, 0xf6f4df, 0.24);
        this.debugGraphics.strokeRect(worldX, worldY, TILE_SIZE, TILE_SIZE);

        const label = this.getDebugLabel(labelIndex);
        label.setText(tileLabel(tile));
        label.setPosition(worldX + 2, worldY + 2);
        label.setVisible(true);
        labelIndex += 1;

        if (!isWalkableTile(tile)) {
          this.debugGraphics.lineStyle(2, 0x8bd3ff, 0.42);
          this.debugGraphics.strokeRect(worldX + 2, worldY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      }
    }

    this.setDebugLabelsVisible(labelIndex);
    this.debugGraphics.lineStyle(2, 0xff4d6d, 0.95);

    for (const rect of this.debugRects) {
      this.debugGraphics.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    if (player?.body) {
      this.debugGraphics.lineStyle(2, 0x72f0bf, 1);
      this.debugGraphics.strokeRect(player.body.x, player.body.y, player.body.width, player.body.height);
    }
  }

  private getDebugLabel(index: number) {
    if (!this.debugLabels[index]) {
      const label = this.scene.add.text(0, 0, "", {
        color: "#fff4c4",
        fontFamily: "monospace",
        fontSize: "8px",
        resolution: 2
      });

      label.setDepth(9901);
      label.setShadow(1, 1, "#10151c", 1);
      this.debugLabels[index] = label;
    }

    return this.debugLabels[index];
  }

  private setDebugLabelsVisible(visibleCount: number) {
    for (let index = visibleCount; index < this.debugLabels.length; index += 1) {
      this.debugLabels[index].setVisible(false);
    }
  }

  private createBuildingColliders(portals: PortalDefinition[]) {
    for (const portal of portals) {
      const width = portal.width * TILE_SIZE;
      const height = portal.height * TILE_SIZE;
      const x = portal.x * TILE_SIZE + width / 2;
      const y = portal.y * TILE_SIZE + height / 2;
      const rect = this.scene.add.rectangle(x, y, width - 4, height - 4, 0x000000, 0);

      this.scene.physics.add.existing(rect, true);
      this.group.add(rect);
      this.debugRects.push({
        x: x - (width - 4) / 2,
        y: y - (height - 4) / 2,
        width: width - 4,
        height: height - 4,
        label: portal.id
      });
    }
  }

  private createObjectColliders(objects: WorldObjectDefinition[]) {
    for (const object of objects) {
      if (!object.solid) {
        continue;
      }

      const width = object.width * TILE_SIZE;
      const height = object.height * TILE_SIZE;
      const rect = this.scene.add.rectangle(
        object.x * TILE_SIZE + width / 2,
        object.y * TILE_SIZE + height / 2,
        Math.max(18, width - 8),
        Math.max(18, height - 8),
        0x000000,
        0
      );

      this.scene.physics.add.existing(rect, true);
      this.group.add(rect);
      this.debugRects.push({
        x: object.x * TILE_SIZE + (width - Math.max(18, width - 8)) / 2,
        y: object.y * TILE_SIZE + (height - Math.max(18, height - 8)) / 2,
        width: Math.max(18, width - 8),
        height: Math.max(18, height - 8),
        label: object.id
      });
    }
  }
}

function tileLabel(tile: number) {
  switch (tile) {
    case TileId.Grass:
      return "GR";
    case TileId.Meadow:
      return "ME";
    case TileId.Path:
      return "PA";
    case TileId.Plaza:
      return "PL";
    case TileId.RoadStone:
      return "RD";
    case TileId.Water:
      return "WA";
    case TileId.Bridge:
      return "BR";
    case TileId.Forest:
      return "FO";
    case TileId.Sand:
      return "SA";
    case TileId.Ridge:
      return "RI";
    case TileId.Cliff:
      return "CL";
    case TileId.Fence:
      return "FE";
    case TileId.Floor:
      return "FL";
    default:
      return String(tile);
  }
}

function tileDebugColor(tile: number) {
  switch (tile) {
    case TileId.Grass:
    case TileId.Meadow:
      return 0x62c06f;
    case TileId.Path:
    case TileId.Sand:
      return 0xe0bd7c;
    case TileId.Plaza:
    case TileId.RoadStone:
    case TileId.Floor:
      return 0x9aa8ba;
    case TileId.Water:
      return 0x64c7d8;
    case TileId.Bridge:
      return 0xd3a16a;
    case TileId.Forest:
      return 0x237044;
    case TileId.Ridge:
      return 0xb4a8bd;
    case TileId.Cliff:
      return 0x8a789d;
    case TileId.Fence:
      return 0xc99058;
    default:
      return 0xffffff;
  }
}
