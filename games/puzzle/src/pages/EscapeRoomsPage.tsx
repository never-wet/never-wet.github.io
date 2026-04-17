import { Link } from "react-router-dom";
import { PageHero } from "../components/layout/PageHero";
import { useGame } from "../hooks/useGame";
import { Badge } from "../components/common/Badge";

export function EscapeRoomsPage() {
  const { rooms, getRoomStatus, state } = useGame();

  return (
    <div className="page page--stack">
      <PageHero
        eyebrow="Escape Mode"
        title="Three original escape rooms"
        description="Click through connected scenes, collect inventory, combine items, solve linked puzzles, and escape entire facilities with local-only persistence."
      />

      <section className="room-grid">
        {rooms.map((room) => {
          const status = getRoomStatus(room.id);
          const progress = state.escapeProgress[room.id];

          return (
            <article key={room.id} className="panel room-card">
              <div className="room-card__header">
                <div>
                  <span className="eyebrow">{room.difficulty}</span>
                  <h2>{room.title}</h2>
                </div>
                <Badge tone={status === "escaped" ? "success" : status === "locked" ? "warning" : "accent"}>{status}</Badge>
              </div>
              <p>{room.blurb}</p>
              <div className="room-card__meta">
                <span>{room.estimatedTime} min</span>
                <span>{room.scenes.length} scenes</span>
                <span>{progress?.collectedItemIds.length ?? 0} items found</span>
              </div>
              <p className="muted">{room.unlock.description ?? "Available immediately."}</p>
              <Link to={`/escape/${room.id}`} className="button button--primary">
                {status === "locked" ? "View Requirements" : status === "escaped" ? "Replay Room" : "Enter Room"}
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
