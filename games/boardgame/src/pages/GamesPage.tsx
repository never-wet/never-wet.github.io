import { GameCard } from "../components/ui/GameCard";
import { gameIndex } from "../memory/gameIndex";

export function GamesPage() {
  return (
    <div className="page-stack">
      <section className="section-heading surface-card">
        <p className="eyebrow">Game Selection Hub</p>
        <h1>Pick your next match</h1>
        <p>
          Every game includes AI difficulty settings, move history, autosave resume, and a rules
          reference directly in the play screen.
        </p>
      </section>
      <section className="card-grid">
        {Object.values(gameIndex).map((game) => (
          <GameCard key={game.id} game={game} subtitle={game.shortDescription} />
        ))}
      </section>
    </div>
  );
}
