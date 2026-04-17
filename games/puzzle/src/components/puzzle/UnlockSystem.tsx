import { useGame } from "../../hooks/useGame";
import { getPuzzleById } from "../../lib/game/progression";
import type { PuzzleDefinition } from "../../memory/types";
import { Badge } from "../common/Badge";

export function UnlockSystem({ puzzle }: { puzzle: PuzzleDefinition }) {
  const { getPuzzleStatus } = useGame();

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Unlock System</h2>
      </div>
      <p className="muted">{puzzle.unlock.description ?? "Starter puzzle. No prerequisite lock."}</p>
      <div className="unlock-links">
        {puzzle.relatedPuzzles.length === 0 ? (
          <p className="muted">No related follow-up cases registered.</p>
        ) : (
          puzzle.relatedPuzzles.map((relatedId) => {
            const relatedPuzzle = getPuzzleById(relatedId);
            if (!relatedPuzzle) {
              return null;
            }

            const status = getPuzzleStatus(relatedId);
            return (
              <div key={relatedId} className="unlock-links__item">
                <strong>{relatedPuzzle.title}</strong>
                <Badge tone={status === "solved" ? "success" : status === "locked" ? "warning" : "accent"}>{status}</Badge>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
