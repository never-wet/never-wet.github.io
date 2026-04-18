import { RecentMatches, StatsStrip } from "../components/dashboard/StatsStrip";
import { useAppContext } from "../context/AppContext";
import { gameIndex } from "../memory/gameIndex";
import { formatDateTime } from "../utils/format";

export function DashboardPage() {
  const { appState } = useAppContext();

  return (
    <div className="page-stack">
      <section className="section-heading surface-card">
        <p className="eyebrow">View Mode</p>
        <h1>Performance dashboard</h1>
        <p>
          Check total results, streaks, unfinished saves, and the last-used difficulty across every
          board in the vault.
        </p>
      </section>

      <StatsStrip appState={appState} />

      <section className="dashboard-grid">
        <div className="surface-card breakdown-card">
          <div className="panel-heading">
            <h3>By Game</h3>
            <span>{Object.keys(gameIndex).length} active boards</span>
          </div>
          <div className="breakdown-list">
            {Object.values(gameIndex).map((game) => {
              const stats = appState.stats[game.id];
              const save = appState.saves[game.id];
              const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;

              return (
                <article className="breakdown-item" key={game.id}>
                  <div>
                    <h4>{game.title}</h4>
                    <p>
                      {stats.played} played, {winRate}% win rate, last difficulty{" "}
                      {stats.lastDifficulty ?? "none"}
                    </p>
                  </div>
                  <div className="mini-bars" aria-hidden="true">
                    <span style={{ width: `${Math.max(6, stats.wins * 18)}px` }} />
                    <span style={{ width: `${Math.max(6, stats.losses * 18)}px` }} />
                    <span style={{ width: `${Math.max(6, stats.draws * 18)}px` }} />
                  </div>
                  <div className="breakdown-meta">
                    <strong>{save && !save.isComplete ? "Resume available" : "No live save"}</strong>
                    <span>{formatDateTime(stats.lastPlayedAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <RecentMatches matches={appState.recentMatches} />
      </section>
    </div>
  );
}
