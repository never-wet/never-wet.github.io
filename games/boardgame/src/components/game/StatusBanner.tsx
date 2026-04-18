import type { GameStatus } from "../../memory/types";

interface StatusBannerProps {
  status: GameStatus;
  thinking: boolean;
}

export function StatusBanner({ status, thinking }: StatusBannerProps) {
  return (
    <section className={`status-banner is-${status.phase}`}>
      <div>
        <p className="eyebrow">Match Status</p>
        <h2>{thinking ? "Computer thinking..." : status.headline}</h2>
        <p>{status.detail}</p>
      </div>
      <span className="status-pill">{thinking ? "AI" : status.phase.toUpperCase()}</span>
    </section>
  );
}
