import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="surface-card section-heading">
      <p className="eyebrow">Missing Route</p>
      <h1>That board wasn&apos;t found.</h1>
      <p>The page may have moved, but the game hub is still waiting for you.</p>
      <Link className="primary-button" to="/games">
        Back to games
      </Link>
    </section>
  );
}
