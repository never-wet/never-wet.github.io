import { playerBaseStats } from "./playerDefaults";
import type { CodexProgress, MetaProgression, PlayerStats, SaveData, SettingsData } from "./types";

export const CURRENT_SAVE_VERSION = 2;

export const createDefaultCodex = (): CodexProgress => ({
  weapons: [],
  passives: [],
  enemies: [],
  relics: [],
  characters: [],
  evolutions: [],
  synergies: [],
  modes: ["standard"],
});

export const createDefaultSettings = (): SettingsData => ({
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  muted: false,
  musicMuted: false,
  sfxMuted: false,
  screenshake: true,
  damageNumbers: true,
  reducedFlash: false,
});

export const createDefaultProfile = (): MetaProgression => ({
  bestDay: 0,
  completedDay100: false,
  totalRuns: 0,
  totalDeaths: 0,
  codex: createDefaultCodex(),
});

export const createDefaultPlayerStats = (): PlayerStats => ({
  ...playerBaseStats,
  hp: playerBaseStats.maxHp,
  level: 1,
  xp: 0,
  xpToNext: 24,
});

export const createEmptySave = (): SaveData => ({
  version: CURRENT_SAVE_VERSION,
  profile: createDefaultProfile(),
  settings: createDefaultSettings(),
  currentRun: null,
});
