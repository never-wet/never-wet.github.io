import { useEffect, useMemo, useState } from "react";
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { findBestMove } from "../../ai/search";
import { aiIndex } from "../../memory/aiIndex";
import type { GameBoardProps, GameModule } from "../../memory/types";

interface ChessMoveInput {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  san?: string;
  piece?: PieceSymbol;
  captured?: PieceSymbol;
}

interface ChessState {
  fen: string;
  moveHistory: string[];
  lastMove: { from: Square; to: Square } | null;
}

const unicodePieces: Record<`${Color}-${PieceSymbol}`, string> = {
  "w-p": "♙",
  "w-n": "♘",
  "w-b": "♗",
  "w-r": "♖",
  "w-q": "♕",
  "w-k": "♔",
  "b-p": "♟",
  "b-n": "♞",
  "b-b": "♝",
  "b-r": "♜",
  "b-q": "♛",
  "b-k": "♚",
};

const pieceValues: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const promotionPieces: PieceSymbol[] = ["q", "r", "b", "n"];

function createInitialState(): ChessState {
  const chess = new Chess();
  return {
    fen: chess.fen(),
    moveHistory: [],
    lastMove: null,
  };
}

function parseState(value: unknown): ChessState {
  if (!value || typeof value !== "object") {
    return createInitialState();
  }

  const candidate = value as Partial<ChessState>;
  if (typeof candidate.fen !== "string") {
    return createInitialState();
  }

  try {
    const chess = new Chess(candidate.fen);
    return {
      fen: chess.fen(),
      moveHistory: Array.isArray(candidate.moveHistory)
        ? candidate.moveHistory.filter((entry): entry is string => typeof entry === "string")
        : [],
      lastMove:
        candidate.lastMove &&
        typeof candidate.lastMove === "object" &&
        typeof candidate.lastMove.from === "string" &&
        typeof candidate.lastMove.to === "string"
          ? { from: candidate.lastMove.from as Square, to: candidate.lastMove.to as Square }
          : null,
    };
  } catch {
    return createInitialState();
  }
}

function getGame(state: ChessState): Chess {
  return new Chess(state.fen);
}

function legalMoves(state: ChessState): ChessMoveInput[] {
  return getGame(state)
    .moves({ verbose: true })
    .map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
      piece: move.piece,
      captured: move.captured,
    }));
}

function findKingSquare(state: ChessState, color: Color): Square | null {
  const board = getGame(state).board();
  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.type === "k" && piece.color === color) {
        return piece.square;
      }
    }
  }

  return null;
}

function applyMove(state: ChessState, move: ChessMoveInput): ChessState {
  const chess = getGame(state);

  try {
    const nextMove = chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    return {
      fen: chess.fen(),
      moveHistory: [...state.moveHistory, nextMove.san],
      lastMove: {
        from: nextMove.from,
        to: nextMove.to,
      },
    };
  } catch {
    return state;
  }
}

function pieceActivity(piece: PieceSymbol, color: Color, row: number, col: number): number {
  const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
  const centerBonus = Math.max(0, 4 - centerDistance) * 8;

  if (piece === "p") {
    const advancement = color === "w" ? 6 - row : row - 1;
    return advancement * 7 + (centerBonus * 0.2);
  }

  if (piece === "n" || piece === "b") {
    return centerBonus;
  }

  if (piece === "r") {
    return centerBonus * 0.35;
  }

  if (piece === "q") {
    return centerBonus * 0.25;
  }

  return 0;
}

function evaluateBoard(state: ChessState, perspective: Color): number {
  const chess = getGame(state);

  if (chess.isCheckmate()) {
    return chess.turn() === perspective ? -100000 : 100000;
  }

  if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }

      const sign = piece.color === perspective ? 1 : -1;
      score += sign * pieceValues[piece.type];
      score += sign * pieceActivity(piece.type, piece.color, row, col);
    }
  }

  const currentMobility = chess.moves().length;
  score += chess.turn() === perspective ? currentMobility * 3 : -currentMobility * 3;

  const ownCastling = chess.getCastlingRights(perspective);
  const oppCastling = chess.getCastlingRights(perspective === "w" ? "b" : "w");
  score += (ownCastling.k ? 8 : 0) + (ownCastling.q ? 8 : 0);
  score -= (oppCastling.k ? 8 : 0) + (oppCastling.q ? 8 : 0);

  if (chess.isCheck()) {
    score += chess.turn() === perspective ? -30 : 30;
  }

  return score;
}

function moveWeight(move: ChessMoveInput): number {
  let score = 0;
  if (move.captured) {
    score += pieceValues[move.captured] + 20;
  }
  if (move.promotion) {
    score += pieceValues[move.promotion];
  }
  if (move.san?.includes("+")) {
    score += 40;
  }
  if (move.san?.includes("#")) {
    score += 1000;
  }
  if (move.san === "O-O" || move.san === "O-O-O") {
    score += 25;
  }
  return score;
}

function getStatus(state: ChessState) {
  const chess = getGame(state);

  if (chess.isCheckmate()) {
    if (chess.turn() === "w") {
      return {
        phase: "loss" as const,
        headline: "Checkmate.",
        detail: "Your king has no legal escape squares left.",
      };
    }

    return {
      phase: "win" as const,
      headline: "Checkmate delivered.",
      detail: "The AI king is trapped with no legal move.",
    };
  }

  if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial()) {
    return {
      phase: "draw" as const,
      headline: "Drawn position.",
      detail: chess.isStalemate()
        ? "The side to move has no legal moves, but the king is not in check."
        : "The game ended in a drawn state.",
    };
  }

  return {
    phase: "playing" as const,
    headline: chess.turn() === "w" ? "Your move" : "Computer thinking",
    detail: chess.isCheck()
      ? `${chess.turn() === "w" ? "White" : "Black"} is in check.`
      : chess.turn() === "w"
        ? "Select a piece to see legal destinations."
        : "Black is evaluating legal replies.",
  };
}

function getAiMove(state: ChessState, difficulty: "easy" | "medium" | "hard"): ChessMoveInput | null {
  const profile = aiIndex[difficulty];

  return findBestMove({
    adapter: {
      getCurrentPlayer(current) {
        return getGame(current).turn();
      },
      getMoves: legalMoves,
      applyMove,
      evaluate: evaluateBoard,
      isTerminal(current) {
        return getGame(current).isGameOver();
      },
      scoreMove(_current, move) {
        return moveWeight(move);
      },
    },
    state,
    depth: profile.searchDepth.chess ?? 2,
    perspective: "b",
    randomness: profile.randomness,
  });
}

function ChessBoard({
  state,
  disabled,
  coordinateLabels,
  onMove,
}: GameBoardProps<ChessState, ChessMoveInput>) {
  const chess = useMemo(() => getGame(state), [state]);
  const board = useMemo(() => chess.board(), [chess]);
  const moves = useMemo(() => legalMoves(state), [state]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [promotionTarget, setPromotionTarget] = useState<{ from: Square; to: Square } | null>(null);
  const checkSquare = chess.isCheck() ? findKingSquare(state, chess.turn()) : null;

  useEffect(() => {
    setSelectedSquare(null);
    setPromotionTarget(null);
  }, [state.fen]);

  const candidateMoves = selectedSquare ? moves.filter((move) => move.from === selectedSquare) : [];
  const targetMap = new Map<string, ChessMoveInput[]>();
  for (const move of candidateMoves) {
    const existing = targetMap.get(move.to) ?? [];
    existing.push(move);
    targetMap.set(move.to, existing);
  }

  return (
    <div className="board-shell chess-shell">
      <div className="grid-board chess-board">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const square = `${files[colIndex]}${8 - rowIndex}` as Square;
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isTarget = targetMap.has(square);
            const isLast =
              state.lastMove?.from === square || state.lastMove?.to === square;
            const isCheck = checkSquare === square;
            const isOwnPiece = piece?.color === "w";

            return (
              <button
                className={`chess-cell ${isLight ? "is-light" : "is-dark"}${isSelected ? " is-selected" : ""}${isTarget ? " is-target" : ""}${isLast ? " is-last" : ""}${isCheck ? " is-check" : ""}`}
                key={square}
                onClick={() => {
                  if (disabled || chess.turn() !== "w") {
                    return;
                  }

                  const targetMoves = targetMap.get(square);
                  if (selectedSquare && targetMoves?.length) {
                    const promotionOptions = targetMoves.filter((move) => move.promotion);
                    if (promotionOptions.length) {
                      setPromotionTarget({ from: selectedSquare, to: square });
                      return;
                    }

                    onMove(targetMoves[0]);
                    setSelectedSquare(null);
                    return;
                  }

                  if (selectedSquare === square) {
                    setSelectedSquare(null);
                    return;
                  }

                  if (isOwnPiece) {
                    setSelectedSquare(square);
                    setPromotionTarget(null);
                  }
                }}
                type="button"
              >
                {coordinateLabels ? <span className="cell-corner">{square}</span> : null}
                {isTarget && !piece ? <span className="move-dot" /> : null}
                {piece ? (
                  <span className={`chess-piece is-${piece.color === "w" ? "white" : "black"}`}>
                    {unicodePieces[`${piece.color}-${piece.type}`]}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
      {promotionTarget ? (
        <div className="promotion-strip surface-card">
          <span>Choose promotion</span>
          <div className="promotion-actions">
            {promotionPieces.map((piece) => (
              <button
                className="pill-button is-active"
                key={piece}
                onClick={() => {
                  onMove({
                    from: promotionTarget.from,
                    to: promotionTarget.to,
                    promotion: piece,
                  });
                  setPromotionTarget(null);
                  setSelectedSquare(null);
                }}
                type="button"
              >
                {piece.toUpperCase()}
              </button>
            ))}
            <button
              className="pill-button"
              onClick={() => setPromotionTarget(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const chessModule: GameModule<ChessState, ChessMoveInput> = {
  id: "chess",
  name: "Chess",
  createInitialState,
  parseState,
  serializeState: (state) => state,
  getStatus,
  getMoveHistory: (state) => state.moveHistory,
  getSidebarStats(state) {
    const chess = getGame(state);
    const whitePieces = chess.board().flat().filter((piece) => piece?.color === "w").length;
    const blackPieces = chess.board().flat().filter((piece) => piece?.color === "b").length;

    return [
      { label: "Turn", value: chess.turn() === "w" ? "White" : "Black" },
      { label: "White pieces", value: String(whitePieces) },
      { label: "Black pieces", value: String(blackPieces) },
      { label: "Legal moves", value: String(chess.moves().length) },
    ];
  },
  getTurnCount: (state) => state.moveHistory.length,
  isAiTurn: (state) => !getGame(state).isGameOver() && getGame(state).turn() === "b",
  applyMove,
  getAiMove,
  Board: ChessBoard,
  rules: [
    {
      title: "Legal rules",
      body: "This board enforces check, checkmate, stalemate, castling, en passant, and promotion.",
    },
    {
      title: "Promotion",
      body: "When your pawn reaches the back rank, choose the promotion piece from the on-board picker.",
    },
    {
      title: "Difficulty",
      body: "Hard searches farther and scores material, mobility, center control, and tactical captures.",
    },
  ],
};
