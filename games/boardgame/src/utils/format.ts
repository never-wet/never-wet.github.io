import { gameIndex } from "../memory/gameIndex";
import type { GameId, MatchResult } from "../memory/types";

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function resultLabel(result: MatchResult): string {
  if (result === "win") {
    return "Win";
  }

  if (result === "loss") {
    return "Loss";
  }

  return "Draw";
}

export function gameTitle(gameId: GameId | null): string {
  if (!gameId) {
    return "No game";
  }

  return gameIndex[gameId].title;
}

export function pluralizeTurns(count: number): string {
  return `${count} turn${count === 1 ? "" : "s"}`;
}
