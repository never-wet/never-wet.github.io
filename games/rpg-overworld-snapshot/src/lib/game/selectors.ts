import { contentRegistry } from "../../memory/contentRegistry";
import type { GameState, LocationAction, QuestDefinition } from "../../memory/types";
import { areConditionsMet, getItemQuantity, getMainProgressPercent, isLocationUnlocked } from "./helpers";
import { getAvailableInteractions, getCurrentOverworldMap, getFrontPosition, getInteractionAt, getOverworldPosition, getTileChar, tileCharToType } from "./overworld";

export const getCurrentLocation = (state: GameState) => contentRegistry.locationsById[state.currentLocationId];

export const getCurrentScene = (state: GameState) =>
  state.activeSceneId ? contentRegistry.scenesById[state.activeSceneId] : undefined;

export const getCurrentNode = (state: GameState) => {
  const scene = getCurrentScene(state);
  if (!scene || !state.activeNodeId) {
    return undefined;
  }
  return scene.nodes[state.activeNodeId];
};

export const getAvailableLocationActions = (state: GameState, locationId = state.currentLocationId): LocationAction[] => {
  const location = contentRegistry.locationsById[locationId];
  return location.actionIds
    .map((actionId) => contentRegistry.locationActionsById[actionId])
    .filter(Boolean)
    .filter((action) => areConditionsMet(state, action.conditions))
    .filter((action) => {
      if (!action.once) {
        return true;
      }
      if (action.sceneId) {
        return !state.completedSceneIds.includes(action.sceneId);
      }
      if (action.encounterId) {
        return !state.defeatedEncounterIds.includes(action.encounterId);
      }
      return true;
    });
};

export const getUnlockedLocations = (state: GameState) =>
  contentRegistry.locations.filter((location) => isLocationUnlocked(state, location.id));

export const getTravelOptions = (state: GameState) => {
  const current = getCurrentLocation(state);
  return current.neighbors
    .map((neighborId) => contentRegistry.locationsById[neighborId])
    .filter((location) => isLocationUnlocked(state, location.id));
};

export const getActiveQuests = (state: GameState) =>
  contentRegistry.quests.filter((quest) => state.quests[quest.id]?.status === "active");

export const getCompletedQuests = (state: GameState) =>
  contentRegistry.quests.filter((quest) => state.quests[quest.id]?.status === "completed");

export const getQuestObjective = (state: GameState, quest: QuestDefinition) => {
  const progress = state.quests[quest.id];
  if (!progress) {
    return undefined;
  }
  return quest.objectives[progress.currentObjectiveIndex];
};

export const isManualTurnInReady = (state: GameState, questId: string) => {
  const quest = contentRegistry.questsById[questId];
  const progress = state.quests[questId];
  if (!quest || !progress || progress.status !== "active") {
    return false;
  }
  const objective = quest.objectives[progress.currentObjectiveIndex];
  return objective?.progressType === "manual";
};

export const getQuestCompletionPercent = (state: GameState, questId: string) => {
  const quest = contentRegistry.questsById[questId];
  const progress = state.quests[questId];
  if (!quest || !progress) {
    return 0;
  }
  return Math.round((progress.completedObjectiveIds.length / quest.objectives.length) * 100);
};

export const getJournalEntries = (state: GameState) =>
  state.journalEntryIds.map((entryId) => contentRegistry.journalEntriesById[entryId]).filter(Boolean);

export const getInventoryEntries = (state: GameState) =>
  state.inventory
    .map((entry) => ({
      ...entry,
      item: contentRegistry.itemsById[entry.itemId],
    }))
    .sort((a, b) => a.item.name.localeCompare(b.item.name));

export const getPlayerSummary = (state: GameState) => ({
  level: state.player.level,
  hp: state.player.currentHp,
  mp: state.player.currentMp,
  silver: state.player.silver,
  progress: getMainProgressPercent(state),
});

export const canContinueGame = (state?: GameState | null) => Boolean(state);

export const getMapNodeState = (state: GameState, locationId: string) => ({
  unlocked: isLocationUnlocked(state, locationId),
  discovered: state.discoveredLocationIds.includes(locationId),
  current: state.currentLocationId === locationId,
});

export const getItemCount = (state: GameState, itemId: string) => getItemQuantity(state, itemId);

export const getOverworldViewModel = (state: GameState) => {
  const map = getCurrentOverworldMap(state);
  const position = getOverworldPosition(state);
  const front = getFrontPosition(position);
  const currentInteraction = getInteractionAt(state, position.x, position.y);
  const frontInteraction = getInteractionAt(state, front.x, front.y);

  return {
    map,
    position,
    front,
    currentInteraction,
    frontInteraction,
    interactions: getAvailableInteractions(state),
    tileAtPlayer: tileCharToType(getTileChar(map, position.x, position.y)),
  };
};
