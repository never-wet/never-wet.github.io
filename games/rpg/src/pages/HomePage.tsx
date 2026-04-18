import { useNavigate } from "react-router-dom";
import { gameManifest } from "../memory/gameManifest";
import { storyIndex } from "../memory/storyIndex";
import { ArtImage } from "../components/common/ArtImage";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";

export const HomePage = () => {
  const navigate = useNavigate();
  const { latestSave, continueLatest } = useGame();

  return (
    <div className="page-grid home-page">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Single-Player Browser RPG</p>
          <h1>{gameManifest.title}</h1>
          <p className="hero-tagline">{gameManifest.tagline}</p>
          <p className="hero-pitch">{gameManifest.pitch}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("/new-game")} type="button">
              New Game
            </button>
            <button
              className="secondary-button"
              disabled={!latestSave}
              onClick={() => {
                continueLatest();
                navigate("/game");
              }}
              type="button"
            >
              Continue
            </button>
            <button className="secondary-button" onClick={() => navigate("/load")} type="button">
              Load / Save Slots
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <ArtImage assetId="bg-home" alt="Skyglass Spire at dusk" className="hero-art" />
        </div>
      </section>

      <Panel eyebrow="World" title="A fantasy mystery built to be played, not just read">
        <div className="card-grid three-up">
          <article className="feature-card">
            <h3>Story-Driven Adventure</h3>
            <p>Three major chapters, a full prologue, branching choices, betrayal, and an ending shaped by what Rowan decides at the Hollow Star.</p>
          </article>
          <article className="feature-card">
            <h3>Exploration + Combat</h3>
            <p>Travel between a harbor town, forest reach, marsh crossing, flooded abbey, and mirrored spire while taking on scripted encounters and a boss duel.</p>
          </article>
          <article className="feature-card">
            <h3>Local-First Systems</h3>
            <p>Autosave, manual slots, export/import, generated SVG art, procedural audio, quest tracking, inventory, equipment, and journal lore all run in the browser.</p>
          </article>
        </div>
      </Panel>

      <Panel eyebrow="Chapters" title="Campaign Arc">
        <div className="card-grid">
          {gameManifest.chapters.map((chapter) => (
            <article key={chapter.id} className="chapter-card">
              <p className="chapter-label">{chapter.label}</p>
              <h3>{chapter.title}</h3>
              <p>{chapter.description}</p>
              <small>{storyIndex[chapter.id].sceneIds.length} scenes</small>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Conflict" title="What waits in Hollowmere">
        <div className="card-grid three-up">
          <article className="feature-card">
            <h3>The Glass Choir</h3>
            <p>A splinter order that treats memory like territory and wants the Hollow Star restored as a weapon of rule.</p>
          </article>
          <article className="feature-card">
            <h3>The Lantern Guild</h3>
            <p>Messengers, bellkeepers, and archivists trying to keep towns connected before the roads forget them.</p>
          </article>
          <article className="feature-card">
            <h3>The Hollow Star</h3>
            <p>A royal relic that can seal, free, or rewrite the memories of an entire kingdom, depending on whose hands reach it first.</p>
          </article>
        </div>
      </Panel>
    </div>
  );
};
