import { Gauge, Pause, Play, RotateCcw, WalletCards } from "lucide-react";
import { DIFFICULTY_CONFIG } from "../engine/marketEngine";
import type { Difficulty } from "../types";
import { formatCurrency, formatPercent } from "./format";

interface TopBarProps {
  cash: number;
  netWorth: number;
  returnPct: number;
  exposurePct: number;
  tick: number;
  running: boolean;
  speed: "slow" | "live" | "fast";
  difficulty: Difficulty;
  onToggleRunning: () => void;
  onSpeedChange: (speed: "slow" | "live" | "fast") => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onReset: () => void;
}

const speedOptions: Array<TopBarProps["speed"]> = ["slow", "live", "fast"];
const difficultyOptions: Difficulty[] = ["normal", "strategic", "volatile"];

export function TopBar({
  cash,
  netWorth,
  returnPct,
  exposurePct,
  tick,
  running,
  speed,
  difficulty,
  onToggleRunning,
  onSpeedChange,
  onDifficultyChange,
  onReset,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="brand-lockup">
        <div className="brand-mark">
          <Gauge size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Market Pulse Trader</p>
          <h1>Trading Desk</h1>
        </div>
      </div>

      <div className="account-strip" aria-label="Account summary">
        <div className="account-stat">
          <span>Cash</span>
          <strong>{formatCurrency(cash)}</strong>
        </div>
        <div className="account-stat">
          <span>Net Worth</span>
          <strong>{formatCurrency(netWorth)}</strong>
        </div>
        <div className={`account-stat ${returnPct >= 0 ? "is-positive" : "is-negative"}`}>
          <span>Total Return</span>
          <strong>{formatPercent(returnPct)}</strong>
        </div>
        <div className="account-stat">
          <span>Exposure</span>
          <strong>{Math.round(exposurePct * 100)}%</strong>
        </div>
      </div>

      <div className="desk-controls">
        <button className="icon-button" type="button" onClick={onToggleRunning} title={running ? "Pause market" : "Resume market"}>
          {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          <span>{running ? "Pause" : "Play"}</span>
        </button>
        <button className="icon-button" type="button" onClick={onReset} title="Start a fresh run">
          <RotateCcw size={18} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="segmented" aria-label="Market speed">
        {speedOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={speed === option ? "is-active" : ""}
            onClick={() => onSpeedChange(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="segmented segmented--wide" aria-label="Difficulty">
        {difficultyOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={difficulty === option ? "is-active" : ""}
            onClick={() => onDifficultyChange(option)}
            title={DIFFICULTY_CONFIG[option].description}
          >
            {DIFFICULTY_CONFIG[option].label}
          </button>
        ))}
      </div>

      <div className="clock-pill">
        <WalletCards size={16} aria-hidden="true" />
        <span>Tick {tick}</span>
      </div>
    </header>
  );
}
