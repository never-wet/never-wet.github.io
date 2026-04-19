import { useEffect, useMemo, useRef } from "react";
import { findBestMove } from "../../ai/search";
import { aiIndex } from "../../memory/aiIndex";
import type { GameBoardProps, GameModule } from "../../memory/types";
import { allDirections, cloneGrid, coordsToLabel, gridToKey, inBounds } from "../shared";

type Cell = "B" | "W" | null;

interface ReversiMove {
  row: number;
  col: number;
}

interface ReversiState {
  board: Cell[][];
  turn: "B" | "W";
  winner: "B" | "W" | "draw" | null;
  moveHistory: string[];
  lastMove: ReversiMove | null;
}

const SIZE = 8;
const corners: ReversiMove[] = [
  { row: 0, col: 0 },
  { row: 0, col: 7 },
  { row: 7, col: 0 },
  { row: 7, col: 7 },
];

function createInitialBoard(): Cell[][] {
  const board = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
  board[3][3] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  board[4][4] = "W";
  return board;
}

function createInitialState(): ReversiState {
  return {
    board: createInitialBoard(),
    turn: "B",
    winner: null,
    moveHistory: [],
    lastMove: null,
  };
}

function opposite(color: "B" | "W"): "B" | "W" {
  return color === "B" ? "W" : "B";
}

function label(color: "B" | "W"): string {
  return color === "B" ? "Black" : "White";
}

function getFlips(board: Cell[][], row: number, col: number, color: "B" | "W"): ReversiMove[] {
  if (board[row][col] !== null) {
    return [];
  }

  const enemy = opposite(color);
  const flips: ReversiMove[] = [];

  for (const [dr, dc] of allDirections) {
    const line: ReversiMove[] = [];
    let nextRow = row + dr;
    let nextCol = col + dc;

    while (inBounds(nextRow, nextCol, SIZE) && board[nextRow][nextCol] === enemy) {
      line.push({ row: nextRow, col: nextCol });
      nextRow += dr;
      nextCol += dc;
    }

    if (line.length && inBounds(nextRow, nextCol, SIZE) && board[nextRow][nextCol] === color) {
      flips.push(...line);
    }
  }

  return flips;
}

function getLegalMovesFor(board: Cell[][], color: "B" | "W"): ReversiMove[] {
  const moves: ReversiMove[] = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (getFlips(board, row, col, color).length) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

function countPieces(board: Cell[][]): { black: number; white: number; empty: number } {
  let black = 0;
  let white = 0;
  let empty = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell === "B") {
        black += 1;
      } else if (cell === "W") {
        white += 1;
      } else {
        empty += 1;
      }
    }
  }

  return { black, white, empty };
}

function finishState(board: Cell[][], turn: "B" | "W", moveHistory: string[], lastMove: ReversiMove): ReversiState {
  const nextTurn = opposite(turn);
  const nextMoves = getLegalMovesFor(board, nextTurn);

  if (nextMoves.length) {
    return {
      board,
      turn: nextTurn,
      winner: null,
      moveHistory,
      lastMove,
    };
  }

  const currentMoves = getLegalMovesFor(board, turn);
  if (currentMoves.length) {
    return {
      board,
      turn,
      winner: null,
      moveHistory: [...moveHistory, `${label(nextTurn)} passes`],
      lastMove,
    };
  }

  const { black, white } = countPieces(board);
  return {
    board,
    turn: nextTurn,
    winner: black === white ? "draw" : black > white ? "B" : "W",
    moveHistory,
    lastMove,
  };
}

function applyMove(state: ReversiState, move: ReversiMove): ReversiState {
  if (state.winner) {
    return state;
  }

  const flips = getFlips(state.board, move.row, move.col, state.turn);
  if (!flips.length) {
    return state;
  }

  const board = cloneGrid(state.board);
  board[move.row][move.col] = state.turn;
  for (const flip of flips) {
    board[flip.row][flip.col] = state.turn;
  }

  return finishState(
    board,
    state.turn,
    [...state.moveHistory, `${label(state.turn)} to ${coordsToLabel(move.row, move.col, SIZE)}`],
    move,
  );
}

function parseState(value: unknown): ReversiState {
  if (!value || typeof value !== "object") {
    return createInitialState();
  }

  const candidate = value as Partial<ReversiState>;
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

function evaluateBoard(state: ReversiState, perspective: "B" | "W"): number {
  if (state.winner === perspective) {
    return 100000;
  }

  if (state.winner && state.winner !== "draw") {
    return -100000;
  }

  if (state.winner === "draw") {
    return 0;
  }

  const opponent = opposite(perspective);
  const counts = countPieces(state.board);
  const discScore = perspective === "B" ? counts.black - counts.white : counts.white - counts.black;
  const mobility =
    getLegalMovesFor(state.board, perspective).length - getLegalMovesFor(state.board, opponent).length;
  const cornerScore = corners.reduce((total, corner) => {
    const cell = state.board[corner.row][corner.col];
    if (cell === perspective) {
      return total + 1;
    }

    if (cell === opponent) {
      return total - 1;
    }

    return total;
  }, 0);

  return discScore * 4 + mobility * 14 + cornerScore * 40;
}

function getStatus(state: ReversiState) {
  const counts = countPieces(state.board);

  if (state.winner === "B") {
    return {
      phase: "win" as const,
      headline: "Black controls the board.",
      detail: `You finished ahead ${counts.black} to ${counts.white}.`,
    };
  }

  if (state.winner === "W") {
    return {
      phase: "loss" as const,
      headline: "White wins the disc battle.",
      detail: `The AI finished ahead ${counts.white} to ${counts.black}.`,
    };
  }

  if (state.winner === "draw") {
    return {
      phase: "draw" as const,
      headline: "Level finish.",
      detail: `Both sides ended on ${counts.black} discs.`,
    };
  }

  return {
    phase: "playing" as const,
    headline: state.turn === "B" ? "Your move" : "Computer thinking",
    detail:
      state.turn === "B"
        ? "Claim corners and keep your mobility high."
        : "White is looking for flips and stable edges.",
  };
}

function getAiMove(state: ReversiState, difficulty: "easy" | "medium" | "hard"): ReversiMove | null {
  const profile = aiIndex[difficulty];
  return findBestMove({
    adapter: {
      getCurrentPlayer(current) {
        return current.turn;
      },
      getMoves(current) {
        return getLegalMovesFor(current.board, current.turn);
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
        const flips = getFlips(current.board, move.row, move.col, current.turn).length;
        const cornerBoost = corners.some((corner) => corner.row === move.row && corner.col === move.col) ? 80 : 0;
        return flips * 6 + cornerBoost;
      },
    },
    state,
    depth: profile.searchDepth.reversi ?? 3,
    maxNodes: profile.nodeBudget.reversi,
    perspective: "W",
    randomness: profile.randomness,
  });
}

function ReversiBoard({
  state,
  disabled,
  coordinateLabels,
  onMove,
}: GameBoardProps<ReversiState, ReversiMove>) {
  const previousBoardRef = useRef<Cell[][] | null>(null);
  const legalMoves = useMemo(() => getLegalMovesFor(state.board, state.turn), [state]);
  const legalKeySet = useMemo(
    () => new Set(legalMoves.map((move) => `${move.row}-${move.col}`)),
    [legalMoves],
  );
  const changedKeySet = useMemo(() => {
    const previous = previousBoardRef.current;
    if (!previous) {
      return new Set<string>();
    }

    const changed = new Set<string>();
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (previous[row][col] !== state.board[row][col] && state.board[row][col] !== null) {
          changed.add(`${row}-${col}`);
        }
      }
    }

    return changed;
  }, [state.board]);

  useEffect(() => {
    previousBoardRef.current = state.board.map((row) => [...row]);
  }, [state.board]);

  return (
    <div className="board-shell">
      <div className="grid-board reversi-board">
        {state.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const playable = legalKeySet.has(key);
            const isLast =
              state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex;
            const motionClass = cell
              ? isLast
                ? " piece-motion is-pop"
                : changedKeySet.has(key)
                  ? " piece-motion is-flip"
                  : ""
              : "";

            return (
              <button
                className={`grid-cell reversi-cell${playable ? " is-playable" : ""}${isLast ? " is-last" : ""}`}
                disabled={disabled || !playable}
                key={key}
                onClick={() => onMove({ row: rowIndex, col: colIndex })}
                type="button"
              >
                {coordinateLabels && (
                  <span className="cell-corner">{coordsToLabel(rowIndex, colIndex, SIZE)}</span>
                )}
                {playable && !cell ? <span className="move-dot" /> : null}
                {cell ? <span className={`stone is-${cell === "B" ? "black" : "white"}${motionClass}`} /> : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export const reversiModule: GameModule<ReversiState, ReversiMove> = {
  id: "reversi",
  name: "Reversi",
  createInitialState,
  parseState,
  serializeState: (state) => state,
  getStatus,
  getMoveHistory: (state) => state.moveHistory,
  getSidebarStats(state) {
    const counts = countPieces(state.board);

    return [
      { label: "Turn", value: label(state.turn) },
      { label: "Black discs", value: String(counts.black) },
      { label: "White discs", value: String(counts.white) },
    ];
  },
  getTurnCount: (state) => state.moveHistory.length,
  isAiTurn: (state) => state.turn === "W" && !state.winner,
  applyMove,
  getAiMove,
  Board: ReversiBoard,
  rules: [
    {
      title: "Goal",
      body: "Trap enemy discs between a new disc and one of your existing discs to flip them to your color.",
    },
    {
      title: "Passing",
      body: "If a side has no legal move, it automatically passes. The game ends when neither side can move.",
    },
    {
      title: "Strategy",
      body: "Corners are powerful. Mobility often matters more than early disc count.",
    },
  ],
};
