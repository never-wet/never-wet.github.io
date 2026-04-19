import { pickWeighted } from "../utils/math";

export interface SearchAdapter<State, Move, Player> {
  getCurrentPlayer: (state: State) => Player;
  getMoves: (state: State) => Move[];
  applyMove: (state: State, move: Move) => State;
  evaluate: (state: State, perspective: Player) => number;
  isTerminal: (state: State) => boolean;
  scoreMove?: (state: State, move: Move, perspective: Player) => number;
  keyOf?: (state: State) => string;
}

interface SearchOptions<State, Move, Player> {
  adapter: SearchAdapter<State, Move, Player>;
  state: State;
  depth: number;
  perspective: Player;
  randomness?: number;
  maxNodes?: number;
}

interface SearchRuntime {
  cache: Map<string, number>;
  nodesRemaining: number | null;
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

function getCacheKey<State, Move, Player>(
  adapter: SearchAdapter<State, Move, Player>,
  state: State,
  depth: number,
  perspective: Player,
): string | null {
  if (!adapter.keyOf) {
    return null;
  }

  return `${depth}|${String(adapter.getCurrentPlayer(state))}|${String(perspective)}|${adapter.keyOf(state)}`;
}

function takeNode(runtime: SearchRuntime): boolean {
  if (runtime.nodesRemaining === null) {
    return false;
  }

  runtime.nodesRemaining -= 1;
  return runtime.nodesRemaining < 0;
}

function allowsImmediateLoss<State, Move, Player>(
  adapter: SearchAdapter<State, Move, Player>,
  state: State,
  perspective: Player,
): boolean {
  const replies = adapter.getMoves(state);
  if (!replies.length) {
    return false;
  }

  const orderedReplies = orderMoves(adapter, state, replies, perspective);
  return orderedReplies.some((reply) => {
    const nextState = adapter.applyMove(state, reply);
    return adapter.isTerminal(nextState) && adapter.evaluate(nextState, perspective) < 0;
  });
}

function alphabeta<State, Move, Player>(
  adapter: SearchAdapter<State, Move, Player>,
  state: State,
  depth: number,
  alpha: number,
  beta: number,
  perspective: Player,
  runtime: SearchRuntime,
): number {
  if (takeNode(runtime)) {
    return adapter.evaluate(state, perspective);
  }

  const cacheKey = getCacheKey(adapter, state, depth, perspective);
  if (cacheKey && runtime.cache.has(cacheKey)) {
    return runtime.cache.get(cacheKey)!;
  }

  if (depth === 0 || adapter.isTerminal(state)) {
    const score = adapter.evaluate(state, perspective);
    if (cacheKey) {
      runtime.cache.set(cacheKey, score);
    }
    return score;
  }

  const moves = adapter.getMoves(state);
  if (moves.length === 0) {
    const score = adapter.evaluate(state, perspective);
    if (cacheKey) {
      runtime.cache.set(cacheKey, score);
    }
    return score;
  }

  const orderedMoves = orderMoves(adapter, state, moves, perspective);
  const maximizing = adapter.getCurrentPlayer(state) === perspective;
  let pruned = false;

  if (maximizing) {
    let best = Number.NEGATIVE_INFINITY;

    for (const move of orderedMoves) {
      const next = adapter.applyMove(state, move);
      const score = alphabeta(adapter, next, depth - 1, alpha, beta, perspective, runtime);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);

      if (alpha >= beta) {
        pruned = true;
        break;
      }
    }

    if (cacheKey && !pruned) {
      runtime.cache.set(cacheKey, best);
    }
    return best;
  }

  let best = Number.POSITIVE_INFINITY;

  for (const move of orderedMoves) {
    const next = adapter.applyMove(state, move);
    const score = alphabeta(adapter, next, depth - 1, alpha, beta, perspective, runtime);
    best = Math.min(best, score);
    beta = Math.min(beta, score);

    if (alpha >= beta) {
      pruned = true;
      break;
    }
  }

  if (cacheKey && !pruned) {
    runtime.cache.set(cacheKey, best);
  }
  return best;
}

export function findBestMove<State, Move, Player>({
  adapter,
  state,
  depth,
  perspective,
  randomness = 0,
  maxNodes,
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

  const safeMoves = orderedMoves.filter((move) => !allowsImmediateLoss(adapter, adapter.applyMove(state, move), perspective));
  const candidateMoves = safeMoves.length ? safeMoves : orderedMoves;
  if (candidateMoves.length === 1) {
    return candidateMoves[0];
  }

  const runtime: SearchRuntime = {
    cache: new Map<string, number>(),
    nodesRemaining: typeof maxNodes === "number" ? maxNodes : null,
  };

  const scored = candidateMoves.map((move) => ({
    move,
    score: alphabeta(
      adapter,
      adapter.applyMove(state, move),
      Math.max(0, depth - 1),
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      perspective,
      runtime,
    ),
  }));

  scored.sort((left, right) => right.score - left.score);
  const bestScore = scored[0].score;
  const closeMoves = scored.filter((entry) => entry.score >= bestScore - 0.75).map((entry) => entry.move);
  return pickWeighted(closeMoves, randomness);
}
