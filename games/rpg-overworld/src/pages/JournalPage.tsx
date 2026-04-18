import { useState } from "react";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { getJournalEntries } from "../lib/game/selectors";

export const JournalPage = () => {
  const { state } = useGame();
  const [filter, setFilter] = useState<"all" | "lore" | "character" | "location" | "faction" | "event">("all");

  const entries = getJournalEntries(state).filter((entry) => filter === "all" || entry.category === filter);

  return (
    <div className="page-grid">
      <Panel
        eyebrow="Journal"
        title="Unlocked Lore"
        actions={
          <div className="chip-row">
            {(["all", "lore", "character", "location", "faction", "event"] as const).map((value) => (
              <button key={value} className={`chip ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)} type="button">
                {value}
              </button>
            ))}
          </div>
        }
      >
        <div className="stack-actions">
          {entries.map((entry) => (
            <article key={entry.id} className="journal-entry">
              <h3>{entry.title}</h3>
              <small>{entry.category}</small>
              {entry.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
};
