import { contentRegistry } from "../../memory/contentRegistry";
import type {
  Direction,
  GameState,
  OverworldInteraction,
  OverworldMapDefinition,
  OverworldPosition,
  OverworldTileType,
} from "../../memory/types";
import { areConditionsMet } from "./helpers";

export const tileCharToType = (char: string): OverworldTileType => {
  switch (char) {
    case "#":
      return "wall";
    case "\"":
      return "wild";
    case "~":
      return "water";
    case "=":
      return "road";
    case "+":
      return "bridge";
    case ":":
      return "ruin";
    default:
      return "floor";
  }
};

export const getCurrentOverworldMap = (state: GameState): OverworldMapDefinition =>
  contentRegistry.overworldMapsById[state.currentLocationId];

export const getOverworldPosition = (state: GameState, locationId = state.currentLocationId): OverworldPosition => {
  const map = contentRegistry.overworldMapsById[locationId];
  return (
    state.overworld.positions[locationId] ?? {
      x: map.spawn.x,
      y: map.spawn.y,
      facing: "right",
      steps: 0,
    }
  );
};

export const getDirectionalDelta = (direction: Direction) => {
  switch (direction) {
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
  }
};

export const getFrontPosition = (position: OverworldPosition) => {
  const delta = getDirectionalDelta(position.facing);
  return { x: position.x + delta.x, y: position.y + delta.y };
};

export const getTileChar = (map: OverworldMapDefinition, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return "#";
  }
  return map.tiles[y]?.[x] ?? "#";
};

export const isTilePassable = (tile: OverworldTileType) => tile !== "wall" && tile !== "water";

export const getAvailableInteractions = (state: GameState, locationId = state.currentLocationId): OverworldInteraction[] => {
  const map = contentRegistry.overworldMapsById[locationId];
  return map.interactions.filter((interaction) => {
    if (!areConditionsMet(state, interaction.conditions)) {
      return false;
    }

    if (!interaction.actionId) {
      return true;
    }

    const action = contentRegistry.locationActionsById[interaction.actionId];
    if (!action) {
      return true;
    }
    if (!areConditionsMet(state, action.conditions)) {
      return false;
    }
    if (!action.once) {
      return true;
    }
    if (action.sceneId && state.completedSceneIds.includes(action.sceneId)) {
      return false;
    }
    if (action.encounterId && state.defeatedEncounterIds.includes(action.encounterId)) {
      return false;
    }
    return true;
  });
};

export const getInteractionAt = (
  state: GameState,
  x: number,
  y: number,
  locationId = state.currentLocationId,
): OverworldInteraction | undefined =>
  getAvailableInteractions(state, locationId).find((interaction) => interaction.x === x && interaction.y === y);

export const isBlockedByInteraction = (state: GameState, x: number, y: number, locationId = state.currentLocationId) =>
  Boolean(getInteractionAt(state, x, y, locationId)?.blocking);

export const pickWildEncounterId = (state: GameState, locationId = state.currentLocationId) => {
  const map = contentRegistry.overworldMapsById[locationId];
  const pool = map.wildEncounterIds ?? [];
  if (!pool.length) {
    return null;
  }
  const available = pool.filter((encounterId) => {
    const encounter = contentRegistry.encountersById[encounterId];
    if (!encounter) {
      return false;
    }
    return !encounter.once || !state.defeatedEncounterIds.includes(encounterId);
  });
  if (!available.length) {
    return null;
  }
  return available[Math.floor(Math.random() * available.length)];
};
