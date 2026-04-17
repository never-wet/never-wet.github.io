import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page page--stack">
      <section className="panel panel--hero">
        <span className="eyebrow">404</span>
        <h1>Case file not found</h1>
        <p>The route you opened is not part of Puzzle Escape Lab.</p>
        <Link to="/" className="button button--primary">
          Return Home
        </Link>
      </section>
    </div>
  );
}
