import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArtImage } from "../components/common/ArtImage";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";

export const NewGamePage = () => {
  const navigate = useNavigate();
  const { startNewGame } = useGame();
  const [name, setName] = useState("Rowan");

  return (
    <div className="page-grid">
      <section className="hero-card compact">
        <div className="hero-copy">
          <p className="eyebrow">Prologue Setup</p>
          <h1>Step into the rain.</h1>
          <p>Choose Rowan's public name and begin at Thornwake on the night the western bell rings by itself.</p>
          <label className="field">
            <span>Name</span>
            <input maxLength={18} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => {
                startNewGame(name.trim() || "Rowan");
                navigate("/game");
              }}
              type="button"
            >
              Begin Prologue
            </button>
            <button className="secondary-button" onClick={() => navigate("/")} type="button">
              Back
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <ArtImage assetId="portrait-rowan" alt="Rowan portrait" className="hero-art portrait-only" />
        </div>
      </section>

      <Panel eyebrow="Opening Promise" title="The first hour includes">
        <ul className="plain-list">
          <li>Thornwake under attack and a full opening combat sequence</li>
          <li>Mira Quill, Nessa Reed, Brother Caldus, and the first layers of the abbey mystery</li>
          <li>Main quests, side quests, branching dialogue, equipment, inventory, journal lore, and autosave</li>
        </ul>
      </Panel>
    </div>
  );
};
