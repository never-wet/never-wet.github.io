import { useEffect, useMemo, useState } from "react";
import { findBestMove } from "../../ai/search";
import { aiIndex } from "../../memory/aiIndex";
import type { GameBoardProps, GameModule } from "../../memory/types";
import { cloneGrid, coordsToLabel, gridToKey, inBounds } from "../shared";

type Piece = "r" | "R" | "b" | "B";
type Cell = Piece | null;

interface Position {
  row: number;
  col: number;
}

interface CheckersMove {
  from: Position;
  to: Position;
  capture: Position | null;
}

interface CheckersState {
  board: Cell[][];
  turn: "r" | "b";
  winner: "r" | "b" | "draw" | null;
  moveHistory: string[];
  forcedFrom: Position | null;
  lastMove: CheckersMove | null;
  quietMoves: number;
}

const SIZE = 8;

function createInitialBoard(): Cell[][] {
  return Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => {
      if ((row + col) % 2 === 0) {
        return null;
      }

      if (row < 3) {
        return "b";
      }

      if (row > 4) {
        return "r";
      }

      return null;
    }),
  );
}

function createInitialState(): CheckersState {
  return {
    board: createInitialBoard(),
    turn: "r",
    winner: null,
    moveHistory: [],
    forcedFrom: null,
    lastMove: null,
    quietMoves: 0,
  };
}

function parseState(value: unknown): CheckersState {
  if (!value || typeof value !== "object") {
    return createInitialState();
  }

  const candidate = value as Partial<CheckersState>;
  if (!Array.isArray(candidate.board) || candidate.board.length !== SIZE) {
    return createInitialState();
  }

  return {
    board: candidate.board.map((row) =>
      Array.isArray(row)
        ? Array.from({ length: SIZE }, (_, index) => {
            const cell = row[index];
            return cell === "r" || cell === "R" || cell === "b" || cell === "B" ? cell : null;
          })
        : Array<Cell>(SIZE).fill(null),
    ),
    turn: candidate.turn === "b" ? "b" : "r",
    winner:
      candidate.winner === "r" || candidate.winner === "b" || candidate.winner === "draw"
        ? candidate.winner
        : null,
    moveHistory: Array.isArray(candidate.moveHistory)
      ? candidate.moveHistory.filter((entry): entry is string => typeof entry === "string")
      : [],
    forcedFrom:
      candidate.forcedFrom &&
      typeof candidate.forcedFrom === "object" &&
      typeof candidate.forcedFrom.row === "number" &&
      typeof candidate.forcedFrom.col === "number"
        ? candidate.forcedFrom
        : null,
    lastMove:
      candidate.lastMove &&
      typeof candidate.lastMove === "object" &&
      candidate.lastMove.from &&
      typeof candidate.lastMove.from === "object" &&
      typeof candidate.lastMove.from.row === "number" &&
      typeof candidate.lastMove.from.col === "number" &&
      candidate.lastMove.to &&
      typeof candidate.lastMove.to === "object" &&
      typeof candidate.lastMove.to.row === "number" &&
      typeof candidate.lastMove.to.col === "number"
        ? {
            from: candidate.lastMove.from,
            to: candidate.lastMove.to,
            capture:
              candidate.lastMove.capture &&
              typeof candidate.lastMove.capture === "object" &&
              typeof candidate.lastMove.capture.row === "number" &&
              typeof candidate.lastMove.capture.col === "number"
                ? candidate.lastMove.capture
                : null,
          }
        : null,
    quietMoves: typeof candidate.quietMoves === "number" ? candidate.quietMoves : 0,
  };
}

function other(color: "r" | "b"): "r" | "b" {
  return color === "r" ? "b" : "r";
}

function pieceColor(piece: Piece): "r" | "b" {
  return piece.toLowerCase() as "r" | "b";
}

function isKing(piece: Piece): boolean {
  return piece === "R" || piece === "B";
}

function pieceDirections(piece: Piece): number[][] {
  if (isKing(piece)) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }

  return pieceColor(piece) === "r"
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ];
}

function labelColor(color: "r" | "b"): string {
  return color === "r" ? "Red" : "Black";
}

function maybeKing(piece: Piece, row: number): Piece {
  if (piece === "r" && row === 0) {
    return "R";
  }

  if (piece === "b" && row === SIZE - 1) {
    return "B";
  }

  return piece;
}

function getSimpleMovesFrom(board: Cell[][], row: number, col: number): CheckersMove[] {
  const piece = board[row][col];
  if (!piece) {
    return [];
  }

  return pieceDirections(piece).flatMap(([dr, dc]) => {
    const nextRow = row + dr;
    const nextCol = col + dc;

    if (inBounds(nextRow, nextCol, SIZE) && board[nextRow][nextCol] === null) {
      return [
        {
          from: { row, col },
          to: { row: nextRow, col: nextCol },
          capture: null,
        },
      ];
    }

    return [];
  });
}

function getCaptureMovesFrom(board: Cell[][], row: number, col: number): CheckersMove[] {
  const piece = board[row][col];
  if (!piece) {
    return [];
  }

  const color = pieceColor(piece);

  return pieceDirections(piece).flatMap(([dr, dc]) => {
    const middleRow = row + dr;
    const middleCol = col + dc;
    const landingRow = row + dr * 2;
    const landingCol = col + dc * 2;

    if (
      !inBounds(middleRow, middleCol, SIZE) ||
      !inBounds(landingRow, landingCol, SIZE) ||
      board[landingRow][landingCol] !== null
    ) {
      return [];
    }

    const jumped = board[middleRow][middleCol];
    if (!jumped || pieceColor(jumped) === color) {
      return [];
    }

    return [
      {
        from: { row, col },
        to: { row: landingRow, col: landingCol },
        capture: { row: middleRow, col: middleCol },
      },
    ];
  });
}

function getLegalMoves(state: CheckersState): CheckersMove[] {
  if (state.winner) {
    return [];
  }

  if (state.forcedFrom) {
    return getCaptureMovesFrom(state.board, state.forcedFrom.row, state.forcedFrom.col);
  }

  const captures: CheckersMove[] = [];
  const quietMoves: CheckersMove[] = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = state.board[row][col];
      if (!piece || pieceColor(piece) !== state.turn) {
        continue;
      }

      captures.push(...getCaptureMovesFrom(state.board, row, col));
      quietMoves.push(...getSimpleMovesFrom(state.board, row, col));
    }
  }

  return captures.length ? captures : quietMoves;
}

function countPieces(board: Cell[][]): { red: number; black: number; kings: number } {
  let red = 0;
  let black = 0;
  let kings = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece) {
        continue;
      }

      if (pieceColor(piece) === "r") {
        red += 1;
      } else {
        black += 1;
      }

      if (isKing(piece)) {
        kings += 1;
      }
    }
  }

  return { red, black, kings };
}

function moveNotation(move: CheckersMove): string {
  const from = coordsToLabel(move.from.row, move.from.col, SIZE);
  const to = coordsToLabel(move.to.row, move.to.col, SIZE);
  return `${from}${move.capture ? "x" : "-"}${to}`;
}

function applyMove(state: CheckersState, move: CheckersMove): CheckersState {
  if (state.winner) {
    return state;
  }

  const piece = state.board[move.from.row][move.from.col];
  if (!piece || pieceColor(piece) !== state.turn) {
    return state;
  }

  const board = cloneGrid(state.board);
  board[move.from.row][move.from.col] = null;
  if (move.capture) {
    board[move.capture.row][move.capture.col] = null;
  }

  const promotedPiece = maybeKing(piece, move.to.row);
  board[move.to.row][move.to.col] = promotedPiece;

  const history = [...state.moveHistory, `${labelColor(state.turn)} ${moveNotation(move)}`];
  const quietMoves = move.capture ? 0 : state.quietMoves + 1;
  const gotKinged = promotedPiece !== piece;

  if (move.capture && !gotKinged) {
    const followUpCaptures = getCaptureMovesFrom(board, move.to.row, move.to.col);
    if (followUpCaptures.length) {
      return {
        board,
        turn: state.turn,
        winner: null,
        moveHistory: history,
        forcedFrom: { row: move.to.row, col: move.to.col },
        lastMove: move,
        quietMoves,
      };
    }
  }

  if (quietMoves >= 80) {
    return {
      board,
      turn: other(state.turn),
      winner: "draw",
      moveHistory: history,
      forcedFrom: null,
      lastMove: move,
      quietMoves,
    };
  }

  const nextTurn = other(state.turn);
  const pieceCounts = countPieces(board);
  if (!pieceCounts.red || !pieceCounts.black) {
    return {
      board,
      turn: nextTurn,
      winner: pieceCounts.red ? "r" : "b",
      moveHistory: history,
      forcedFrom: null,
      lastMove: move,
      quietMoves,
    };
  }

  const nextState: CheckersState = {
    board,
    turn: nextTurn,
    winner: null,
    moveHistory: history,
    forcedFrom: null,
    lastMove: move,
    quietMoves,
  };

  if (getLegalMoves(nextState).length === 0) {
    return {
      ...nextState,
      winner: state.turn,
    };
  }

  return nextState;
}

function evaluateBoard(state: CheckersState, perspective: "r" | "b"): number {
  if (state.winner === perspective) {
    return 100000;
  }

  if (state.winner && state.winner !== "draw") {
    return -100000;
  }

  if (state.winner === "draw") {
    return 0;
  }

  let score = 0;
  const opponent = other(perspective);

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = state.board[row][col];
      if (!piece) {
        continue;
      }

      const color = pieceColor(piece);
      const value = isKing(piece) ? 185 : 110;
      const advancement = color === "r" ? SIZE - 1 - row : row;
      const edgePenalty = col === 0 || col === SIZE - 1 ? -8 : 0;
      const centerBonus = col >= 2 && col <= 5 && row >= 2 && row <= 5 ? 10 : 0;
      const total = value + advancement * 5 + centerBonus + edgePenalty;

      score += color === perspective ? total : -total;
    }
  }

  const mobility =
    getLegalMoves({ ...state, turn: perspective, forcedFrom: null }).length -
    getLegalMoves({ ...state, turn: opponent, forcedFrom: null }).length;
  return score + mobility * 8;
}

function getStatus(state: CheckersState) {
  if (state.winner === "r") {
    return {
      phase: "win" as const,
      headline: "Red wins the draft.",
      detail: "The computer ran out of pieces or legal moves.",
    };
  }

  if (state.winner === "b") {
    return {
      phase: "loss" as const,
      headline: "Black wins the board.",
      detail: "The AI converted its material and mobility edge.",
    };
  }

  if (state.winner === "draw") {
    return {
      phase: "draw" as const,
      headline: "Draw by repetition pressure.",
      detail: "The game hit the quiet-move draw threshold.",
    };
  }

  return {
    phase: "playing" as const,
    headline: state.turn === "r" ? "Your move" : "Computer thinking",
    detail:
      state.forcedFrom && state.turn === "r"
        ? "A jump is still available from the highlighted checker."
        : state.turn === "r"
          ? "Captures are mandatory when available."
          : "Black is checking forced lines and king races.",
  };
}

function getAiMove(state: CheckersState, difficulty: "easy" | "medium" | "hard"): CheckersMove | null {
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
        return `${current.turn}|${current.winner ?? "-"}|${current.quietMoves}|${
          current.forcedFrom ? `${current.forcedFrom.row}-${current.forcedFrom.col}` : "free"
        }|${gridToKey(current.board)}`;
      },
      scoreMove(current, move) {
        const next = applyMove(current, move);
        return evaluateBoard(next, "b") + (move.capture ? 80 : 0);
      },
    },
    state,
    depth: profile.searchDepth.checkers ?? 5,
    maxNodes: profile.nodeBudget.checkers,
    perspective: "b",
    randomness: profile.randomness,
  });
}

function pieceGlyph(piece: Piece): string {
  if (piece === "r") {
    return "●";
  }

  if (piece === "b") {
    return "●";
  }

  if (piece === "R") {
    return "♔";
  }

  return "♚";
}

function positionKey(position: Position | null): string | null {
  return position ? `${position.row}-${position.col}` : null;
}

function CheckersBoard({
  state,
  disabled,
  coordinateLabels,
  onMove,
}: GameBoardProps<CheckersState, CheckersMove>) {
  const legalMoves = useMemo(() => getLegalMoves(state), [state]);
  const forcedKey = positionKey(state.forcedFrom);
  const [selectedKey, setSelectedKey] = useState<string | null>(forcedKey);

  useEffect(() => {
    setSelectedKey(forcedKey);
  }, [forcedKey]);

  useEffect(() => {
    if (!forcedKey) {
      setSelectedKey(null);
    }
  }, [forcedKey, state.moveHistory.length, state.turn]);

  const moveTargets = useMemo(() => {
    const targets = new Map<string, CheckersMove>();
    for (const move of legalMoves) {
      if (!selectedKey || `${move.from.row}-${move.from.col}` === selectedKey) {
        targets.set(`${move.to.row}-${move.to.col}`, move);
      }
    }
    return targets;
  }, [legalMoves, selectedKey]);

  const movablePieces = useMemo(
    () => new Set(legalMoves.map((move) => `${move.from.row}-${move.from.col}`)),
    [legalMoves],
  );

  return (
    <div className="board-shell">
      <div className="grid-board checkers-board">
        {state.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const darkSquare = (rowIndex + colIndex) % 2 === 1;
            const isSelected = selectedKey === key;
            const targetMove = moveTargets.get(key);
            const isForced = forcedKey === key;
            const travelStyle =
              cell && state.lastMove?.to.row === rowIndex && state.lastMove?.to.col === colIndex
                ? {
                    ["--travel-x" as any]: String(state.lastMove.from.col - colIndex),
                    ["--travel-y" as any]: String(state.lastMove.from.row - rowIndex),
                  }
                : undefined;

            return (
              <button
                className={`checkers-cell ${darkSquare ? "is-dark" : "is-light"}${isSelected ? " is-selected" : ""}${targetMove ? " is-target" : ""}${isForced ? " is-forced" : ""}`}
                disabled={!darkSquare}
                key={key}
                onClick={() => {
                  if (disabled || state.turn !== "r") {
                    return;
                  }

                  if (targetMove) {
                    onMove(targetMove);
                    return;
                  }

                  if (cell && pieceColor(cell) === "r" && movablePieces.has(key)) {
                    setSelectedKey(key);
                  }
                }}
                type="button"
              >
                {coordinateLabels && darkSquare ? (
                  <span className="cell-corner">{coordsToLabel(rowIndex, colIndex, SIZE)}</span>
                ) : null}
                {targetMove ? <span className="move-dot" /> : null}
                {cell ? (
                  <span
                    className={`checker-piece is-${pieceColor(cell) === "r" ? "red" : "black"}${travelStyle ? " piece-motion is-travel" : ""}`}
                    style={travelStyle}
                  >
                    {pieceGlyph(cell)}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export const checkersModule: GameModule<CheckersState, CheckersMove> = {
  id: "checkers",
  name: "Checkers",
  createInitialState,
  parseState,
  serializeState: (state) => state,
  getStatus,
  getMoveHistory: (state) => state.moveHistory,
  getSidebarStats(state) {
    const counts = countPieces(state.board);

    return [
      { label: "Turn", value: labelColor(state.turn) },
      { label: "Red pieces", value: String(counts.red) },
      { label: "Black pieces", value: String(counts.black) },
      { label: "Kings", value: String(counts.kings) },
    ];
  },
  getTurnCount: (state) => state.moveHistory.length,
  isAiTurn: (state) => state.turn === "b" && !state.winner,
  applyMove,
  getAiMove,
  Board: CheckersBoard,
  rules: [
    {
      title: "Goal",
      body: "Capture all opposing pieces or leave the opponent without a legal move.",
    },
    {
      title: "Forced captures",
      body: "If a capture is available you must take it. Multi-jumps continue until no further capture remains.",
    },
    {
      title: "Kinging",
      body: "Men become kings on the far edge and then move diagonally in both directions.",
    },
  ],
};
