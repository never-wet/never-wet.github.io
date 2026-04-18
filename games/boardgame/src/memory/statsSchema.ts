import { gameIds } from "./types";
import type { Difficulty, GameId, GameStats, MatchRecord, MatchResult } from "./types";

export function createEmptyGameStats(): GameStats {
  return {
    wins: 0,
    losses: 0,
    draws: 0,
    played: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: null,
    lastDifficulty: null,
  };
}

export function createEmptyStatsRecord(): Record<GameId, GameStats> {
  return gameIds.reduce((record, gameId) => {
    record[gameId] = createEmptyGameStats();
    return record;
  }, {} as Record<GameId, GameStats>);
}

export function applyMatchToStats(
  current: Record<GameId, GameStats>,
  gameId: GameId,
  result: MatchResult,
  difficulty: Difficulty,
  completedAt: string,
): Record<GameId, GameStats> {
  const next = { ...current, [gameId]: { ...current[gameId] } };
  const stats = next[gameId];
  stats.played += 1;
  stats.lastPlayedAt = completedAt;
  stats.lastDifficulty = difficulty;

  if (result === "win") {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else if (result === "loss") {
    stats.losses += 1;
    stats.currentStreak = 0;
  } else {
    stats.draws += 1;
    stats.currentStreak = 0;
  }

  return next;
}

export function createMatchRecord(input: Omit<MatchRecord, "id">): MatchRecord {
  return {
    ...input,
    id: `${input.gameId}-${input.completedAt}-${Math.random().toString(36).slice(2, 8)}`,
  };
}
