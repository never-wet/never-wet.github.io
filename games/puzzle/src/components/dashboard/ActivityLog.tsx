import { formatDateTime } from "../../lib/game/format";
import type { ActivityEntry } from "../../memory/types";

export function ActivityLog({
  entries,
  title = "Recent Activity",
  limit,
}: {
  entries: ActivityEntry[];
  title?: string;
  limit?: number;
}) {
  const list = typeof limit === "number" ? entries.slice(0, limit) : entries;

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      <div className="activity-log">
        {list.length === 0 ? (
          <p className="muted">No activity yet. Start a puzzle or explore an escape room to begin the log.</p>
        ) : (
          list.map((entry) => (
            <article key={entry.id} className="activity-log__item">
              <div>
                <strong>{entry.label}</strong>
                <p>{entry.detail ?? "Progress saved locally."}</p>
              </div>
              <time>{formatDateTime(entry.timestamp)}</time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
