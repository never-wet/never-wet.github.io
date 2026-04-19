import { useMemo } from "react";
import { findBestMove } from "../../ai/search";
import { aiIndex } from "../../memory/aiIndex";
import type { GameBoardProps, GameModule } from "../../memory/types";
import { coordsToLabel, gridToKey } from "../shared";

type Cell = "R" | "Y" | null;

interface Connect4State {
  board: Cell[][];
  turn: "R" | "Y";
  winner: "R" | "Y" | "draw" | null;
  moveHistory: string[];
  lastMove: { row: number; col: number } | null;
}

const ROWS = 6;
const COLS = 7;
const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

function createBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

function createInitialState(): Connect4State {
  return {
    board: createBoard(),
    turn: "R",
    winner: null,
    moveHistory: [],
    lastMove: null,
  };
}

function parseState(value: unknown): Connect4State {
  if (!value || typeof value !== "object") {
    return createInitialState();
  }

  const candidate = value as Partial<Connect4State>;
  if (!Array.isArray(candidate.board) || candidate.board.length !== ROWS) {
    return createInitialState();
  }

  return {
    board: candidate.board.map((row) =>
      Array.isArray(row)
        ? row.map((cell) => (cell === "R" || cell === "Y" ? cell : null)).slice(0, COLS)
        : Array<Cell>(COLS).fill(null),
    ),
    turn: candidate.turn === "Y" ? "Y" : "R",
    winner:
      candidate.winner === "R" || candidate.winner === "Y" || candidate.winner === "draw"
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

function getLegalMoves(state: Connect4State): number[] {
  if (state.winner) {
    return [];
  }

  const moves: number[] = [];
  for (let col = 0; col < COLS; col += 1) {
    if (state.board[0][col] === null) {
      moves.push(col);
    }
  }
  return moves;
}

function getDropRow(board: Cell[][], col: number): number {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row][col] === null) {
      return row;
    }
  }

  return -1;
}

function countDirection(board: Cell[][], row: number, col: number, dr: number, dc: number, cell: Cell): number {
  let count = 0;
  let currentRow = row + dr;
  let currentCol = col + dc;

  while (
    currentRow >= 0 &&
    currentRow < ROWS &&
    currentCol >= 0 &&
    currentCol < COLS &&
    board[currentRow][currentCol] === cell
  ) {
    count += 1;
    currentRow += dr;
    currentCol += dc;
  }

  return count;
}

function getWinner(board: Cell[][], row: number, col: number): "R" | "Y" | null {
  const token = board[row][col];
  if (!token) {
    return null;
  }

  for (const [dr, dc] of directions) {
    const count =
      1 +
      countDirection(board, row, col, dr, dc, token) +
      countDirection(board, row, col, -dr, -dc, token);
    if (count >= 4) {
      return token;
    }
  }

  return null;
}

function boardFull(board: Cell[][]): boolean {
  return board[0].every(Boolean);
}

function applyMove(state: Connect4State, col: number): Connect4State {
  if (state.winner) {
    return state;
  }

  const row = getDropRow(state.board, col);
  if (row === -1) {
    return state;
  }

  const board = state.board.map((currentRow) => [...currentRow]);
  board[row][col] = state.turn;
  const winner = getWinner(board, row, col);

  return {
    board,
    turn: winner || boardFull(board) ? state.turn : state.turn === "R" ? "Y" : "R",
    winner: winner ?? (boardFull(board) ? "draw" : null),
    moveHistory: [...state.moveHistory, `${state.turn} to ${coordsToLabel(row, col, ROWS)}`],
    lastMove: { row, col },
  };
}

function evaluateWindow(window: Cell[], perspective: "R" | "Y"): number {
  const opponent = perspective === "R" ? "Y" : "R";
  const own = window.filter((cell) => cell === perspective).length;
  const enemy = window.filter((cell) => cell === opponent).length;
  const empty = window.filter((cell) => cell === null).length;

  if (own === 4) {
    return 100000;
  }

  if (enemy === 4) {
    return -100000;
  }

  if (own === 3 && empty === 1) {
    return 240;
  }

  if (own === 2 && empty === 2) {
    return 32;
  }

  if (enemy === 3 && empty === 1) {
    return -220;
  }

  if (enemy === 2 && empty === 2) {
    return -28;
  }

  return 0;
}

function evaluateBoard(state: Connect4State, perspective: "R" | "Y"): number {
  if (state.winner === perspective) {
    return 1000000;
  }

  if (state.winner && state.winner !== "draw") {
    return -1000000;
  }

  if (state.winner === "draw") {
    return 0;
  }

  let score = 0;
  const centerColumn = Math.floor(COLS / 2);

  for (let row = 0; row < ROWS; row += 1) {
    if (state.board[row][centerColumn] === perspective) {
      score += 12;
    }
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      score += evaluateWindow(
        [state.board[row][col], state.board[row][col + 1], state.board[row][col + 2], state.board[row][col + 3]],
        perspective,
      );
    }
  }

  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      score += evaluateWindow(
        [state.board[row][col], state.board[row + 1][col], state.board[row + 2][col], state.board[row + 3][col]],
        perspective,
      );
    }
  }

  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      score += evaluateWindow(
        [
          state.board[row][col],
          state.board[row + 1][col + 1],
          state.board[row + 2][col + 2],
          state.board[row + 3][col + 3],
        ],
        perspective,
      );
    }
  }

  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 3; col < COLS; col += 1) {
      score += evaluateWindow(
        [
          state.board[row][col],
          state.board[row + 1][col - 1],
          state.board[row + 2][col - 2],
          state.board[row + 3][col - 3],
        ],
        perspective,
      );
    }
  }

  return score;
}

function getStatus(state: Connect4State) {
  if (state.winner === "R") {
    return {
      phase: "win" as const,
      headline: "You connected four.",
      detail: "Red completed a line and closed out the board.",
    };
  }

  if (state.winner === "Y") {
    return {
      phase: "loss" as const,
      headline: "Computer connected four.",
      detail: "Yellow completed a winning line first.",
    };
  }

  if (state.winner === "draw") {
    return {
      phase: "draw" as const,
      headline: "Column grid locked up.",
      detail: "The board filled with no four-in-a-row.",
    };
  }

  return {
    phase: "playing" as const,
    headline: state.turn === "R" ? "Your drop" : "Computer thinking",
    detail: state.turn === "R" ? "Choose a column and let gravity do the rest." : "Yellow is evaluating the stack.",
  };
}

function getAiMove(state: Connect4State, difficulty: "easy" | "medium" | "hard"): number | null {
  const profile = aiIndex[difficulty];
  return findBestMove({
    adapter: {
      getCurrentPlayer(current) {
        return current.turn;
      },
      getMoves: getLegalMoves,
      applyMove,
      evaluate: evaluateBoard,
      isTerminal(current) {
        return current.winner !== null;
      },
      keyOf(current) {
        return `${current.turn}|${current.winner ?? "-"}|${gridToKey(current.board)}`;
      },
      scoreMove(current, move) {
        const next = applyMove(current, move);
        return evaluateBoard(next, "Y");
      },
    },
    state,
    depth: profile.searchDepth.connect4 ?? 4,
    maxNodes: profile.nodeBudget.connect4,
    perspective: "Y",
    randomness: profile.randomness,
  });
}

function Connect4Board({
  state,
  disabled,
  coordinateLabels,
  onMove,
}: GameBoardProps<Connect4State, number>) {
  const legalMoves = useMemo(() => new Set(getLegalMoves(state)), [state]);

  return (
    <div className="board-shell">
      <div className="connect4-controls">
        {Array.from({ length: COLS }, (_, col) => (
          <button
            className={`connect4-drop${legalMoves.has(col) && !disabled ? " is-ready" : ""}`}
            disabled={disabled || !legalMoves.has(col)}
            key={col}
            onClick={() => onMove(col)}
            type="button"
          >
            {String.fromCharCode(65 + col)}
          </button>
        ))}
      </div>
      <div className="connect4-board">
        {state.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isLast =
              state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex;

            return (
              <button
                className={`connect4-cell${isLast ? " is-last" : ""}`}
                disabled={disabled || !legalMoves.has(colIndex)}
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onMove(colIndex)}
                type="button"
              >
                {coordinateLabels && (
                  <span className="cell-corner">{coordsToLabel(rowIndex, colIndex, ROWS)}</span>
                )}
                <span className={`connect4-disc ${cell === "R" ? "is-red" : cell === "Y" ? "is-yellow" : ""}`} />
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export const connect4Module: GameModule<Connect4State, number> = {
  id: "connect4",
  name: "Connect 4",
  createInitialState,
  parseState,
  serializeState: (state) => state,
  getStatus,
  getMoveHistory: (state) => state.moveHistory,
  getSidebarStats(state) {
    const redCount = state.board.flat().filter((cell) => cell === "R").length;
    const yellowCount = state.board.flat().filter((cell) => cell === "Y").length;

    return [
      { label: "Turn", value: state.turn === "R" ? "Red" : "Yellow" },
      { label: "Red discs", value: String(redCount) },
      { label: "Yellow discs", value: String(yellowCount) },
    ];
  },
  getTurnCount: (state) => state.moveHistory.length,
  isAiTurn: (state) => state.turn === "Y" && !state.winner,
  applyMove,
  getAiMove,
  Board: Connect4Board,
  rules: [
    {
      title: "Goal",
      body: "Drop discs into the grid and connect four in a row horizontally, vertically, or diagonally.",
    },
    {
      title: "Gravity",
      body: "A disc always falls to the lowest open space in the chosen column.",
    },
    {
      title: "Difficulty",
      body: "Hard searches deeper for traps, center control, and double-threat setups.",
    },
  ],
};
