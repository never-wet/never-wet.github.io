import type { MatchRecord, PersistedAppState } from "../../memory/types";
import { gameTitle } from "../../utils/format";

interface StatsStripProps {
  appState: PersistedAppState;
}

function totalize(records: PersistedAppState["stats"]) {
  return Object.values(records).reduce(
    (acc, stats) => {
      acc.wins += stats.wins;
      acc.losses += stats.losses;
      acc.draws += stats.draws;
      acc.played += stats.played;
      acc.bestStreak = Math.max(acc.bestStreak, stats.bestStreak);
      return acc;
    },
    { wins: 0, losses: 0, draws: 0, played: 0, bestStreak: 0 },
  );
}

function findCurrentSave(appState: PersistedAppState) {
  return Object.values(appState.saves).find((save) => save && !save.isComplete) ?? null;
}

function winRate(records: PersistedAppState["stats"]): number {
  const totals = totalize(records);
  return totals.played ? Math.round((totals.wins / totals.played) * 100) : 0;
}

export function StatsStrip({ appState }: StatsStripProps) {
  const totals = totalize(appState.stats);
  const currentSave = findCurrentSave(appState);

  const items = [
    { label: "Games Played", value: String(totals.played) },
    { label: "Wins", value: String(totals.wins) },
    { label: "Losses", value: String(totals.losses) },
    { label: "Draws", value: String(totals.draws) },
    { label: "Win Rate", value: `${winRate(appState.stats)}%` },
    { label: "Best Streak", value: String(totals.bestStreak) },
    { label: "Resume", value: currentSave ? gameTitle(currentSave.gameId) : "Nothing pending" },
  ];

  return (
    <section className="stats-strip">
      {items.map((item) => (
        <article className="surface-card stat-tile" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

export function RecentMatches({ matches }: { matches: MatchRecord[] }) {
  if (!matches.length) {
    return (
      <div className="surface-card empty-panel">
        <h3>Recent Matches</h3>
        <p>Your completed games will appear here once you finish a match.</p>
      </div>
    );
  }

  return (
    <div className="surface-card timeline-card">
      <div className="panel-heading">
        <h3>Recent Matches</h3>
        <span>{matches.length} logged</span>
      </div>
      <div className="timeline-list">
        {matches.map((match) => (
          <article className={`timeline-item is-${match.result}`} key={match.id}>
            <div>
              <strong>{gameTitle(match.gameId)}</strong>
              <p>{match.summary}</p>
            </div>
            <div className="timeline-meta">
              <span>{match.result.toUpperCase()}</span>
              <span>{match.difficulty}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
