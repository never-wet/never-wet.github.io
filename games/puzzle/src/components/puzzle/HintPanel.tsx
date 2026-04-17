import { useGame } from "../../hooks/useGame";
import type { PuzzleDefinition } from "../../memory/types";

export function HintPanel({
  puzzle,
  hintsUsed,
}: {
  puzzle: PuzzleDefinition;
  hintsUsed: number;
}) {
  const { useHint, revealAnswer } = useGame();
  const visibleHints = puzzle.hints.slice(0, hintsUsed);
  const nextHint = puzzle.hints[hintsUsed];

  return (
    <aside className="panel hint-panel">
      <div className="section-heading">
        <h2>Hint Panel</h2>
        <span>{hintsUsed}/{puzzle.hints.length}</span>
      </div>
      <div className="hint-panel__list">
        {visibleHints.length === 0 ? <p className="muted">No hints used yet.</p> : null}
        {visibleHints.map((hint) => (
          <article key={hint.id} className="hint-panel__item">
            <strong>{hint.title}</strong>
            <p>{hint.text}</p>
            <small>Penalty: -{hint.penalty} score</small>
          </article>
        ))}
      </div>
      <div className="hint-panel__actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => nextHint && useHint(puzzle.id, nextHint.id)}
          disabled={!nextHint}
        >
          Reveal Next Hint
        </button>
        <button type="button" className="button button--subtle" onClick={() => revealAnswer(puzzle.id)}>
          Reveal Answer
        </button>
      </div>
    </aside>
  );
}
