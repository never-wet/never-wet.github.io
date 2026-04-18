import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { gameManifest } from "../memory/gameManifest";
import { storyIndex } from "../memory/storyIndex";
import { OverworldMap } from "../components/game/OverworldMap";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { createDefaultState } from "../memory/defaultState";

export const HomePage = () => {
  const navigate = useNavigate();
  const { latestSave, continueLatest } = useGame();
  const previewState = useMemo(() => createDefaultState("Rowan"), []);

  return (
    <div className="page-grid home-page">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Graphical Overworld RPG</p>
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
        <div className="hero-visual overworld-hero-preview">
          <div className="overworld-preview-shell">
            <p className="eyebrow">Live Map Preview</p>
            <OverworldMap state={previewState} onMove={() => undefined} onInteract={() => undefined} showControls={false} />
          </div>
        </div>
      </section>

      <Panel eyebrow="World" title="A fantasy mystery built to be played, not just read">
        <div className="card-grid three-up">
          <article className="feature-card">
            <h3>Graphic Overworld</h3>
            <p>Start directly on a live top-down map with a controllable character, tile movement, interact prompts, map exits, and route hotspots.</p>
          </article>
          <article className="feature-card">
            <h3>Routes + Encounters</h3>
            <p>Walk through Thornwake, Gloamwood, Rainmire, the abbey, and the spire while field tiles can trigger repeatable wild encounters.</p>
          </article>
          <article className="feature-card">
            <h3>Separate From Classic</h3>
            <p>This edition keeps its own saves and aims for a more game-like feel than the page-navigation classic build.</p>
          </article>
        </div>
      </Panel>

      <Panel eyebrow="Controls" title="How This Version Plays">
        <div className="card-grid three-up">
          <article className="feature-card">
            <h3>Move</h3>
            <p>`WASD` or arrow keys move Rowan across the map.</p>
          </article>
          <article className="feature-card">
            <h3>Interact</h3>
            <p>Press `E` or `Enter` near NPCs, shops, exits, and story hotspots.</p>
          </article>
          <article className="feature-card">
            <h3>Start</h3>
            <p>New Game drops you straight into Thornwake streets. Walk to the Market Square to start the opening battle.</p>
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
