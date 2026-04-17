import { Link } from "react-router-dom";
import { gameManifest } from "../../memory/gameManifest";
import type { PuzzleDefinition, PuzzleStatus } from "../../memory/types";
import { Badge } from "../common/Badge";

export function PuzzleCard({
  puzzle,
  status,
}: {
  puzzle: PuzzleDefinition;
  status: PuzzleStatus;
}) {
  const category = gameManifest.categories.find((entry) => entry.id === puzzle.category);

  return (
    <Link to={`/puzzle/${puzzle.id}`} className={`puzzle-card ${status === "locked" ? "puzzle-card--locked" : ""}`}>
      <div className="puzzle-card__node">{puzzle.id.replace(/-/g, "_").toUpperCase()}</div>
      <div className="puzzle-card__top">
        <div>
          <span className="eyebrow">{category?.name ?? puzzle.category}</span>
          <h3>{puzzle.title}</h3>
        </div>
        <Badge tone={status === "solved" ? "success" : status === "locked" ? "warning" : "accent"}>{status}</Badge>
      </div>

      <p>{puzzle.description}</p>

      <div className="puzzle-card__meta">
        <Badge>{puzzle.difficulty}</Badge>
        <Badge>{puzzle.estimatedTime} min</Badge>
        <Badge>{puzzle.type}</Badge>
      </div>

      <div className="puzzle-card__tags">
        {puzzle.tags.slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </Link>
  );
}
