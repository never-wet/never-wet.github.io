import { contentRegistry } from "../../memory/contentRegistry";
import type {
  CombatEntityState,
  Condition,
  EquipmentBonuses,
  EquipmentSlots,
  GameState,
  ItemDefinition,
  NotificationTone,
} from "../../memory/types";

export const xpForLevel = (level: number) => 60 + level * 36;

export const getItemQuantity = (state: GameState, itemId: string) =>
  state.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;

export const getItem = (itemId: string): ItemDefinition | undefined => contentRegistry.itemsById[itemId];

export const getEquipmentBonuses = (state: GameState): Required<EquipmentBonuses> => {
  const totals: Required<EquipmentBonuses> = {
    maxHp: 0,
    maxMp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    spirit: 0,
  };

  (Object.values(state.equipment) as Array<string | undefined>).forEach((itemId) => {
    if (!itemId) {
      return;
    }

    const bonuses = contentRegistry.itemsById[itemId]?.bonuses;
    if (!bonuses) {
      return;
    }

    totals.maxHp += bonuses.maxHp ?? 0;
    totals.maxMp += bonuses.maxMp ?? 0;
    totals.attack += bonuses.attack ?? 0;
    totals.defense += bonuses.defense ?? 0;
    totals.speed += bonuses.speed ?? 0;
    totals.spirit += bonuses.spirit ?? 0;
  });

  return totals;
};

export const getDerivedPlayerStats = (state: GameState) => {
  const bonus = getEquipmentBonuses(state);
  const { baseStats, level } = state.player;

  return {
    maxHp: baseStats.maxHp + bonus.maxHp + level * 8,
    maxMp: baseStats.maxMp + bonus.maxMp + Math.floor(level * 3),
    attack: baseStats.attack + bonus.attack + Math.floor(level * 1.5),
    defense: baseStats.defense + bonus.defense + Math.floor(level * 1.3),
    speed: baseStats.speed + bonus.speed + Math.floor(level * 0.8),
    spirit: baseStats.spirit + bonus.spirit + Math.floor(level * 1.1),
  };
};

export const createPlayerCombatant = (state: GameState): CombatEntityState => {
  const derived = getDerivedPlayerStats(state);

  return {
    id: "player",
    name: state.player.name,
    portraitAssetId: "portrait-rowan",
    maxHp: derived.maxHp,
    hp: Math.min(state.player.currentHp, derived.maxHp),
    maxMp: derived.maxMp,
    mp: Math.min(state.player.currentMp, derived.maxMp),
    attack: derived.attack,
    defense: derived.defense,
    speed: derived.speed,
    spirit: derived.spirit,
    defending: false,
    buffs: {},
  };
};

export const createEnemyCombatant = (enemyId: string): CombatEntityState => {
  const enemy = contentRegistry.enemiesById[enemyId];

  return {
    id: `${enemyId}-${Math.random().toString(36).slice(2, 8)}`,
    name: enemy.name,
    portraitAssetId: enemy.portraitAssetId,
    maxHp: enemy.baseStats.maxHp,
    hp: enemy.baseStats.maxHp,
    maxMp: enemy.baseStats.maxMp,
    mp: enemy.baseStats.maxMp,
    attack: enemy.baseStats.attack,
    defense: enemy.baseStats.defense,
    speed: enemy.baseStats.speed,
    spirit: enemy.baseStats.spirit,
    defending: false,
    buffs: {},
  };
};

export const addInventoryItem = (state: GameState, itemId: string, quantity: number) => {
  const existing = state.inventory.find((entry) => entry.itemId === itemId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    state.inventory.push({ itemId, quantity });
  }
};

export const removeInventoryItem = (state: GameState, itemId: string, quantity: number) => {
  const existing = state.inventory.find((entry) => entry.itemId === itemId);
  if (!existing) {
    return false;
  }

  existing.quantity -= quantity;
  state.inventory = state.inventory.filter((entry) => entry.quantity > 0);
  return existing.quantity >= 0;
};

export const pushNotification = (state: GameState, message: string, tone: NotificationTone = "info") => {
  state.notifications.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    tone,
    createdAt: Date.now(),
  });
  state.notifications = state.notifications.slice(0, 6);
};

export const levelUpIfNeeded = (state: GameState) => {
  let leveled = false;
  while (state.player.xp >= xpForLevel(state.player.level)) {
    state.player.xp -= xpForLevel(state.player.level);
    state.player.level += 1;
    state.player.baseStats.maxHp += 5;
    state.player.baseStats.maxMp += 2;
    state.player.baseStats.attack += 2;
    state.player.baseStats.defense += 1;
    state.player.baseStats.speed += 1;
    state.player.baseStats.spirit += 2;
    leveled = true;
  }

  if (leveled) {
    const derived = getDerivedPlayerStats(state);
    state.player.currentHp = derived.maxHp;
    state.player.currentMp = derived.maxMp;
    pushNotification(state, `${state.player.name} reached level ${state.player.level}.`, "reward");
  }
};

export const clampPlayerVitals = (state: GameState) => {
  const derived = getDerivedPlayerStats(state);
  state.player.currentHp = Math.max(0, Math.min(state.player.currentHp, derived.maxHp));
  state.player.currentMp = Math.max(0, Math.min(state.player.currentMp, derived.maxMp));
};

export const getEquipmentSlotForItem = (item: ItemDefinition): keyof EquipmentSlots | null => {
  if (item.type === "weapon") {
    return "weapon";
  }
  if (item.type === "armor") {
    return "armor";
  }
  if (item.type === "accessory") {
    return "accessory";
  }
  return null;
};

export const isConditionMet = (state: GameState, condition: Condition): boolean => {
  switch (condition.type) {
    case "flag":
      return state.flags[condition.key] === condition.equals;
    case "decision":
      return state.decisions[condition.key] === condition.equals;
    case "quest":
      return state.quests[condition.questId]?.status === condition.status;
    case "inventory":
      return getItemQuantity(state, condition.itemId) >= condition.minQuantity;
    case "sceneCompleted":
      return state.completedSceneIds.includes(condition.sceneId);
    case "encounterDefeated":
      return state.defeatedEncounterIds.includes(condition.encounterId);
    case "locationDiscovered":
      return state.discoveredLocationIds.includes(condition.locationId);
    case "chapter":
      return state.chapterId === condition.chapterId;
    case "level":
      return state.player.level >= condition.min;
    case "not":
      return !isConditionMet(state, condition.condition);
    default:
      return false;
  }
};

export const areConditionsMet = (state: GameState, conditions?: Condition[]) =>
  conditions?.every((condition) => isConditionMet(state, condition)) ?? true;

export const discoverLocation = (state: GameState, locationId: string) => {
  if (!state.discoveredLocationIds.includes(locationId)) {
    state.discoveredLocationIds.push(locationId);
    pushNotification(state, `New location discovered: ${contentRegistry.locationsById[locationId]?.name ?? locationId}`, "reward");
  }
};

export const unlockJournalEntry = (state: GameState, entryId: string) => {
  if (!state.journalEntryIds.includes(entryId)) {
    state.journalEntryIds.push(entryId);
  }
};

export const awardSilver = (state: GameState, amount: number) => {
  state.player.silver += amount;
};

export const awardXp = (state: GameState, amount: number) => {
  state.player.xp += amount;
  levelUpIfNeeded(state);
};

export const getMainProgressPercent = (state: GameState) => {
  const mainQuests = contentRegistry.quests.filter((quest) => quest.kind === "main");
  const completed = mainQuests.filter((quest) => state.quests[quest.id]?.status === "completed").length;
  return Math.round((completed / mainQuests.length) * 100);
};

export const isLocationUnlocked = (state: GameState, locationId: string) =>
  areConditionsMet(state, contentRegistry.locationsById[locationId]?.unlockConditions);

export const autoAdvanceObjective = (state: GameState, progressType: "item" | "location", targetId: string) => {
  contentRegistry.quests.forEach((quest) => {
    const progress = state.quests[quest.id];
    if (progress?.status !== "active") {
      return;
    }
    const objective = quest.objectives[progress.currentObjectiveIndex];
    if (!objective || objective.progressType !== progressType || objective.targetId !== targetId) {
      return;
    }
    progress.completedObjectiveIds.push(objective.id);
    progress.currentObjectiveIndex += 1;
    progress.updatedAt = Date.now();
    pushNotification(state, `Objective advanced: ${objective.text}`, "quest");
  });
};
