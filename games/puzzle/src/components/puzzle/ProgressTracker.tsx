import { useGame } from "../../hooks/useGame";
import { formatPercent } from "../../lib/game/format";
import { gameManifest } from "../../memory/gameManifest";

export function ProgressTracker() {
  const { state } = useGame();

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Progress Tracker</h2>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Solved</span>
          <strong>{state.stats.totalSolved}</strong>
        </div>
        <div className="stat-card">
          <span>Started</span>
          <strong>{state.stats.totalStarted}</strong>
        </div>
        <div className="stat-card">
          <span>Hints Used</span>
          <strong>{state.stats.totalHintsUsed}</strong>
        </div>
        <div className="stat-card">
          <span>Streak</span>
          <strong>{state.stats.streakDays} days</strong>
        </div>
      </div>
      <div className="progress-list">
        {gameManifest.categories.map((category) => {
          const percent = state.stats.categoryCompletion[category.id] ?? 0;
          return (
            <div key={category.id} className="progress-list__item">
              <div>
                <strong>{category.name}</strong>
                <small>{formatPercent(percent)}</small>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${percent}%`, background: category.accent }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
