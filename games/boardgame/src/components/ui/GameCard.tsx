import { Link } from "react-router-dom";
import type { GameCardMeta } from "../../memory/types";

interface GameCardProps {
  game: GameCardMeta;
  subtitle?: string;
}

export function GameCard({ game, subtitle }: GameCardProps) {
  return (
    <article className="surface-card game-card">
      <div className="card-header">
        <span className="card-tag">{game.tag}</span>
        <span className="hero-metric" style={{ color: game.accent }}>
          {game.heroMetric}
        </span>
      </div>
      <h3>{game.title}</h3>
      <p>{subtitle ?? game.longDescription}</p>
      <ul className="card-bullets">
        {game.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <div className="card-footer">
        <span className="board-shape">{game.boardShape}</span>
        <Link className="primary-button" to={`/play/${game.id}`}>
          Play {game.title}
        </Link>
      </div>
    </article>
  );
}
