import { contentRegistry } from "../memory/contentRegistry";
import type {
  CharacterDefinition,
  Condition,
  ConversationState,
  DialogueAction,
  DialoguePage,
  DialogueProfile,
  DialogueVariant,
  EnemyDefinition,
  FloatingText,
  HitboxState,
  InventoryEntry,
  ItemDefinition,
  JobDefinition,
  JobProgress,
  MapDefinition,
  PortalDefinition,
  ProjectileState,
  QuestDefinition,
  QuestObjectiveDefinition,
  RuntimeEnemy,
  RuntimeNpc,
  SaveState,
  SceneMode,
  SettingsState,
  ShopDefinition,
} from "../memory/types";
import { AudioManager } from "./AudioManager";
import { SaveManager } from "./SaveManager";

export const TILE_SIZE = 16;
export const CANVAS_WIDTH = 512;
export const CANVAS_HEIGHT = 288;

export type PauseTab = "status" | "inventory" | "journal" | "jobs" | "map" | "save" | "settings";

interface ToastMessage {
  id: string;
  text: string;
  ttlMs: number;
}

interface PickupDrop {
  id: string;
  x: number;
  y: number;
  itemId?: string;
  quantity: number;
  gold?: number;
}

interface ResourceRuntimeState {
  key: string;
  availableAt: number;
}

interface RuntimeNpcEx extends RuntimeNpc {
  targetX: number;
  targetY: number;
  moveSpeed: number;
}

interface RuntimeEnemyEx extends RuntimeEnemy {
  homeX: number;
  homeY: number;
  chargeTimerMs: number;
  patternIndex: number;
  strafeDirection: number;
}

interface InteractionTarget {
  kind: "npc" | "node" | "portal";
  id: string;
  x: number;
  y: number;
  label: string;
  prompt: string;
  score: number;
  priority: number;
  npcId?: string;
  nodeId?: string;
  portalId?: string;
}

interface ConversationInstance {
  npcId: string;
  variant: DialogueVariant;
  page: DialoguePage;
  visitedPageIds: Set<string>;
  temporary?: boolean;
}

export interface RenderState {
  map: MapDefinition;
  cameraX: number;
  cameraY: number;
  player: {
    x: number;
    y: number;
    facing: "up" | "down" | "left" | "right";
    animFrame: number;
    attacking: boolean;
    dodging: boolean;
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    aether: number;
    maxAether: number;
  };
  npcs: Array<{
    id: string;
    x: number;
    y: number;
    spriteId: string;
    frame: number;
    facing: "up" | "down" | "left" | "right";
    marker?: "quest" | "turnin" | "job" | "shop";
  }>;
  enemies: Array<{
    id: string;
    x: number;
    y: number;
    spriteId: string;
    frame: number;
    facing: "up" | "down" | "left" | "right";
    health: number;
    maxHealth: number;
    elite: boolean;
  }>;
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    spriteId: string;
    available: boolean;
  }>;
  projectiles: ProjectileState[];
  hitboxes: HitboxState[];
  floatingTexts: FloatingText[];
  pickups: PickupDrop[];
  prompt?: string;
  interactionHint?: {
    x: number;
    y: number;
    key: string;
    label: string;
  };
  nearBoss: boolean;
  timeMinutes: number;
  animationMs: number;
}

export interface UiState {
  mode: SceneMode;
  pauseTab: PauseTab;
  mapName: string;
  regionName: string;
  chapter: number;
  gold: number;
  prompt?: string;
  toasts: ToastMessage[];
  playerName: string;
  playerVitals: {
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    aether: number;
    maxAether: number;
  };
  activeQuests: Array<{
    id: string;
    title: string;
    category: "main" | "side";
    summary: string;
    objectives: Array<{ label: string; current: number; required: number }>;
    readyToTurnIn: boolean;
  }>;
  completedQuestCount: number;
  jobs: Array<{
    id: string;
    name: string;
    rank: number;
    rankTitle: string;
    loopsCompleted: number;
    active: boolean;
    readyToTurnIn: boolean;
    current: number;
    required: number;
    label: string;
  }>;
  inventory: Array<{
    itemId: string;
    quantity: number;
    item: ItemDefinition;
    equipped: boolean;
  }>;
  equipment: {
    weapon?: ItemDefinition;
    armor?: ItemDefinition;
    trinket?: ItemDefinition;
  };
  conversation?: {
    speakerName: string;
    text: string[];
    choices: Array<{ id: string; label: string }>;
  };
  shop?: {
    id: string;
    name: string;
    stock: Array<{ itemId: string; price: number; item: ItemDefinition; affordable: boolean }>;
  };
  settings: SettingsState;
  timeLabel: string;
  discoveredRegions: string[];
  saveLabel: string;
  gameOver: boolean;
  storyComplete: boolean;
  ending?: {
    title: string;
    summary: string[];
    stats: Array<{ label: string; value: string }>;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function makeRectFromCenter(x: number, y: number, size: number) {
  return { x: x - size / 2, y: y - size / 2, w: size, h: size };
}

function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function nowId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTime(minutes: number): string {
  const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(wrapped / 60);
  const mins = Math.floor(wrapped % 60);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export class GameSession {
  private save: SaveState;
  private readonly saveManager: SaveManager;
  private readonly audioManager: AudioManager;
  private currentMap: MapDefinition;
  private npcs: RuntimeNpcEx[] = [];
  private enemies: RuntimeEnemyEx[] = [];
  private projectiles: ProjectileState[] = [];
  private hitboxes: HitboxState[] = [];
  private floatingTexts: FloatingText[] = [];
  private pickups: PickupDrop[] = [];
  private nodeTimers = new Map<string, ResourceRuntimeState>();
  private mode: SceneMode = "playing";
  private pauseTab: PauseTab = "status";
  private conversation: ConversationInstance | null = null;
  private activeShopId: string | null = null;
  private toasts: ToastMessage[] = [];
  private prompt: string | undefined;
  private attackCooldownMs = 0;
  private skillCooldownMs = 0;
  private dodgeCooldownMs = 0;
  private dodgeTimerMs = 0;
  private invulnerabilityMs = 0;
  private attackAnimMs = 0;
  private autoSaveMs = 0;
  private elapsedMs = 0;
  private quickItemId = "field_tonic";
  private playerDashVector = { x: 0, y: 0 };
  private playerKnockback = { x: 0, y: 0, timerMs: 0 };
  private lastMusicTrack: string | null = null;
  private interactionHint: InteractionTarget | null = null;

  constructor(save: SaveState, saveManager: SaveManager, audioManager: AudioManager) {
    this.save = structuredClone(save);
    this.saveManager = saveManager;
    this.audioManager = audioManager;
    this.currentMap = contentRegistry.maps[this.save.currentMapId];
    this.ensureDerivedStats();
    this.loadMap(this.save.currentMapId, this.save.respawnSpawnId, true);
    const storedTime = Number(this.save.flags["time.minutes"] ?? 480);
    this.save.flags["time.minutes"] = Number.isFinite(storedTime) ? storedTime : 480;
    if (this.isEndingPending()) {
      this.mode = "ending";
    }
    this.updateMusic();
  }

  getMode(): SceneMode {
    return this.mode;
  }

  getCurrentSlot(): number {
    return this.save.slot;
  }

  openScript(npcId: string): void {
    this.openNpcConversation(npcId);
  }

  getRenderState(): RenderState {
    const cameraX = clamp(this.save.player.x - CANVAS_WIDTH / 2, 0, Math.max(0, this.currentMap.width * TILE_SIZE - CANVAS_WIDTH));
    const cameraY = clamp(this.save.player.y - CANVAS_HEIGHT / 2, 0, Math.max(0, this.currentMap.height * TILE_SIZE - CANVAS_HEIGHT));

    return {
      map: this.currentMap,
      cameraX,
      cameraY,
      player: {
        x: this.save.player.x,
        y: this.save.player.y,
        facing: this.save.player.direction,
        animFrame: Math.floor(this.elapsedMs / 160) % 2,
        attacking: this.attackAnimMs > 0,
        dodging: this.dodgeTimerMs > 0,
        health: this.save.player.stats.health,
        maxHealth: this.getDerivedStat("maxHealth"),
        stamina: this.save.player.stats.stamina,
        maxStamina: this.getDerivedStat("maxStamina"),
        aether: this.save.player.stats.aether,
        maxAether: this.getDerivedStat("maxAether"),
      },
      npcs: this.npcs.map((npc) => {
        const character = contentRegistry.characters[npc.npcId];
        return {
          id: npc.id,
          x: npc.x,
          y: npc.y,
          spriteId: character?.spriteId ?? "npc_townsfolk",
          frame: Math.floor(this.elapsedMs / 300) % 2,
          facing: npc.facing,
          marker: this.getNpcMarker(character),
        };
      }),
      enemies: this.enemies
        .filter((enemy) => enemy.state !== "dead")
        .map((enemy) => {
          const definition = contentRegistry.enemies[enemy.enemyId];
          return {
            id: enemy.id,
            x: enemy.x,
            y: enemy.y,
            spriteId: definition?.spriteId ?? "enemy_mossling",
            frame: Math.floor(this.elapsedMs / 180) % 2,
            facing: enemy.facing,
            health: enemy.health,
            maxHealth: definition.maxHealth,
            elite: Boolean(definition.elite),
          };
        }),
      nodes: this.currentMap.resourceNodes.map((node) => ({
        id: node.id,
        x: node.x * TILE_SIZE,
        y: node.y * TILE_SIZE,
        spriteId:
          node.type === "herb"
            ? "herb_node"
            : node.type === "ore"
              ? "ore_node"
              : node.type === "fish"
                ? "fish_node"
                : node.type === "crate"
                  ? "crate_node"
                  : node.type === "sign"
                    ? "sign_post"
                    : node.type === "lore"
                      ? "lore_plaque"
                      : node.type === "bed"
                        ? "bed_node"
                        : node.type === "chest"
                          ? "chest_node"
                          : "ui_logo_emblem",
        available: this.isNodeAvailable(node.id),
      })),
      projectiles: this.projectiles,
      hitboxes: this.hitboxes,
      floatingTexts: this.floatingTexts,
      pickups: this.pickups,
      prompt: this.prompt,
      interactionHint: this.interactionHint
        ? {
            x: this.interactionHint.x,
            y: this.interactionHint.y,
            key: "E",
            label: this.interactionHint.label,
          }
        : undefined,
      nearBoss: this.enemies.some((enemy) => enemy.enemyId === "the_hollow_stag" && enemy.state !== "dead"),
      timeMinutes: Number(this.save.flags["time.minutes"] ?? 480),
      animationMs: this.elapsedMs,
    };
  }

  getUiState(): UiState {
    const map = contentRegistry.maps[this.save.currentMapId];
    const region = contentRegistry.regions[map.regionId];

    return {
      mode: this.mode,
      pauseTab: this.pauseTab,
      mapName: map.name,
      regionName: region?.name ?? map.regionId,
      chapter: this.save.chapter,
      gold: this.save.gold,
      prompt: this.prompt,
      toasts: this.toasts,
      playerName: this.save.player.name,
      playerVitals: {
        health: this.save.player.stats.health,
        maxHealth: this.getDerivedStat("maxHealth"),
        stamina: this.save.player.stats.stamina,
        maxStamina: this.getDerivedStat("maxStamina"),
        aether: this.save.player.stats.aether,
        maxAether: this.getDerivedStat("maxAether"),
      },
      activeQuests: this.save.activeQuestIds.map((questId) => {
        const quest = contentRegistry.quests[questId];
        const progress = this.save.questProgress[questId];
        return {
          id: quest.id,
          title: quest.title,
          category: quest.category,
          summary: quest.summary,
          objectives: quest.objectives.map((objective) => ({
            label: objective.label,
            current: progress.objectiveCounts[objective.id] ?? 0,
            required: objective.required,
          })),
          readyToTurnIn: progress.turnInReady,
        };
      }),
      completedQuestCount: this.save.completedQuestIds.length,
      jobs: Object.values(contentRegistry.jobs).map((job) => {
        const progress = this.save.jobProgress[job.id];
        const currentRequired = job.objective.required;
        return {
          id: job.id,
          name: job.name,
          rank: progress.rank,
          rankTitle: job.rankTitles[progress.rank] ?? job.rankTitles[job.rankTitles.length - 1],
          loopsCompleted: progress.loopsCompleted,
          active: progress.active,
          readyToTurnIn: progress.readyToTurnIn,
          current: progress.currentCount,
          required: currentRequired,
          label: job.objective.label,
        };
      }),
      inventory: this.save.inventory
        .map((entry) => ({
          itemId: entry.itemId,
          quantity: entry.quantity,
          item: contentRegistry.items[entry.itemId],
          equipped: Object.values(this.save.equipment).includes(entry.itemId),
        }))
        .filter((entry) => Boolean(entry.item))
        .sort((a, b) => a.item.category.localeCompare(b.item.category) || a.item.name.localeCompare(b.item.name)),
      equipment: {
        weapon: this.save.equipment.weapon ? contentRegistry.items[this.save.equipment.weapon] : undefined,
        armor: this.save.equipment.armor ? contentRegistry.items[this.save.equipment.armor] : undefined,
        trinket: this.save.equipment.trinket ? contentRegistry.items[this.save.equipment.trinket] : undefined,
      },
      conversation: this.conversation
        ? {
            speakerName: this.conversation.page.speakerName,
            text: this.conversation.page.text,
            choices: this.conversation.page.choices?.map((choice) => ({ id: choice.id, label: choice.label })) ?? [],
          }
        : undefined,
      shop: this.activeShopId
        ? (() => {
            const shop = contentRegistry.shops[this.activeShopId!] as ShopDefinition;
            return {
              id: shop.id,
              name: shop.name,
              stock: shop.inventory.map((stock) => ({
                itemId: stock.itemId,
                price: stock.price,
                item: contentRegistry.items[stock.itemId],
                affordable: this.save.gold >= stock.price,
              })),
            };
          })()
        : undefined,
      settings: this.save.settings,
      timeLabel: formatTime(Number(this.save.flags["time.minutes"] ?? 480)),
      discoveredRegions: this.save.discoveredRegionIds,
      saveLabel: this.save.label,
      gameOver: this.mode === "gameover",
      storyComplete: this.hasClearedMainStory(),
      ending: this.mode === "ending" ? this.getEndingState() : undefined,
    };
  }

  update(deltaMs: number, input: { isDown(key: string): boolean; wasPressed(key: string): boolean; getMovementVector(): { x: number; y: number } }): void {
    this.elapsedMs += deltaMs;
    this.prompt = undefined;
    this.interactionHint = null;
    this.tickTimers(deltaMs);
    this.refreshCollectObjectives();

    if (this.mode === "ending") {
      if (input.wasPressed("e") || input.wasPressed("enter") || input.wasPressed("escape")) {
        this.dismissEnding();
      }
      return;
    }

    if (input.wasPressed("escape")) {
      if (this.mode === "dialogue") {
        this.closeDialogue();
        return;
      }
      if (this.mode === "shop") {
        this.closeShop();
        return;
      }
      if (this.mode === "paused") {
        this.resume();
      } else if (this.mode === "playing") {
        this.pause("status");
      }
      return;
    }

    if (this.mode === "dialogue") {
      if (!this.conversation?.page.choices?.length && (input.wasPressed("e") || input.wasPressed("enter"))) {
        this.advanceDialogue();
      }
      return;
    }

    if (this.mode === "shop" || this.mode === "paused" || this.mode === "gameover") {
      return;
    }

    if (input.wasPressed("tab")) {
      this.pause("map");
      return;
    }

    this.save.playtimeMs += deltaMs;
    this.save.flags["time.minutes"] = Number(this.save.flags["time.minutes"] ?? 480) + deltaMs / 1000 * 2.5;
    this.autoSaveMs += deltaMs;

    if (input.wasPressed("q")) {
      this.useItem(this.quickItemId);
    }
    if (input.wasPressed("j")) {
      this.playerAttack();
    }
    if (input.wasPressed("k")) {
      this.useSkill("skill_lantern_spark");
    }
    if (input.wasPressed(" ")) {
      this.dodge(input.getMovementVector());
    }

    this.updateMovement(deltaMs, input.getMovementVector());
    this.updateNpcs(deltaMs);
    this.updateInteractionState();
    if (input.wasPressed("e")) {
      this.interact();
      if (this.mode !== "playing") {
        this.updateMusic();
        return;
      }
    }
    this.updateEnemies(deltaMs);
    this.updateProjectiles(deltaMs);
    this.updateHitboxes(deltaMs);
    this.updatePickups();
    this.updateFloatingTexts(deltaMs);
    this.updateMusic();

    if (this.autoSaveMs > 45000) {
      this.manualSave(this.save.slot, true);
      this.autoSaveMs = 0;
    }
  }

  pause(tab: PauseTab): void {
    this.mode = "paused";
    this.pauseTab = tab;
    this.audioManager.playMusic("menu_theme");
  }

  resume(): void {
    this.mode = "playing";
    this.activeShopId = null;
    this.conversation = null;
    this.updateMusic();
  }

  closeDialogue(): void {
    this.conversation = null;
    if (this.mode === "dialogue") {
      this.mode = "playing";
    }
    this.updateMusic();
  }

  chooseDialogue(choiceId: string): void {
    if (!this.conversation) {
      return;
    }

    const choice = this.conversation.page.choices?.find((candidate) => candidate.id === choiceId);
    if (!choice) {
      return;
    }

    choice.actions?.forEach((action) => this.performAction(action));
    if (choice.close) {
      this.closeDialogue();
      return;
    }
    if (choice.nextPageId) {
      this.enterDialoguePage(choice.nextPageId);
    } else {
      this.closeDialogue();
    }
  }

  advanceDialogue(): void {
    if (!this.conversation) {
      return;
    }

    if (this.conversation.page.nextPageId) {
      this.enterDialoguePage(this.conversation.page.nextPageId);
      return;
    }

    this.closeDialogue();
  }

  buyItem(itemId: string): void {
    if (!this.activeShopId) {
      return;
    }

    const shop = contentRegistry.shops[this.activeShopId];
    const stock = shop.inventory.find((entry) => entry.itemId === itemId);
    if (!stock || this.save.gold < stock.price) {
      return;
    }

    this.save.gold -= stock.price;
    this.addItem(itemId, 1);
    this.addToast(`Bought ${contentRegistry.items[itemId].name}`);
    this.audioManager.playSfx("coin");
  }

  closeShop(): void {
    this.activeShopId = null;
    this.mode = "playing";
    this.updateMusic();
  }

  setPauseTab(tab: PauseTab): void {
    this.pauseTab = tab;
  }

  setSettings(settings: Partial<SettingsState>): void {
    this.save.settings = { ...this.save.settings, ...settings };
    this.saveManager.saveSettings(this.save.settings);
    this.audioManager.applySettings(this.save.settings);
    this.updateMusic();
  }

  manualSave(slot: number, auto = false, silent = false): void {
    this.save.slot = slot;
    this.save.currentMapId = this.currentMap.id;
    this.saveManager.saveSlot(this.save);
    if (!silent) {
      this.addToast(auto ? "Auto-saved." : `Saved to slot ${slot}.`);
      this.audioManager.playSfx("save");
    }
  }

  dismissEnding(): void {
    this.save.flags["story.ending_seen"] = true;
    this.mode = "playing";
    this.manualSave(this.save.slot, true, true);
    this.updateMusic();
  }

  equipItem(itemId: string): void {
    const item = contentRegistry.items[itemId];
    if (!item?.equipmentSlot || !this.getInventoryCount(itemId)) {
      return;
    }

    this.save.equipment[item.equipmentSlot] = itemId;
    this.ensureDerivedStats();
    this.addToast(`Equipped ${item.name}`);
  }

  useItem(itemId: string): void {
    const item = contentRegistry.items[itemId];
    if (!item || !item.healAmount || this.getInventoryCount(itemId) <= 0) {
      return;
    }

    if (this.save.player.stats.health >= this.getDerivedStat("maxHealth")) {
      return;
    }

    this.removeItem(itemId, 1);
    this.save.player.stats.health = clamp(this.save.player.stats.health + item.healAmount, 0, this.getDerivedStat("maxHealth"));
    this.addFloatingText(this.save.player.x, this.save.player.y - 16, `+${item.healAmount}`, "#9af5b5");
    this.audioManager.playSfx("heal");
  }

  respawn(): void {
    const spawn = this.findSpawnPoint(this.save.respawnMapId, this.save.respawnSpawnId);
    this.loadMap(this.save.respawnMapId, this.save.respawnSpawnId, true);
    this.save.player.x = spawn.x * TILE_SIZE;
    this.save.player.y = spawn.y * TILE_SIZE;
    this.save.player.stats.health = Math.floor(this.getDerivedStat("maxHealth") * 0.7);
    this.save.player.stats.stamina = this.getDerivedStat("maxStamina");
    this.save.player.stats.aether = this.getDerivedStat("maxAether");
    this.save.gold = Math.floor(this.save.gold * 0.9);
    this.mode = "playing";
    this.addToast("You wake at the last safe hearth.");
  }

  private tickTimers(deltaMs: number): void {
    this.attackCooldownMs = Math.max(0, this.attackCooldownMs - deltaMs);
    this.skillCooldownMs = Math.max(0, this.skillCooldownMs - deltaMs);
    this.dodgeCooldownMs = Math.max(0, this.dodgeCooldownMs - deltaMs);
    this.dodgeTimerMs = Math.max(0, this.dodgeTimerMs - deltaMs);
    this.invulnerabilityMs = Math.max(0, this.invulnerabilityMs - deltaMs);
    this.attackAnimMs = Math.max(0, this.attackAnimMs - deltaMs);
    this.playerKnockback.timerMs = Math.max(0, this.playerKnockback.timerMs - deltaMs);

    this.toasts = this.toasts
      .map((toast) => ({ ...toast, ttlMs: toast.ttlMs - deltaMs }))
      .filter((toast) => toast.ttlMs > 0);

    this.nodeTimers.forEach((state, key) => {
      if (state.availableAt <= this.elapsedMs) {
        this.nodeTimers.delete(key);
      }
    });
  }

  private ensureDerivedStats(): void {
    this.save.player.stats.health = clamp(this.save.player.stats.health, 0, this.getDerivedStat("maxHealth"));
    this.save.player.stats.stamina = clamp(this.save.player.stats.stamina, 0, this.getDerivedStat("maxStamina"));
    this.save.player.stats.aether = clamp(this.save.player.stats.aether, 0, this.getDerivedStat("maxAether"));
  }

  private getDerivedStat(stat: "maxHealth" | "maxStamina" | "maxAether" | "attack" | "defense" | "moveSpeed"): number {
    const base = this.save.player.stats[stat];
    const bonuses = [this.save.equipment.weapon, this.save.equipment.armor, this.save.equipment.trinket]
      .filter(Boolean)
      .map((itemId) => contentRegistry.items[itemId!]?.statBonuses?.[stat] ?? 0)
      .reduce((total, value) => total + value, 0);
    return base + bonuses;
  }

  private findSpawnPoint(mapId: string, spawnId: string) {
    const map = contentRegistry.maps[mapId];
    return map.spawnPoints.find((spawn) => spawn.id === spawnId) ?? map.spawnPoints[0];
  }

  private loadMap(mapId: string, spawnId: string, silent = false): void {
    this.currentMap = contentRegistry.maps[mapId];
    this.save.currentMapId = mapId;
    const spawn = this.findSpawnPoint(mapId, spawnId);
    const safeSpawn = this.resolveSafeSpawn(spawn.x * TILE_SIZE, spawn.y * TILE_SIZE, 10);
    this.save.player.x = safeSpawn.x;
    this.save.player.y = safeSpawn.y;

    this.npcs = this.currentMap.npcPlacements.map((npc) => ({
      ...npc,
      dialogueProfileId: npc.npcId,
      stepTimer: Math.random() * 800,
      homeX: npc.x * TILE_SIZE,
      homeY: npc.y * TILE_SIZE,
      x: npc.x * TILE_SIZE,
      y: npc.y * TILE_SIZE,
      targetX: npc.x * TILE_SIZE,
      targetY: npc.y * TILE_SIZE,
      moveSpeed: 18 + Math.random() * 10,
    }));

    this.enemies = this.currentMap.enemyPlacements.map((enemy) => ({
      ...enemy,
      x: enemy.x * TILE_SIZE,
      y: enemy.y * TILE_SIZE,
      health: contentRegistry.enemies[enemy.enemyId].maxHealth,
      vx: 0,
      vy: 0,
      facing: "down",
      attackCooldown: Math.random() * 600,
      state: "idle",
      invulnerableMs: 0,
      respawnTimerMs: 0,
      homeX: enemy.x * TILE_SIZE,
      homeY: enemy.y * TILE_SIZE,
      chargeTimerMs: 0,
      patternIndex: 0,
      strafeDirection: Math.random() > 0.5 ? 1 : -1,
    }));

    this.projectiles = [];
    this.hitboxes = [];
    this.pickups = [];
    this.discoverMap(this.currentMap);
    this.recordEvent("visit", mapId, 1);

    if (!silent) {
      this.addToast(`Entered ${this.currentMap.name}`);
    }

    if (this.currentMap.safeZone) {
      this.save.respawnMapId = mapId;
      this.save.respawnSpawnId = spawnId;
    }
  }

  private resolveSafeSpawn(x: number, y: number, size: number): { x: number; y: number } {
    if (!this.collidesWithWalls(x, y, size)) {
      return { x, y };
    }

    const baseTileX = Math.floor(x / TILE_SIZE);
    const baseTileY = Math.floor(y / TILE_SIZE);
    for (let radius = 1; radius <= 4; radius += 1) {
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const tileX = baseTileX + offsetX;
          const tileY = baseTileY + offsetY;
          const candidateX = tileX * TILE_SIZE + TILE_SIZE / 2;
          const candidateY = tileY * TILE_SIZE + TILE_SIZE / 2;
          if (!this.collidesWithWalls(candidateX, candidateY, size)) {
            return { x: candidateX, y: candidateY };
          }
        }
      }
    }

    return { x, y };
  }

  private discoverMap(map: MapDefinition): void {
    if (!this.save.discoveredMapIds.includes(map.id)) {
      this.save.discoveredMapIds.push(map.id);
    }
    if (map.revealRegionId && !this.save.discoveredRegionIds.includes(map.revealRegionId)) {
      this.save.discoveredRegionIds.push(map.revealRegionId);
    }
  }

  private updateMovement(deltaMs: number, inputVector: { x: number; y: number }): void {
    const derivedSpeed = this.getDerivedStat("moveSpeed");
    let moveX = inputVector.x;
    let moveY = inputVector.y;

    if (moveX !== 0 || moveY !== 0) {
      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.save.player.direction = moveX > 0 ? "right" : "left";
      } else {
        this.save.player.direction = moveY > 0 ? "down" : "up";
      }
    }

    if (this.dodgeTimerMs > 0) {
      moveX = this.playerDashVector.x;
      moveY = this.playerDashVector.y;
    }

    let velocityX = moveX * derivedSpeed;
    let velocityY = moveY * derivedSpeed;

    if (this.playerKnockback.timerMs > 0) {
      velocityX += this.playerKnockback.x;
      velocityY += this.playerKnockback.y;
    }

    const nextX = this.save.player.x + (velocityX * deltaMs) / 1000;
    if (!this.collidesWithWalls(nextX, this.save.player.y, 10)) {
      this.save.player.x = nextX;
    }
    const nextY = this.save.player.y + (velocityY * deltaMs) / 1000;
    if (!this.collidesWithWalls(this.save.player.x, nextY, 10)) {
      this.save.player.y = nextY;
    }

    if (moveX !== 0 || moveY !== 0) {
      this.save.player.stats.stamina = clamp(
        this.save.player.stats.stamina + deltaMs * (this.dodgeTimerMs > 0 ? 0 : 0.006),
        0,
        this.getDerivedStat("maxStamina"),
      );
    } else {
      this.save.player.stats.stamina = clamp(this.save.player.stats.stamina + deltaMs * 0.02, 0, this.getDerivedStat("maxStamina"));
    }
    this.save.player.stats.aether = clamp(this.save.player.stats.aether + deltaMs * 0.01, 0, this.getDerivedStat("maxAether"));
  }

  private collidesWithWalls(x: number, y: number, size: number): boolean {
    const rect = makeRectFromCenter(x, y, size);
    const minTileX = Math.floor(rect.x / TILE_SIZE);
    const maxTileX = Math.floor((rect.x + rect.w - 1) / TILE_SIZE);
    const minTileY = Math.floor(rect.y / TILE_SIZE);
    const maxTileY = Math.floor((rect.y + rect.h - 1) / TILE_SIZE);

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        if (this.isPortalTile(tileX, tileY)) {
          continue;
        }
        const row = this.currentMap.layout[tileY];
        const cell = row?.[tileX] ?? "#";
        const tileInfo = this.currentMap.legend[cell as keyof typeof this.currentMap.legend];
        if (!tileInfo || tileInfo.solid) {
          return true;
        }
      }
    }

    return false;
  }

  private moveBodyWithCollisions(
    body: { x: number; y: number; vx?: number; vy?: number },
    velocityX: number,
    velocityY: number,
    size: number,
    deltaMs: number,
  ): void {
    const nextX = body.x + (velocityX * deltaMs) / 1000;
    if (!this.collidesWithWalls(nextX, body.y, size)) {
      body.x = nextX;
    } else if (typeof body.vx === "number") {
      body.vx = 0;
    }

    const nextY = body.y + (velocityY * deltaMs) / 1000;
    if (!this.collidesWithWalls(body.x, nextY, size)) {
      body.y = nextY;
    } else if (typeof body.vy === "number") {
      body.vy = 0;
    }
  }

  private isPortalTile(tileX: number, tileY: number): boolean {
    return this.currentMap.portals.some(
      (portal) =>
        tileX >= portal.x &&
        tileX < portal.x + portal.width &&
        tileY >= portal.y &&
        tileY < portal.y + portal.height,
    );
  }

  private isWalkableTile(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileY < 0 || tileX >= this.currentMap.width || tileY >= this.currentMap.height) {
      return false;
    }

    const cell = this.currentMap.layout[tileY]?.[tileX] ?? "#";
    const tileInfo = this.currentMap.legend[cell as keyof typeof this.currentMap.legend];
    return Boolean(tileInfo && !tileInfo.solid);
  }

  private hasWalkableTilesNextToPortal(portal: PortalDefinition, offsetX: number, offsetY: number): boolean {
    for (let tileY = portal.y; tileY < portal.y + portal.height; tileY += 1) {
      for (let tileX = portal.x; tileX < portal.x + portal.width; tileX += 1) {
        if (this.isWalkableTile(tileX + offsetX, tileY + offsetY)) {
          return true;
        }
      }
    }
    return false;
  }

  private getPortalRequiredDirection(portal: PortalDefinition): "up" | "down" | "left" | "right" | null {
    if (portal.y === 0) return "up";
    if (portal.y + portal.height >= this.currentMap.height) return "down";
    if (portal.x === 0) return "left";
    if (portal.x + portal.width >= this.currentMap.width) return "right";

    const openAbove = this.hasWalkableTilesNextToPortal(portal, 0, -1);
    const openBelow = this.hasWalkableTilesNextToPortal(portal, 0, 1);
    const openLeft = this.hasWalkableTilesNextToPortal(portal, -1, 0);
    const openRight = this.hasWalkableTilesNextToPortal(portal, 1, 0);

    if (openBelow && !openAbove) return "up";
    if (openAbove && !openBelow) return "down";
    if (openRight && !openLeft) return "left";
    if (openLeft && !openRight) return "right";
    return null;
  }

  private getPortalTriggerRect(portal: PortalDefinition) {
    const requiredDirection = this.getPortalRequiredDirection(portal);
    const edgePadding = 3;
    const approachReach = TILE_SIZE * 0.6;
    let x = portal.x * TILE_SIZE - edgePadding;
    let y = portal.y * TILE_SIZE - edgePadding;
    let w = portal.width * TILE_SIZE + edgePadding * 2;
    let h = portal.height * TILE_SIZE + edgePadding * 2;

    if (requiredDirection === "up") {
      h += approachReach;
    } else if (requiredDirection === "down") {
      y -= approachReach;
      h += approachReach;
    } else if (requiredDirection === "left") {
      w += approachReach;
    } else if (requiredDirection === "right") {
      x -= approachReach;
      w += approachReach;
    }

    return { x, y, w, h };
  }

  private playerAttack(): void {
    const weapon = Object.values(contentRegistry.weapons).find((definition) => definition.itemId === this.save.equipment.weapon) ?? contentRegistry.weapons.weapon_rust_blade;
    if (this.attackCooldownMs > 0 || this.save.player.stats.stamina < weapon.staminaCost) {
      return;
    }

    this.save.player.stats.stamina = Math.max(0, this.save.player.stats.stamina - weapon.staminaCost);
    this.attackCooldownMs = weapon.cooldownMs;
    this.attackAnimMs = 180;
    this.audioManager.playSfx("swing");

    if (weapon.style === "bow" || weapon.style === "arcane") {
      const direction = this.directionVector(this.save.player.direction);
      const projectileSpeed = weapon.style === "bow" ? 236 : 168;
      const projectileRadius = weapon.style === "bow" ? 3 : 5;
      const projectileTtl = weapon.style === "bow" ? 980 : 1120;
      const spawnDistance = weapon.style === "bow" ? 12 : 9;
      this.spawnProjectile({
        owner: "player",
        x: this.save.player.x + direction.x * spawnDistance,
        y: this.save.player.y + direction.y * spawnDistance,
        vx: direction.x * projectileSpeed,
        vy: direction.y * projectileSpeed,
        radius: projectileRadius,
        damage: weapon.damage + this.getDerivedStat("attack"),
        ttlMs: projectileTtl,
        spriteId: weapon.projectileId ?? "arrow_amber",
      });
      this.audioManager.playSfx("projectile");
      return;
    }

    const direction = this.directionVector(this.save.player.direction);
    const width = weapon.style === "thrust" ? 12 : 18;
    const height = weapon.style === "thrust" ? 24 : 18;
    const centerX = this.save.player.x + direction.x * weapon.range;
    const centerY = this.save.player.y + direction.y * weapon.range;
    this.hitboxes.push({
      id: nowId("player-hitbox"),
      owner: "player",
      x: centerX - width / 2,
      y: centerY - height / 2,
      w: width,
      h: height,
      damage: weapon.damage + this.getDerivedStat("attack"),
      ttlMs: 120,
      knockback: weapon.knockback,
    });
  }

  private useSkill(skillId: string): void {
    const skill = contentRegistry.skills[skillId];
    if (!skill || this.skillCooldownMs > 0 || this.save.player.stats.aether < skill.aetherCost) {
      return;
    }

    this.skillCooldownMs = skill.cooldownMs;
    this.save.player.stats.aether -= skill.aetherCost;

    if (skill.damage < 0) {
      this.save.player.stats.health = clamp(this.save.player.stats.health - skill.damage, 0, this.getDerivedStat("maxHealth"));
      this.addFloatingText(this.save.player.x, this.save.player.y - 18, `${-skill.damage}`, "#9af5b5");
      this.audioManager.playSfx("heal");
      return;
    }

    const direction = this.directionVector(this.save.player.direction);
    this.spawnProjectile({
      owner: "player",
      x: this.save.player.x + direction.x * 10,
      y: this.save.player.y + direction.y * 10,
      vx: direction.x * 220,
      vy: direction.y * 220,
      radius: 4,
      damage: skill.damage + Math.floor(this.getDerivedStat("attack") * 0.5),
      ttlMs: 700,
      spriteId: skill.projectileId ?? "lantern_spark",
    });
    this.audioManager.playSfx("projectile");
  }

  private dodge(inputVector: { x: number; y: number }): void {
    if (this.dodgeCooldownMs > 0 || this.save.player.stats.stamina < 18) {
      return;
    }

    const direction =
      inputVector.x !== 0 || inputVector.y !== 0 ? inputVector : this.directionVector(this.save.player.direction);
    this.playerDashVector = direction;
    this.dodgeCooldownMs = 520;
    this.dodgeTimerMs = 180;
    this.invulnerabilityMs = 240;
    this.save.player.stats.stamina = Math.max(0, this.save.player.stats.stamina - 18);
    this.audioManager.playSfx("dodge");
  }

  private interact(): void {
    const target = this.interactionHint ?? this.getInteractionTarget();
    if (!target) {
      return;
    }

    if (target.kind === "npc" && target.npcId) {
      this.openNpcConversation(target.npcId);
      return;
    }

    if (target.kind === "portal" && target.portalId) {
      const portal = this.currentMap.portals.find((entry) => entry.id === target.portalId);
      if (!portal) {
        return;
      }
      this.audioManager.playSfx("menu_accept");
      this.loadMap(portal.targetMapId, portal.targetSpawnId);
      this.updateInteractionState();
      return;
    }

    if (target.kind !== "node" || !target.nodeId) {
      return;
    }

    const nearbyNode = this.currentMap.resourceNodes.find((node) => node.id === target.nodeId);
    if (!nearbyNode) {
      return;
    }

    if (nearbyNode.type === "sign" || nearbyNode.type === "lore") {
      this.openTemporaryDialogue(nearbyNode.label, nearbyNode.signText ?? ["You find nothing written there."]);
      if (nearbyNode.itemDrops && nearbyNode.type === "lore" && this.isNodeAvailable(nearbyNode.id)) {
        nearbyNode.itemDrops.forEach((drop) => this.addItem(drop.itemId, drop.quantity));
        this.setNodeCooldown(nearbyNode.id, nearbyNode.respawnMs ?? 180000, nearbyNode.lootFlag);
      }
      return;
    }

    if (nearbyNode.type === "bed") {
      this.rest();
      return;
    }

    if (!this.isNodeAvailable(nearbyNode.id)) {
      this.addToast("Nothing useful there right now.");
      return;
    }

    nearbyNode.itemDrops?.forEach((drop) => this.addItem(drop.itemId, drop.quantity));
    this.audioManager.playSfx("pickup");
    this.addToast(`Gathered from ${nearbyNode.label}.`);
    this.setNodeCooldown(nearbyNode.id, nearbyNode.respawnMs ?? 120000, nearbyNode.lootFlag);
  }

  private rest(): void {
    this.save.player.stats.health = this.getDerivedStat("maxHealth");
    this.save.player.stats.stamina = this.getDerivedStat("maxStamina");
    this.save.player.stats.aether = this.getDerivedStat("maxAether");
    this.save.flags["time.minutes"] = Number(this.save.flags["time.minutes"] ?? 480) + 60;
    this.addToast("Rested until the next watch.");
    this.audioManager.playSfx("heal");
  }

  private openNpcConversation(npcId: string): void {
    this.recordEvent("talk", npcId, 1);
    this.handleDeliveries(npcId);

    const profile = contentRegistry.dialogue[npcId];
    if (!profile) {
      const character = contentRegistry.characters[npcId];
      this.openTemporaryDialogue(character?.name ?? "Traveler", [character?.bio ?? "They have nothing to say right now."]);
      return;
    }

    const variant = this.selectDialogueVariant(profile);
    if (!variant) {
      const character = contentRegistry.characters[npcId];
      this.openTemporaryDialogue(character?.name ?? "Traveler", [character?.bio ?? "They have nothing to say right now."]);
      return;
    }

    this.mode = "dialogue";
    this.conversation = {
      npcId,
      variant,
      page: variant.pages[0],
      visitedPageIds: new Set<string>(),
    };
    this.enterDialoguePage(variant.entryPageId);
  }

  private openTemporaryDialogue(speakerName: string, text: string[]): void {
    this.mode = "dialogue";
    const page: DialoguePage = {
      id: "temp",
      speakerId: "temporary",
      speakerName,
      text,
    };
    const variant: DialogueVariant = { id: "temporary", entryPageId: "temp", pages: [page] };
    this.conversation = {
      npcId: "temporary",
      variant,
      page,
      visitedPageIds: new Set<string>(),
      temporary: true,
    };
  }

  private enterDialoguePage(pageId: string): void {
    if (!this.conversation) {
      return;
    }

    const page = this.conversation.variant.pages.find((candidate) => candidate.id === pageId);
    if (!page) {
      this.closeDialogue();
      return;
    }

    this.conversation.page = page;
    if (!this.conversation.visitedPageIds.has(page.id)) {
      this.conversation.visitedPageIds.add(page.id);
      page.actions?.forEach((action) => this.performAction(action));
    }
  }

  private selectDialogueVariant(profile: DialogueProfile): DialogueVariant | null {
    return profile.variants.find((variant) => !variant.conditions || variant.conditions.every((condition) => this.matchesCondition(condition))) ?? null;
  }

  private matchesCondition(condition: Condition): boolean {
    let result = false;
    if (condition.type === "flag") {
      result = this.save.flags[condition.key] === (condition.equals ?? true);
    }
    if (condition.type === "quest") {
      const progress = this.save.questProgress[condition.key];
      if (!progress) {
        result = false;
      } else if (condition.state === "active") {
        result = progress.accepted && !progress.completed;
      } else if (condition.state === "completed") {
        result = progress.completed;
      } else if (condition.state === "turnInReady") {
        result = progress.turnInReady;
      }
    }
    if (condition.type === "jobRank") {
      result = (this.save.jobProgress[condition.key]?.rank ?? 0) >= (condition.atLeast ?? 0);
    }
    if (condition.type === "inventory") {
      result = this.getInventoryCount(condition.key) >= (condition.atLeast ?? 1);
    }
    if (condition.type === "map") {
      result = this.save.discoveredMapIds.includes(condition.key);
    }
    return condition.not ? !result : result;
  }

  private performAction(action: DialogueAction): void {
    switch (action.type) {
      case "startQuest":
        if (action.id) this.startQuest(action.id);
        break;
      case "completeQuest":
        if (action.id) this.completeQuest(action.id);
        break;
      case "grantItem":
        if (action.id && action.amount) this.addItem(action.id, action.amount);
        break;
      case "takeItem":
        if (action.id && action.amount) this.removeItem(action.id, action.amount);
        break;
      case "addGold":
        this.save.gold += action.amount ?? 0;
        break;
      case "setFlag":
        if (action.key) this.save.flags[action.key] = action.value ?? true;
        break;
      case "openShop":
        if (action.id) {
          this.activeShopId = action.id;
          this.mode = "shop";
        }
        break;
      case "openJob":
        if (action.id) this.handleJobBoard(action.id);
        break;
      case "rest":
        this.rest();
        break;
      case "heal":
        this.save.player.stats.health = clamp(
          this.save.player.stats.health + (action.amount ?? 0),
          0,
          this.getDerivedStat("maxHealth"),
        );
        break;
      case "save":
        this.manualSave(this.save.slot);
        break;
      case "loadMap":
        if (action.mapId) this.loadMap(action.mapId, action.spawnId ?? "start");
        break;
      case "startDialogue":
        if (action.id) this.openNpcConversation(action.id);
        break;
    }
  }

  private startQuest(questId: string): void {
    const quest = contentRegistry.quests[questId];
    if (!quest) {
      return;
    }

    const progress = this.save.questProgress[questId];
    if (progress.accepted || progress.completed) {
      return;
    }

    progress.accepted = true;
    progress.completed = false;
    progress.turnInReady = false;
    if (!this.save.activeQuestIds.includes(questId)) {
      this.save.activeQuestIds.push(questId);
    }
    this.save.chapter = Math.max(this.save.chapter, quest.chapter);
    this.addToast(`Quest started: ${quest.title}`);
    this.audioManager.playSfx("quest");
  }

  private completeQuest(questId: string): void {
    const quest = contentRegistry.quests[questId];
    const progress = this.save.questProgress[questId];
    if (!quest || !progress || progress.completed) {
      return;
    }

    quest.objectives.forEach((objective) => {
      if (objective.kind === "collect") {
        this.removeItem(objective.targetId, objective.required);
      }
    });

    progress.accepted = false;
    progress.completed = true;
    progress.turnInReady = false;
    progress.rewardClaimed = true;
    this.save.activeQuestIds = this.save.activeQuestIds.filter((id) => id !== questId);
    if (!this.save.completedQuestIds.includes(questId)) {
      this.save.completedQuestIds.push(questId);
    }

    if (quest.rewards.gold) {
      this.save.gold += quest.rewards.gold;
    }
    quest.rewards.items?.forEach((item) => this.addItem(item.itemId, item.quantity));
    quest.rewards.unlockFlags?.forEach((flag) => {
      this.save.flags[flag.key] = flag.value;
    });

    this.save.chapter = Math.max(this.save.chapter, Math.min(4, quest.chapter + 1));
    this.addToast(`Quest complete: ${quest.title}`);
    this.audioManager.playSfx("quest");

    if (questId === "main_last_hearth") {
      this.save.flags["story.ending_seen"] = false;
      this.mode = "ending";
      this.manualSave(this.save.slot, true, true);
      this.updateMusic();
    }
  }

  private handleJobBoard(jobId: string): void {
    const job = contentRegistry.jobs[jobId];
    const progress = this.save.jobProgress[jobId];
    if (!job || !progress) {
      return;
    }

    if (progress.readyToTurnIn) {
      this.turnInJob(job, progress);
      return;
    }

    if (!progress.active) {
      progress.active = true;
      progress.currentCount = 0;
      progress.readyToTurnIn = false;
      if (job.objective.requiredItemId && this.getInventoryCount(job.objective.requiredItemId) <= 0) {
        this.addItem(job.objective.requiredItemId, 1);
      }
      this.addToast(`Shift taken: ${job.name}`);
      return;
    }

    this.addToast(`${job.name}: ${progress.currentCount}/${job.objective.required}`);
  }

  private turnInJob(job: JobDefinition, progress: JobProgress): void {
    if (job.objective.kind === "collect") {
      this.removeItem(job.objective.targetId, job.objective.required);
    }

    progress.active = false;
    progress.readyToTurnIn = false;
    progress.currentCount = 0;
    progress.loopsCompleted += 1;
    progress.xp += job.xpPerLoop;
    progress.rank = Math.min(job.rankTitles.length - 1, Math.floor(progress.xp / 30));
    this.save.gold += job.baseRewardGold + progress.rank * 4;
    this.addToast(`${job.name} complete. Pay received.`);
    this.audioManager.playSfx("coin");
  }

  private addItem(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      return;
    }

    const item = contentRegistry.items[itemId];
    const existing = this.save.inventory.find((entry) => entry.itemId === itemId);
    if (existing && item?.stackable !== false) {
      existing.quantity += quantity;
    } else if (existing && item?.stackable === false) {
      existing.quantity += quantity;
    } else {
      this.save.inventory.push({ itemId, quantity });
    }
    this.refreshCollectObjectives();
    this.addToast(`Obtained ${item?.name ?? itemId}${quantity > 1 ? ` x${quantity}` : ""}`);
  }

  private removeItem(itemId: string, quantity: number): void {
    const entry = this.save.inventory.find((candidate) => candidate.itemId === itemId);
    if (!entry) {
      return;
    }

    entry.quantity -= quantity;
    if (entry.quantity <= 0) {
      this.save.inventory = this.save.inventory.filter((candidate) => candidate.itemId !== itemId);
    }
    this.refreshCollectObjectives();
  }

  private getInventoryCount(itemId: string): number {
    return this.save.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
  }

  private refreshCollectObjectives(): void {
    this.save.activeQuestIds.forEach((questId) => {
      const quest = contentRegistry.quests[questId];
      const progress = this.save.questProgress[questId];
      quest.objectives.forEach((objective) => {
        if (objective.kind === "collect") {
          progress.objectiveCounts[objective.id] = Math.min(objective.required, this.getInventoryCount(objective.targetId));
        }
      });
      progress.turnInReady = quest.objectives.every(
        (objective) => (progress.objectiveCounts[objective.id] ?? 0) >= objective.required,
      );
    });

    Object.values(contentRegistry.jobs).forEach((job) => {
      const progress = this.save.jobProgress[job.id];
      if (!progress.active) {
        return;
      }
      if (job.objective.kind === "collect") {
        progress.currentCount = Math.min(job.objective.required, this.getInventoryCount(job.objective.targetId));
      }
      progress.readyToTurnIn = progress.currentCount >= job.objective.required;
    });
  }

  private recordEvent(kind: "talk" | "defeat" | "collect" | "deliver" | "visit", targetId: string, amount: number): void {
    this.save.activeQuestIds.forEach((questId) => {
      const quest = contentRegistry.quests[questId];
      const progress = this.save.questProgress[questId];
      quest.objectives.forEach((objective) => {
        if (objective.kind !== kind || objective.targetId !== targetId) {
          return;
        }

        progress.objectiveCounts[objective.id] = Math.min(
          objective.required,
          (progress.objectiveCounts[objective.id] ?? 0) + amount,
        );
      });
      progress.turnInReady = quest.objectives.every(
        (objective) => (progress.objectiveCounts[objective.id] ?? 0) >= objective.required,
      );
    });

    Object.values(contentRegistry.jobs).forEach((job) => {
      const progress = this.save.jobProgress[job.id];
      if (!progress.active) {
        return;
      }
      if (job.objective.kind === kind && job.objective.targetId === targetId) {
        progress.currentCount = Math.min(job.objective.required, progress.currentCount + amount);
        progress.readyToTurnIn = progress.currentCount >= job.objective.required;
      }
    });
  }

  private handleDeliveries(npcId: string): void {
    this.save.activeQuestIds.forEach((questId) => {
      const quest = contentRegistry.quests[questId];
      quest.objectives.forEach((objective) => {
        if (objective.kind !== "deliver" || objective.targetId !== npcId || (this.save.questProgress[questId].objectiveCounts[objective.id] ?? 0) >= objective.required) {
          return;
        }
        if (!objective.requiredItemId || this.getInventoryCount(objective.requiredItemId) <= 0) {
          return;
        }
        this.removeItem(objective.requiredItemId, 1);
        this.recordEvent("deliver", npcId, 1);
        this.addToast("Delivery handed over.");
      });
    });

    Object.values(contentRegistry.jobs).forEach((job) => {
      const progress = this.save.jobProgress[job.id];
      if (!progress.active) {
        return;
      }
      const objective = job.objective;
      if (objective.kind !== "deliver" || objective.targetId !== npcId || progress.currentCount >= objective.required) {
        return;
      }
      if (objective.requiredItemId && this.getInventoryCount(objective.requiredItemId) > 0) {
        this.removeItem(objective.requiredItemId, 1);
        progress.currentCount += 1;
        progress.readyToTurnIn = progress.currentCount >= objective.required;
        this.addToast(`${job.name} delivery complete.`);
      }
    });
  }

  private updateNpcs(deltaMs: number): void {
    this.npcs.forEach((npc) => {
      const toTarget = { x: npc.targetX - npc.x, y: npc.targetY - npc.y };
      const targetDistance = Math.hypot(toTarget.x, toTarget.y);

      if (targetDistance > 1.5) {
        const direction = { x: toTarget.x / targetDistance, y: toTarget.y / targetDistance };
        const travel = Math.min(targetDistance, (npc.moveSpeed * deltaMs) / 1000);
        const moveX = direction.x * npc.moveSpeed;
        const moveY = direction.y * npc.moveSpeed;

        if (Math.abs(direction.x) > Math.abs(direction.y)) {
          npc.facing = direction.x > 0 ? "right" : "left";
        } else {
          npc.facing = direction.y > 0 ? "down" : "up";
        }

        this.moveBodyWithCollisions(npc, moveX, moveY, 10, deltaMs);

        if (travel >= targetDistance - 0.05 || distance(npc, { x: npc.targetX, y: npc.targetY }) <= 1.5) {
          npc.x = npc.targetX;
          npc.y = npc.targetY;
          npc.stepTimer = 500 + Math.random() * 1200;
        }
        return;
      }

      npc.stepTimer -= deltaMs;
      if (npc.stepTimer > 0) {
        return;
      }

      this.chooseNpcTarget(npc);
    });
  }

  private chooseNpcTarget(npc: RuntimeNpcEx): void {
    if (npc.wanderRadius <= 0) {
      npc.targetX = npc.homeX;
      npc.targetY = npc.homeY;
      npc.stepTimer = 900 + Math.random() * 1100;
      return;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const travel = Math.random() * npc.wanderRadius * TILE_SIZE;
      const nextX = clamp(npc.homeX + Math.cos(angle) * travel, 8, this.currentMap.width * TILE_SIZE - 8);
      const nextY = clamp(npc.homeY + Math.sin(angle) * travel, 8, this.currentMap.height * TILE_SIZE - 8);
      if (!this.collidesWithWalls(nextX, nextY, 10)) {
        npc.targetX = nextX;
        npc.targetY = nextY;
        npc.stepTimer = 0;
        return;
      }
    }

    npc.targetX = npc.homeX;
    npc.targetY = npc.homeY;
    npc.stepTimer = 800;
  }

  private updateEnemies(deltaMs: number): void {
    const player = { x: this.save.player.x, y: this.save.player.y };

    this.enemies.forEach((enemy) => {
      const definition = contentRegistry.enemies[enemy.enemyId];
      if (enemy.state === "dead") {
        enemy.respawnTimerMs -= deltaMs;
        if (enemy.respawnTimerMs <= 0) {
          enemy.state = "idle";
          enemy.health = definition.maxHealth;
          enemy.x = enemy.homeX;
          enemy.y = enemy.homeY;
          enemy.vx = 0;
          enemy.vy = 0;
        }
        return;
      }

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaMs);
      enemy.invulnerableMs = Math.max(0, enemy.invulnerableMs - deltaMs);
      const toPlayer = { x: player.x - enemy.x, y: player.y - enemy.y };
      const dist = Math.hypot(toPlayer.x, toPlayer.y);
      const dir = dist > 0 ? { x: toPlayer.x / dist, y: toPlayer.y / dist } : { x: 0, y: 0 };

      if (dist < definition.aggroRange || enemy.state === "aggro" || enemy.state === "charging") {
        if (enemy.state !== "charging") {
          enemy.state = "aggro";
        }
      } else if (distance({ x: enemy.x, y: enemy.y }, { x: enemy.homeX, y: enemy.homeY }) > 8) {
        const homeVector = { x: enemy.homeX - enemy.x, y: enemy.homeY - enemy.y };
        const homeDist = Math.hypot(homeVector.x, homeVector.y);
        const returnDir = { x: homeVector.x / Math.max(homeDist, 1), y: homeVector.y / Math.max(homeDist, 1) };
        const smoothing = Math.min(1, deltaMs / 120);
        enemy.vx += (returnDir.x * definition.moveSpeed - enemy.vx) * smoothing;
        enemy.vy += (returnDir.y * definition.moveSpeed - enemy.vy) * smoothing;
        this.moveBodyWithCollisions(enemy, enemy.vx, enemy.vy, definition.elite ? 16 : 12, deltaMs);
        enemy.state = "idle";
        return;
      }

      if (enemy.state === "charging") {
        enemy.chargeTimerMs -= deltaMs;
        const nextX = enemy.x + (enemy.vx * deltaMs) / 1000;
        const nextY = enemy.y + (enemy.vy * deltaMs) / 1000;
        if (!this.collidesWithWalls(nextX, nextY, definition.elite ? 16 : 12)) {
          enemy.x = nextX;
          enemy.y = nextY;
        }
        if (distance(enemy, player) < 14) {
          this.damagePlayer(definition.damage + 2, enemy.vx * 0.08, enemy.vy * 0.08);
        }
        if (enemy.chargeTimerMs <= 0) {
          enemy.state = "aggro";
          enemy.vx = 0;
          enemy.vy = 0;
        }
        return;
      }

      if (dist > 0) {
        enemy.facing = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x > 0 ? "right" : "left") : dir.y > 0 ? "down" : "up";
      }

      let moveX = 0;
      let moveY = 0;

      switch (definition.behavior) {
        case "melee":
          if (dist > definition.attackRange + 6) {
            moveX = dir.x;
            moveY = dir.y;
          } else if (enemy.attackCooldown <= 0) {
            this.spawnEnemyHitbox(enemy, definition);
            enemy.attackCooldown = definition.attackCooldownMs;
          }
          break;
        case "skirmisher":
          if (dist > 50) {
            moveX = dir.x;
            moveY = dir.y;
          } else if (dist < 24) {
            moveX = -dir.x;
            moveY = -dir.y;
          } else {
            moveX = -dir.y * enemy.strafeDirection;
            moveY = dir.x * enemy.strafeDirection;
          }
          if (dist < definition.attackRange + 10 && enemy.attackCooldown <= 0) {
            this.spawnEnemyHitbox(enemy, definition);
            enemy.attackCooldown = definition.attackCooldownMs;
          }
          break;
        case "ranged":
          if (dist > 90) {
            moveX = dir.x;
            moveY = dir.y;
          } else if (dist < 58) {
            moveX = -dir.x;
            moveY = -dir.y;
          }
          if (enemy.attackCooldown <= 0) {
            this.spawnEnemyProjectile(enemy, definition, dir);
            enemy.attackCooldown = definition.attackCooldownMs;
          }
          break;
        case "charger":
          if (dist > 52) {
            moveX = dir.x;
            moveY = dir.y;
          } else if (enemy.attackCooldown <= 0) {
            enemy.state = "charging";
            enemy.vx = dir.x * (definition.chargeSpeed ?? 120);
            enemy.vy = dir.y * (definition.chargeSpeed ?? 120);
            enemy.chargeTimerMs = 420;
            enemy.attackCooldown = definition.attackCooldownMs;
          }
          break;
        case "boss":
          if (enemy.attackCooldown <= 0) {
            const pattern = enemy.patternIndex % 3;
            if (pattern === 0) {
              this.spawnEnemySpread(enemy, definition);
              enemy.attackCooldown = 1500;
            } else if (pattern === 1) {
              enemy.state = "charging";
              enemy.vx = dir.x * (definition.chargeSpeed ?? 140);
              enemy.vy = dir.y * (definition.chargeSpeed ?? 140);
              enemy.chargeTimerMs = 500;
              enemy.attackCooldown = 1600;
            } else {
              this.spawnEnemyNova(enemy, definition);
              enemy.attackCooldown = 1700;
            }
            enemy.patternIndex += 1;
          } else if (dist > 72) {
            moveX = dir.x;
            moveY = dir.y;
          }
          break;
      }

      const smoothing = Math.min(1, deltaMs / 110);
      const desiredVx = moveX * definition.moveSpeed;
      const desiredVy = moveY * definition.moveSpeed;
      enemy.vx += (desiredVx - enemy.vx) * smoothing;
      enemy.vy += (desiredVy - enemy.vy) * smoothing;

      if (Math.abs(moveX) < 0.05) {
        enemy.vx *= 0.86;
      }
      if (Math.abs(moveY) < 0.05) {
        enemy.vy *= 0.86;
      }

      this.moveBodyWithCollisions(enemy, enemy.vx, enemy.vy, definition.elite ? 16 : 12, deltaMs);
    });
  }

  private spawnEnemyHitbox(enemy: RuntimeEnemyEx, definition: EnemyDefinition): void {
    const direction = this.directionVector(enemy.facing);
    this.hitboxes.push({
      id: nowId("enemy-hitbox"),
      owner: "enemy",
      x: enemy.x + direction.x * 14 - 9,
      y: enemy.y + direction.y * 14 - 9,
      w: 18,
      h: 18,
      damage: definition.damage,
      ttlMs: 140,
      knockback: 16,
    });
  }

  private spawnEnemyProjectile(enemy: RuntimeEnemyEx, definition: EnemyDefinition, direction: { x: number; y: number }): void {
    this.spawnProjectile({
      id: nowId("enemy-shot"),
      owner: "enemy",
      x: enemy.x + direction.x * 10,
      y: enemy.y + direction.y * 10,
      vx: direction.x * 120,
      vy: direction.y * 120,
      radius: 4,
      damage: definition.damage,
      ttlMs: 1200,
      spriteId: definition.projectileId ?? "moth_dust",
    });
    this.audioManager.playSfx("projectile");
  }

  private spawnEnemySpread(enemy: RuntimeEnemyEx, definition: EnemyDefinition): void {
    const baseAngle = Math.atan2(this.save.player.y - enemy.y, this.save.player.x - enemy.x);
    [-0.35, -0.18, 0, 0.18, 0.35].forEach((offset) => {
      const angle = baseAngle + offset;
      this.spawnProjectile({
        owner: "enemy",
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 130,
        vy: Math.sin(angle) * 130,
        radius: 4,
        damage: definition.damage,
        ttlMs: 1400,
        spriteId: definition.projectileId ?? "stag_flare",
      });
    });
    this.audioManager.playSfx("projectile");
  }

  private spawnEnemyNova(enemy: RuntimeEnemyEx, definition: EnemyDefinition): void {
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      this.spawnProjectile({
        owner: "enemy",
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 100,
        vy: Math.sin(angle) * 100,
        radius: 4,
        damage: definition.damage - 2,
        ttlMs: 1400,
        spriteId: definition.projectileId ?? "stag_flare",
      });
    }
    this.audioManager.playSfx("projectile");
  }

  private updateProjectiles(deltaMs: number): void {
    this.projectiles = this.projectiles.filter((projectile) => {
      projectile.ttlMs -= deltaMs;
      if (projectile.ttlMs <= 0) {
        return false;
      }

      projectile.x += (projectile.vx * deltaMs) / 1000;
      projectile.y += (projectile.vy * deltaMs) / 1000;

      if (this.collidesWithWalls(projectile.x, projectile.y, projectile.radius * 2)) {
        return false;
      }

      const projectileRect = {
        x: projectile.x - projectile.radius,
        y: projectile.y - projectile.radius,
        w: projectile.radius * 2,
        h: projectile.radius * 2,
      };

      if (projectile.owner === "player") {
        const hitEnemy = this.enemies.find(
          (enemy) =>
            enemy.state !== "dead" &&
            rectsIntersect(projectileRect, makeRectFromCenter(enemy.x, enemy.y, contentRegistry.enemies[enemy.enemyId].elite ? 18 : 12)),
        );
        if (hitEnemy) {
          this.damageEnemy(hitEnemy, projectile.damage, projectile.vx * 0.05, projectile.vy * 0.05);
          return false;
        }
      } else if (
        rectsIntersect(projectileRect, makeRectFromCenter(this.save.player.x, this.save.player.y, 10)) &&
        this.invulnerabilityMs <= 0
      ) {
        this.damagePlayer(projectile.damage, projectile.vx * 0.04, projectile.vy * 0.04);
        return false;
      }

      return true;
    });
  }

  private updateHitboxes(deltaMs: number): void {
    this.hitboxes = this.hitboxes.filter((hitbox) => {
      hitbox.ttlMs -= deltaMs;
      if (hitbox.ttlMs <= 0) {
        return false;
      }

      if (hitbox.owner === "player") {
        const hitEnemy = this.enemies.find(
          (enemy) =>
            enemy.state !== "dead" &&
            rectsIntersect(hitbox, makeRectFromCenter(enemy.x, enemy.y, contentRegistry.enemies[enemy.enemyId].elite ? 18 : 12)),
        );
        if (hitEnemy) {
          this.damageEnemy(hitEnemy, hitbox.damage, hitbox.knockback * this.directionVector(this.save.player.direction).x, hitbox.knockback * this.directionVector(this.save.player.direction).y);
          return false;
        }
      } else if (this.invulnerabilityMs <= 0 && rectsIntersect(hitbox, makeRectFromCenter(this.save.player.x, this.save.player.y, 10))) {
        this.damagePlayer(hitbox.damage, hitbox.knockback * 0.4, hitbox.knockback * 0.4);
        return false;
      }

      return true;
    });
  }

  private damageEnemy(enemy: RuntimeEnemyEx, damage: number, knockbackX: number, knockbackY: number): void {
    if (enemy.invulnerableMs > 0 || enemy.state === "dead") {
      return;
    }

    enemy.health -= damage;
    enemy.invulnerableMs = 180;
    enemy.x += knockbackX;
    enemy.y += knockbackY;
    this.addFloatingText(enemy.x, enemy.y - 12, `${damage}`, "#ffd9a1");
    this.audioManager.playSfx("hit");

    if (enemy.health <= 0) {
      enemy.state = "dead";
      enemy.respawnTimerMs = enemy.respawnMs;
      const definition = contentRegistry.enemies[enemy.enemyId];
      this.recordEvent("defeat", enemy.enemyId, 1);
      this.spawnDrops(enemy.x, enemy.y, definition);
      this.audioManager.playSfx("enemy_down");
      if (enemy.enemyId === "the_hollow_stag") {
        this.addToast("The Hollow Stag collapses.");
      }
    }
  }

  private damagePlayer(damage: number, knockbackX: number, knockbackY: number): void {
    if (this.invulnerabilityMs > 0) {
      return;
    }

    const reduced = Math.max(1, damage - Math.floor(this.getDerivedStat("defense") / 2));
    this.save.player.stats.health -= reduced;
    this.invulnerabilityMs = 650;
    this.playerKnockback = { x: knockbackX, y: knockbackY, timerMs: 150 };
    this.addFloatingText(this.save.player.x, this.save.player.y - 14, `${reduced}`, "#ff8f8f");
    this.audioManager.playSfx("hit");

    if (this.save.player.stats.health <= 0) {
      this.save.player.stats.health = 0;
      this.mode = "gameover";
      this.addToast("You fall and the lantern goes cold.");
    }
  }

  private spawnDrops(x: number, y: number, definition: EnemyDefinition): void {
    const goldAmount =
      definition.goldDrop[0] + Math.floor(Math.random() * Math.max(1, definition.goldDrop[1] - definition.goldDrop[0] + 1));
    this.pickups.push({ id: nowId("gold"), x, y, gold: goldAmount, quantity: goldAmount });

    definition.lootTable.forEach((drop) => {
      if (Math.random() <= drop.chance) {
        const quantity = drop.min + Math.floor(Math.random() * Math.max(1, drop.max - drop.min + 1));
        this.pickups.push({
          id: nowId("loot"),
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          itemId: drop.itemId,
          quantity,
        });
      }
    });
  }

  private updatePickups(): void {
    this.pickups = this.pickups.filter((pickup) => {
      if (distance(pickup, { x: this.save.player.x, y: this.save.player.y }) > 12) {
        return true;
      }

      if (pickup.gold) {
        this.save.gold += pickup.gold;
        this.addToast(`+${pickup.gold} gold`);
        this.audioManager.playSfx("coin");
      }
      if (pickup.itemId) {
        this.addItem(pickup.itemId, pickup.quantity);
        this.audioManager.playSfx("pickup");
      }
      return false;
    });
  }

  private updateFloatingTexts(deltaMs: number): void {
    this.floatingTexts = this.floatingTexts
      .map((text) => ({ ...text, ttlMs: text.ttlMs - deltaMs, y: text.y - deltaMs * 0.02 }))
      .filter((text) => text.ttlMs > 0);
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({ id: nowId("float"), x, y, text, color, ttlMs: 600 });
  }

  private spawnProjectile(projectile: Omit<ProjectileState, "id"> & { id?: string }): void {
    this.projectiles.push({
      id: projectile.id ?? nowId("proj"),
      ...projectile,
    });
  }

  private directionVector(direction: "up" | "down" | "left" | "right") {
    if (direction === "up") return { x: 0, y: -1 };
    if (direction === "down") return { x: 0, y: 1 };
    if (direction === "left") return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  }

  private updateInteractionState(): void {
    const target = this.getInteractionTarget();
    this.interactionHint = target;
    this.prompt = target?.prompt;
  }

  private getInteractionTarget(): InteractionTarget | null {
    const player = { x: this.save.player.x, y: this.save.player.y };
    const candidates = [
      this.getNearbyPortalTarget(player),
      this.getNearbyNpcTarget(player),
      this.getNearbyNodeTarget(player),
    ].filter((target): target is InteractionTarget => Boolean(target));

    if (!candidates.length) {
      return null;
    }

    return candidates.reduce((best, candidate) => {
      if (candidate.score !== best.score) {
        return candidate.score < best.score ? candidate : best;
      }
      return candidate.priority < best.priority ? candidate : best;
    });
  }

  private getNearbyNpcTarget(player: { x: number; y: number }): InteractionTarget | null {
    const nearbyNpc = this.npcs.find((npc) => distance(player, npc) < 18);
    if (!nearbyNpc) {
      return null;
    }

    const character = contentRegistry.characters[nearbyNpc.npcId];
    return {
      kind: "npc",
      id: nearbyNpc.id,
      npcId: nearbyNpc.npcId,
      x: nearbyNpc.x,
      y: nearbyNpc.y - 18,
      label: "Talk",
      prompt: `E Talk: ${character?.name ?? "Traveler"}`,
      score: distance(player, nearbyNpc),
      priority: 1,
    };
  }

  private getNearbyNodeTarget(player: { x: number; y: number }): InteractionTarget | null {
    const nearbyNode = this.currentMap.resourceNodes.find(
      (node) => distance({ x: node.x * TILE_SIZE, y: node.y * TILE_SIZE }, player) < 18,
    );
    if (!nearbyNode) {
      return null;
    }

    return {
      kind: "node",
      id: nearbyNode.id,
      nodeId: nearbyNode.id,
      x: nearbyNode.x * TILE_SIZE,
      y: nearbyNode.y * TILE_SIZE - 14,
      label: this.getNodeInteractionLabel(nearbyNode.type),
      prompt: `E ${nearbyNode.prompt ?? nearbyNode.label}`,
      score: distance({ x: nearbyNode.x * TILE_SIZE, y: nearbyNode.y * TILE_SIZE }, player),
      priority: 2,
    };
  }

  private getNearbyPortalTarget(player: { x: number; y: number }): InteractionTarget | null {
    const playerRect = makeRectFromCenter(this.save.player.x, this.save.player.y, 10);
    const portal = this.currentMap.portals.find((entry) => rectsIntersect(playerRect, this.getPortalTriggerRect(entry)));
    if (!portal) {
      return null;
    }

    const targetMap = contentRegistry.maps[portal.targetMapId];
    const label = this.getPortalInteractionLabel(portal);
    const prompt = this.getPortalPrompt(portal, targetMap?.name ?? "the next area");
    const hintPosition = this.getPortalHintPosition(portal);
    return {
      kind: "portal",
      id: portal.id,
      portalId: portal.id,
      x: hintPosition.x,
      y: hintPosition.y,
      label,
      prompt,
      score: Math.max(0, distance(player, hintPosition) - 6),
      priority: 0,
    };
  }

  private getNodeInteractionLabel(nodeType: "herb" | "ore" | "fish" | "crate" | "sign" | "chest" | "bed" | "lore"): string {
    if (nodeType === "sign" || nodeType === "lore") {
      return "Read";
    }
    if (nodeType === "bed") {
      return "Rest";
    }
    if (nodeType === "crate" || nodeType === "chest") {
      return "Open";
    }
    return "Gather";
  }

  private getPortalInteractionLabel(portal: PortalDefinition): string {
    const targetMap = contentRegistry.maps[portal.targetMapId];
    if (!targetMap) {
      return "Enter";
    }

    if (this.currentMap.theme !== "interior" && targetMap.theme === "interior") {
      return "Enter";
    }
    if (this.currentMap.theme === "interior" && targetMap.theme !== "interior") {
      return "Exit";
    }
    return "Travel";
  }

  private getPortalPrompt(portal: PortalDefinition, targetName: string): string {
    const action = this.getPortalInteractionLabel(portal);
    if (action === "Exit") {
      return `E Exit: ${targetName}`;
    }
    if (action === "Travel") {
      return `E Travel: ${targetName}`;
    }
    return `E Enter: ${targetName}`;
  }

  private getPortalHintPosition(portal: PortalDefinition): { x: number; y: number } {
    const requiredDirection = this.getPortalRequiredDirection(portal);
    const centerX = portal.x * TILE_SIZE + (portal.width * TILE_SIZE) / 2;
    const centerY = portal.y * TILE_SIZE + (portal.height * TILE_SIZE) / 2;

    if (requiredDirection === "up") {
      return { x: centerX, y: (portal.y + portal.height) * TILE_SIZE + 8 };
    }
    if (requiredDirection === "down") {
      return { x: centerX, y: portal.y * TILE_SIZE - 8 };
    }
    if (requiredDirection === "left") {
      return { x: (portal.x + portal.width) * TILE_SIZE + 8, y: centerY - 2 };
    }
    if (requiredDirection === "right") {
      return { x: portal.x * TILE_SIZE - 8, y: centerY - 2 };
    }
    return { x: centerX, y: centerY - 12 };
  }

  private updateMusic(): void {
    const track =
      this.mode === "paused" || this.mode === "shop" || this.mode === "ending"
        ? "menu_theme"
        : this.enemies.some((enemy) => enemy.enemyId === "the_hollow_stag" && enemy.state !== "dead")
          ? "boss_theme"
          : this.enemies.some((enemy) => enemy.state === "aggro")
            ? "battle_theme"
            : this.currentMap.musicTrack;

    if (this.lastMusicTrack !== track) {
      this.audioManager.playMusic(track);
      this.lastMusicTrack = track;
    }
  }

  private isNodeAvailable(nodeId: string): boolean {
    const node = this.currentMap.resourceNodes.find((entry) => entry.id === nodeId);
    if (!node) {
      return false;
    }
    if (node.lootFlag && this.save.flags[node.lootFlag]) {
      return false;
    }
    const key = `${this.currentMap.id}:${nodeId}`;
    return !this.nodeTimers.has(key);
  }

  private setNodeCooldown(nodeId: string, respawnMs: number, lootFlag?: string): void {
    if (lootFlag) {
      this.save.flags[lootFlag] = true;
    }
    this.nodeTimers.set(`${this.currentMap.id}:${nodeId}`, {
      key: `${this.currentMap.id}:${nodeId}`,
      availableAt: this.elapsedMs + respawnMs,
    });
  }

  private addToast(text: string): void {
    this.toasts = [...this.toasts.slice(-2), { id: nowId("toast"), text, ttlMs: 2800 }];
  }

  private hasClearedMainStory(): boolean {
    return Boolean(this.save.flags["story.ending_complete"]);
  }

  private isEndingPending(): boolean {
    return this.hasClearedMainStory() && !Boolean(this.save.flags["story.ending_seen"]);
  }

  private getEndingState(): UiState["ending"] {
    const completedSideStories = this.save.completedQuestIds.filter((questId) => contentRegistry.quests[questId]?.category === "side").length;
    const totalJobLoops = Object.values(this.save.jobProgress).reduce((sum, progress) => sum + progress.loopsCompleted, 0);
    return {
      title: "The Last Hearth Burns Again",
      summary: [
        "The Sun Shard is home, the brazier in Emberwharf burns clean, and the roads of the Cinder Reach have one more night of light ahead of them.",
        "This cleared save stays playable, so you can keep working jobs, finish side stories, and keep exploring the Reach.",
      ],
      stats: [
        { label: "Playtime", value: formatDuration(this.save.playtimeMs) },
        { label: "Completed Quests", value: `${this.save.completedQuestIds.length}` },
        { label: "Side Stories", value: `${completedSideStories}` },
        { label: "Job Loops", value: `${totalJobLoops}` },
        { label: "Regions Seen", value: `${this.save.discoveredRegionIds.length}` },
        { label: "Save Slot", value: `Slot ${this.save.slot}` },
      ],
    };
  }

  private getNpcMarker(character?: CharacterDefinition): "quest" | "turnin" | "job" | "shop" | undefined {
    if (!character) {
      return undefined;
    }

    const questTurnIn = character.questIds?.some((questId) => this.save.questProgress[questId]?.turnInReady);
    if (questTurnIn) {
      return "turnin";
    }

    const questAvailable = character.questIds?.some((questId) => {
      const progress = this.save.questProgress[questId];
      return progress && !progress.accepted && !progress.completed;
    });
    if (questAvailable) {
      return "quest";
    }

    if (character.jobId) {
      return "job";
    }
    if (character.shopId) {
      return "shop";
    }
    return undefined;
  }
}
