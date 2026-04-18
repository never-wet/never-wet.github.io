import type { DifficultyProfile } from "./types";

export const aiIndex: Record<"easy" | "medium" | "hard", DifficultyProfile> = {
  easy: {
    label: "Easy",
    description: "Relaxed play with shorter search and more noise.",
    moveDelayMs: 320,
    randomness: 0.24,
    searchDepth: {
      chess: 1,
      connect4: 3,
      checkers: 3,
      tictactoe: 7,
      reversi: 2,
      gomoku: 1,
    },
  },
  medium: {
    label: "Medium",
    description: "Balanced search for most matches.",
    moveDelayMs: 420,
    randomness: 0.1,
    searchDepth: {
      chess: 2,
      connect4: 4,
      checkers: 5,
      tictactoe: 9,
      reversi: 3,
      gomoku: 2,
    },
  },
  hard: {
    label: "Hard",
    description: "Sharper tactical awareness and deeper reads.",
    moveDelayMs: 520,
    randomness: 0,
    searchDepth: {
      chess: 3,
      connect4: 5,
      checkers: 6,
      tictactoe: 10,
      reversi: 4,
      gomoku: 2,
    },
  },
};
