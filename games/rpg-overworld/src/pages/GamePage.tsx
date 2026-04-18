import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CombatView } from "../components/game/CombatView";
import { DialogueView } from "../components/game/DialogueView";
import { audioManager } from "../lib/audio/audioManager";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { getOverworldViewModel } from "../lib/game/selectors";
import { GameOverOverlay } from "../game/GameOverOverlay";
import { GameViewport } from "../game/GameViewport";
import { PauseMenu } from "../game/PauseMenu";
import { ShopOverlay } from "../game/ShopOverlay";
import { WorldMessageOverlay } from "../game/WorldMessageOverlay";

export const GamePage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [paused, setPaused] = useState(false);
  const lastCombatId = useRef<string | null>(null);
  const overworld = getOverworldViewModel(state);
  const nearbyInteraction = overworld.frontInteraction ?? overworld.currentInteraction;

  useEffect(() => {
    if (state.activeSceneId || state.combat || state.status === "gameover" || state.overworld.message) {
      setPaused(false);
    }
  }, [state.activeSceneId, state.combat, state.overworld.message, state.status]);

  useEffect(() => {
    const combatId = state.combat?.encounterId ?? null;
    if (combatId && combatId !== lastCombatId.current) {
      audioManager.playSfx(state.combat?.boss ? "boss-warning" : "battle-start");
    }
    lastCombatId.current = combatId;
  }, [state.combat]);

  useEffect(() => {
    if (!state.combat) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1") {
        event.preventDefault();
        dispatch({ type: "BATTLE_ACTION", action: "attack" });
      }
      if (event.key === "2") {
        event.preventDefault();
        dispatch({ type: "BATTLE_ACTION", action: "skill", skillId: state.player.learnedSkillIds[0] });
      }
      if (event.key === "3") {
        event.preventDefault();
        dispatch({ type: "BATTLE_ACTION", action: "defend" });
      }
      if (event.key === "4") {
        event.preventDefault();
        dispatch({ type: "BATTLE_ACTION", action: "item", itemId: "moonwater-tonic" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, state.combat, state.player.learnedSkillIds]);

  if (state.status === "title") {
    return (
      <Panel eyebrow="Camp" title="No active journey">
        <p>Start a new game or load a local save to enter Hollowmere.</p>
        <button className="primary-button" onClick={() => navigate("/new-game")} type="button">
          Start New Game
        </button>
      </Panel>
    );
  }

  return (
    <div className="game-scene-shell">
      <GameViewport
        state={state}
        dispatch={dispatch}
        paused={paused}
        highlightInteractionId={nearbyInteraction?.id}
        nearbyInteraction={nearbyInteraction}
        onTogglePause={() => setPaused((current) => !current)}
      />

      {!state.activeSceneId && !state.combat && state.status !== "gameover" ? (
        <div className="field-controls">
          <button className="field-control-button" onClick={() => dispatch({ type: "INTERACT_OVERWORLD" })} type="button">
            Interact
          </button>
          <button className="field-control-button primary" onClick={() => setPaused((current) => !current)} type="button">
            Menu
          </button>
        </div>
      ) : null}

      {state.overworld.message && !state.activeSceneId && !state.combat ? (
        <WorldMessageOverlay message={state.overworld.message} onClose={() => dispatch({ type: "CLOSE_OVERWORLD_MESSAGE" })} />
      ) : null}

      {state.activeShopId && !state.combat ? <ShopOverlay /> : null}
      {state.activeSceneId ? (
        <DialogueView
          state={state}
          onContinue={() => dispatch({ type: "ADVANCE_SCENE" })}
          onChoose={(choiceId) => dispatch({ type: "CHOOSE_SCENE_OPTION", choiceId })}
        />
      ) : null}
      {state.combat ? <CombatView /> : null}
      {paused && !state.activeSceneId && !state.combat && state.status !== "gameover" ? <PauseMenu onResume={() => setPaused(false)} /> : null}
      {state.status === "gameover" ? <GameOverOverlay /> : null}
    </div>
  );
};
