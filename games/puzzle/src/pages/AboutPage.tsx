import { Link } from "react-router-dom";
import { PageHero } from "../components/layout/PageHero";
import { gameManifest } from "../memory/gameManifest";

export function AboutPage() {
  return (
    <div className="page page--stack">
      <PageHero
        eyebrow="About & Help"
        title="How Puzzle Escape Lab works"
        description="Original puzzles, local-only persistence, reusable scene systems, and a memory-file architecture built for easy expansion."
      />

      <section className="settings-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>How to play</h2>
          </div>
          <ul className="detail-list">
            <li>Start from Home or All Puzzles and open any unlocked puzzle.</li>
            <li>Use hints when needed, but expect a score penalty.</li>
            <li>Enter Escape Mode to inspect scenes, collect items, and solve linked puzzles.</li>
            <li>View Mode tracks solved cases, timestamps, hints, room progress, and completion stats.</li>
          </ul>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>What is saved locally</h2>
          </div>
          <ul className="detail-list">
            <li>Solved and started puzzles</li>
            <li>Started and solved timestamps</li>
            <li>Hints used, score, and best time</li>
            <li>Escape room progress, unlocked scenes, and inventory</li>
            <li>Settings and recent activity</li>
          </ul>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Built-in categories</h2>
          </div>
          <ul className="detail-list">
            {gameManifest.categories.map((category) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Developer docs</h2>
        </div>
        <p>
          The compact memory files live in <code>src/memory</code>, with detailed instructions in
          <code> docs/ARCHITECTURE.md</code>.
        </p>
        <Link to="/puzzles" className="button button--primary">
          Explore the puzzle catalog
        </Link>
      </section>
    </div>
  );
}
