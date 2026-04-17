import { createContext, useEffect, useState } from "react";
import { escapeRooms } from "../data/escapeRooms";
import { LocalStorageManager } from "../lib/storage/localStorageManager";
import { calculateScore, getPuzzleAnswerPreview, validatePuzzleAnswer } from "../lib/game/puzzleHelpers";
import {
  finalizeState,
  getPuzzleById,
  getPuzzleStatus,
  getResumeRoute,
  getRoomById,
  getRoomProgress,
  getRoomStatus,
  hasAllItems,
  isTransitionAvailable,
  meetsUnlockCondition,
} from "../lib/game/progression";
import { createActivity } from "../memory/activitySchema";
import { defaultState, defaultSettings } from "../memory/defaultState";
import { allPuzzles } from "../memory/contentRegistry";
import type {
  EscapeRoomDefinition,
  EscapeRoomProgress,
  GameSettings,
  GameState,
  HotspotDefinition,
  PuzzleDefinition,
  ToastMessage,
} from "../memory/types";

type HotspotResult =
  | { status: "resolved"; message: string }
  | { status: "needs-puzzle"; message: string; puzzleId: string }
  | { status: "needs-items"; message: string }
  | { status: "already-complete"; message: string };

interface GameContextValue {
  state: GameState;
  puzzles: PuzzleDefinition[];
  rooms: EscapeRoomDefinition[];
  toasts: ToastMessage[];
  getPuzzleStatus: (puzzleId: string) => ReturnType<typeof getPuzzleStatus>;
  getRoomStatus: (roomId: string) => ReturnType<typeof getRoomStatus>;
  getRoomProgress: (roomId: string) => EscapeRoomProgress | undefined;
  getResumeRoute: () => string;
  startPuzzle: (puzzleId: string) => void;
  submitPuzzle: (puzzleId: string, answer: unknown, elapsedSeconds?: number) => boolean;
  savePuzzleSession: (puzzleId: string, sessionData: Record<string, unknown>) => void;
  useHint: (puzzleId: string, hintId: string) => void;
  revealAnswer: (puzzleId: string) => void;
  resetPuzzle: (puzzleId: string) => void;
  startRoom: (roomId: string) => void;
  moveToScene: (roomId: string, sceneId: string) => void;
  inspectHotspot: (roomId: string, sceneId: string, hotspotId: string) => HotspotResult;
  combineItems: (roomId: string, itemA: string, itemB: string) => boolean;
  completeRoom: (roomId: string) => boolean;
  updateSettings: (settings: Partial<GameSettings>) => void;
  clearProgress: () => void;
  dismissToast: (toastId: string) => void;
}

function createToast(title: string, body: string, tone: ToastMessage["tone"] = "neutral"): ToastMessage {
  return {
    id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
    title,
    body,
    tone,
  };
}

export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => finalizeState(LocalStorageManager.load()));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    LocalStorageManager.save(state);
  }, [state]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  function pushToast(title: string, body: string, tone: ToastMessage["tone"] = "neutral") {
    setToasts((current) => [...current, createToast(title, body, tone)]);
  }

  function commit(updater: (current: GameState) => GameState) {
    setState((current) => finalizeState(updater(current)));
  }

  function notifyUnlocks(before: GameState, after: GameState) {
    allPuzzles.forEach((puzzle) => {
      if (getPuzzleStatus(puzzle, before) === "locked" && getPuzzleStatus(puzzle, after) === "available") {
        pushToast("Puzzle Unlocked", puzzle.title, "success");
      }
    });

    escapeRooms.forEach((room) => {
      if (getRoomStatus(room, before) === "locked" && getRoomStatus(room, after) === "unlocked") {
        pushToast("Escape Room Unlocked", room.title, "success");
      }
    });
  }

  function withUnlockNotifications(updater: (current: GameState) => GameState) {
    setState((current) => {
      const before = finalizeState(current);
      const after = finalizeState(updater(before));
      notifyUnlocks(before, after);
      return after;
    });
  }

  const value: GameContextValue = {
    state,
    puzzles: allPuzzles,
    rooms: escapeRooms,
    toasts,
    getPuzzleStatus(puzzleId) {
      const puzzle = getPuzzleById(puzzleId);
      return puzzle ? getPuzzleStatus(puzzle, state) : "locked";
    },
    getRoomStatus(roomId) {
      const room = getRoomById(roomId);
      return room ? getRoomStatus(room, state) : "locked";
    },
    getRoomProgress(roomId) {
      return state.escapeProgress[roomId];
    },
    getResumeRoute() {
      return getResumeRoute(state);
    },
    startPuzzle(puzzleId) {
      const puzzle = getPuzzleById(puzzleId);
      if (!puzzle || getPuzzleStatus(puzzle, state) === "locked") {
        return;
      }

      withUnlockNotifications((current) => {
        const existing = current.puzzleProgress[puzzleId];
        const timestamp = new Date().toISOString();

        return {
          ...current,
          currentPuzzleId: puzzleId,
          puzzleProgress: {
            ...current.puzzleProgress,
            [puzzleId]: {
              puzzleId,
              status: existing?.status === "solved" ? "solved" : "started",
              startedAt: existing?.startedAt ?? timestamp,
              solvedAt: existing?.solvedAt,
              lastPlayedAt: timestamp,
              hintsUsed: existing?.hintsUsed ?? 0,
              score: existing?.score ?? 0,
              stars: existing?.stars ?? 0,
              attempts: existing?.attempts ?? 0,
              revealedAnswer: existing?.revealedAnswer ?? false,
              bestTimeSeconds: existing?.bestTimeSeconds,
              sessionData: existing?.sessionData ?? {},
            },
          },
          recentActivity: [
            createActivity("puzzle_started", `Started ${puzzle.title}`, puzzleId),
            ...current.recentActivity,
          ],
        };
      });
    },
    submitPuzzle(puzzleId, answer, elapsedSeconds) {
      const puzzle = getPuzzleById(puzzleId);
      if (!puzzle) {
        return false;
      }

      const progress = state.puzzleProgress[puzzleId];
      const solved = validatePuzzleAnswer(puzzle, answer, progress?.sessionData);
      if (!solved) {
        commit((current) => {
          const existing = current.puzzleProgress[puzzleId];
          const timestamp = new Date().toISOString();

          return {
            ...current,
            currentPuzzleId: puzzleId,
            puzzleProgress: {
              ...current.puzzleProgress,
              [puzzleId]: {
                puzzleId,
                status: existing?.status === "solved" ? "solved" : "started",
                startedAt: existing?.startedAt ?? timestamp,
                solvedAt: existing?.solvedAt,
                lastPlayedAt: timestamp,
                hintsUsed: existing?.hintsUsed ?? 0,
                score: existing?.score ?? 0,
                stars: existing?.stars ?? 0,
                attempts: (existing?.attempts ?? 0) + 1,
                revealedAnswer: existing?.revealedAnswer ?? false,
                bestTimeSeconds: existing?.bestTimeSeconds,
                sessionData: existing?.sessionData ?? {},
              },
            },
          };
        });
        pushToast("Not Quite", "That answer does not fit the clue pattern yet.", "warning");
        return false;
      }

      withUnlockNotifications((current) => {
        const existing = current.puzzleProgress[puzzleId];
        const timestamp = new Date().toISOString();
        const nextHints = existing?.hintsUsed ?? 0;
        const { score, stars } = calculateScore(puzzle, nextHints, elapsedSeconds);
        const nextProgress = {
          puzzleId,
          status: "solved" as const,
          startedAt: existing?.startedAt ?? timestamp,
          solvedAt: existing?.solvedAt ?? timestamp,
          lastPlayedAt: timestamp,
          hintsUsed: nextHints,
          score: Math.max(existing?.score ?? 0, score),
          stars: Math.max(existing?.stars ?? 0, stars),
          attempts: (existing?.attempts ?? 0) + 1,
          revealedAnswer: existing?.revealedAnswer ?? false,
          bestTimeSeconds:
            existing?.bestTimeSeconds && elapsedSeconds
              ? Math.min(existing.bestTimeSeconds, elapsedSeconds)
              : existing?.bestTimeSeconds ?? elapsedSeconds,
          sessionData: existing?.sessionData ?? {},
        };

        const nextEscapeProgress = { ...current.escapeProgress };
        escapeRooms.forEach((room) => {
          const roomProgress = getRoomProgress(room, current);
          const roomPuzzleIds = room.scenes.flatMap((sceneDef) =>
            sceneDef.hotspots
              .map((hotspot) => hotspot.linkedPuzzleId)
              .filter((linkedId): linkedId is string => Boolean(linkedId)),
          );
          if (roomPuzzleIds.includes(puzzleId)) {
            nextEscapeProgress[room.id] = {
              ...roomProgress,
              solvedPuzzleIds: Array.from(new Set([...roomProgress.solvedPuzzleIds, puzzleId])),
            };
          }
        });

        return {
          ...current,
          currentPuzzleId: puzzleId,
          puzzleProgress: {
            ...current.puzzleProgress,
            [puzzleId]: nextProgress,
          },
          escapeProgress: nextEscapeProgress,
          recentActivity: [
            createActivity("puzzle_solved", `Solved ${puzzle.title}`, puzzleId, `${score} points`),
            ...current.recentActivity,
          ],
        };
      });

      pushToast("Puzzle Solved", `${puzzle.title} is now complete.`, "success");
      return true;
    },
    savePuzzleSession(puzzleId, sessionData) {
      commit((current) => {
        const existing = current.puzzleProgress[puzzleId];
        if (!existing) {
          return current;
        }

        return {
          ...current,
          puzzleProgress: {
            ...current.puzzleProgress,
            [puzzleId]: {
              ...existing,
              sessionData: {
                ...existing.sessionData,
                ...sessionData,
              },
            },
          },
        };
      });
    },
    useHint(puzzleId, hintId) {
      const puzzle = getPuzzleById(puzzleId);
      if (!puzzle) {
        return;
      }

      commit((current) => {
        const existing = current.puzzleProgress[puzzleId];
        const timestamp = new Date().toISOString();
        return {
          ...current,
          currentPuzzleId: puzzleId,
          puzzleProgress: {
            ...current.puzzleProgress,
            [puzzleId]: {
              puzzleId,
              status: existing?.status === "solved" ? "solved" : "started",
              startedAt: existing?.startedAt ?? timestamp,
              solvedAt: existing?.solvedAt,
              lastPlayedAt: timestamp,
              hintsUsed: (existing?.hintsUsed ?? 0) + 1,
              score: existing?.score ?? 0,
              stars: existing?.stars ?? 0,
              attempts: existing?.attempts ?? 0,
              revealedAnswer: existing?.revealedAnswer ?? false,
              bestTimeSeconds: existing?.bestTimeSeconds,
              sessionData: existing?.sessionData ?? {},
            },
          },
          recentActivity: [
            createActivity("hint_used", `Used a hint in ${puzzle.title}`, hintId),
            ...current.recentActivity,
          ],
        };
      });

      pushToast("Hint Used", "A hint has been revealed and your score will be reduced.", "warning");
    },
    revealAnswer(puzzleId) {
      const puzzle = getPuzzleById(puzzleId);
      if (!puzzle) {
        return;
      }

      commit((current) => {
        const existing = current.puzzleProgress[puzzleId];
        const timestamp = new Date().toISOString();

        return {
          ...current,
          currentPuzzleId: puzzleId,
          puzzleProgress: {
            ...current.puzzleProgress,
            [puzzleId]: {
              puzzleId,
              status: existing?.status ?? "started",
              startedAt: existing?.startedAt ?? timestamp,
              solvedAt: existing?.solvedAt,
              lastPlayedAt: timestamp,
              hintsUsed: existing?.hintsUsed ?? 0,
              score: existing?.score ?? 0,
              stars: existing?.stars ?? 0,
              attempts: existing?.attempts ?? 0,
              revealedAnswer: true,
              bestTimeSeconds: existing?.bestTimeSeconds,
              sessionData: existing?.sessionData ?? {},
            },
          },
          recentActivity: [
            createActivity("answer_revealed", `Revealed answer for ${puzzle.title}`, puzzleId),
            ...current.recentActivity,
          ],
        };
      });

      pushToast("Answer Revealed", getPuzzleAnswerPreview(puzzle), "warning");
    },
    resetPuzzle(puzzleId) {
      const puzzle = getPuzzleById(puzzleId);
      if (!puzzle) {
        return;
      }

      commit((current) => {
        const nextProgress = { ...current.puzzleProgress };
        delete nextProgress[puzzleId];

        return {
          ...current,
          currentPuzzleId: current.currentPuzzleId === puzzleId ? undefined : current.currentPuzzleId,
          puzzleProgress: nextProgress,
        };
      });

      pushToast("Puzzle Reset", `${puzzle.title} has been reset.`, "neutral");
    },
    startRoom(roomId) {
      const room = getRoomById(roomId);
      if (!room || !meetsUnlockCondition(room.unlock, state)) {
        return;
      }

      withUnlockNotifications((current) => {
        const existing = getRoomProgress(room, current);
        const timestamp = new Date().toISOString();
        return {
          ...current,
          escapeProgress: {
            ...current.escapeProgress,
            [roomId]: {
              ...existing,
              status: existing.status === "escaped" ? "escaped" : "in_progress",
              startedAt: existing.startedAt ?? timestamp,
              currentSceneId: existing.currentSceneId || room.scenes[0].id,
              unlockedSceneIds:
                existing.unlockedSceneIds.length > 0 ? existing.unlockedSceneIds : [room.scenes[0].id],
              visitedSceneIds:
                existing.visitedSceneIds.length > 0 ? existing.visitedSceneIds : [room.scenes[0].id],
            },
          },
          recentActivity: [
            createActivity("room_started", `Entered ${room.title}`, roomId),
            ...current.recentActivity,
          ],
        };
      });
    },
    moveToScene(roomId, sceneId) {
      const room = getRoomById(roomId);
      if (!room) {
        return;
      }

      commit((current) => {
        const progress = getRoomProgress(room, current);
        return {
          ...current,
          escapeProgress: {
            ...current.escapeProgress,
            [roomId]: {
              ...progress,
              status: progress.status === "escaped" ? "escaped" : "in_progress",
              currentSceneId: sceneId,
              unlockedSceneIds: Array.from(new Set([...progress.unlockedSceneIds, sceneId])),
              visitedSceneIds: Array.from(new Set([...progress.visitedSceneIds, sceneId])),
            },
          },
        };
      });
    },
    inspectHotspot(roomId, sceneId, hotspotId) {
      const room = getRoomById(roomId);
      if (!room) {
        return { status: "already-complete", message: "Room not found." };
      }

      const scene = room.scenes.find((entry) => entry.id === sceneId);
      const hotspot = scene?.hotspots.find((entry) => entry.id === hotspotId);
      if (!scene || !hotspot) {
        return { status: "already-complete", message: "Hotspot not found." };
      }

      if (hotspot.requiresItemIds && !hasAllItems(state, hotspot.requiresItemIds)) {
        return { status: "needs-items", message: hotspot.result };
      }

      if (hotspot.linkedPuzzleId && state.puzzleProgress[hotspot.linkedPuzzleId]?.status !== "solved") {
        commit((current) => {
          const progress = getRoomProgress(room, current);
          return {
            ...current,
            escapeProgress: {
              ...current.escapeProgress,
              [roomId]: {
                ...progress,
                status: progress.status === "escaped" ? "escaped" : "in_progress",
                discoveredHotspotIds: Array.from(new Set([...progress.discoveredHotspotIds, hotspot.id])),
                currentSceneId: sceneId,
                visitedSceneIds: Array.from(new Set([...progress.visitedSceneIds, sceneId])),
              },
            },
          };
        });

        return {
          status: "needs-puzzle",
          message: hotspot.result,
          puzzleId: hotspot.linkedPuzzleId,
        };
      }

      commit((current) => {
        const progress = getRoomProgress(room, current);
        const nextCollected = [...progress.collectedItemIds];
        const nextInventory = { ...current.inventory };
        let nextRecent = current.recentActivity.slice();
        let detailMessage = hotspot.result;

        if (hotspot.itemId && !nextInventory[hotspot.itemId]) {
          nextCollected.push(hotspot.itemId);
          nextInventory[hotspot.itemId] = {
            itemId: hotspot.itemId,
            roomId,
            collectedAt: new Date().toISOString(),
          };
          nextRecent = [
            createActivity("item_collected", `Collected ${hotspot.itemId}`, hotspot.itemId, room.title),
            ...nextRecent,
          ];
          pushToast("Inventory Updated", hotspot.itemId.replace(/-/g, " "), "success");
        }

        const unlockedSceneIds = hotspot.unlocksSceneId
          ? Array.from(new Set([...progress.unlockedSceneIds, hotspot.unlocksSceneId]))
          : progress.unlockedSceneIds;

        if (hotspot.unlocksSceneId && !progress.unlockedSceneIds.includes(hotspot.unlocksSceneId)) {
          nextRecent = [
            createActivity("scene_unlocked", `Unlocked ${hotspot.unlocksSceneId}`, hotspot.unlocksSceneId, room.title),
            ...nextRecent,
          ];
          pushToast("Scene Unlocked", hotspot.unlocksSceneId.replace(/-/g, " "), "success");
        }

        return {
          ...current,
          inventory: nextInventory,
          escapeProgress: {
            ...current.escapeProgress,
            [roomId]: {
              ...progress,
              status: progress.status === "escaped" ? "escaped" : "in_progress",
              currentSceneId: sceneId,
              unlockedSceneIds,
              visitedSceneIds: Array.from(new Set([...progress.visitedSceneIds, sceneId])),
              discoveredHotspotIds: Array.from(new Set([...progress.discoveredHotspotIds, hotspot.id])),
              collectedItemIds: Array.from(new Set(nextCollected)),
              solvedPuzzleIds: hotspot.linkedPuzzleId
                ? Array.from(new Set([...progress.solvedPuzzleIds, hotspot.linkedPuzzleId]))
                : progress.solvedPuzzleIds,
            },
          },
          recentActivity: nextRecent,
        };
      });

      return { status: "resolved", message: hotspot.result };
    },
    combineItems(roomId, itemA, itemB) {
      const room = getRoomById(roomId);
      if (!room) {
        return false;
      }

      const first = room.inventory.find((item) => item.id === itemA);
      const second = room.inventory.find((item) => item.id === itemB);
      if (!first || !second || !state.inventory[itemA] || !state.inventory[itemB]) {
        return false;
      }

      const resultId =
        (first.combinableWith?.includes(itemB) && first.combinationResultId) ||
        (second.combinableWith?.includes(itemA) && second.combinationResultId);

      if (!resultId) {
        pushToast("Combination Failed", "Those items do not fit together.", "warning");
        return false;
      }

      commit((current) => {
        const progress = getRoomProgress(room, current);
        const nextInventory = { ...current.inventory };
        delete nextInventory[itemA];
        delete nextInventory[itemB];
        nextInventory[resultId] = {
          itemId: resultId,
          roomId,
          collectedAt: new Date().toISOString(),
        };

        return {
          ...current,
          inventory: nextInventory,
          escapeProgress: {
            ...current.escapeProgress,
            [roomId]: {
              ...progress,
              collectedItemIds: Array.from(
                new Set(
                  progress.collectedItemIds
                    .filter((itemId) => itemId !== itemA && itemId !== itemB)
                    .concat(resultId),
                ),
              ),
            },
          },
        };
      });

      pushToast("Items Combined", `${itemA.replace(/-/g, " ")} + ${itemB.replace(/-/g, " ")}`, "success");
      return true;
    },
    completeRoom(roomId) {
      const room = getRoomById(roomId);
      if (!room) {
        return false;
      }

      const finalScene = room.scenes[room.scenes.length - 1];
      const finalHotspot = finalScene.hotspots[0];
      if (!finalHotspot.requiresItemIds || !hasAllItems(state, finalHotspot.requiresItemIds)) {
        pushToast("Not Ready Yet", "The final exit still needs more items or clearance.", "warning");
        return false;
      }

      commit((current) => {
        const progress = getRoomProgress(room, current);
        const timestamp = new Date().toISOString();
        return {
          ...current,
          escapeProgress: {
            ...current.escapeProgress,
            [roomId]: {
              ...progress,
              status: "escaped",
              completedAt: timestamp,
              currentSceneId: finalScene.id,
            },
          },
          recentActivity: [
            createActivity("room_escaped", `Escaped ${room.title}`, roomId),
            ...current.recentActivity,
          ],
        };
      });

      pushToast("Room Escaped", `${room.title} is complete.`, "success");
      return true;
    },
    updateSettings(settings) {
      commit((current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...settings,
        },
        recentActivity: [
          createActivity("settings_updated", "Updated settings", "settings"),
          ...current.recentActivity,
        ],
      }));
    },
    clearProgress() {
      LocalStorageManager.reset();
      setState(finalizeState({ ...defaultState, settings: { ...defaultSettings } }));
      pushToast("Progress Cleared", "All local progress has been reset.", "warning");
    },
    dismissToast(toastId) {
      setToasts((current) => current.filter((toast) => toast.id !== toastId));
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
