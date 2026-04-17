import { useState } from "react";
import { ActivityLog } from "../components/dashboard/ActivityLog";
import { PageHero } from "../components/layout/PageHero";
import { ProgressTracker } from "../components/puzzle/ProgressTracker";
import { useGame } from "../hooks/useGame";
import { formatDateTime } from "../lib/game/format";

export function DashboardPage() {
  const { state, puzzles, rooms, getPuzzleStatus, getRoomStatus } = useGame();
  const [tab, setTab] = useState<"overview" | "puzzles" | "rooms" | "activity">("overview");
  const [filter, setFilter] = useState("all");

  const filteredPuzzles = puzzles.filter((puzzle) => filter === "all" || getPuzzleStatus(puzzle.id) === filter);

  return (
    <div className="page page--stack">
      <PageHero
        eyebrow="View Mode"
        title="Progress Dashboard"
        description="Track your active puzzle, solved cases, category completion, hint usage, room progress, and timestamps in one place."
      />

      <section className="panel tabs">
        {["overview", "puzzles", "rooms", "activity"].map((item) => (
          <button
            key={item}
            type="button"
            className={`tab ${tab === item ? "tab--active" : ""}`}
            onClick={() => setTab(item as typeof tab)}
          >
            {item}
          </button>
        ))}
      </section>

      {tab === "overview" ? (
        <>
          <section className="dashboard-grid">
            <ProgressTracker />
            <section className="panel">
              <div className="section-heading">
                <h2>Current Focus</h2>
              </div>
              <div className="stat-grid">
                <div className="stat-card">
                  <span>Current puzzle</span>
                  <strong>{state.currentPuzzleId ?? "None selected"}</strong>
                </div>
                <div className="stat-card">
                  <span>Last played</span>
                  <strong>{formatDateTime(state.stats.lastPlayedAt)}</strong>
                </div>
                <div className="stat-card">
                  <span>Solved total</span>
                  <strong>{state.stats.totalSolved}</strong>
                </div>
                <div className="stat-card">
                  <span>Locked now</span>
                  <strong>{puzzles.filter((puzzle) => getPuzzleStatus(puzzle.id) === "locked").length}</strong>
                </div>
              </div>
            </section>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>Escape Room Progress</h2>
            </div>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Current Scene</th>
                    <th>Items</th>
                    <th>Started</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const progress = state.escapeProgress[room.id];
                    return (
                      <tr key={room.id}>
                        <td>{room.title}</td>
                        <td>{getRoomStatus(room.id)}</td>
                        <td>{progress?.currentSceneId ?? room.scenes[0].id}</td>
                        <td>{progress?.collectedItemIds.length ?? 0}</td>
                        <td>{formatDateTime(progress?.startedAt)}</td>
                        <td>{formatDateTime(progress?.completedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {tab === "puzzles" ? (
        <>
          <section className="panel filters">
            <label className="field">
              <span>Status filter</span>
              <select className="select-input" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="solved">Solved</option>
                <option value="started">Started</option>
                <option value="available">Available</option>
                <option value="locked">Locked</option>
              </select>
            </label>
          </section>
          <section className="panel">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Puzzle</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Solved</th>
                    <th>Hints</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPuzzles.map((puzzle) => {
                    const status = getPuzzleStatus(puzzle.id);
                    const progress = state.puzzleProgress[puzzle.id];
                    return (
                      <tr key={puzzle.id}>
                        <td>{puzzle.title}</td>
                        <td>{status}</td>
                        <td>{formatDateTime(progress?.startedAt)}</td>
                        <td>{formatDateTime(progress?.solvedAt)}</td>
                        <td>{progress?.hintsUsed ?? 0}</td>
                        <td>{progress?.score ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {tab === "rooms" ? (
        <section className="room-grid">
          {rooms.map((room) => {
            const progress = state.escapeProgress[room.id];
            return (
              <article key={room.id} className="panel room-card">
                <div className="room-card__header">
                  <h2>{room.title}</h2>
                  <span>{getRoomStatus(room.id)}</span>
                </div>
                <p>{room.tagline}</p>
                <ul className="detail-list">
                  <li>Current scene: {progress?.currentSceneId ?? room.scenes[0].id}</li>
                  <li>Visited scenes: {progress?.visitedSceneIds.length ?? 0}</li>
                  <li>Unlocked scenes: {progress?.unlockedSceneIds.length ?? 1}</li>
                  <li>Collected items: {progress?.collectedItemIds.length ?? 0}</li>
                </ul>
              </article>
            );
          })}
        </section>
      ) : null}

      {tab === "activity" ? <ActivityLog entries={state.recentActivity} /> : null}
    </div>
  );
}
