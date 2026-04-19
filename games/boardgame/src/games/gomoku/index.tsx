import { useMemo } from "react";
import { findBestMove } from "../../ai/search";
import { aiIndex } from "../../memory/aiIndex";
import type { GameBoardProps, GameModule } from "../../memory/types";
import { boardHasEmptyCells, cloneGrid, coordsToLabel, gridToKey, inBounds } from "../shared";

type Cell = "B" | "W" | null;

interface GomokuMove {
  row: number;
  col: number;
}

interface GomokuState {
  board: Cell[][];
  turn: "B" | "W";
  winner: "B" | "W" | "draw" | null;
  moveHistory: string[];
  lastMove: GomokuMove | null;
}

const SIZE = 15;
const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

function createInitialState(): GomokuState {
  return {
    board: Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null)),
    turn: "B",
    winner: null,
    moveHistory: [],
    lastMove: null,
  };
}

function parseState(value: unknown): GomokuState {
  if (!value || typeof value !== "object") {
    return createInitialState();
  }

  const candidate = value as Partial<GomokuState>;
  if (!Array.isArray(candidate.board) || candidate.board.length !== SIZE) {
    return createInitialState();
  }

  return {
    board: candidate.board.map((row) =>
      Array.isArray(row)
        ? Array.from({ length: SIZE }, (_, index) => {
            const cell = row[index];
            return cell === "B" || cell === "W" ? cell : null;
          })
        : Array<Cell>(SIZE).fill(null),
    ),
    turn: candidate.turn === "W" ? "W" : "B",
    winner:
      candidate.winner === "B" || candidate.winner === "W" || candidate.winner === "draw"
        ? candidate.winner
        : null,
    moveHistory: Array.isArray(candidate.moveHistory)
      ? candidate.moveHistory.filter((entry): entry is string => typeof entry === "string")
      : [],
    lastMove:
      candidate.lastMove &&
      typeof candidate.lastMove === "object" &&
      typeof candidate.lastMove.row === "number" &&
      typeof candidate.lastMove.col === "number"
        ? candidate.lastMove
        : null,
  };
}

function other(color: "B" | "W"): "B" | "W" {
  return color === "B" ? "W" : "B";
}

function boardEmpty(board: Cell[][]): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}

function countLine(board: Cell[][], row: number, col: number, dr: number, dc: number, color: "B" | "W"): number {
  let count = 0;
  let nextRow = row + dr;
  let nextCol = col + dc;

  while (inBounds(nextRow, nextCol, SIZE) && board[nextRow][nextCol] === color) {
    count += 1;
    nextRow += dr;
    nextCol += dc;
  }

  return count;
}

function hasFive(board: Cell[][], row: number, col: number, color: "B" | "W"): boolean {
  return directions.some(([dr, dc]) => {
    const total = 1 + countLine(board, row, col, dr, dc, color) + countLine(board, row, col, -dr, -dc, color);
    return total >= 5;
  });
}

function applyMove(state: GomokuState, move: GomokuMove): GomokuState {
  if (state.winner || state.board[move.row][move.col] !== null) {
    return state;
  }

  const board = cloneGrid(state.board);
  board[move.row][move.col] = state.turn;
  const winner = hasFive(board, move.row, move.col, state.turn) ? state.turn : null;
  const draw = !winner && !boardHasEmptyCells(board);

  return {
    board,
    turn: winner || draw ? state.turn : other(state.turn),
    winner: winner ?? (draw ? "draw" : null),
    moveHistory: [...state.moveHistory, `${state.turn} to ${coordsToLabel(move.row, move.col, SIZE)}`],
    lastMove: move,
  };
}

function patternScore(length: number, openEnds: number): number {
  if (length >= 5) {
    return 200000;
  }

  if (length === 4 && openEnds === 2) {
    return 30000;
  }

  if (length === 4 && openEnds === 1) {
    return 6000;
  }

  if (length === 3 && openEnds === 2) {
    return 1800;
  }

  if (length === 3 && openEnds === 1) {
    return 280;
  }

  if (length === 2 && openEnds === 2) {
    return 120;
  }

  if (length === 2 && openEnds === 1) {
    return 30;
  }

  if (length === 1 && openEnds === 2) {
    return 8;
  }

  return 0;
}

function evaluateLines(board: Cell[][], perspective: "B" | "W"): number {
  const opponent = other(perspective);
  let score = 0;

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = board[row][col];
      if (!cell) {
        continue;
      }

      for (const [dr, dc] of directions) {
        const prevRow = row - dr;
        const prevCol = col - dc;
        if (inBounds(prevRow, prevCol, SIZE) && board[prevRow][prevCol] === cell) {
          continue;
        }

        let length = 0;
        let nextRow = row;
        let nextCol = col;
        while (inBounds(nextRow, nextCol, SIZE) && board[nextRow][nextCol] === cell) {
          length += 1;
          nextRow += dr;
          nextCol += dc;
        }

        let openEnds = 0;
        if (inBounds(prevRow, prevCol, SIZE) && board[prevRow][prevCol] === null) {
          openEnds += 1;
        }

        if (inBounds(nextRow, nextCol, SIZE) && board[nextRow][nextCol] === null) {
          openEnds += 1;
        }

        const value = patternScore(length, openEnds);
        score += cell === perspective ? value : -value;
      }
    }
  }

  const center = Math.floor(SIZE / 2);
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = board[row][col];
      if (cell === null) {
        continue;
      }

      const proximity = 8 - (Math.abs(center - row) + Math.abs(center - col));
      score += cell === perspective ? proximity : -proximity;
    }
  }

  const ownCount = board.flat().filter((cell) => cell === perspective).length;
  const enemyCount = board.flat().filter((cell) => cell === opponent).length;
  return score + (ownCount - enemyCount) * 3;
}

function evaluateBoard(state: GomokuState, perspective: "B" | "W"): number {
  if (state.winner === perspective) {
    return 1000000;
  }

  if (state.winner && state.winner !== "draw") {
    return -1000000;
  }

  if (state.winner === "draw") {
    return 0;
  }

  return evaluateLines(state.board, perspective);
}

function getCandidateMoves(board: Cell[][]): GomokuMove[] {
  if (boardEmpty(board)) {
    const center = Math.floor(SIZE / 2);
    return [{ row: center, col: center }];
  }

  const seen = new Set<string>();
  const moves: GomokuMove[] = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === null) {
        continue;
      }

      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          const key = `${nextRow}-${nextCol}`;

          if (!inBounds(nextRow, nextCol, SIZE) || board[nextRow][nextCol] !== null || seen.has(key)) {
            continue;
          }

          seen.add(key);
          moves.push({ row: nextRow, col: nextCol });
        }
      }
    }
  }

  return moves;
}

function getAiMove(state: GomokuState, difficulty: "easy" | "medium" | "hard"): GomokuMove | null {
  const profile = aiIndex[difficulty];

  return findBestMove({
    adapter: {
      getCurrentPlayer(current) {
        return current.turn;
      },
      getMoves(current) {
        return getCandidateMoves(current.board)
          .sort((left, right) => {
            const nextLeft = applyMove(current, left);
            const nextRight = applyMove(current, right);
            return evaluateBoard(nextRight, current.turn) - evaluateBoard(nextLeft, current.turn);
          })
          .slice(0, difficulty === "hard" ? 14 : 10);
      },
      applyMove,
      evaluate: evaluateBoard,
      isTerminal(current) {
        return current.winner !== null;
      },
      keyOf(current) {
        return `${current.turn}|${current.winner ?? "-"}|${gridToKey(current.board)}`;
      },
      scoreMove(current, move) {
        return evaluateBoard(applyMove(current, move), current.turn);
      },
    },
    state,
    depth: profile.searchDepth.gomoku ?? 2,
    maxNodes: profile.nodeBudget.gomoku,
    perspective: "W",
    randomness: profile.randomness,
  });
}

function getStatus(state: GomokuState) {
  if (state.winner === "B") {
    return {
      phase: "win" as const,
      headline: "Five in a row.",
      detail: "You completed a decisive chain before the AI could block it.",
    };
  }

  if (state.winner === "W") {
    return {
      phase: "loss" as const,
      headline: "Computer completed the line.",
      detail: "White built a five-stone sequence.",
    };
  }

  if (state.winner === "draw") {
    return {
      phase: "draw" as const,
      headline: "Board filled to a draw.",
      detail: "Neither side reached five before the grid closed.",
    };
  }

  return {
    phase: "playing" as const,
    headline: state.turn === "B" ? "Your placement" : "Computer thinking",
    detail: state.turn === "B" ? "Build an open line or cut off an urgent threat." : "White is scanning live threats.",
  };
}

function GomokuBoard({
  state,
  disabled,
  coordinateLabels,
  onMove,
}: GameBoardProps<GomokuState, GomokuMove>) {
  const playable = useMemo(() => !disabled && !state.winner, [disabled, state.winner]);

  return (
    <div className="board-shell">
      <div className="grid-board gomoku-board">
        {state.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isLast =
              state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex;
            return (
              <button
                className={`grid-cell gomoku-cell${isLast ? " is-last" : ""}`}
                disabled={disabled || cell !== null || !playable}
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onMove({ row: rowIndex, col: colIndex })}
                type="button"
              >
                {coordinateLabels && (
                  <span className="cell-corner">{coordsToLabel(rowIndex, colIndex, SIZE)}</span>
                )}
                {cell ? (
                  <span
                    className={`stone is-${cell === "B" ? "black" : "white"}${isLast ? " piece-motion is-pop" : ""}`}
                  />
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export const gomokuModule: GameModule<GomokuState, GomokuMove> = {
  id: "gomoku",
  name: "Gomoku",
  createInitialState,
  parseState,
  serializeState: (state) => state,
  getStatus,
  getMoveHistory: (state) => state.moveHistory,
  getSidebarStats(state) {
    const black = state.board.flat().filter((cell) => cell === "B").length;
    const white = state.board.flat().filter((cell) => cell === "W").length;

    return [
      { label: "Turn", value: state.turn === "B" ? "Black" : "White" },
      { label: "Black stones", value: String(black) },
      { label: "White stones", value: String(white) },
    ];
  },
  getTurnCount: (state) => state.moveHistory.length,
  isAiTurn: (state) => state.turn === "W" && !state.winner,
  applyMove,
  getAiMove,
  Board: GomokuBoard,
  rules: [
    {
      title: "Goal",
      body: "Place five stones in a continuous row horizontally, vertically, or diagonally.",
    },
    {
      title: "Open threats",
      body: "Open-ended threes and fours are dangerous because they create multiple winning continuations.",
    },
    {
      title: "Difficulty",
      body: "Hard evaluates nearby threats more deeply and prunes candidate moves more carefully.",
    },
  ],
};
