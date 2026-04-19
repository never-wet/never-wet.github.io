export type Direction = "up" | "down" | "left" | "right";
export type SceneMode = "title" | "playing" | "paused" | "dialogue" | "shop" | "save" | "gameover";
export type MapTheme =
  | "town"
  | "city"
  | "village"
  | "forest"
  | "coast"
  | "mine"
  | "ruin"
  | "dungeon"
  | "interior";
export type TileKind =
  | "grass"
  | "flowers"
  | "road"
  | "dirt"
  | "wood"
  | "stone"
  | "wall"
  | "water"
  | "sand"
  | "crop"
  | "forestFloor"
  | "marsh"
  | "bridge"
  | "ore"
  | "ruin"
  | "cave"
  | "roof"
  | "glow";
export type ItemCategory = "weapon" | "armor" | "consumable" | "material" | "quest" | "trinket";
export type EquipmentSlot = "weapon" | "armor" | "trinket";
export type ObjectiveKind = "talk" | "defeat" | "collect" | "deliver" | "visit" | "job" | "flag";
export type JobActivityType =
  | "courier"
  | "farmer"
  | "fisher"
  | "hunter"
  | "miner"
  | "smith"
  | "apothecary"
  | "guard"
  | "scribe"
  | "innhand";
export type TrackId =
  | "title_theme"
  | "emberwharf_theme"
  | "sunglade_theme"
  | "wilds_theme"
  | "coast_theme"
  | "ruin_theme"
  | "battle_theme"
  | "boss_theme"
  | "menu_theme";
export type SfxId =
  | "menu_move"
  | "menu_accept"
  | "dialogue"
  | "swing"
  | "hit"
  | "dodge"
  | "projectile"
  | "pickup"
  | "coin"
  | "quest"
  | "heal"
  | "enemy_down"
  | "save";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Condition {
  type: "flag" | "quest" | "jobRank" | "inventory" | "map";
  key: string;
  equals?: string | number | boolean;
  state?: "active" | "completed" | "turnInReady";
  atLeast?: number;
  not?: boolean;
}

export interface DialogueAction {
  type:
    | "startQuest"
    | "completeQuest"
    | "grantItem"
    | "takeItem"
    | "addGold"
    | "setFlag"
    | "openShop"
    | "openJob"
    | "rest"
    | "heal"
    | "save"
    | "loadMap"
    | "startDialogue";
  id?: string;
  amount?: number;
  key?: string;
  value?: string | number | boolean;
  mapId?: string;
  spawnId?: string;
}

export interface DialogueChoice {
  id: string;
  label: string;
  nextPageId?: string;
  close?: boolean;
  actions?: DialogueAction[];
}

export interface DialoguePage {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string[];
  nextPageId?: string;
  choices?: DialogueChoice[];
  actions?: DialogueAction[];
}

export interface DialogueVariant {
  id: string;
  conditions?: Condition[];
  entryPageId: string;
  pages: DialoguePage[];
}

export interface DialogueProfile {
  npcId: string;
  variants: DialogueVariant[];
}

export interface QuestObjectiveDefinition {
  id: string;
  kind: ObjectiveKind;
  targetId: string;
  required: number;
  label: string;
  requiredItemId?: string;
}

export interface RewardDefinition {
  gold?: number;
  items?: Array<{ itemId: string; quantity: number }>;
  unlockFlags?: Array<{ key: string; value: string | number | boolean }>;
  jobXp?: Array<{ jobId: string; amount: number }>;
}

export interface QuestDefinition {
  id: string;
  title: string;
  category: "main" | "side";
  chapter: number;
  giverId: string;
  summary: string;
  unlockConditions?: Condition[];
  objectives: QuestObjectiveDefinition[];
  rewards: RewardDefinition;
  journalSummary: string;
  followupQuestId?: string;
  repeatable?: boolean;
}

export interface JobDefinition {
  id: string;
  name: string;
  mentorId: string;
  activityType: JobActivityType;
  description: string;
  locationId: string;
  unlockConditions?: Condition[];
  objective: QuestObjectiveDefinition;
  baseRewardGold: number;
  xpPerLoop: number;
  rankTitles: string[];
  perkText: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  value: number;
  stackable: boolean;
  equipmentSlot?: EquipmentSlot;
  iconId: string;
  statBonuses?: Partial<CombatStats>;
  healAmount?: number;
}

export interface ShopDefinition {
  id: string;
  name: string;
  inventory: Array<{ itemId: string; price: number }>;
}

export interface WeaponDefinition {
  id: string;
  itemId: string;
  label: string;
  style: "slash" | "thrust" | "bow" | "arcane";
  damage: number;
  range: number;
  cooldownMs: number;
  staminaCost: number;
  projectileId?: string;
  arc?: number;
  knockback: number;
}

export interface SkillDefinition {
  id: string;
  label: string;
  description: string;
  aetherCost: number;
  cooldownMs: number;
  projectileId?: string;
  damage: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  spriteId: string;
  maxHealth: number;
  moveSpeed: number;
  damage: number;
  aggroRange: number;
  leashRange: number;
  attackRange: number;
  attackCooldownMs: number;
  behavior: "melee" | "ranged" | "charger" | "skirmisher" | "boss";
  projectileId?: string;
  chargeSpeed?: number;
  lootTable: Array<{ itemId: string; chance: number; min: number; max: number }>;
  goldDrop: [number, number];
  elite?: boolean;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  role: string;
  spriteId: string;
  regionId: string;
  bio: string;
  portraitId?: string;
  shopId?: string;
  jobId?: string;
  questIds?: string[];
}

export interface PortalDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMapId: string;
  targetSpawnId: string;
  lockedFlag?: string;
}

export interface MapSpawnPoint {
  id: string;
  x: number;
  y: number;
}

export interface NpcPlacement {
  id: string;
  npcId: string;
  x: number;
  y: number;
  facing: Direction;
  wanderRadius: number;
}

export interface EnemyPlacement {
  id: string;
  enemyId: string;
  x: number;
  y: number;
  respawnMs: number;
}

export interface ResourceNodeDefinition {
  id: string;
  type: "herb" | "ore" | "fish" | "crate" | "sign" | "chest" | "bed" | "lore";
  x: number;
  y: number;
  label: string;
  spriteId?: string;
  prompt?: string;
  itemDrops?: Array<{ itemId: string; quantity: number }>;
  signText?: string[];
  lootFlag?: string;
  respawnMs?: number;
}

export interface TileLegendEntry {
  kind: TileKind;
  solid?: boolean;
}

export interface MapDefinition {
  id: string;
  name: string;
  regionId: string;
  theme: MapTheme;
  width: number;
  height: number;
  layout: string[];
  legend: Record<string, TileLegendEntry>;
  portals: PortalDefinition[];
  spawnPoints: MapSpawnPoint[];
  npcPlacements: NpcPlacement[];
  enemyPlacements: EnemyPlacement[];
  resourceNodes: ResourceNodeDefinition[];
  musicTrack: TrackId;
  safeZone?: boolean;
  revealRegionId?: string;
}

export interface RegionDefinition {
  id: string;
  name: string;
  biome: string;
  summary: string;
  unlockFlag?: string;
  mapIds: string[];
  connections: string[];
}

export interface AudioTrackDefinition {
  id: TrackId;
  label: string;
  tempo: number;
  steps: number;
  voices: Array<{
    wave: OscillatorType;
    octaveShift?: number;
    gain: number;
    notes: string[];
  }>;
}

export interface GeneratedAssetDefinition {
  id: string;
  type: "sprite" | "icon" | "emblem" | "ui";
  frameCount: number;
  notes: string;
}

export interface CombatStats {
  maxHealth: number;
  health: number;
  maxStamina: number;
  stamina: number;
  maxAether: number;
  aether: number;
  attack: number;
  defense: number;
  moveSpeed: number;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface EquipmentState {
  weapon: string;
  armor?: string;
  trinket?: string;
}

export interface QuestProgress {
  accepted: boolean;
  completed: boolean;
  turnInReady: boolean;
  objectiveCounts: Record<string, number>;
  rewardClaimed: boolean;
}

export interface JobProgress {
  rank: number;
  xp: number;
  loopsCompleted: number;
  active: boolean;
  currentCount: number;
  readyToTurnIn: boolean;
}

export interface SettingsState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

export interface PlayerState {
  name: string;
  x: number;
  y: number;
  direction: Direction;
  stats: CombatStats;
}

export interface SaveState {
  version: number;
  slot: number;
  label: string;
  timestamp: number;
  playtimeMs: number;
  chapter: number;
  currentMapId: string;
  respawnMapId: string;
  respawnSpawnId: string;
  player: PlayerState;
  gold: number;
  inventory: InventoryEntry[];
  equipment: EquipmentState;
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, QuestProgress>;
  jobProgress: Record<string, JobProgress>;
  discoveredMapIds: string[];
  discoveredRegionIds: string[];
  flags: Record<string, string | number | boolean>;
  settings: SettingsState;
  knownDialogueIds: string[];
}

export interface SaveSlotSummary {
  slot: number;
  exists: boolean;
  label: string;
  timestamp?: number;
  chapter?: number;
  locationName?: string;
  playtimeMs?: number;
}

export interface ContentRegistry {
  regions: Record<string, RegionDefinition>;
  maps: Record<string, MapDefinition>;
  characters: Record<string, CharacterDefinition>;
  dialogue: Record<string, DialogueProfile>;
  quests: Record<string, QuestDefinition>;
  jobs: Record<string, JobDefinition>;
  items: Record<string, ItemDefinition>;
  shops: Record<string, ShopDefinition>;
  weapons: Record<string, WeaponDefinition>;
  skills: Record<string, SkillDefinition>;
  enemies: Record<string, EnemyDefinition>;
  audioTracks: Record<TrackId, AudioTrackDefinition>;
}

export interface RuntimeNpc extends NpcPlacement {
  dialogueProfileId: string;
  stepTimer: number;
  homeX: number;
  homeY: number;
}

export interface RuntimeEnemy extends EnemyPlacement {
  health: number;
  vx: number;
  vy: number;
  facing: Direction;
  attackCooldown: number;
  state: "idle" | "aggro" | "charging" | "dead";
  invulnerableMs: number;
  respawnTimerMs: number;
}

export interface ProjectileState {
  id: string;
  owner: "player" | "enemy";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ttlMs: number;
  spriteId: string;
}

export interface HitboxState {
  id: string;
  owner: "player" | "enemy";
  x: number;
  y: number;
  w: number;
  h: number;
  damage: number;
  ttlMs: number;
  knockback: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  ttlMs: number;
}

export interface ConversationState {
  npcId: string;
  variantId: string;
  pageId: string;
}
