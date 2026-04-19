import { useMemo } from "react";
import { aiIndex } from "../../memory/aiIndex";
import type { GameBoardProps, GameModule } from "../../memory/types";
import { findBestMove } from "../../ai/search";
import { listToKey } from "../shared";

type Cell = "X" | "O" | null;

interface TicTacToeState {
  board: Cell[];
  turn: "X" | "O";
  winner: "X" | "O" | "draw" | null;
  moveHistory: string[];
  lastMove: number | null;
}

function createInitialState(): TicTacToeState {
  return {
    board: Array<Cell>(9).fill(null),
    turn: "X",
    winner: null,
    moveHistory: [],
    lastMove: null,
  };
}

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function cellLabel(index: number): string {
  return ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"][index];
}

function getWinner(board: Cell[]): TicTacToeState["winner"] {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return board.every(Boolean) ? "draw" : null;
}

function getLegalMoves(state: TicTacToeState): number[] {
  if (state.winner) {
    return [];
  }

  return state.board.flatMap((cell, index) => (cell === null ? [index] : []));
}

function applyMove(state: TicTacToeState, move: number): TicTacToeState {
  if (state.board[move] || state.winner) {
    return state;
  }

  const board = [...state.board];
  board[move] = state.turn;
  const winner = getWinner(board);

  return {
    board,
    turn: winner ? state.turn : state.turn === "X" ? "O" : "X",
    winner,
    moveHistory: [...state.moveHistory, `${state.turn} to ${cellLabel(move)}`],
    lastMove: move,
  };
}

function evaluateBoard(state: TicTacToeState, perspective: "X" | "O"): number {
  if (state.winner === perspective) {
    return 100;
  }

  if (state.winner && state.winner !== "draw") {
    return -100;
  }

  if (state.winner === "draw") {
    return 0;
  }

  const opponent = perspective === "X" ? "O" : "X";
  let score = 0;

  for (const line of winningLines) {
    const values = line.map((index) => state.board[index]);
    const own = values.filter((value) => value === perspective).length;
    const enemy = values.filter((value) => value === opponent).length;

    if (own && enemy) {
      continue;
    }

    if (own) {
      score += own === 2 ? 12 : 2;
    }

    if (enemy) {
      score -= enemy === 2 ? 12 : 2;
    }
  }

  return score;
}

function parseState(value: unknown): TicTacToeState {
  if (!value || typeof value !== "object") {
    return createInitialState();
  }

  const candidate = value as Partial<TicTacToeState>;
  if (!Array.isArray(candidate.board) || candidate.board.length !== 9) {
    return createInitialState();
  }

  return {
    board: candidate.board.map((cell) => (cell === "X" || cell === "O" ? cell : null)),
    turn: candidate.turn === "O" ? "O" : "X",
    winner:
      candidate.winner === "X" || candidate.winner === "O" || candidate.winner === "draw"
        ? candidate.winner
        : null,
    moveHistory: Array.isArray(candidate.moveHistory)
      ? candidate.moveHistory.filter((entry): entry is string => typeof entry === "string")
      : [],
    lastMove: typeof candidate.lastMove === "number" ? candidate.lastMove : null,
  };
}

function getStatus(state: TicTacToeState) {
  if (state.winner === "X") {
    return {
      phase: "win" as const,
      headline: "You solved the board.",
      detail: "X completed a three-in-a-row before the AI could answer.",
    };
  }

  if (state.winner === "O") {
    return {
      phase: "loss" as const,
      headline: "Computer wins this round.",
      detail: "The AI completed the line first.",
    };
  }

  if (state.winner === "draw") {
    return {
      phase: "draw" as const,
      headline: "Draw board.",
      detail: "No more legal moves remain.",
    };
  }

  return {
    phase: "playing" as const,
    headline: state.turn === "X" ? "Your move" : "Computer thinking",
    detail: state.turn === "X" ? "Pick any open square." : "O is looking for a tactic.",
  };
}

function getAiMove(state: TicTacToeState, difficulty: "easy" | "medium" | "hard"): number | null {
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
        return `${current.turn}|${current.winner ?? "-"}|${listToKey(current.board)}`;
      },
      scoreMove(current, move) {
        if (move === 4) {
          return 10;
        }

        return [0, 2, 6, 8].includes(move) ? 5 : 1;
      },
    },
    state,
    depth: profile.searchDepth.tictactoe ?? 9,
    maxNodes: profile.nodeBudget.tictactoe,
    perspective: "O",
    randomness: profile.randomness,
  });
}

function TicTacToeBoard({
  state,
  disabled,
  coordinateLabels,
  onMove,
}: GameBoardProps<TicTacToeState, number>) {
  const legalMoves = useMemo(() => new Set(getLegalMoves(state)), [state]);

  return (
    <div className="board-shell compact-board">
      {coordinateLabels && (
        <div className="mini-board-labels top">
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </div>
      )}
      <div className="ttt-board">
        {state.board.map((cell, index) => (
          <button
            className={`ttt-cell${legalMoves.has(index) && !disabled ? " is-playable" : ""}`}
            disabled={disabled || !legalMoves.has(index)}
            key={index}
            onClick={() => onMove(index)}
            type="button"
          >
            {coordinateLabels && <span className="cell-corner">{cellLabel(index)}</span>}
            <span className={`${cell ? "ttt-mark" : ""}${cell && state.lastMove === index ? " piece-motion is-pop" : ""}`}>
              {cell ?? ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const ticTacToeModule: GameModule<TicTacToeState, number> = {
  id: "tictactoe",
  name: "Tic-Tac-Toe",
  createInitialState,
  parseState,
  serializeState: (state) => state,
  getStatus,
  getMoveHistory: (state) => state.moveHistory,
  getSidebarStats(state) {
    return [
      { label: "Turn", value: state.turn },
      { label: "Open squares", value: String(getLegalMoves(state).length) },
      { label: "Board fill", value: `${state.board.filter(Boolean).length}/9` },
    ];
  },
  getTurnCount: (state) => state.moveHistory.length,
  isAiTurn: (state) => state.turn === "O" && !state.winner,
  applyMove,
  getAiMove,
  Board: TicTacToeBoard,
  rules: [
    {
      title: "Goal",
      body: "Place three of your marks in a horizontal, vertical, or diagonal line before the AI does.",
    },
    {
      title: "Turn flow",
      body: "You play X and always move first. Click an empty square to place your mark.",
    },
    {
      title: "Difficulty",
      body: "Hard uses perfect play. Easier settings add shorter search and a bit of randomness.",
    },
  ],
};
