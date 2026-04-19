import { pickWeighted } from "../utils/math";

export interface SearchAdapter<State, Move, Player> {
  getCurrentPlayer: (state: State) => Player;
  getMoves: (state: State) => Move[];
  applyMove: (state: State, move: Move) => State;
  evaluate: (state: State, perspective: Player) => number;
  isTerminal: (state: State) => boolean;
  scoreMove?: (state: State, move: Move, perspective: Player) => number;
}

interface SearchOptions<State, Move, Player> {
  adapter: SearchAdapter<State, Move, Player>;
  state: State;
  depth: number;
  perspective: Player;
  randomness?: number;
}

function orderMoves<State, Move, Player>(
  adapter: SearchAdapter<State, Move, Player>,
  state: State,
  moves: Move[],
  perspective: Player,
): Move[] {
  if (!adapter.scoreMove) {
    return moves;
  }

  return [...moves].sort(
    (left, right) => adapter.scoreMove!(state, right, perspective) - adapter.scoreMove!(state, left, perspective),
  );
}

function alphabeta<State, Move, Player>(
  adapter: SearchAdapter<State, Move, Player>,
  state: State,
  depth: number,
  alpha: number,
  beta: number,
  perspective: Player,
): number {
  if (depth === 0 || adapter.isTerminal(state)) {
    return adapter.evaluate(state, perspective);
  }

  const moves = adapter.getMoves(state);
  if (moves.length === 0) {
    return adapter.evaluate(state, perspective);
  }

  const orderedMoves = orderMoves(adapter, state, moves, perspective);

  const maximizing = adapter.getCurrentPlayer(state) === perspective;

  if (maximizing) {
    let best = Number.NEGATIVE_INFINITY;

    for (const move of orderedMoves) {
      const next = adapter.applyMove(state, move);
      const score = alphabeta(adapter, next, depth - 1, alpha, beta, perspective);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);

      if (alpha >= beta) {
        break;
      }
    }

    return best;
  }

  let best = Number.POSITIVE_INFINITY;

  for (const move of orderedMoves) {
    const next = adapter.applyMove(state, move);
    const score = alphabeta(adapter, next, depth - 1, alpha, beta, perspective);
    best = Math.min(best, score);
    beta = Math.min(beta, score);

    if (alpha >= beta) {
      break;
    }
  }

  return best;
}

export function findBestMove<State, Move, Player>({
  adapter,
  state,
  depth,
  perspective,
  randomness = 0,
}: SearchOptions<State, Move, Player>): Move | null {
  const moves = adapter.getMoves(state);
  if (!moves.length) {
    return null;
  }

  const orderedMoves = orderMoves(adapter, state, moves, perspective);
  if (orderedMoves.length === 1) {
    return orderedMoves[0];
  }

  for (const move of orderedMoves) {
    const nextState = adapter.applyMove(state, move);
    if (adapter.isTerminal(nextState) && adapter.evaluate(nextState, perspective) > 0) {
      return move;
    }
  }

  const scored = orderedMoves.map((move) => ({
    move,
    score: alphabeta(
      adapter,
      adapter.applyMove(state, move),
      Math.max(0, depth - 1),
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      perspective,
    ),
  }));

  scored.sort((left, right) => right.score - left.score);
  const bestScore = scored[0].score;
  const closeMoves = scored.filter((entry) => entry.score >= bestScore - 0.75).map((entry) => entry.move);
  return pickWeighted(closeMoves, randomness);
}
