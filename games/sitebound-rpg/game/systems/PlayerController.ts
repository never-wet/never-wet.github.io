import Phaser from "phaser";
import { TILE_SIZE } from "../data/worldMap";
import type { FacingDirection, TilePoint } from "../../store/useWorldStore";

const PLAYER_KEY = "sitebound-player";
const SPEED = 150;

export class PlayerController {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private path: TilePoint[] = [];
  private facing: FacingDirection = "down";

  constructor(private readonly scene: Phaser.Scene, spawnTile: TilePoint) {
    createCharacterTexture(scene, PLAYER_KEY, {
      hair: 0x1e253a,
      coat: 0x2dd4bf,
      trim: 0xffe082,
      skin: 0xf1b58e
    });
    createCharacterAnimations(scene, PLAYER_KEY);

    this.sprite = scene.physics.add.sprite(tileCenter(spawnTile.x), tileFoot(spawnTile.y), PLAYER_KEY, 0);
    this.sprite.setDepth(this.sprite.y);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body?.setSize(18, 16);
    this.sprite.body?.setOffset(7, 31);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = scene.input.keyboard!.addKeys("W,A,S,D") as Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  }

  update(deltaSeconds: number) {
    const manual = this.getManualVector();

    if (manual.lengthSq() > 0) {
      this.path = [];
      manual.normalize();
      this.applyVelocity(manual.x, manual.y);
      return;
    }

    if (this.path.length > 0) {
      this.followPath(deltaSeconds);
      return;
    }

    this.applyVelocity(0, 0);
  }

  setPath(path: TilePoint[]) {
    this.path = path.slice(1);
  }

  clearPath() {
    this.path = [];
  }

  getTile() {
    return {
      x: Math.floor(this.sprite.x / TILE_SIZE),
      y: Math.floor(this.sprite.y / TILE_SIZE)
    };
  }

  getSnapshot() {
    const tile = this.getTile();

    return {
      x: this.sprite.x,
      y: this.sprite.y,
      tileX: tile.x,
      tileY: tile.y,
      facing: this.facing,
      moving: this.sprite.body ? Math.abs(this.sprite.body.velocity.x) + Math.abs(this.sprite.body.velocity.y) > 0.1 : false
    };
  }

  private followPath(deltaSeconds: number) {
    const target = this.path[0];
    const targetX = tileCenter(target.x);
    const targetY = tileFoot(target.y);
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.hypot(dx, dy);

    if (distance < Math.max(5, SPEED * deltaSeconds * 0.65)) {
      this.sprite.setPosition(targetX, targetY);
      this.path.shift();
      this.applyVelocity(0, 0);
      return;
    }

    this.applyVelocity(dx / distance, dy / distance);
  }

  private getManualVector() {
    const vector = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      vector.x -= 1;
    }

    if (this.cursors.right.isDown || this.keys.D.isDown) {
      vector.x += 1;
    }

    if (this.cursors.up.isDown || this.keys.W.isDown) {
      vector.y -= 1;
    }

    if (this.cursors.down.isDown || this.keys.S.isDown) {
      vector.y += 1;
    }

    return vector;
  }

  private applyVelocity(x: number, y: number) {
    this.sprite.setVelocity(x * SPEED, y * SPEED);

    if (Math.abs(x) > Math.abs(y) && Math.abs(x) > 0.01) {
      this.facing = x > 0 ? "right" : "left";
    } else if (Math.abs(y) > 0.01) {
      this.facing = y > 0 ? "down" : "up";
    }

    if (Math.abs(x) + Math.abs(y) > 0.01) {
      this.sprite.anims.play(`${PLAYER_KEY}-${this.facing}`, true);
    } else {
      this.sprite.anims.stop();
      this.sprite.setFrame(directionFrame(this.facing));
    }

    this.sprite.setDepth(this.sprite.y);
  }
}

export function createCharacterTexture(
  scene: Phaser.Scene,
  key: string,
  palette: { hair: number; coat: number; trim: number; skin: number }
) {
  if (scene.textures.exists(key)) {
    return;
  }

  const frameWidth = 32;
  const frameHeight = 48;
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth * 4;
  canvas.height = frameHeight * 4;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create character canvas.");
  }

  ctx.imageSmoothingEnabled = false;

  for (let direction = 0; direction < 4; direction += 1) {
    for (let frame = 0; frame < 4; frame += 1) {
      drawCharacterFrame(ctx, frame * frameWidth, direction * frameHeight, direction, frame, palette);
    }
  }

  const texture = scene.textures.addCanvas(key, canvas);

  if (!texture) {
    throw new Error(`Could not add texture ${key}.`);
  }

  for (let index = 0; index < 16; index += 1) {
    texture.add(index, 0, (index % 4) * frameWidth, Math.floor(index / 4) * frameHeight, frameWidth, frameHeight);
  }
}

export function createCharacterAnimations(scene: Phaser.Scene, key: string) {
  for (const direction of ["down", "left", "right", "up"] as FacingDirection[]) {
    const animKey = `${key}-${direction}`;

    if (scene.anims.exists(animKey)) {
      continue;
    }

    const start = directionFrame(direction);

    scene.anims.create({
      key: animKey,
      frames: [
        { key, frame: start },
        { key, frame: start + 1 },
        { key, frame: start + 2 },
        { key, frame: start + 3 }
      ],
      frameRate: 8,
      repeat: -1
    });
  }
}

function drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: number,
  frame: number,
  palette: { hair: number; coat: number; trim: number; skin: number }
) {
  const px = (left: number, top: number, width: number, height: number, color: number) => {
    ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    ctx.fillRect(x + left, y + top, width, height);
  };
  const step = frame === 1 || frame === 2 ? 2 : 0;
  const dark = 0x141823;
  const shoe = 0x182c3b;

  px(10, 31, 5, 9 + step, dark);
  px(17, 31, 5, 9 + (step ? 0 : 2), dark);
  px(8, 41 + step, 8, 4, shoe);
  px(17, 41 + (step ? 0 : 2), 8, 4, shoe);
  px(8, 18, 16, 17, dark);
  px(10, 18, 12, 15, palette.coat);
  px(10, 29, 12, 4, palette.trim);
  px(direction === 1 ? 6 : 24, 21, 4, 10, palette.skin);
  px(7, 7, 18, 16, dark);
  px(9, 9, 14, 13, palette.skin);

  if (direction === 3) {
    px(7, 5, 18, 13, palette.hair);
    px(10, 6, 11, 5, lighten(palette.hair));
  } else {
    px(7, 5, 18, 8, palette.hair);
    px(6, 11, 6, 11, palette.hair);
    px(20, 11, 6, 11, palette.hair);

    if (direction === 1) {
      px(10, 15, 4, 2, dark);
    } else if (direction === 2) {
      px(19, 15, 4, 2, dark);
    } else {
      px(11, 15, 4, 2, dark);
      px(19, 15, 4, 2, dark);
    }

    px(13, 19, 7, 2, 0x9a5e55);
  }

  px(11, 22, 10, 2, palette.trim);
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

function lighten(color: number) {
  const red = Math.min(255, ((color >> 16) & 255) + 36);
  const green = Math.min(255, ((color >> 8) & 255) + 36);
  const blue = Math.min(255, (color & 255) + 36);

  return (red << 16) | (green << 8) | blue;
}

function tileCenter(tileX: number) {
  return tileX * TILE_SIZE + TILE_SIZE / 2;
}

function tileFoot(tileY: number) {
  return tileY * TILE_SIZE + TILE_SIZE * 0.82;
}
