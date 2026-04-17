import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HintPanel } from "../components/puzzle/HintPanel";
import { PuzzleLayout } from "../components/puzzle/PuzzleLayout";
import { PuzzleRenderer } from "../components/puzzle/PuzzleRenderer";
import { PuzzleTimer } from "../components/puzzle/PuzzleTimer";
import { UnlockSystem } from "../components/puzzle/UnlockSystem";
import { useGame } from "../hooks/useGame";
import { formatDateTime } from "../lib/game/format";
import { contentRegistry } from "../memory/contentRegistry";

export function PuzzlePage() {
  const { puzzleId } = useParams();
  const { state, startPuzzle, getPuzzleStatus } = useGame();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const puzzle = puzzleId ? contentRegistry[puzzleId] : undefined;
  const progress = puzzle ? state.puzzleProgress[puzzle.id] : undefined;
  const status = puzzle ? getPuzzleStatus(puzzle.id) : "locked";

  useEffect(() => {
    if (puzzle && status !== "locked") {
      startPuzzle(puzzle.id);
    }
  }, [puzzle?.id, startPuzzle, status, puzzle]);

  if (!puzzle) {
    return (
      <div className="page page--stack">
        <section className="panel">
          <h1>Puzzle not found</h1>
          <p>The requested case file does not exist in the registry.</p>
          <Link to="/puzzles" className="button button--primary">
            Back to All Puzzles
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page page--stack">
      <PuzzleLayout
        puzzle={puzzle}
        status={status}
        meta={
          <div className="inline-meta">
            <PuzzleTimer
              enabled={state.settings.timerEnabled}
              startedAt={progress?.startedAt}
              onElapsedChange={setElapsedSeconds}
            />
            <div className="stat-pill">
              <span>Started</span>
              <strong>{formatDateTime(progress?.startedAt)}</strong>
            </div>
            <div className="stat-pill">
              <span>Solved</span>
              <strong>{formatDateTime(progress?.solvedAt)}</strong>
            </div>
            <div className="stat-pill">
              <span>Score</span>
              <strong>{progress?.score ?? 0}</strong>
            </div>
          </div>
        }
        side={
          <>
            <HintPanel puzzle={puzzle} hintsUsed={progress?.hintsUsed ?? 0} />
            <UnlockSystem puzzle={puzzle} />
          </>
        }
      >
        {status === "locked" ? (
          <div className="empty-state">
            <h2>This puzzle is still locked.</h2>
            <p>{puzzle.unlock.description ?? "Solve more puzzles to unlock this case."}</p>
            <Link to="/puzzles" className="button button--ghost">
              Explore unlocked puzzles
            </Link>
          </div>
        ) : (
          <PuzzleRenderer puzzle={puzzle} progress={progress} elapsedSeconds={elapsedSeconds} />
        )}
      </PuzzleLayout>
    </div>
  );
}
