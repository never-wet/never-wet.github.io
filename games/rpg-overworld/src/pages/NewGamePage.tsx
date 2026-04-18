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
          <p className="eyebrow">Overworld Start</p>
          <h1>Step straight onto the streets.</h1>
          <p>Choose Rowan's name and begin directly on the Thornwake map with movement controls enabled from the first second.</p>
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
              Start On Map
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
          <li>A live Thornwake overworld with a visible controllable character and interactable hotspots</li>
          <li>The market-square opening battle, then council, roads, routes, and later story chapters</li>
          <li>Main quests, side quests, wild encounters, inventory, journal lore, and autosave</li>
        </ul>
      </Panel>
    </div>
  );
};
