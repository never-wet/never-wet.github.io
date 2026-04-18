export type ChapterId = "prologue" | "chapter1" | "chapter2" | "chapter3" | "epilogue";
export type RegionId = "lantern-coast" | "gloamwood-reach" | "saintfall-basin" | "skyglass-rise";
export type QuestKind = "main" | "side";
export type QuestStatus = "locked" | "active" | "completed" | "failed";
export type ItemType = "consumable" | "weapon" | "armor" | "accessory" | "quest" | "material";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CharacterRole = "player" | "companion" | "npc" | "enemy" | "boss";
export type RouteId =
  | "home"
  | "new-game"
  | "load"
  | "game"
  | "character"
  | "inventory"
  | "quests"
  | "map"
  | "journal"
  | "settings"
  | "credits";
export type AssetKind = "portrait" | "background" | "icon" | "logo" | "panel";
export type CombatActionType = "attack" | "skill" | "defend" | "item";
export type NotificationTone = "info" | "quest" | "reward" | "danger";
export type AudioCategory = "music" | "ambience" | "sfx" | "ui";
export type Direction = "up" | "down" | "left" | "right";
export type OverworldTileType = "floor" | "wall" | "wild" | "water" | "road" | "bridge" | "ruin";
export type OverworldInteractionKind = "npc" | "action" | "travel" | "shop" | "message";

export interface ChapterSummary {
  id: ChapterId;
  label: string;
  title: string;
  description: string;
}

export interface RegionSummary {
  id: RegionId;
  name: string;
  mood: string;
  description: string;
}

export interface FeatureFlags {
  companions: boolean;
  shops: boolean;
  achievements: boolean;
  keyboardShortcuts: boolean;
  proceduralAudio: boolean;
  generatedArt: boolean;
}

export interface GameManifest {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  tagline: string;
  pitch: string;
  chapters: ChapterSummary[];
  regions: RegionSummary[];
  featureFlags: FeatureFlags;
}

export interface BaseStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
}

export interface EquipmentBonuses {
  maxHp?: number;
  maxMp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  spirit?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown?: number;
  target: "enemy" | "self";
  effect: "damage" | "heal" | "guardBreak" | "shield";
  power: number;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  role: CharacterRole;
  portraitAssetId: string;
  faction: string;
  description: string;
  shortBio: string;
  homeLocationId?: string;
  baseStats?: BaseStats;
  skillIds?: string[];
  journalEntryId?: string;
}

export interface EnemyBehavior {
  id: string;
  label: string;
  action: "attack" | "skill" | "defend";
  skillId?: string;
  weight: number;
  whenBelowHpPct?: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  title: string;
  role: CharacterRole;
  portraitAssetId: string;
  description: string;
  baseStats: BaseStats;
  rewardXp: number;
  rewardSilver: number;
  lootTable: Array<{ itemId: string; chance: number; quantity: number }>;
  behavior: EnemyBehavior[];
  weakness?: string;
  boss?: boolean;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  iconAssetId: string;
  value: number;
  stackable: boolean;
  bonuses?: EquipmentBonuses;
  consumeEffect?:
    | { type: "heal"; amount: number }
    | { type: "restoreMp"; amount: number }
    | { type: "revive"; amount: number }
    | { type: "buff"; stat: keyof EquipmentBonuses; amount: number; turns: number };
}

export interface ObjectiveDefinition {
  id: string;
  text: string;
  progressType: "scene" | "location" | "encounter" | "item" | "dialogue" | "manual";
  targetId?: string;
  requiredCount?: number;
}

export interface QuestDefinition {
  id: string;
  kind: QuestKind;
  chapterId: ChapterId;
  title: string;
  giverId: string;
  summary: string;
  description: string;
  objectives: ObjectiveDefinition[];
  rewardSilver: number;
  rewardXp: number;
  rewardItemIds: string[];
  unlockConditions?: Condition[];
}

export interface LocationAction {
  id: string;
  label: string;
  description: string;
  sceneId?: string;
  encounterId?: string;
  shopId?: string;
  conditions?: Condition[];
  once?: boolean;
}

export interface ShopListing {
  itemId: string;
  price: number;
}

export interface LocationDefinition {
  id: string;
  regionId: RegionId;
  chapterId: ChapterId;
  name: string;
  subtitle: string;
  description: string;
  travelDescription: string;
  backgroundAssetId: string;
  ambienceKey: string;
  mapX: number;
  mapY: number;
  neighbors: string[];
  unlockConditions?: Condition[];
  npcIds: string[];
  journalEntryIds: string[];
  actionIds: string[];
  encounterIds: string[];
  shopListings?: ShopListing[];
  checkpoint?: boolean;
}

export interface OverworldInteraction {
  id: string;
  kind: OverworldInteractionKind;
  x: number;
  y: number;
  label: string;
  description: string;
  blocking?: boolean;
  actionId?: string;
  shopId?: string;
  targetLocationId?: string;
  message?: string[];
  conditions?: Condition[];
}

export interface OverworldMapDefinition {
  id: string;
  locationId: string;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  tiles: string[];
  spawn: { x: number; y: number };
  interactions: OverworldInteraction[];
  wildEncounterIds?: string[];
}

export type Condition =
  | { type: "flag"; key: string; equals: string | number | boolean }
  | { type: "decision"; key: string; equals: string | number | boolean }
  | { type: "quest"; questId: string; status: QuestStatus }
  | { type: "inventory"; itemId: string; minQuantity: number }
  | { type: "sceneCompleted"; sceneId: string }
  | { type: "encounterDefeated"; encounterId: string }
  | { type: "locationDiscovered"; locationId: string }
  | { type: "chapter"; chapterId: ChapterId }
  | { type: "level"; min: number }
  | { type: "not"; condition: Condition };

export type GameEffect =
  | { type: "setFlag"; key: string; value: string | number | boolean }
  | { type: "setDecision"; key: string; value: string | number | boolean }
  | { type: "startQuest"; questId: string }
  | { type: "advanceQuest"; questId: string; objectiveId?: string }
  | { type: "completeQuest"; questId: string }
  | { type: "discoverLocation"; locationId: string }
  | { type: "travel"; locationId: string }
  | { type: "unlockJournal"; entryId: string }
  | { type: "addItem"; itemId: string; quantity: number }
  | { type: "removeItem"; itemId: string; quantity: number }
  | { type: "gainSilver"; amount: number }
  | { type: "gainXp"; amount: number }
  | { type: "healParty"; amount: number }
  | { type: "setChapter"; chapterId: ChapterId }
  | { type: "startScene"; sceneId: string }
  | { type: "startEncounter"; encounterId: string }
  | { type: "setCheckpoint"; locationId: string }
  | { type: "unlockAchievement"; achievementId: string }
  | { type: "addNotification"; message: string; tone?: NotificationTone }
  | { type: "unlockCompanion"; characterId: string };

export interface SceneChoice {
  id: string;
  label: string;
  nextNodeId?: string;
  conditions?: Condition[];
  effects?: GameEffect[];
  tone?: "compassion" | "curious" | "defiant" | "pragmatic";
}

export interface SceneNode {
  id: string;
  speakerId?: string;
  speakerName?: string;
  portraitAssetId?: string;
  text: string[];
  nextNodeId?: string;
  choices?: SceneChoice[];
  onEnterEffects?: GameEffect[];
  end?: boolean;
}

export interface SceneDefinition {
  id: string;
  chapterId: ChapterId;
  title: string;
  summary: string;
  locationId: string;
  backgroundAssetId: string;
  startNodeId: string;
  availability?: Condition[];
  nodes: Record<string, SceneNode>;
  completionEffects?: GameEffect[];
  repeatable?: boolean;
}

export interface EncounterDefinition {
  id: string;
  chapterId: ChapterId;
  locationId: string;
  title: string;
  intro: string;
  enemyIds: string[];
  rewardXp: number;
  rewardSilver: number;
  rewardItemIds: string[];
  victoryText: string;
  boss?: boolean;
  musicKey: string;
  once?: boolean;
  onVictoryEffects?: GameEffect[];
}

export interface JournalEntry {
  id: string;
  title: string;
  category: "lore" | "character" | "location" | "faction" | "event";
  body: string[];
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface EquipmentSlots {
  weapon?: string;
  armor?: string;
  accessory?: string;
}

export interface QuestProgress {
  id: string;
  status: QuestStatus;
  currentObjectiveIndex: number;
  completedObjectiveIds: string[];
  updatedAt: number;
}

export interface Notification {
  id: string;
  message: string;
  tone: NotificationTone;
  createdAt: number;
}

export interface SettingsState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  muteAll: boolean;
  reducedMotion: boolean;
  textSpeed: "calm" | "standard" | "swift";
}

export interface PlayerState {
  name: string;
  title: string;
  className: string;
  level: number;
  xp: number;
  silver: number;
  baseStats: BaseStats;
  currentHp: number;
  currentMp: number;
  learnedSkillIds: string[];
}

export interface CombatEntityState {
  id: string;
  name: string;
  portraitAssetId: string;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  defending?: boolean;
  buffs?: Partial<Record<keyof EquipmentBonuses, number>>;
}

export interface CombatLogEntry {
  id: string;
  message: string;
  tone: NotificationTone;
}

export interface CombatState {
  encounterId: string;
  turnNumber: number;
  player: CombatEntityState;
  enemies: CombatEntityState[];
  queue: string[];
  currentTurnOwnerId: string;
  resolved: "victory" | "defeat" | null;
  log: CombatLogEntry[];
  boss: boolean;
}

export interface CheckpointState {
  locationId: string;
  chapterId: ChapterId;
}

export interface OverworldPosition {
  x: number;
  y: number;
  facing: Direction;
  steps: number;
}

export interface OverworldMessage {
  title: string;
  body: string[];
}

export interface OverworldState {
  positions: Record<string, OverworldPosition>;
  message: OverworldMessage | null;
  lastEncounterStepByLocation: Record<string, number>;
}

export interface SaveMeta {
  slotId: string;
  label: string;
  timestamp: number;
  preview: string;
}

export interface GameState {
  version: number;
  status: "title" | "playing" | "gameover";
  chapterId: ChapterId;
  currentLocationId: string;
  activeSceneId: string | null;
  activeNodeId: string | null;
  activeShopId: string | null;
  completedSceneIds: string[];
  discoveredLocationIds: string[];
  journalEntryIds: string[];
  defeatedEncounterIds: string[];
  companionIds: string[];
  inventory: InventoryEntry[];
  equipment: EquipmentSlots;
  quests: Record<string, QuestProgress>;
  player: PlayerState;
  combat: CombatState | null;
  decisions: Record<string, string | number | boolean>;
  flags: Record<string, string | number | boolean>;
  notifications: Notification[];
  settings: SettingsState;
  overworld: OverworldState;
  checkpoint: CheckpointState;
  achievements: string[];
  saveMeta: SaveMeta;
  startedAt: number;
  updatedAt: number;
  totalPlaytimeSeconds: number;
}

export interface SaveFile {
  version: number;
  slotId: string;
  savedAt: number;
  state: GameState;
}

export interface SaveSlotRecord {
  autosave?: SaveFile;
  manual: Record<string, SaveFile | undefined>;
}

export interface UiNavItem {
  routeId: RouteId;
  label: string;
  path: string;
  iconAssetId: string;
  showWhenPlaying?: boolean;
}

export interface AudioNodeDefinition {
  key: string;
  category: AudioCategory;
  label: string;
  description: string;
  waveform: OscillatorType;
  tempo?: number;
  sequence?: number[];
  volume: number;
  loop: boolean;
}

export interface AssetColorRamp {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  light: string;
}

export interface AssetDefinition {
  id: string;
  kind: AssetKind;
  label: string;
  variant: string;
  palette: AssetColorRamp;
  caption?: string;
}
