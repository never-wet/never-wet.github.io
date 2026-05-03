import type { MiniGameKind, MiniGameState } from "../../store/useWorldStore";

export function createMiniGame(kind: MiniGameKind): MiniGameState {
  if (kind === "market_timing") {
    return {
      kind,
      title: "Market Timing",
      playerHp: 12,
      enemyHp: 16,
      meter: 0.18,
      result: "playing",
      message: "Buy when the pulse crosses the gold band. Three good reads win.",
      questReward: {
        questId: "market_signal",
        objectiveId: "win_trading_game"
      }
    };
  }

  if (kind === "rhythm_pulse") {
    return {
      kind,
      title: "Rhythm Pulse",
      playerHp: 14,
      enemyHp: 14,
      meter: 0.4,
      result: "playing",
      message: "Hit on the bright beat to charge the studio lights.",
      questReward: undefined
    };
  }

  return {
    kind,
    title: "Circuit Duel",
    playerHp: 20,
    enemyHp: 22,
    meter: 0.32,
    result: "playing",
    message: "Attack near the center band. Dodge before the circuit sparks back.",
    questReward: {
      questId: "observatory_pass",
      objectiveId: "training_duel"
    }
  };
}

export function tickMiniGame(miniGame: MiniGameState, deltaSeconds: number): MiniGameState {
  if (miniGame.result !== "playing") {
    return miniGame;
  }

  const speed = miniGame.kind === "market_timing" ? 0.64 : miniGame.kind === "rhythm_pulse" ? 0.82 : 0.58;
  const meter = (miniGame.meter + deltaSeconds * speed) % 1;

  return {
    ...miniGame,
    meter
  };
}

export function miniGameAttack(miniGame: MiniGameState): MiniGameState {
  if (miniGame.result !== "playing") {
    return miniGame;
  }

  const accuracy = 1 - Math.min(1, Math.abs(miniGame.meter - 0.5) / 0.5);
  const damage = accuracy > 0.72 ? 7 : accuracy > 0.46 ? 4 : 2;
  const enemyHp = Math.max(0, miniGame.enemyHp - damage);
  const result = enemyHp <= 0 ? "won" : "playing";

  return {
    ...miniGame,
    enemyHp,
    result,
    message:
      result === "won"
        ? "Victory. The town records the reward."
        : accuracy > 0.72
          ? "Clean hit. The timing window flashed bright."
          : "Glancing hit. Try closer to the center band."
  };
}

export function miniGameDodge(miniGame: MiniGameState): MiniGameState {
  if (miniGame.result !== "playing") {
    return miniGame;
  }

  const safe = miniGame.meter < 0.18 || miniGame.meter > 0.82;
  const playerHp = safe ? miniGame.playerHp : Math.max(0, miniGame.playerHp - 4);
  const result = playerHp <= 0 ? "lost" : "playing";

  return {
    ...miniGame,
    playerHp,
    result,
    message:
      result === "lost"
        ? "The circuit overloads. Try again from the practice yard."
        : safe
          ? "Perfect dodge. The spark misses cleanly."
          : "Too early. The spark clips your guard."
  };
}
