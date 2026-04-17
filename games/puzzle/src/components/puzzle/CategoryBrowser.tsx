import { Link } from "react-router-dom";
import { useGame } from "../../hooks/useGame";
import { gameManifest } from "../../memory/gameManifest";

export function CategoryBrowser() {
  const { state } = useGame();

  return (
    <div className="category-grid">
      {gameManifest.categories.map((category) => (
        <Link key={category.id} to={category.route} className="category-card panel">
          <span className="category-card__icon" style={{ borderColor: `${category.accent}66`, color: category.accent }}>
            {category.icon}
          </span>
          <div>
            <strong>{category.name}</strong>
            <p>{category.blurb}</p>
          </div>
          <div className="category-card__footer">
            <small>{category.heroMetric}</small>
            <span>{state.stats.categoryCompletion[category.id] ?? 0}% complete</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
