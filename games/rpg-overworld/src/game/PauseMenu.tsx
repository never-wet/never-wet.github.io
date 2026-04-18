import { useNavigate } from "react-router-dom";
import { useGame } from "../hooks/useGame";

interface PauseMenuProps {
  onResume: () => void;
}

export const PauseMenu = ({ onResume }: PauseMenuProps) => {
  const navigate = useNavigate();
  const { saveToSlot, resetToTitle } = useGame();

  return (
    <div className="scene-overlay pause-overlay">
      <div className="pause-panel">
        <p className="hud-label">Pause</p>
        <h2>Lantern Menu</h2>
        <p>Take a breath, save your progress, or step into one of the deeper menus.</p>
        <div className="pause-grid">
          <button className="primary-button" onClick={onResume} type="button">
            Resume Journey
          </button>
          <button className="secondary-button" onClick={() => saveToSlot("slot-1")} type="button">
            Save to Slot 1
          </button>
          <button className="secondary-button" onClick={() => saveToSlot("slot-2")} type="button">
            Save to Slot 2
          </button>
          <button className="secondary-button" onClick={() => saveToSlot("slot-3")} type="button">
            Save to Slot 3
          </button>
          <button className="ghost-button" onClick={() => navigate("/inventory")} type="button">
            Inventory
          </button>
          <button className="ghost-button" onClick={() => navigate("/quests")} type="button">
            Quests
          </button>
          <button className="ghost-button" onClick={() => navigate("/map")} type="button">
            World Map
          </button>
          <button className="ghost-button" onClick={() => navigate("/journal")} type="button">
            Journal
          </button>
          <button className="ghost-button" onClick={() => navigate("/character")} type="button">
            Character
          </button>
          <button className="ghost-button" onClick={() => navigate("/settings")} type="button">
            Settings
          </button>
          <button className="ghost-button" onClick={() => navigate("/load")} type="button">
            Load / Save List
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
