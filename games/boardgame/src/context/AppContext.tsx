import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultState } from "../memory/defaultState";
import { createMatchRecord, applyMatchToStats } from "../memory/statsSchema";
import type { AppSettings, Difficulty, GameId, MatchResult, PersistedAppState, SaveSlot } from "../memory/types";
import { loadAppState, saveAppState } from "../state/storage";

interface AppContextValue {
  appState: PersistedAppState;
  updateSettings: (patch: Partial<AppSettings>) => void;
  saveGame: (slot: SaveSlot) => void;
  clearSave: (gameId: GameId) => void;
  markGameFinished: (
    gameId: GameId,
    difficulty: Difficulty,
    result: MatchResult,
    turnCount: number,
    summary: string,
    latestState: SaveSlot["state"],
  ) => void;
  resetAllStats: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appState, setAppState] = useState<PersistedAppState>(() => {
    if (typeof window === "undefined") {
      return defaultState;
    }

    return loadAppState();
  });

  useEffect(() => {
    saveAppState(appState);
    document.documentElement.dataset.theme = appState.settings.theme;
  }, [appState]);

  const value = useMemo<AppContextValue>(
    () => ({
      appState,
      updateSettings(patch) {
        setAppState((current) => ({
          ...current,
          settings: {
            ...current.settings,
            ...patch,
          },
        }));
      },
      saveGame(slot) {
        setAppState((current) => ({
          ...current,
          lastPlayedGameId: slot.gameId,
          saves: {
            ...current.saves,
            [slot.gameId]: slot,
          },
        }));
      },
      clearSave(gameId) {
        setAppState((current) => {
          const saves = { ...current.saves };
          delete saves[gameId];
          return {
            ...current,
            saves,
          };
        });
      },
      markGameFinished(gameId, difficulty, result, turnCount, summary, latestState) {
        const completedAt = new Date().toISOString();
        setAppState((current) => {
          const slot: SaveSlot = {
            gameId,
            difficulty,
            state: latestState,
            undoStack: current.saves[gameId]?.undoStack ?? [],
            updatedAt: completedAt,
            isComplete: true,
          };

          const recentMatch = createMatchRecord({
            gameId,
            result,
            difficulty,
            turnCount,
            summary,
            completedAt,
          });

          return {
            ...current,
            lastPlayedGameId: gameId,
            stats: applyMatchToStats(current.stats, gameId, result, difficulty, completedAt),
            saves: {
              ...current.saves,
              [gameId]: slot,
            },
            recentMatches: [recentMatch, ...current.recentMatches].slice(0, 18),
          };
        });
      },
      resetAllStats() {
        setAppState(defaultState);
      },
    }),
    [appState],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider.");
  }

  return context;
}
