import { escapeRooms } from "../../data/escapeRooms";
import { allPuzzles } from "../../memory/contentRegistry";
import { gameManifest } from "../../memory/gameManifest";
import type {
  EscapeRoomDefinition,
  EscapeRoomProgress,
  EscapeRoomTransition,
  GameState,
  PuzzleDefinition,
  PuzzleProgress,
  PuzzleStatus,
  RoomStatus,
  UnlockCondition,
} from "../../memory/types";

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function differenceInCalendarDays(later: Date, earlier: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate()).getTime();
  const end = new Date(later.getFullYear(), later.getMonth(), later.getDate()).getTime();
  return Math.round((end - start) / oneDay);
}

export function getSolvedPuzzleIds(state: GameState) {
  return Object.values(state.puzzleProgress)
    .filter((progress) => progress.status === "solved")
    .map((progress) => progress.puzzleId);
}

export function countSolvedByCategory(state: GameState, categoryId: PuzzleDefinition["category"]) {
  return allPuzzles.filter((puzzle) => puzzle.category === categoryId && state.puzzleProgress[puzzle.id]?.status === "solved").length;
}

export function meetsUnlockCondition(condition: UnlockCondition | undefined, state: GameState) {
  if (!condition) {
    return true;
  }

  if (condition.requiredTotalSolved && getSolvedPuzzleIds(state).length < condition.requiredTotalSolved) {
    return false;
  }

  if (condition.requiredPuzzleIds?.some((id) => state.puzzleProgress[id]?.status !== "solved")) {
    return false;
  }

  if (condition.requiredRoomIds?.some((id) => state.escapeProgress[id]?.status !== "escaped")) {
    return false;
  }

  if (
    condition.requiredCategoryCounts &&
    Object.entries(condition.requiredCategoryCounts).some(([categoryId, count]) => {
      if (typeof count !== "number") {
        return false;
      }

      return countSolvedByCategory(state, categoryId as PuzzleDefinition["category"]) < count;
    })
  ) {
    return false;
  }

  return true;
}

export function getPuzzleById(puzzleId: string) {
  return allPuzzles.find((puzzle) => puzzle.id === puzzleId);
}

export function getRoomById(roomId: string) {
  return escapeRooms.find((room) => room.id === roomId);
}

export function getPuzzleStatus(puzzle: PuzzleDefinition, state: GameState): PuzzleStatus {
  const progress = state.puzzleProgress[puzzle.id];

  if (progress?.status === "solved") {
    return "solved";
  }

  if (progress?.status === "started") {
    return "started";
  }

  return meetsUnlockCondition(puzzle.unlock, state) ? "available" : "locked";
}

export function createEmptyRoomProgress(room: EscapeRoomDefinition): EscapeRoomProgress {
  return {
    roomId: room.id,
    status: meetsUnlockCondition(room.unlock, {
      version: 0,
      puzzleProgress: {},
      escapeProgress: {},
      inventory: {},
      settings: {
        timerEnabled: true,
        soundEnabled: false,
        reducedMotion: false,
        highContrast: false,
        hintsEnabled: true,
        defaultViewMode: "immersive",
      },
      currentPuzzleId: undefined,
      recentActivity: [],
      stats: {
        totalSolved: 0,
        totalStarted: 0,
        totalHintsUsed: 0,
        streakDays: 0,
        lastPlayedAt: undefined,
        categoryCompletion: {},
      },
    })
      ? "unlocked"
      : "locked",
    startedAt: undefined,
    completedAt: undefined,
    currentSceneId: room.scenes[0]?.id ?? "",
    unlockedSceneIds: room.scenes[0] ? [room.scenes[0].id] : [],
    visitedSceneIds: room.scenes[0] ? [room.scenes[0].id] : [],
    discoveredHotspotIds: [],
    solvedPuzzleIds: [],
    collectedItemIds: [],
  };
}

export function getRoomProgress(room: EscapeRoomDefinition, state: GameState): EscapeRoomProgress {
  return state.escapeProgress[room.id] ?? createEmptyRoomProgress(room);
}

export function getRoomStatus(room: EscapeRoomDefinition, state: GameState): RoomStatus {
  const progress = getRoomProgress(room, state);

  if (progress.status === "escaped") {
    return "escaped";
  }

  if (progress.status === "in_progress") {
    return "in_progress";
  }

  return meetsUnlockCondition(room.unlock, state) ? "unlocked" : "locked";
}

export function getCategoryCompletion(state: GameState) {
  const result = gameManifest.categories.reduce<Record<string, number>>((accumulator, category) => {
    const inCategory = allPuzzles.filter((puzzle) => puzzle.category === category.id);
    const solved = inCategory.filter((puzzle) => state.puzzleProgress[puzzle.id]?.status === "solved").length;
    accumulator[category.id] = inCategory.length === 0 ? 0 : Math.round((solved / inCategory.length) * 100);
    return accumulator;
  }, {});

  return result;
}

export function calculateStreak(state: GameState) {
  const days = Array.from(
    new Set(
      state.recentActivity
        .map((activity) => activity.timestamp)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map((timestamp) => new Date(timestamp).toDateString()),
    ),
  ).map((entry) => new Date(entry));

  if (days.length === 0) {
    return 0;
  }

  const today = new Date();
  const firstGap = differenceInCalendarDays(today, days[0]);

  if (firstGap > 1) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < days.length; index += 1) {
    if (differenceInCalendarDays(days[index - 1], days[index]) === 1) {
      streak += 1;
    } else if (!isSameDay(days[index - 1], days[index])) {
      break;
    }
  }

  return streak;
}

export function finalizeState(state: GameState): GameState {
  const recentActivity = state.recentActivity
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 120);
  const totalSolved = Object.values(state.puzzleProgress).filter((progress) => progress.status === "solved").length;
  const totalStarted = Object.values(state.puzzleProgress).filter((progress) => progress.status === "started" || progress.status === "solved").length;
  const totalHintsUsed = Object.values(state.puzzleProgress).reduce((total, progress) => total + progress.hintsUsed, 0);
  const lastPlayedAt = recentActivity[0]?.timestamp;

  return {
    ...state,
    recentActivity,
    stats: {
      totalSolved,
      totalStarted,
      totalHintsUsed,
      lastPlayedAt,
      streakDays: calculateStreak({ ...state, recentActivity }),
      categoryCompletion: getCategoryCompletion(state),
    },
  };
}

export function getResumeRoute(state: GameState) {
  if (state.currentPuzzleId) {
    return `/puzzle/${state.currentPuzzleId}`;
  }

  const activeRoom = Object.values(state.escapeProgress).find((progress) => progress.status === "in_progress");
  if (activeRoom) {
    return `/escape/${activeRoom.roomId}`;
  }

  const startedPuzzle = Object.values(state.puzzleProgress).find((progress) => progress.status === "started");
  if (startedPuzzle) {
    return `/puzzle/${startedPuzzle.puzzleId}`;
  }

  return "/puzzles";
}

export function hasAllItems(state: GameState, itemIds: string[]) {
  return itemIds.every((itemId) => state.inventory[itemId]);
}

export function isTransitionAvailable(
  transition: EscapeRoomTransition,
  roomProgress: EscapeRoomProgress,
  state: GameState,
) {
  const hotspotsReady = transition.requiredHotspotIds?.every((id) => roomProgress.discoveredHotspotIds.includes(id)) ?? true;
  const itemsReady = transition.requiredItemIds?.every((itemId) => state.inventory[itemId]) ?? true;
  return hotspotsReady && itemsReady;
}

export function puzzleProgressSnapshot(progress?: PuzzleProgress) {
  return {
    startedAt: progress?.startedAt,
    solvedAt: progress?.solvedAt,
    lastPlayedAt: progress?.lastPlayedAt,
    hintsUsed: progress?.hintsUsed ?? 0,
    completionPercent: progress?.status === "solved" ? 100 : progress?.status === "started" ? 50 : 0,
  };
}
