import { useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";

export const GameOverOverlay = () => {
  const navigate = useNavigate();
  const { dispatch, resetToTitle } = useGame();

  return (
    <div className="scene-overlay gameover-overlay">
      <div className="pause-panel gameover-panel">
        <p className="hud-label">Defeat</p>
        <h2>The Veil Shard dims.</h2>
        <p>The rain keeps falling. You can wake at your last checkpoint or retreat to the title screen.</p>
        <div className="pause-grid compact">
          <button className="primary-button" onClick={() => dispatch({ type: "RESPAWN" })} type="button">
            Respawn at Checkpoint
          </button>
          <button
            className="ghost-button danger"
            onClick={() => {
              resetToTitle();
              navigate("/");
            }}
            type="button"
          >
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
};
