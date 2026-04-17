import type { ReactNode } from "react";
import { gameManifest } from "../../memory/gameManifest";
import type { PuzzleDefinition } from "../../memory/types";
import { Badge } from "../common/Badge";

export function PuzzleLayout({
  puzzle,
  status,
  meta,
  children,
  side,
}: {
  puzzle: PuzzleDefinition;
  status: string;
  meta?: ReactNode;
  children: ReactNode;
  side: ReactNode;
}) {
  const category = gameManifest.categories.find((entry) => entry.id === puzzle.category);

  return (
    <div className="puzzle-layout">
      <section className="panel panel--hero">
        <div className="puzzle-layout__hero">
          <div>
            <span className="eyebrow">{category?.name ?? puzzle.category}</span>
            <h1>{puzzle.title}</h1>
            <p>{puzzle.description}</p>
          </div>
          <div className="puzzle-layout__hero-meta">
            <Badge tone="accent">{puzzle.difficulty}</Badge>
            <Badge>{puzzle.estimatedTime} min</Badge>
            <Badge tone={status === "solved" ? "success" : status === "locked" ? "warning" : "accent"}>{status}</Badge>
          </div>
        </div>
        <div className="puzzle-layout__instruction">
          <strong>Instructions</strong>
          <p>{puzzle.instructions}</p>
        </div>
        {meta}
      </section>

      <div className="puzzle-layout__grid">
        <section className="panel">{children}</section>
        <div className="puzzle-layout__sidebar">{side}</div>
      </div>
    </div>
  );
}
