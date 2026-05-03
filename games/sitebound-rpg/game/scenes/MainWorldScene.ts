import Phaser from "phaser";
import { portals, type PortalDefinition } from "../data/portals";
import { worldMap, TILE_SIZE, type WorldObjectDefinition } from "../data/worldMap";
import { CollisionSystem } from "../systems/CollisionSystem";
import { DayNightSystem } from "../systems/DayNightSystem";
import { DialogueSystem } from "../systems/DialogueSystem";
import { NPCSystem, type NPCRuntime } from "../systems/NPCSystem";
import { PathfindingSystem } from "../systems/PathfindingSystem";
import { PlayerController } from "../systems/PlayerController";
import { PortalSystem } from "../systems/PortalSystem";
import { SoundManager } from "../systems/SoundManager";
import { TerrainRenderer } from "../systems/TerrainRenderer";
import { TilemapLoader } from "../systems/TilemapLoader";
import { WeatherSystem } from "../systems/WeatherSystem";
import { tickMiniGame } from "../systems/MiniGameManager";
import { useWorldStore } from "../../store/useWorldStore";

type InteractionTarget =
  | { kind: "npc"; id: string; label: string; action: string; runtime: NPCRuntime }
  | { kind: "portal"; id: string; label: string; action: string; portal: PortalDefinition }
  | { kind: "object"; id: string; label: string; action: string; object: WorldObjectDefinition };

export class MainWorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private npcs!: NPCSystem;
  private dialogue!: DialogueSystem;
  private portals!: PortalSystem;
  private pathfinder!: PathfindingSystem;
  private dayNight!: DayNightSystem;
  private weather!: WeatherSystem;
  private audio!: SoundManager;
  private collision!: CollisionSystem;
  private currentTarget: InteractionTarget | null = null;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private targetMarker!: Phaser.GameObjects.Arc;
  private lastPathRequest = 0;
  private lastTeleportRequest = 0;
  private hudTimer = 0;
  private saveTimer = 0;
  private miniGameTimer = 0;
  private unsubscribeStore?: () => void;

  constructor() {
    super("MainWorldScene");
  }

  create() {
    this.physics.world.setBounds(0, 0, worldMap.width * TILE_SIZE, worldMap.height * TILE_SIZE);
    const tilemap = TilemapLoader.create(this);
    TerrainRenderer.render(this);
    createWorldTextures(this);
    this.renderPortals();
    this.renderObjects();

    const persistedPlayer = useWorldStore.getState().player;
    this.player = new PlayerController(this, {
      x: persistedPlayer.tileX || worldMap.spawn.x,
      y: persistedPlayer.tileY || worldMap.spawn.y
    });

    this.collision = new CollisionSystem(this, portals, worldMap.objects);
    this.collision.addCollider(this.player.sprite);

    this.npcs = new NPCSystem(this);

    for (const runtime of this.npcs.getAll()) {
      this.physics.add.collider(this.player.sprite, runtime.sprite);
      this.physics.add.collider(runtime.sprite, tilemap.layer);
      this.collision.addCollider(runtime.sprite);
    }

    this.physics.add.collider(this.player.sprite, tilemap.layer);

    this.dialogue = new DialogueSystem();
    this.portals = new PortalSystem(this, this.dialogue);
    this.pathfinder = new PathfindingSystem(portals, worldMap.objects);
    this.dayNight = new DayNightSystem(this);
    this.weather = new WeatherSystem(this);
    this.weather.setWeather("clear");
    this.audio = new SoundManager(useWorldStore.getState().settings);
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.setDepth(6000);
    this.targetMarker = this.add.circle(0, 0, 8, 0xffd06a, 0);
    this.targetMarker.setDepth(6100);

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, worldMap.width * TILE_SIZE, worldMap.height * TILE_SIZE);
    this.cameras.main.setZoom(2);

    useWorldStore.getState().setWorldSize(worldMap.width * TILE_SIZE, worldMap.height * TILE_SIZE);
    useWorldStore.getState().setPlayerSnapshot({
      x: this.player.sprite.x,
      y: this.player.sprite.y,
      tileX: this.player.getTile().x,
      tileY: this.player.getTile().y,
      facing: "down",
      moving: false
    });

    this.input.keyboard?.on("keydown-E", () => this.interact());
    this.input.keyboard?.on("keydown-SPACE", () => this.interact());
    this.input.keyboard?.on("keydown-ENTER", () => this.interact());
    this.input.keyboard?.on("keydown-ESC", () => {
      const store = useWorldStore.getState();
      store.closeDialogue();
      store.setMiniGame(null);
    });
    this.input.keyboard?.on("keydown-F2", () => {
      useWorldStore.getState().toggleDebugCollision();
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.audio.unlock();

      if (this.currentTarget) {
        this.interact();
        return;
      }

      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      useWorldStore.getState().requestPathTo({
        x: Math.floor(worldPoint.x / TILE_SIZE),
        y: Math.floor(worldPoint.y / TILE_SIZE)
      });
    });

    this.input.keyboard?.on("keydown", () => this.audio.unlock());
    this.unsubscribeStore = useWorldStore.subscribe((state) => {
      this.audio.applySettings(state.settings);
    });
  }

  update(_time: number, delta: number) {
    const deltaSeconds = delta / 1000;
    const store = useWorldStore.getState();
    const paused = Boolean(store.dialogue || store.miniGame);

    this.handleTeleportRequests(store.teleportRequest);
    this.handlePathRequests(store.pathRequestVersion, store.destinationTile);
    this.collision.renderDebug(store.debugCollision, this.player.sprite);

    if (!paused) {
      this.player.update(deltaSeconds);
      this.npcs.update(deltaSeconds, this.player.sprite);
      this.currentTarget = this.findInteractionTarget();
      this.updatePrompt();
    } else {
      this.player.sprite.setVelocity(0, 0);
      this.currentTarget = null;
      store.setPrompt(null);
    }

    this.drawPath(store.path);
    this.dayNight.update(deltaSeconds, this);
    this.weather.update(deltaSeconds);
    this.audio.setWeather(store.weather);
    this.audio.update(deltaSeconds, this.player.getSnapshot().moving && !paused);
    this.tickMiniGame(deltaSeconds);
    this.updateHud(deltaSeconds);
    this.autoSave(deltaSeconds);
  }

  destroy() {
    this.unsubscribeStore?.();
  }

  private handlePathRequests(version: number, destination: { x: number; y: number } | null) {
    if (version === this.lastPathRequest || !destination) {
      return;
    }

    this.lastPathRequest = version;
    const start = this.player.getTile();
    const path = this.pathfinder.findPath(start, destination);

    useWorldStore.getState().setPath(path);
    this.player.setPath(path);
  }

  private handleTeleportRequests(
    request: { tile: { x: number; y: number }; interiorId: string | null; version: number } | null
  ) {
    if (!request || request.version === this.lastTeleportRequest) {
      return;
    }

    this.lastTeleportRequest = request.version;
    this.player.clearPath();
    this.player.sprite.setPosition(tileCenter(request.tile.x), tileFoot(request.tile.y));
    this.player.sprite.setVelocity(0, 0);
    useWorldStore.getState().setCurrentInterior(request.interiorId);
    useWorldStore.getState().clearPath();
    useWorldStore.getState().pushNotification("Position restored.");
  }

  private drawPath(path: Array<{ x: number; y: number }>) {
    this.pathGraphics.clear();

    if (path.length < 2) {
      this.targetMarker.setAlpha(0);
      return;
    }

    this.pathGraphics.lineStyle(3, 0xffd06a, 0.82);
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(tileCenter(path[0].x), tileCenter(path[0].y));

    for (const point of path.slice(1)) {
      this.pathGraphics.lineTo(tileCenter(point.x), tileCenter(point.y));
    }

    this.pathGraphics.strokePath();

    const last = path[path.length - 1];
    this.targetMarker.setPosition(tileCenter(last.x), tileCenter(last.y));
    this.targetMarker.setAlpha(0.86);
  }

  private interact() {
    this.audio.unlock();
    const store = useWorldStore.getState();

    if (store.dialogue) {
      store.advanceDialogue();
      this.audio.playUi();
      return;
    }

    if (!this.currentTarget || store.miniGame) {
      return;
    }

    this.audio.playInteract();

    if (this.currentTarget.kind === "npc") {
      void this.dialogue.openNpc(this.currentTarget.runtime);
      return;
    }

    if (this.currentTarget.kind === "portal") {
      this.player.clearPath();
      const entered = this.portals.enter(this.currentTarget.portal, this.player.sprite);

      if (entered) {
        this.audio.playPortal();
      }

      return;
    }

    this.interactWithObject(this.currentTarget.object);
  }

  private interactWithObject(object: WorldObjectDefinition) {
    if (object.type === "interior_exit" && object.portalId) {
      const portal = portals.find((entry) => entry.id === object.portalId);

      if (portal) {
        this.player.clearPath();
        this.portals.exit(portal, this.player.sprite);
        this.audio.playPortal();
      }

      return;
    }

    if (object.type === "shard") {
      useWorldStore.getState().collectItem(
        object.id,
        object.questObjective?.questId as "archive_shards" | undefined,
        object.questObjective?.objectiveId
      );
      this.children.getByName(object.id)?.destroy();
      return;
    }

    this.dialogue.openObject(object);
  }

  private findInteractionTarget(): InteractionTarget | null {
    const store = useWorldStore.getState();
    const npc = this.npcs.getNearby(this.player.sprite);

    if (npc && !store.currentInteriorId) {
      return {
        kind: "npc",
        id: npc.definition.id,
        label: npc.definition.name,
        action: "Talk",
        runtime: npc
      };
    }

    const portal = store.currentInteriorId ? null : this.portals.getNearbyPortal(this.player.sprite);

    if (portal) {
      return {
        kind: "portal",
        id: portal.id,
        label: portal.name,
        action: "Enter",
        portal
      };
    }

    let nearest: WorldObjectDefinition | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const collected = store.collected;

    for (const object of worldMap.objects) {
      if (collected.includes(object.id)) {
        continue;
      }

      if (store.currentInteriorId) {
        if (object.portalId !== store.currentInteriorId) {
          continue;
        }
      } else if (object.portalId) {
        continue;
      }

      const distance = distanceToObject(this.player.sprite.x, this.player.sprite.y, object);

      if (distance < 50 && distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    }

    if (!nearest) {
      return null;
    }

    return {
      kind: "object",
      id: nearest.id,
      label: nearest.name,
      action: nearest.prompt,
      object: nearest
    };
  }

  private updatePrompt() {
    useWorldStore.getState().setPrompt(
      this.currentTarget
        ? {
            id: this.currentTarget.id,
            label: this.currentTarget.label,
            action: this.currentTarget.action
          }
        : null
    );
  }

  private updateHud(deltaSeconds: number) {
    this.hudTimer += deltaSeconds;

    if (this.hudTimer < 0.06) {
      return;
    }

    this.hudTimer = 0;
    const snapshot = this.player.getSnapshot();

    useWorldStore.getState().setPlayerSnapshot({
      ...snapshot,
      worldWidth: worldMap.width * TILE_SIZE,
      worldHeight: worldMap.height * TILE_SIZE
    });
  }

  private autoSave(deltaSeconds: number) {
    this.saveTimer += deltaSeconds;

    if (this.saveTimer < 2.5) {
      return;
    }

    this.saveTimer = 0;
    useWorldStore.getState().saveGame();
  }

  private tickMiniGame(deltaSeconds: number) {
    this.miniGameTimer += deltaSeconds;

    if (this.miniGameTimer < 0.045) {
      return;
    }

    this.miniGameTimer = 0;
    const store = useWorldStore.getState();

    if (store.miniGame?.result === "playing") {
      store.setMiniGame(tickMiniGame(store.miniGame, deltaSeconds));
    }
  }

  private renderPortals() {
    for (const portal of portals) {
      const key = `building-${portal.id}`;

      if (!this.textures.exists(key)) {
        this.textures.addCanvas(key, createBuildingCanvas(portal));
      }

      const image = this.add.image(portal.x * TILE_SIZE, portal.y * TILE_SIZE, key);
      image.setOrigin(0);
      image.setDepth((portal.y + portal.height) * TILE_SIZE);
    }
  }

  private renderObjects() {
    for (const object of worldMap.objects) {
      if (useWorldStore.getState().collected.includes(object.id)) {
        continue;
      }

      const key = objectTextureKey(object);

      if (!this.textures.exists(key)) {
        this.textures.addCanvas(key, createObjectCanvas(object));
      }

      const image = this.add.image(object.x * TILE_SIZE, object.y * TILE_SIZE, key);
      image.setName(object.id);
      image.setOrigin(0);
      image.setDepth((object.y + object.height) * TILE_SIZE);

      if (object.type === "shard") {
        this.tweens.add({
          targets: image,
          y: image.y - 5,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    }
  }
}

function createWorldTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists("target-dot")) {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffd06a";
    ctx.fillRect(5, 2, 6, 12);
    ctx.fillRect(2, 5, 12, 6);
    scene.textures.addCanvas("target-dot", canvas);
  }
}

function createBuildingCanvas(portal: PortalDefinition) {
  const width = portal.width * TILE_SIZE;
  const height = portal.height * TILE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const palette = buildingPalette(portal.id);
  const roofHeight = Math.round(height * 0.42);
  const wallY = roofHeight - 8;

  rect(ctx, 4, height - 18, width - 8, 12, "#26312d");
  rect(ctx, 9, wallY + 14, width - 18, height - wallY - 18, "#111821");
  rect(ctx, 16, wallY + 3, width - 32, height - wallY - 20, palette.wall);
  rect(ctx, 10, wallY + 19, 8, height - wallY - 38, palette.wallShade);
  rect(ctx, width - 18, wallY + 19, 8, height - wallY - 38, palette.wallShade);
  rect(ctx, 16, wallY + 3, width - 32, 7, palette.wallLight);
  rect(ctx, 16, height - 25, width - 32, 8, palette.wallShade);

  ctx.fillStyle = "#151923";
  ctx.beginPath();
  ctx.moveTo(4, wallY + 12);
  ctx.lineTo(width / 2, 4);
  ctx.lineTo(width - 4, wallY + 12);
  ctx.lineTo(width - 18, wallY + 20);
  ctx.lineTo(18, wallY + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.roof;
  ctx.beginPath();
  ctx.moveTo(8, wallY + 8);
  ctx.lineTo(width / 2, 8);
  ctx.lineTo(width - 8, wallY + 8);
  ctx.lineTo(width - 21, wallY + 16);
  ctx.lineTo(21, wallY + 16);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 22, wallY + 14, width - 44, 5, palette.roofShade);

  for (let stripe = 0; stripe < 4; stripe += 1) {
    rect(ctx, 24 + stripe * 22, wallY + 4 + stripe * 6, width - 48 - stripe * 44, 3, stripe % 2 ? palette.roofShade : palette.roofLight);
  }

  const doorWidth = Math.min(32, width * 0.22);
  rect(ctx, width / 2 - doorWidth / 2 - 4, height - 48, doorWidth + 8, 40, "#151923");
  rect(ctx, width / 2 - doorWidth / 2, height - 44, doorWidth, 36, palette.door);
  rect(ctx, width / 2 + doorWidth / 2 - 8, height - 27, 4, 4, palette.roofLight);
  drawWindow(ctx, 24, wallY + 24, palette.window);
  drawWindow(ctx, width - 50, wallY + 24, palette.window);
  drawBuildingIdentity(ctx, portal, palette, width, height, wallY);

  return canvas;
}

function createObjectCanvas(object: WorldObjectDefinition) {
  const width = object.width * TILE_SIZE;
  const height = object.height * TILE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  if (object.type === "tree") {
    rect(ctx, width / 2 - 7, height - 34, 14, 28, "#6a432c");
    rect(ctx, 8, 20, width - 16, 28, "#237044");
    rect(ctx, 0, 37, width, 34, "#1d5a3c");
    rect(ctx, 18, 8, width - 30, 26, "#2f9360");
    rect(ctx, 13, 26, 10, 6, "#83d47b");
    return canvas;
  }

  if (object.type === "rock") {
    rect(ctx, 7, 14, 20, 14, "#4c5364");
    rect(ctx, 10, 10, 15, 8, "#8792a5");
    rect(ctx, 19, 19, 8, 8, "#2b3240");
    return canvas;
  }

  if (object.type === "shard") {
    rect(ctx, 13, 4, 7, 7, "#dffcff");
    rect(ctx, 9, 11, 15, 12, "#6ee7f7");
    rect(ctx, 12, 15, 6, 13, "#c2fff4");
    rect(ctx, 20, 17, 5, 8, "#318cc8");
    return canvas;
  }

  if (object.type === "sign") {
    rect(ctx, 14, 13, 4, 18, "#6a432c");
    rect(ctx, 3, 5, 26, 14, "#2a2430");
    rect(ctx, 5, 7, 22, 10, "#d39a50");
    rect(ctx, 8, 10, 12, 2, "#60452e");
    return canvas;
  }

  if (object.type === "practice_yard") {
    rect(ctx, 0, 0, width, height, "#766f63");
    rect(ctx, 8, 8, width - 16, height - 16, "#b98b55");
    rect(ctx, width / 2 - 30, height / 2 - 3, 60, 6, "#ffd06a");
    rect(ctx, width / 2 - 3, height / 2 - 30, 6, 60, "#72f0bf");
    return canvas;
  }

  if (object.type === "lamp") {
    rect(ctx, 14, 10, 4, 44, "#363243");
    rect(ctx, 9, 4, 14, 12, "#ffd06a");
    rect(ctx, 11, 6, 10, 8, "#fff0a8");
    rect(ctx, 7, 52, 18, 5, "#222433");
    return canvas;
  }

  if (object.type === "interior_exit") {
    rect(ctx, 7, 5, width - 14, height - 10, "#221925");
    rect(ctx, 10, 8, width - 20, height - 16, "#ffd06a");
    rect(ctx, 13, 12, width - 26, height - 24, "#4b2b33");
    rect(ctx, width / 2 - 3, height - 10, 6, 6, "#fff0a8");
    return canvas;
  }

  if (object.type === "bookshelf") {
    rect(ctx, 0, 8, width, height - 12, "#241b24");
    rect(ctx, 4, 4, width - 8, height - 12, "#6a432c");
    for (let x = 8; x < width - 10; x += 13) {
      rect(ctx, x, 9, 5, height - 22, x % 2 ? "#b6f7ff" : "#ffd06a");
      rect(ctx, x + 6, 11, 4, height - 24, "#c5a7ff");
    }
    rect(ctx, 4, height - 14, width - 8, 5, "#3a261d");
    return canvas;
  }

  if (object.type === "workbench") {
    rect(ctx, 3, 10, width - 6, height - 18, "#2b1f1c");
    rect(ctx, 7, 6, width - 14, 13, "#d39a50");
    rect(ctx, 9, 19, width - 18, height - 32, "#76513a");
    rect(ctx, 12, height - 15, 6, 12, "#3e2c22");
    rect(ctx, width - 18, height - 15, 6, 12, "#3e2c22");
    rect(ctx, width / 2 - 15, 23, 30, 4, "#8bd3ff");
    rect(ctx, width / 2 - 5, 31, 10, 8, "#ffd06a");
    return canvas;
  }

  if (object.type === "console") {
    rect(ctx, 4, 10, width - 8, height - 18, "#151923");
    rect(ctx, 8, 6, width - 16, 15, "#3d5570");
    rect(ctx, 11, 9, width - 22, 8, "#8bd3ff");
    rect(ctx, 10, 24, width - 20, height - 38, "#243044");
    for (let x = 13; x < width - 12; x += 10) {
      rect(ctx, x, height - 23, 5, 5, x % 2 ? "#72f0bf" : "#ffd06a");
    }
    return canvas;
  }

  if (object.type === "counter") {
    rect(ctx, 2, 12, width - 4, height - 20, "#241b18");
    rect(ctx, 6, 8, width - 12, 13, "#d1b37a");
    rect(ctx, 6, 21, width - 12, height - 34, "#806644");
    rect(ctx, 12, height - 20, width - 24, 5, "#70e6a2");
    rect(ctx, width - 20, 12, 9, 5, "#fff0a8");
    return canvas;
  }

  if (object.type === "speaker") {
    rect(ctx, 6, 5, width - 12, height - 11, "#151923");
    rect(ctx, 10, 9, width - 20, height - 19, "#372536");
    const centerX = width / 2;
    rect(ctx, centerX - 11, 15, 22, 22, "#ff8faf");
    rect(ctx, centerX - 6, 20, 12, 12, "#241925");
    rect(ctx, centerX - 15, height - 27, 30, 7, "#ffd06a");
    return canvas;
  }

  if (object.type === "telescope") {
    rect(ctx, width / 2 - 5, height - 34, 10, 25, "#4c3d4a");
    rect(ctx, width / 2 - 24, height - 47, 48, 13, "#b7a9b9");
    rect(ctx, width / 2 + 16, height - 43, 15, 6, "#90f7ff");
    rect(ctx, width / 2 - 12, height - 12, 24, 6, "#2d2537");
    rect(ctx, width / 2 - 16, height - 6, 32, 4, "#8c3d38");
    return canvas;
  }

  if (object.type === "mosaic") {
    rect(ctx, 4, 4, width - 8, height - 8, "#241b38");
    for (let y = 9; y < height - 8; y += 12) {
      for (let x = 9; x < width - 8; x += 12) {
        const color = (x + y) % 3 === 0 ? "#72f0bf" : (x + y) % 3 === 1 ? "#c5a7ff" : "#ffd06a";
        rect(ctx, x, y, 6, 6, color);
      }
    }
    rect(ctx, width / 2 - 12, height / 2 - 2, 24, 4, "#b6f7ff");
    return canvas;
  }

  rect(ctx, 3, 3, width - 6, height - 6, "#6a432c");
  rect(ctx, 7, 7, width - 14, height - 14, "#d39a50");
  return canvas;
}

function objectTextureKey(object: WorldObjectDefinition) {
  return `object-${object.type}-${object.width}x${object.height}`;
}

function drawBuildingIdentity(
  ctx: CanvasRenderingContext2D,
  portal: PortalDefinition,
  palette: Record<string, string>,
  width: number,
  height: number,
  wallY: number
) {
  if (portal.id === "ai_lab") {
    rect(ctx, width / 2 - 18, 16, 36, 15, "#1e3144");
    rect(ctx, width / 2 - 14, 18, 28, 9, palette.window);
    rect(ctx, width / 2 - 2, 0, 4, 17, palette.roofLight);
    rect(ctx, width / 2 - 10, 2, 20, 4, palette.roofLight);
    rect(ctx, 28, height - 34, width - 56, 4, palette.window);
    rect(ctx, 36, height - 27, 8, 5, "#72f0bf");
    rect(ctx, width - 45, height - 27, 8, 5, "#72f0bf");
    return;
  }

  if (portal.id === "trading_house") {
    rect(ctx, width / 2 - 35, wallY + 17, 70, 19, "#16251c");
    rect(ctx, width / 2 - 30, wallY + 21, 14, 4, "#70e6a2");
    rect(ctx, width / 2 - 10, wallY + 26, 20, 3, "#ffd06a");
    rect(ctx, width / 2 + 18, wallY + 21, 14, 4, "#70e6a2");
    rect(ctx, 24, height - 33, 13, 10, "#ffd06a");
    rect(ctx, width - 37, height - 33, 13, 10, "#ffd06a");
    return;
  }

  if (portal.id === "observatory") {
    rect(ctx, width / 2 - 26, 14, 52, 17, palette.roofLight);
    rect(ctx, width / 2 - 30, 28, 60, 8, palette.roofShade);
    rect(ctx, width / 2 + 15, 10, 46, 7, "#90f7ff");
    rect(ctx, width / 2 + 50, 7, 8, 13, "#efe2ed");
    rect(ctx, 28, wallY + 22, 5, 5, "#fff0a8");
    rect(ctx, width - 33, wallY + 18, 5, 5, "#fff0a8");
    rect(ctx, width - 49, wallY + 34, 4, 4, "#b6f7ff");
    return;
  }

  if (portal.id === "music_studio") {
    rect(ctx, width / 2 - 42, wallY + 17, 84, 16, "#241925");
    for (let x = -30; x <= 30; x += 12) {
      const barHeight = 5 + Math.abs(x / 6);
      rect(ctx, width / 2 + x, wallY + 25 - barHeight / 2, 5, barHeight, x % 24 === 0 ? "#ffd06a" : "#ff8faf");
    }
    rect(ctx, 20, height - 43, 18, 27, "#151923");
    rect(ctx, width - 38, height - 43, 18, 27, "#151923");
    rect(ctx, 25, height - 35, 8, 8, "#ffd06a");
    rect(ctx, width - 33, height - 35, 8, 8, "#ffd06a");
    return;
  }

  if (portal.id === "particle_gallery") {
    rect(ctx, width / 2 - 34, wallY + 15, 68, 26, "#241b38");
    for (let index = 0; index < 7; index += 1) {
      const x = width / 2 - 27 + index * 9;
      const y = wallY + 20 + (index % 2) * 8;
      rect(ctx, x, y, 5, 5, index % 3 === 0 ? "#72f0bf" : index % 3 === 1 ? "#c5a7ff" : "#ffd06a");
    }
    rect(ctx, width / 2 - 24, wallY + 37, 48, 3, "#b6f7ff");
    return;
  }

  if (portal.id === "workshop") {
    rect(ctx, width - 45, 17, 14, 29, "#3e2c22");
    rect(ctx, width - 48, 12, 20, 7, palette.roofShade);
    rect(ctx, 23, wallY + 18, 54, 17, "#2b2418");
    rect(ctx, 29, wallY + 23, 13, 3, "#8bd3ff");
    rect(ctx, 49, wallY + 22, 5, 9, "#ffd06a");
    rect(ctx, 60, wallY + 24, 11, 4, "#72f0bf");
    return;
  }

  if (portal.id === "physics_lab") {
    rect(ctx, width / 2 - 34, wallY + 17, 68, 20, "#1e2833");
    rect(ctx, width / 2, wallY + 19, 3, 15, "#9ee8ff");
    rect(ctx, width / 2 - 7, wallY + 33, 17, 5, "#ffd06a");
    rect(ctx, width / 2 + 22, wallY + 21, 14, 12, "#9ee8ff");
    rect(ctx, width / 2 - 34, wallY + 24, 13, 4, "#ff8f70");
    return;
  }

  if (portal.id === "contact_house") {
    rect(ctx, width - 36, height - 38, 19, 12, "#f6b26b");
    rect(ctx, width - 32, height - 43, 11, 6, "#fff0a8");
    rect(ctx, 21, height - 39, 12, 20, "#363243");
    rect(ctx, 17, height - 48, 20, 13, "#ffd06a");
    return;
  }

  if (portal.id === "archive_gate") {
    rect(ctx, 18, wallY + 8, 13, height - wallY - 19, "#38424a");
    rect(ctx, width - 31, wallY + 8, 13, height - wallY - 19, "#38424a");
    for (let y = wallY + 18; y < height - 30; y += 13) {
      rect(ctx, 22, y, 5, 5, "#b6f7ff");
      rect(ctx, width - 27, y + 4, 5, 5, "#ffd06a");
    }
  }
}

function buildingPalette(id: string) {
  const palettes: Record<string, Record<string, string>> = {
    ai_lab: {
      roof: "#4d93d8",
      roofLight: "#a7e0ff",
      roofShade: "#2b538a",
      wall: "#c5d7e2",
      wallLight: "#f1fbff",
      wallShade: "#7b91a6",
      door: "#243044",
      window: "#b9fff4"
    },
    trading_house: {
      roof: "#2f9a68",
      roofLight: "#9dffbd",
      roofShade: "#1c5b43",
      wall: "#d1b37a",
      wallLight: "#ffe0a0",
      wallShade: "#806644",
      door: "#3a2d24",
      window: "#fff0a8"
    },
    observatory: {
      roof: "#e86d51",
      roofLight: "#ffb072",
      roofShade: "#8c3d38",
      wall: "#b7a9b9",
      wallLight: "#efe2ed",
      wallShade: "#776783",
      door: "#392638",
      window: "#90f7ff"
    },
    music_studio: {
      roof: "#c75d86",
      roofLight: "#ffb3ca",
      roofShade: "#7c3353",
      wall: "#bda3a8",
      wallLight: "#eed5dc",
      wallShade: "#7d6870",
      door: "#372536",
      window: "#ffd06a"
    },
    particle_gallery: {
      roof: "#7a5ccf",
      roofLight: "#c5a7ff",
      roofShade: "#44306f",
      wall: "#c3bdd1",
      wallLight: "#f1eaff",
      wallShade: "#7b6e8d",
      door: "#241b38",
      window: "#b6f7ff"
    }
  };

  return (
    palettes[id] ?? {
      roof: "#d49b35",
      roofLight: "#ffd66a",
      roofShade: "#8f6124",
      wall: "#d9c196",
      wallLight: "#f4e0ae",
      wallShade: "#9c7a58",
      door: "#4e3328",
      window: "#77d9ff"
    }
  );
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  rect(ctx, x - 3, y - 3, 26, 24, "#24202a");
  rect(ctx, x, y, 20, 18, color);
  rect(ctx, x + 2, y + 2, 6, 5, "#fff2a7");
  rect(ctx, x + 9, y, 2, 18, "#24202a");
  rect(ctx, x, y + 8, 20, 2, "#24202a");
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function tileCenter(tileX: number) {
  return tileX * TILE_SIZE + TILE_SIZE / 2;
}

function tileFoot(tileY: number) {
  return tileY * TILE_SIZE + TILE_SIZE * 0.82;
}

function distanceToObject(playerX: number, playerY: number, object: WorldObjectDefinition) {
  const left = object.x * TILE_SIZE;
  const right = left + object.width * TILE_SIZE;
  const top = object.y * TILE_SIZE;
  const bottom = top + object.height * TILE_SIZE;
  const nearestX = Phaser.Math.Clamp(playerX, left, right);
  const nearestY = Phaser.Math.Clamp(playerY, top, bottom);

  return Phaser.Math.Distance.Between(playerX, playerY, nearestX, nearestY);
}
