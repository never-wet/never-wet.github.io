import { contentRegistry } from "../../memory/contentRegistry";
import { createDefaultState } from "../../memory/defaultState";
import type { CombatActionType, Direction, GameEffect, GameState, SettingsState } from "../../memory/types";
import { createCombatState, runCombatRound } from "./combat";
import {
  addInventoryItem,
  areConditionsMet,
  autoAdvanceObjective,
  awardSilver,
  awardXp,
  clampPlayerVitals,
  discoverLocation,
  getEquipmentSlotForItem,
  pushNotification,
  removeInventoryItem,
  unlockJournalEntry,
} from "./helpers";
import {
  getCurrentOverworldMap,
  getDirectionalDelta,
  getFrontPosition,
  getInteractionAt,
  getOverworldPosition,
  getTileChar,
  isBlockedByInteraction,
  isTilePassable,
  pickWildEncounterId,
  tileCharToType,
} from "./overworld";

export type GameAction =
  | { type: "NEW_GAME"; playerName?: string }
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "RUN_LOCATION_ACTION"; actionId: string }
  | { type: "TRAVEL"; locationId: string }
  | { type: "MOVE_OVERWORLD"; direction: Direction }
  | { type: "INTERACT_OVERWORLD" }
  | { type: "CLOSE_OVERWORLD_MESSAGE" }
  | { type: "ADVANCE_SCENE" }
  | { type: "CHOOSE_SCENE_OPTION"; choiceId: string }
  | { type: "BATTLE_ACTION"; action: CombatActionType; skillId?: string; itemId?: string; targetId?: string }
  | { type: "USE_ITEM"; itemId: string }
  | { type: "EQUIP_ITEM"; itemId: string }
  | { type: "UNEQUIP_SLOT"; slot: "weapon" | "armor" | "accessory" }
  | { type: "SET_ACTIVE_SHOP"; shopId: string | null }
  | { type: "BUY_ITEM"; itemId: string }
  | { type: "TURN_IN_QUEST"; questId: string }
  | { type: "RESPAWN" }
  | { type: "SET_SETTINGS"; settings: Partial<SettingsState> }
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | { type: "TICK_PLAYTIME"; seconds: number };

const markSceneComplete = (state: GameState, sceneId: string) => {
  if (!state.completedSceneIds.includes(sceneId)) {
    state.completedSceneIds.push(sceneId);
  }
};

const ensureOverworldPosition = (state: GameState, locationId = state.currentLocationId) => {
  const map = contentRegistry.overworldMapsById[locationId];
  if (!map) {
    return;
  }

  if (!state.overworld.positions[locationId]) {
    state.overworld.positions[locationId] = {
      x: map.spawn.x,
      y: map.spawn.y,
      facing: "right",
      steps: 0,
    };
  }
};

const openOverworldMessage = (state: GameState, title: string, body: string[]) => {
  state.overworld.message = { title, body };
};

const completeQuest = (state: GameState, questId: string) => {
  const quest = contentRegistry.questsById[questId];
  const progress = state.quests[questId];
  if (!quest || !progress || progress.status === "completed") {
    return;
  }

  progress.status = "completed";
  progress.updatedAt = Date.now();
  awardSilver(state, quest.rewardSilver);
  awardXp(state, quest.rewardXp);
  quest.rewardItemIds.forEach((itemId) => addInventoryItem(state, itemId, 1));
  pushNotification(state, `Quest complete: ${quest.title}`, "quest");
};

const advanceQuest = (state: GameState, questId: string, objectiveId?: string) => {
  const quest = contentRegistry.questsById[questId];
  const progress = state.quests[questId];
  if (!quest || !progress) {
    return;
  }

  if (progress.status === "locked") {
    progress.status = "active";
  }

  if (progress.status !== "active") {
    return;
  }

  const objective = quest.objectives[progress.currentObjectiveIndex];
  if (!objective) {
    completeQuest(state, questId);
    return;
  }

  if (objectiveId && objective.id !== objectiveId) {
    const targetIndex = quest.objectives.findIndex((entry) => entry.id === objectiveId);
    if (targetIndex !== progress.currentObjectiveIndex) {
      return;
    }
  }

  if (!progress.completedObjectiveIds.includes(objective.id)) {
    progress.completedObjectiveIds.push(objective.id);
    pushNotification(state, `Objective updated: ${objective.text}`, "quest");
  }

  progress.currentObjectiveIndex += 1;
  progress.updatedAt = Date.now();

  if (progress.currentObjectiveIndex >= quest.objectives.length) {
    completeQuest(state, questId);
  }
};

const startQuest = (state: GameState, questId: string) => {
  const quest = contentRegistry.questsById[questId];
  const progress = state.quests[questId];
  if (!quest || !progress || progress.status !== "locked") {
    return;
  }

  if (!areConditionsMet(state, quest.unlockConditions)) {
    return;
  }

  progress.status = "active";
  progress.updatedAt = Date.now();
  pushNotification(state, `Quest started: ${quest.title}`, "quest");
};

const applyEffects = (state: GameState, effects: GameEffect[] = []) => {
  effects.forEach((effect) => {
    switch (effect.type) {
      case "setFlag":
        state.flags[effect.key] = effect.value;
        break;
      case "setDecision":
        state.decisions[effect.key] = effect.value;
        break;
      case "startQuest":
        startQuest(state, effect.questId);
        break;
      case "advanceQuest":
        advanceQuest(state, effect.questId, effect.objectiveId);
        break;
      case "completeQuest":
        completeQuest(state, effect.questId);
        break;
      case "discoverLocation":
        discoverLocation(state, effect.locationId);
        autoAdvanceObjective(state, "location", effect.locationId);
        break;
      case "travel":
        state.currentLocationId = effect.locationId;
        discoverLocation(state, effect.locationId);
        autoAdvanceObjective(state, "location", effect.locationId);
        state.activeShopId = null;
        state.overworld.message = null;
        ensureOverworldPosition(state, effect.locationId);
        break;
      case "unlockJournal":
        unlockJournalEntry(state, effect.entryId);
        break;
      case "addItem":
        addInventoryItem(state, effect.itemId, effect.quantity);
        autoAdvanceObjective(state, "item", effect.itemId);
        break;
      case "removeItem":
        removeInventoryItem(state, effect.itemId, effect.quantity);
        break;
      case "gainSilver":
        awardSilver(state, effect.amount);
        break;
      case "gainXp":
        awardXp(state, effect.amount);
        break;
      case "healParty":
        state.player.currentHp += effect.amount;
        state.player.currentMp += Math.floor(effect.amount / 2);
        clampPlayerVitals(state);
        break;
      case "setChapter":
        state.chapterId = effect.chapterId;
        break;
      case "startScene": {
        const scene = contentRegistry.scenesById[effect.sceneId];
        if (scene) {
          state.activeSceneId = scene.id;
          state.activeNodeId = scene.startNodeId;
          state.activeShopId = null;
          state.overworld.message = null;
        }
        break;
      }
      case "startEncounter":
        state.combat = createCombatState(state, effect.encounterId);
        state.activeShopId = null;
        state.overworld.message = null;
        break;
      case "setCheckpoint":
        state.checkpoint = {
          locationId: effect.locationId,
          chapterId: state.chapterId,
        };
        break;
      case "unlockAchievement":
        if (!state.achievements.includes(effect.achievementId)) {
          state.achievements.push(effect.achievementId);
        }
        break;
      case "addNotification":
        pushNotification(state, effect.message, effect.tone);
        break;
      case "unlockCompanion":
        if (!state.companionIds.includes(effect.characterId)) {
          state.companionIds.push(effect.characterId);
          pushNotification(state, `${contentRegistry.charactersById[effect.characterId]?.name ?? effect.characterId} joined your circle.`, "reward");
        }
        break;
      default:
        break;
    }
  });
};

const completeScene = (state: GameState, sceneId: string) => {
  const scene = contentRegistry.scenesById[sceneId];
  if (!scene) {
    return;
  }
  markSceneComplete(state, sceneId);
  state.activeSceneId = null;
  state.activeNodeId = null;
  applyEffects(state, scene.completionEffects);
};

const runLocationAction = (state: GameState, actionId: string) => {
  const action = contentRegistry.locationActionsById[actionId];
  if (!action || !areConditionsMet(state, action.conditions)) {
    return;
  }

  if (action.once) {
    if (action.sceneId && state.completedSceneIds.includes(action.sceneId)) {
      return;
    }
    if (action.encounterId && state.defeatedEncounterIds.includes(action.encounterId)) {
      return;
    }
  }

  if (action.sceneId) {
    applyEffects(state, [{ type: "startScene", sceneId: action.sceneId }]);
    return;
  }

  if (action.encounterId) {
    applyEffects(state, [{ type: "startEncounter", encounterId: action.encounterId }]);
    return;
  }

  if (action.shopId) {
    state.activeShopId = action.shopId;
    return;
  }

  if (action.id === "thornwake-rest") {
    applyEffects(state, [
      { type: "healParty", amount: 999 },
      { type: "setCheckpoint", locationId: "thornwake" },
      { type: "addNotification", message: "You rest by Sera's hearth and recover your strength.", tone: "reward" },
    ]);
  }

  if (action.id === "thornwake-ledger") {
    applyEffects(state, [
      { type: "unlockJournal", entryId: "entry-lantern-guild" },
      { type: "unlockJournal", entryId: "entry-vow-bells" },
      { type: "unlockJournal", entryId: "entry-hollow-star" },
      { type: "addNotification", message: "Isolde's notes fill in more of Hollowmere's history.", tone: "info" },
    ]);
  }
};

const runOverworldInteraction = (state: GameState, interaction?: ReturnType<typeof getInteractionAt>) => {
  if (!interaction) {
    openOverworldMessage(state, "Nothing Here", ["Only rain, stone, and the sound of your own boots."]);
    return;
  }

  if (interaction.kind === "travel" && interaction.targetLocationId) {
    applyEffects(state, [{ type: "travel", locationId: interaction.targetLocationId }]);
    return;
  }

  if (interaction.kind === "shop" && interaction.shopId) {
    state.activeShopId = interaction.shopId;
    return;
  }

  if (interaction.actionId) {
    runLocationAction(state, interaction.actionId);
    return;
  }

  if (interaction.message?.length) {
    openOverworldMessage(state, interaction.label, interaction.message);
    return;
  }

  openOverworldMessage(state, interaction.label, [interaction.description]);
};

const moveOverworld = (state: GameState, direction: Direction) => {
  ensureOverworldPosition(state);
  const map = getCurrentOverworldMap(state);
  const current = getOverworldPosition(state);
  const delta = getDirectionalDelta(direction);
  const nextX = current.x + delta.x;
  const nextY = current.y + delta.y;

  state.overworld.positions[state.currentLocationId] = {
    ...current,
    facing: direction,
  };

  const tile = tileCharToType(getTileChar(map, nextX, nextY));
  if (!isTilePassable(tile) || isBlockedByInteraction(state, nextX, nextY)) {
    return;
  }

  const nextPosition = {
    x: nextX,
    y: nextY,
    facing: direction,
    steps: current.steps + 1,
  };

  state.overworld.positions[state.currentLocationId] = nextPosition;
  state.activeShopId = null;

  const steppedInteraction = getInteractionAt(state, nextX, nextY);
  if (steppedInteraction?.kind === "travel") {
    runOverworldInteraction(state, steppedInteraction);
    return;
  }

  if (tile === "wild") {
    const encounterId = pickWildEncounterId(state);
    const lastEncounterStep = state.overworld.lastEncounterStepByLocation[state.currentLocationId] ?? -99;
    if (encounterId && nextPosition.steps - lastEncounterStep >= 3 && Math.random() < 0.24) {
      state.overworld.lastEncounterStepByLocation[state.currentLocationId] = nextPosition.steps;
      applyEffects(state, [{ type: "startEncounter", encounterId }]);
      pushNotification(state, "A wild threat emerges from the brush.", "danger");
    }
  }
};

const interactOverworld = (state: GameState) => {
  ensureOverworldPosition(state);
  const current = getOverworldPosition(state);
  const front = getFrontPosition(current);
  const currentInteraction = getInteractionAt(state, current.x, current.y);
  if (currentInteraction && !currentInteraction.blocking) {
    runOverworldInteraction(state, currentInteraction);
    return;
  }

  const frontInteraction = getInteractionAt(state, front.x, front.y);
  runOverworldInteraction(state, frontInteraction);
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const next = structuredClone(state) as GameState;
  next.updatedAt = Date.now();

  switch (action.type) {
    case "NEW_GAME":
      return createDefaultState(action.playerName);
    case "LOAD_STATE":
      return structuredClone(action.state);
    case "RUN_LOCATION_ACTION":
      runLocationAction(next, action.actionId);
      return next;
    case "TRAVEL":
      if (contentRegistry.locationsById[action.locationId]) {
        applyEffects(next, [{ type: "travel", locationId: action.locationId }]);
      }
      return next;
    case "MOVE_OVERWORLD":
      if (next.status === "playing" && !next.combat && !next.activeSceneId) {
        moveOverworld(next, action.direction);
      }
      return next;
    case "INTERACT_OVERWORLD":
      if (next.status === "playing" && !next.combat && !next.activeSceneId) {
        interactOverworld(next);
      }
      return next;
    case "CLOSE_OVERWORLD_MESSAGE":
      next.overworld.message = null;
      return next;
    case "ADVANCE_SCENE": {
      if (!next.activeSceneId || !next.activeNodeId) {
        return next;
      }
      const scene = contentRegistry.scenesById[next.activeSceneId];
      const node = scene.nodes[next.activeNodeId];
      if (node.nextNodeId) {
        next.activeNodeId = node.nextNodeId;
      } else if (node.end || !node.choices?.length) {
        completeScene(next, scene.id);
      }
      return next;
    }
    case "CHOOSE_SCENE_OPTION": {
      if (!next.activeSceneId || !next.activeNodeId) {
        return next;
      }
      const scene = contentRegistry.scenesById[next.activeSceneId];
      const node = scene.nodes[next.activeNodeId];
      const choice = node.choices?.find((entry) => entry.id === action.choiceId);
      if (!choice || !areConditionsMet(next, choice.conditions)) {
        return next;
      }

      applyEffects(next, choice.effects);

      if (choice.nextNodeId) {
        next.activeNodeId = choice.nextNodeId;
      } else if (node.end || !node.nextNodeId) {
        completeScene(next, scene.id);
      }
      return next;
    }
    case "BATTLE_ACTION":
      runCombatRound(next, {
        type: action.action,
        skillId: action.skillId,
        itemId: action.itemId,
        targetId: action.targetId,
      });
      if (!next.combat && next.defeatedEncounterIds.length > state.defeatedEncounterIds.length) {
        const defeatedId = next.defeatedEncounterIds[next.defeatedEncounterIds.length - 1];
        const encounter = contentRegistry.encountersById[defeatedId];
        if (encounter) {
          applyEffects(next, encounter.onVictoryEffects);
        }
      }
      return next;
    case "USE_ITEM": {
      const item = contentRegistry.itemsById[action.itemId];
      if (!item?.consumeEffect || getEquipmentSlotForItem(item)) {
        return next;
      }
      if (!removeInventoryItem(next, item.id, 1)) {
        return next;
      }
      if (item.consumeEffect.type === "heal") {
        next.player.currentHp += item.consumeEffect.amount;
      }
      if (item.consumeEffect.type === "restoreMp") {
        next.player.currentMp += item.consumeEffect.amount;
      }
      clampPlayerVitals(next);
      pushNotification(next, `Used ${item.name}.`, "reward");
      return next;
    }
    case "EQUIP_ITEM": {
      const item = contentRegistry.itemsById[action.itemId];
      if (!item) {
        return next;
      }
      const slot = getEquipmentSlotForItem(item);
      if (!slot) {
        return next;
      }
      next.equipment[slot] = item.id;
      clampPlayerVitals(next);
      pushNotification(next, `Equipped ${item.name}.`, "reward");
      return next;
    }
    case "UNEQUIP_SLOT":
      next.equipment[action.slot] = undefined;
      clampPlayerVitals(next);
      return next;
    case "SET_ACTIVE_SHOP":
      next.activeShopId = action.shopId;
      return next;
    case "BUY_ITEM": {
      const location = contentRegistry.locationsById[next.currentLocationId];
      const listing = location.shopListings?.find((entry) => entry.itemId === action.itemId);
      if (!listing || next.player.silver < listing.price) {
        return next;
      }
      next.player.silver -= listing.price;
      addInventoryItem(next, action.itemId, 1);
      pushNotification(next, `Purchased ${contentRegistry.itemsById[action.itemId]?.name ?? action.itemId}.`, "reward");
      return next;
    }
    case "TURN_IN_QUEST": {
      const quest = contentRegistry.questsById[action.questId];
      const progress = next.quests[action.questId];
      if (!quest || !progress || progress.status !== "active") {
        return next;
      }
      const objective = quest.objectives[progress.currentObjectiveIndex];
      if (objective?.progressType === "manual") {
        advanceQuest(next, action.questId, objective.id);
      }
      return next;
    }
    case "RESPAWN":
      next.status = "playing";
      next.currentLocationId = next.checkpoint.locationId;
      next.chapterId = next.checkpoint.chapterId;
      next.activeSceneId = null;
      next.activeNodeId = null;
      next.combat = null;
       next.overworld.message = null;
      ensureOverworldPosition(next, next.currentLocationId);
      next.player.currentHp = Math.max(24, Math.floor(next.player.baseStats.maxHp * 0.7));
      next.player.currentMp = Math.max(10, Math.floor(next.player.baseStats.maxMp * 0.7));
      next.player.silver = Math.max(0, next.player.silver - 15);
      pushNotification(next, "You awaken at your last checkpoint, shaken but alive.", "danger");
      return next;
    case "SET_SETTINGS":
      next.settings = { ...next.settings, ...action.settings };
      return next;
    case "DISMISS_NOTIFICATION":
      next.notifications = next.notifications.filter((notification) => notification.id !== action.id);
      return next;
    case "TICK_PLAYTIME":
      next.totalPlaytimeSeconds += action.seconds;
      return next;
    default:
      return next;
  }
};
