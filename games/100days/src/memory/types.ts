export type SceneId =
  | "title"
  | "playing"
  | "paused"
  | "upgrade"
  | "day-summary"
  | "settings"
  | "event"
  | "codex"
  | "game-over"
  | "victory";

export type GameModeId = "standard" | "endless" | "boss-rush" | "fragile";

export type EnemyFaction = "wildroot" | "ruinborn" | "embercourt" | "frostkin" | "riftspawn";

export type EliteAffixId = "explosive" | "hasted" | "bulwark" | "splitter" | "siphon";

export type ObjectiveKind = "slayer" | "collector" | "shrine" | "boss";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type WeaponArchetype =
  | "projectile"
  | "spread"
  | "pierce"
  | "orbit"
  | "blast"
  | "beam"
  | "mine"
  | "summon"
  | "chain"
  | "aura";

export type EnemyBehavior =
  | "swarm"
  | "fast"
  | "tank"
  | "ranged"
  | "charger"
  | "wisp"
  | "splitter"
  | "boss";

export type MilestoneTag =
  | "challenge"
  | "elite"
  | "boss"
  | "biome"
  | "spike"
  | "final"
  | "horde";

export type UpgradeChoiceType = "weapon" | "passive" | "day-reward";

export type MusicTrackId = "menu-drift" | "field-drive" | "danger-bloom" | "victory-rise";

export type SfxId =
  | "ui-select"
  | "player-hit"
  | "enemy-hit"
  | "enemy-die"
  | "pickup"
  | "level-up"
  | "boss-warning"
  | "day-clear"
  | "game-over"
  | "victory"
  | "weapon-fire"
  | "upgrade-lock";

export type AssetKind = "sprite" | "icon" | "logo" | "effect";

export interface Vec2 {
  x: number;
  y: number;
}

export interface GameModeDefinition {
  id: GameModeId;
  label: string;
  description: string;
  shortLabel?: string;
}

export interface MilestoneDefinition {
  day: number;
  title: string;
  description: string;
  tags: MilestoneTag[];
}

export interface FeatureFlags {
  proceduralAudio: boolean;
  generatedArt: boolean;
  autosave: boolean;
  metaProgression: boolean;
  bosses: boolean;
}

export interface GameManifest {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  tagline: string;
  pitch: string;
  dayCount: number;
  startingDay: number;
  defaultDayDuration: number;
  modes: GameModeDefinition[];
  biomeOrder: string[];
  milestoneDefinitions: MilestoneDefinition[];
  featureFlags: FeatureFlags;
}

export interface DayPlan {
  day: number;
  duration: number;
  biomeId: string;
  dangerLevel: number;
  spawnRate: number;
  enemyCap: number;
  eliteChance: number;
  enemyWeights: Record<string, number>;
  elitePool: string[];
  bossId?: string;
  bossSpawnAt?: number;
  tags: MilestoneTag[];
  summary: string;
  restHealRatio: number;
}

export interface DayObjectiveState {
  kind: ObjectiveKind;
  title: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  rewardText: string;
}

export interface PlayerBaseStats {
  maxHp: number;
  moveSpeed: number;
  pickupRadius: number;
  armor: number;
  critChance: number;
  critMultiplier: number;
  cooldownMultiplier: number;
  regen: number;
  xpMultiplier: number;
  luck: number;
  damageMultiplier: number;
  areaMultiplier: number;
  durationMultiplier: number;
  projectileSpeed: number;
  dodgeChance: number;
  magnetStrength: number;
  reviveCharges: number;
}

export interface PlayerStats extends PlayerBaseStats {
  hp: number;
  level: number;
  xp: number;
  xpToNext: number;
}

export interface WeaponLevelStats {
  damage: number;
  cooldown: number;
  count: number;
  speed: number;
  size: number;
  range: number;
  duration: number;
  pierce: number;
  knockback: number;
  radius: number;
  chain: number;
  orbitals: number;
  drones: number;
  spread: number;
  orbitRadius: number;
  fuse: number;
  beamWidth: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  archetype: WeaponArchetype;
  iconId: string;
  spriteId: string;
  rarity: Rarity;
  weight: number;
  unlockDay: number;
  maxLevel: number;
  baseStats: WeaponLevelStats;
  perLevel: Partial<WeaponLevelStats>;
}

export type StatModifier = Partial<
  Pick<
    PlayerBaseStats,
    | "maxHp"
    | "moveSpeed"
    | "pickupRadius"
    | "armor"
    | "critChance"
    | "critMultiplier"
    | "cooldownMultiplier"
    | "regen"
    | "xpMultiplier"
    | "luck"
    | "damageMultiplier"
    | "areaMultiplier"
    | "durationMultiplier"
    | "projectileSpeed"
    | "dodgeChance"
    | "magnetStrength"
    | "reviveCharges"
  >
>;

export interface PassiveDefinition {
  id: string;
  name: string;
  description: string;
  iconId: string;
  rarity: Rarity;
  weight: number;
  unlockDay: number;
  maxLevel: number;
  perLevel: StatModifier;
  healOnPick?: number;
}

export interface EnemyRangedConfig {
  cooldown: number;
  speed: number;
  damage: number;
  range: number;
}

export interface EnemyChargeConfig {
  cooldown: number;
  speed: number;
  duration: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  description: string;
  behavior: EnemyBehavior;
  faction: EnemyFaction;
  spriteId: string;
  iconId: string;
  unlockDay: number;
  radius: number;
  maxHp: number;
  speed: number;
  damage: number;
  xp: number;
  touchCooldown: number;
  knockbackResistance: number;
  ranged?: EnemyRangedConfig;
  charge?: EnemyChargeConfig;
  splitInto?: string;
  splitCount?: number;
  summonIds?: string[];
  isElite?: boolean;
  isBoss?: boolean;
  bossMusic?: MusicTrackId;
}

export interface LootDefinition {
  id: string;
  label: string;
  color: string;
  value: number;
  radius: number;
  spriteId: string;
}

export interface AudioCueDefinition {
  id: SfxId;
  waveform: OscillatorType;
  gain: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  baseFrequency: number;
  glide?: number;
  noiseMix?: number;
}

export interface MusicTrackDefinition {
  id: MusicTrackId;
  bpm: number;
  scale: number[];
  bass: number[];
  melody: number[];
  pulseGain: number;
  waveform: OscillatorType;
}

export interface AssetDefinition {
  id: string;
  kind: AssetKind;
  shape: string;
  size: number;
  palette: string[];
  glow?: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  starterWeaponId: string;
  starterPassiveIds: string[];
  starterRelicId: string;
  statModifiers: StatModifier;
  accent: string;
}

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  iconId: string;
  rarity: Rarity;
  statModifiers: StatModifier;
}

export interface WeaponEvolutionDefinition {
  id: string;
  weaponId: string;
  passiveId: string;
  evolvedName: string;
  description: string;
  bonuses: Partial<WeaponLevelStats>;
}

export interface WeaponSynergyDefinition {
  id: string;
  name: string;
  description: string;
  weaponIds: string[];
  passiveId?: string;
}

export interface CodexProgress {
  weapons: string[];
  passives: string[];
  enemies: string[];
  relics: string[];
  characters: string[];
  evolutions: string[];
  synergies: string[];
  modes: GameModeId[];
}

export interface RunWeaponState {
  id: string;
  level: number;
  cooldown: number;
  orbitAngle: number;
  droneSeed: number;
}

export interface RunPassiveState {
  id: string;
  level: number;
}

export interface UpgradeChoice {
  id: string;
  title: string;
  description: string;
  iconId: string;
  rarity: Rarity;
  type: UpgradeChoiceType;
  targetId: string;
  nextLevel: number;
}

export interface DayRewardOption {
  id: string;
  title: string;
  description: string;
  iconId: string;
  type: UpgradeChoiceType;
  targetId: string;
}

export interface DaySummary {
  day: number;
  killCount: number;
  summaryText: string;
  rewardOptions: DayRewardOption[];
  objectiveText?: string;
  objectiveComplete?: boolean;
  objectiveRewardText?: string;
}

export interface WarningMessage {
  id: number;
  text: string;
  timer: number;
  emphasis: "day" | "boss" | "level" | "event";
}

export interface PlayerRuntime {
  position: Vec2;
  velocity: Vec2;
  radius: number;
  facing: number;
  hitFlash: number;
  invulnerable: number;
  stats: PlayerStats;
}

export interface EnemyRuntime {
  uid: number;
  definitionId: string;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  slow: number;
  attackTimer: number;
  stateTimer: number;
  dashTimer: number;
  contactTimer: number;
  summonTimer: number;
  elite: boolean;
  boss: boolean;
  affix?: EliteAffixId;
  phase: number;
}

export interface ProjectileRuntime {
  uid: number;
  source: "player" | "enemy";
  kind: string;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  pierce: number;
  color: string;
  knockback: number;
  critChance: number;
  chain: number;
  explosionRadius?: number;
  spriteId: string;
}

export interface BeamRuntime {
  uid: number;
  source: "player" | "enemy";
  origin: Vec2;
  target: Vec2;
  width: number;
  damagePerSecond: number;
  life: number;
  color: string;
}

export interface MineRuntime {
  uid: number;
  position: Vec2;
  fuse: number;
  explosionRadius: number;
  damage: number;
  radius: number;
  spriteId: string;
}

export interface DroneRuntime {
  uid: number;
  weaponId: string;
  orbitAngle: number;
  fireCooldown: number;
  radius: number;
  damage: number;
}

export interface PickupRuntime {
  uid: number;
  type: string;
  position: Vec2;
  velocity: Vec2;
  value: number;
  radius: number;
  life: number;
  attracted: boolean;
  spriteId: string;
}

export interface HazardRuntime {
  uid: number;
  kind: string;
  biomeId: string;
  position: Vec2;
  radius: number;
  life: number;
  warmup: number;
  pulseTimer: number;
  damage: number;
  color: string;
}

export interface ShrineChoice {
  id: string;
  title: string;
  description: string;
}

export interface ShrineRuntime {
  uid: number;
  title: string;
  description: string;
  position: Vec2;
  radius: number;
  life: number;
  used: boolean;
  choices: ShrineChoice[];
}

export interface EventState {
  shrineUid: number;
  title: string;
  description: string;
  choices: ShrineChoice[];
}

export interface ParticleRuntime {
  uid: number;
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  alpha: number;
}

export interface DamageTextRuntime {
  uid: number;
  text: string;
  position: Vec2;
  velocity: Vec2;
  life: number;
  color: string;
  crit: boolean;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  description: string;
  palette: string[];
  fogColor: string;
  tileColor: string;
  propColor: string;
  parallaxColor: string;
}

export interface MetaProgression {
  bestDay: number;
  completedDay100: boolean;
  totalRuns: number;
  totalDeaths: number;
  codex: CodexProgress;
}

export interface SettingsData {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  screenshake: boolean;
  damageNumbers: boolean;
  reducedFlash: boolean;
}

export interface RunSnapshot {
  version: number;
  day: number;
  dayTimeRemaining: number;
  totalRunTime: number;
  player: PlayerRuntime;
  weapons: RunWeaponState[];
  passives: RunPassiveState[];
  relicIds: string[];
  modeId: GameModeId;
  characterId: string;
  objective: DayObjectiveState | null;
  usedContinue: boolean;
}

export interface SaveData {
  version: number;
  profile: MetaProgression;
  settings: SettingsData;
  currentRun: RunSnapshot | null;
}

export interface ContentRegistry {
  weapons: Record<string, WeaponDefinition>;
  passives: Record<string, PassiveDefinition>;
  enemies: Record<string, EnemyDefinition>;
  loot: Record<string, LootDefinition>;
  characters: Record<string, CharacterDefinition>;
  relics: Record<string, RelicDefinition>;
  evolutions: Record<string, WeaponEvolutionDefinition>;
  synergies: Record<string, WeaponSynergyDefinition>;
  days: DayPlan[];
  assets: Record<string, AssetDefinition>;
  biomes: Record<string, BiomeDefinition>;
  audio: {
    tracks: Record<MusicTrackId, MusicTrackDefinition>;
    cues: Record<SfxId, AudioCueDefinition>;
  };
}
