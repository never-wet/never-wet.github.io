import { Link } from "react-router-dom";
import { StatsStrip } from "../components/dashboard/StatsStrip";
import { GameCard } from "../components/ui/GameCard";
import { useAppContext } from "../context/AppContext";
import { gameManifest } from "../memory/gameManifest";
import { gameIndex } from "../memory/gameIndex";
import { formatDateTime, gameTitle } from "../utils/format";

export function HomePage() {
  const { appState } = useAppContext();
  const featuredGames = gameManifest.featuredGames.map((gameId) => gameIndex[gameId]);
  const resumable = appState.lastPlayedGameId
    ? appState.saves[appState.lastPlayedGameId]
    : Object.values(appState.saves).find((save) => save && !save.isComplete);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Modern Board Game Hub</p>
          <h1>Boardgame Vault</h1>
          <p>
            Choose a classic, tune the AI, resume local saves, and track your streaks across
            polished browser-based strategy boards.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/games">
              Browse all games
            </Link>
            {resumable ? (
              <Link className="secondary-button" to={`/play/${resumable.gameId}`}>
                Continue {gameTitle(resumable.gameId)}
              </Link>
            ) : (
              <Link className="secondary-button" to="/dashboard">
                View dashboard
              </Link>
            )}
          </div>
        </div>
        <aside className="hero-side-panel surface-card">
          <h2>Progress Snapshot</h2>
          <dl>
            <div>
              <dt>Last played</dt>
              <dd>{gameTitle(appState.lastPlayedGameId)}</dd>
            </div>
            <div>
              <dt>Autosave</dt>
              <dd>{resumable ? formatDateTime(resumable.updatedAt) : "No open game"}</dd>
            </div>
            <div>
              <dt>Theme</dt>
              <dd>{appState.settings.theme}</dd>
            </div>
            <div>
              <dt>Rules</dt>
              <dd>Built into every game screen</dd>
            </div>
          </dl>
        </aside>
      </section>

      <StatsStrip appState={appState} />

      <section className="section-header">
        <div>
          <p className="eyebrow">Featured Boards</p>
          <h2>Start with the heavy hitters</h2>
        </div>
        <Link className="text-link" to="/games">
          See all six games
        </Link>
      </section>

      <section className="card-grid">
        {featuredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
    </div>
  );
}
