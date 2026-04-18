import { Panel } from "../components/common/Panel";

export const CreditsPage = () => (
  <div className="page-grid">
    <Panel eyebrow="About" title="Hollowmere Credits">
      <div className="stack-actions">
        <article className="feature-card">
          <h3>Design Direction</h3>
          <p>Dark fantasy mystery, browser-first architecture, local persistence, modular data files, and procedural fallback assets.</p>
        </article>
        <article className="feature-card">
          <h3>Systems</h3>
          <p>React, TypeScript, Vite, hash-based routing, localStorage saves, generated SVG art, and Web Audio placeholder scoring.</p>
        </article>
        <article className="feature-card">
          <h3>Story</h3>
          <p>Original worldbuilding for Thornwake, Gloamwood Reach, Saint Veyra Abbey, Skyglass Spire, the Glass Choir, and the Hollow Star.</p>
        </article>
      </div>
    </Panel>
  </div>
);
