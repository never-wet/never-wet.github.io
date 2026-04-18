import { useNavigate } from "react-router-dom";
import { contentRegistry } from "../memory/contentRegistry";
import type { GameState, OverworldInteraction } from "../memory/types";

interface GameHudProps {
  state: GameState;
  nearbyInteraction?: OverworldInteraction;
  onInteract: () => void;
  onPause: () => void;
}

export const GameHud = ({ state, nearbyInteraction, onInteract, onPause }: GameHudProps) => {
  const navigate = useNavigate();
  const activeQuest = contentRegistry.quests.find((quest) => state.quests[quest.id]?.status === "active");
  const objective = activeQuest ? activeQuest.objectives[state.quests[activeQuest.id].currentObjectiveIndex] : null;

  return (
    <div className="game-hud">
      <section className="hud-cluster hud-card hud-top-left">
        <p className="hud-label">{contentRegistry.locationsById[state.currentLocationId].name}</p>
        <strong className="hud-title">{contentRegistry.overworldMapsById[state.currentLocationId]?.title ?? "Overworld"}</strong>
        <div className="hud-stats">
          <span>Lv {state.player.level}</span>
          <span>
            HP {state.player.currentHp}/{state.player.baseStats.maxHp}
          </span>
          <span>
            MP {state.player.currentMp}/{state.player.baseStats.maxMp}
          </span>
          <span>{state.player.silver} silver</span>
        </div>
      </section>

      <section className="hud-cluster hud-card hud-top-right hud-actions">
        <button className="hud-button" onClick={() => navigate("/inventory")} type="button">
          Bag
        </button>
        <button className="hud-button" onClick={() => navigate("/quests")} type="button">
          Quests
        </button>
        <button className="hud-button" onClick={() => navigate("/journal")} type="button">
          Journal
        </button>
        <button className="hud-button primary" onClick={onPause} type="button">
          Menu
        </button>
      </section>

      <section className="hud-cluster hud-card hud-bottom-left">
        <p className="hud-label">Objective</p>
        <strong className="hud-title">{activeQuest?.title ?? "Explore Hollowmere"}</strong>
        <p className="hud-copy">{objective?.text ?? "Move, interact, and follow the roads ahead."}</p>
      </section>

      <section className="hud-cluster hud-card hud-bottom-right">
        <p className="hud-label">Nearby</p>
        <strong className="hud-title">{nearbyInteraction?.label ?? "Open ground"}</strong>
        <p className="hud-copy">{nearbyInteraction?.description ?? "Walk to points of interest and press Interact."}</p>
        <div className="hud-inline-actions">
          <button className="hud-button primary" onClick={onInteract} type="button">
            Interact
          </button>
          <span className="hud-hint">WASD / Arrows to move, E to interact, Esc for pause</span>
        </div>
      </section>
    </div>
  );
};
