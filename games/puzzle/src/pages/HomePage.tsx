import { Link } from "react-router-dom";
import { ActivityLog } from "../components/dashboard/ActivityLog";
import { CategoryBrowser } from "../components/puzzle/CategoryBrowser";
import { ProgressTracker } from "../components/puzzle/ProgressTracker";
import { PuzzleCard } from "../components/puzzle/PuzzleCard";
import { useGame } from "../hooks/useGame";
import { gameManifest } from "../memory/gameManifest";
import { contentRegistry } from "../memory/contentRegistry";

export function HomePage() {
  const { rooms, state, getPuzzleStatus, getResumeRoute, puzzles } = useGame();
  const featuredPuzzles = gameManifest.featuredChallengeIds
    .map((id) => contentRegistry[id])
    .filter(Boolean);
  const hasProgress = state.stats.totalStarted > 0 || Object.keys(state.escapeProgress).length > 0;
  const unlockedCount = puzzles.filter((puzzle) => getPuzzleStatus(puzzle.id) !== "locked").length;
  const activeRoom = Object.values(state.escapeProgress).find((progress) => progress.status === "in_progress");
  const protocolRows = [
    { label: "ACTIVE_NODE", value: state.currentPuzzleId ? state.currentPuzzleId.replace(/-/g, "_").toUpperCase() : "STANDBY" },
    { label: "UNLOCKED", value: `${unlockedCount}/${puzzles.length}` },
    { label: "ESCAPE_ROOMS", value: `${rooms.length}` },
    { label: "STREAK", value: `${state.stats.streakDays}_DAYS` },
  ];
  const moduleSignals = [
    "Pattern matrices and sequence systems",
    "Battle-of-wits deduction and truth-lie duels",
    "Cipher labs, symbol decoders, and keypad locks",
    "Observation scenes, hidden objects, and meta escape chains",
  ];

  return (
    <div className="page page--stack page--home">
      <section className="landing-hero kinetic-grid">
        <div className="landing-hero__copy">
          <span className="signal-label">CONNECTION_STABLE // LOCAL_STATE_SYNCED</span>
          <h1 className="landing-hero__title">
            <span>THE PUZZLE</span>
            <span className="landing-hero__accent">PROTOCOL</span>
          </h1>
          <p className="landing-hero__description">
            Puzzle Escape Lab is a multi-layered puzzle terminal with logic trials, deduction battles,
            cipher systems, clickable scenes, and full escape-room progression wired into one local-first archive.
          </p>
          <div className="page-hero__actions">
            <Link to="/puzzles" className="button button--primary">
              Initiate Protocol
            </Link>
            {hasProgress ? (
              <Link to={getResumeRoute()} className="button button--ghost">
                Resume Sequence
              </Link>
            ) : null}
            <Link to="/dashboard" className="button button--subtle">
              View Data Logs
            </Link>
          </div>
        </div>

        <aside className="hero-terminal">
          <div className="hero-terminal__heading">
            <span className="eyebrow">SYSTEM_STATE</span>
            <strong>LOCAL_PROTOCOL_ONLINE</strong>
          </div>
          <div className="hero-terminal__rows">
            {protocolRows.map((row) => (
              <div key={row.label} className="hero-terminal__row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
          <div className="hero-terminal__bars">
            <span style={{ width: "100%" }} />
            <span style={{ width: "74%" }} />
            <span style={{ width: "58%" }} />
          </div>
        </aside>
      </section>

      <section className="home-bento">
        <article className="module module--feature">
          <span className="eyebrow">MODULE_01 // PUZZLE_FAMILIES</span>
          <h2>Pattern. Cipher. Observation.</h2>
          <p>
            Every system is built into one archive: Mensa-style matrices, route logic, signal decoding,
            scene inspection, passcode chains, and meta puzzles that synthesize earlier answers.
          </p>
          <div className="home-signal-list">
            {moduleSignals.map((signal, index) => (
              <div key={signal} className="signal-row">
                <span className="signal-row__index">{String(index + 1).padStart(2, "0")}</span>
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </article>

        <Link to="/escape" className="module module--accent">
          <span className="module__tag">ESCAPE_MODE_UNLOCKED</span>
          <h3>Multi-room progression</h3>
          <p>Branch through scenes, inspect hotspots, collect inventory, combine items, and unlock facility exits.</p>
        </Link>

        <article className="module module--metric">
          <span className="module__tag">TOTAL_NODES</span>
          <strong>{Object.keys(contentRegistry).length}</strong>
          <small>Built-in puzzle files</small>
        </article>

        <article className="module module--metric">
          <span className="module__tag">RESOLVED</span>
          <strong>{state.stats.totalSolved}</strong>
          <small>Cases completed locally</small>
        </article>

        <article className="module module--logs">
          <span className="module__tag">ACTIVE_FILE</span>
          <h3>
            {state.currentPuzzleId
              ? contentRegistry[state.currentPuzzleId]?.title ?? "Unknown Node"
              : activeRoom
                ? activeRoom.roomId.replace(/-/g, "_").toUpperCase()
                : "STANDBY"}
          </h3>
          <p>
            {state.currentPuzzleId
              ? "Current puzzle progress is stored locally and can be resumed immediately."
              : activeRoom
                ? "An escape-room branch is active and ready to resume from the current scene."
                : "Starter nodes are already open. No login, no sync server, no reset pressure."}
          </p>
        </article>

        <article className="module module--rooms">
          <span className="module__tag">ESCAPE_NETWORK</span>
          <div className="room-strip">
            {rooms.map((room) => (
              <Link key={room.id} to={`/escape/${room.id}`} className="room-strip__card">
                <strong>{room.title}</strong>
                <span>{room.tagline}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Featured Nodes</h2>
          <Link to="/puzzles" className="button button--ghost">
            Open Directory
          </Link>
        </div>
        <div className="featured-node-grid">
          {featuredPuzzles.map((puzzle) => (
            <PuzzleCard key={puzzle.id} puzzle={puzzle} status={getPuzzleStatus(puzzle.id)} />
          ))}
        </div>
      </section>

      <section className="home-lower-grid">
        <section className="section-block">
          <div className="section-heading">
            <h2>Nodal Directory</h2>
            <Link to="/puzzles" className="button button--subtle">
              Browse Categories
            </Link>
          </div>
          <CategoryBrowser />
        </section>
        <div className="dashboard-grid">
          <ProgressTracker />
          <ActivityLog entries={state.recentActivity} limit={6} />
        </div>
      </section>
    </div>
  );
}
