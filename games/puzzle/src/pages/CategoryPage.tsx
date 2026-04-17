import { Link, useParams } from "react-router-dom";
import { PageHero } from "../components/layout/PageHero";
import { PuzzleCard } from "../components/puzzle/PuzzleCard";
import { useGame } from "../hooks/useGame";
import { gameManifest } from "../memory/gameManifest";

export function CategoryPage() {
  const { categoryId } = useParams();
  const { puzzles, getPuzzleStatus } = useGame();
  const category = gameManifest.categories.find((entry) => entry.id === categoryId);
  const categoryPuzzles = puzzles.filter((puzzle) => puzzle.category === categoryId);

  if (!category) {
    return (
      <div className="page page--stack">
        <PageHero eyebrow="Unknown Category" title="Category not found" description="Try the full puzzle browser instead." />
        <Link to="/puzzles" className="button button--primary">
          Back to All Puzzles
        </Link>
      </div>
    );
  }

  return (
    <div className="page page--stack">
      <PageHero eyebrow="Category File" title={category.name} description={category.blurb} />
      <section className="card-grid">
        {categoryPuzzles.map((puzzle) => (
          <PuzzleCard key={puzzle.id} puzzle={puzzle} status={getPuzzleStatus(puzzle.id)} />
        ))}
      </section>
    </div>
  );
}
