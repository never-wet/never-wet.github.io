import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArtImage } from "../components/common/ArtImage";
import { CombatView } from "../components/game/CombatView";
import { DialogueView } from "../components/game/DialogueView";
import { OverworldMap } from "../components/game/OverworldMap";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import {
  getAvailableLocationActions,
  getCurrentLocation,
  getCurrentNode,
  getCurrentScene,
  getOverworldViewModel,
  getTravelOptions,
} from "../lib/game/selectors";
import { contentRegistry } from "../memory/contentRegistry";

export const GamePage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const location = getCurrentLocation(state);
  const scene = getCurrentScene(state);
  const node = getCurrentNode(state);
  const actions = getAvailableLocationActions(state);
  const travelOptions = getTravelOptions(state);
  const overworld = getOverworldViewModel(state);
  const nearbyInteraction = overworld.frontInteraction ?? overworld.currentInteraction;
  const activeQuests = contentRegistry.quests.filter((quest) => state.quests[quest.id]?.status === "active").slice(0, 3);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.combat) {
        if (event.key === "1") dispatch({ type: "BATTLE_ACTION", action: "attack" });
        if (event.key === "2") dispatch({ type: "BATTLE_ACTION", action: "skill", skillId: state.player.learnedSkillIds[0] });
        if (event.key === "3") dispatch({ type: "BATTLE_ACTION", action: "defend" });
        if (event.key === "4") dispatch({ type: "BATTLE_ACTION", action: "item", itemId: "moonwater-tonic" });
        return;
      }

      if (state.overworld.message && (event.key === "Enter" || event.key.toLowerCase() === "e" || event.key === "Escape")) {
        event.preventDefault();
        dispatch({ type: "CLOSE_OVERWORLD_MESSAGE" });
        return;
      }

      if (scene && node && !node.choices?.length && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        dispatch({ type: "ADVANCE_SCENE" });
        return;
      }

      if (!scene && state.status === "playing") {
        const lower = event.key.toLowerCase();
        if (lower === "w" || event.key === "ArrowUp") {
          event.preventDefault();
          dispatch({ type: "MOVE_OVERWORLD", direction: "up" });
          return;
        }
        if (lower === "s" || event.key === "ArrowDown") {
          event.preventDefault();
          dispatch({ type: "MOVE_OVERWORLD", direction: "down" });
          return;
        }
        if (lower === "a" || event.key === "ArrowLeft") {
          event.preventDefault();
          dispatch({ type: "MOVE_OVERWORLD", direction: "left" });
          return;
        }
        if (lower === "d" || event.key === "ArrowRight") {
          event.preventDefault();
          dispatch({ type: "MOVE_OVERWORLD", direction: "right" });
          return;
        }
        if (lower === "e" || event.key === "Enter") {
          event.preventDefault();
          dispatch({ type: "INTERACT_OVERWORLD" });
          return;
        }
      }

      if (event.key === "Escape") {
        dispatch({ type: "SET_ACTIVE_SHOP", shopId: null });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, node, scene, state.combat, state.overworld.message, state.player.learnedSkillIds, state.status]);

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

  if (state.combat) {
    return <CombatView />;
  }

  if (scene) {
    return (
      <DialogueView
        state={state}
        onContinue={() => dispatch({ type: "ADVANCE_SCENE" })}
        onChoose={(choiceId) => dispatch({ type: "CHOOSE_SCENE_OPTION", choiceId })}
      />
    );
  }

  return (
    <div className="page-grid overworld-game-page">
      <section className="panel overworld-stage">
        <div className="overworld-stage-map">
          <div className="overworld-stage-banner">
            <div>
              <p className="eyebrow">
                {location.name} - {state.chapterId}
              </p>
              <h1>{overworld.map.title}</h1>
              <p className="support-copy">{location.travelDescription}</p>
            </div>
            <div className="stat-row">
              <span>
                Tile {overworld.position.x}, {overworld.position.y}
              </span>
              <span>Facing {overworld.position.facing}</span>
              <span>Level {state.player.level}</span>
            </div>
          </div>

          <OverworldMap
            state={state}
            onMove={(direction) => dispatch({ type: "MOVE_OVERWORLD", direction })}
            onInteract={() => dispatch({ type: "INTERACT_OVERWORLD" })}
          />
        </div>

        <aside className="overworld-stage-sidebar">
          <article className="hud-card">
            <p className="eyebrow">Objective</p>
            <h3>{nearbyInteraction ? nearbyInteraction.label : "Explore the streets"}</h3>
            <p>{nearbyInteraction?.description ?? "Walk up to townsfolk, landmarks, exits, or danger zones and press Interact."}</p>
            <button className="primary-button" onClick={() => dispatch({ type: "INTERACT_OVERWORLD" })} type="button">
              Interact Here
            </button>
          </article>

          {state.overworld.message ? (
            <article className="hud-card">
              <p className="eyebrow">Prompt</p>
              <h3>{state.overworld.message.title}</h3>
              {state.overworld.message.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <button className="secondary-button" onClick={() => dispatch({ type: "CLOSE_OVERWORLD_MESSAGE" })} type="button">
                Close Prompt
              </button>
            </article>
          ) : null}

          <article className="hud-card">
            <p className="eyebrow">Rowan</p>
            <h3>{state.player.title}</h3>
            <div className="stat-row">
              <span>
                HP {state.player.currentHp}/{state.player.baseStats.maxHp}
              </span>
              <span>
                MP {state.player.currentMp}/{state.player.baseStats.maxMp}
              </span>
              <span>{state.player.silver} silver</span>
            </div>
          </article>

          <article className="hud-card">
            <p className="eyebrow">Immediate Quests</p>
            <div className="stack-actions">
              {activeQuests.length ? (
                activeQuests.map((quest) => {
                  const progress = state.quests[quest.id];
                  const objective = quest.objectives[progress.currentObjectiveIndex];
                  return (
                    <div key={quest.id} className="feature-card">
                      <h3>{quest.title}</h3>
                      <p>{objective?.text ?? "Ready to turn in."}</p>
                    </div>
                  );
                })
              ) : (
                <p>No tracked objectives yet. Explore and push the story forward.</p>
              )}
            </div>
          </article>

          <article className="hud-card">
            <p className="eyebrow">Routes</p>
            <div className="stack-actions">
              {travelOptions.map((travel) => (
                <button key={travel.id} className="secondary-button" onClick={() => dispatch({ type: "TRAVEL", locationId: travel.id })} type="button">
                  {travel.name}
                </button>
              ))}
            </div>
          </article>
        </aside>
      </section>

      {state.activeShopId && location.shopListings?.length ? (
        <Panel eyebrow="Market" title="Buy Supplies">
          <div className="card-grid three-up">
            {location.shopListings.map((listing) => {
              const item = contentRegistry.itemsById[listing.itemId];
              return (
                <article key={item.id} className="feature-card">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p>{listing.price} silver</p>
                  <button className="secondary-button" onClick={() => dispatch({ type: "BUY_ITEM", itemId: item.id })} type="button">
                    Buy
                  </button>
                </article>
              );
            })}
          </div>
        </Panel>
      ) : null}

      <div className="two-column">
        <Panel eyebrow="Hotspots" title="Area Interactions">
          <div className="stack-actions">
            {actions.map((action) => (
              <button key={action.id} className="choice-button" onClick={() => dispatch({ type: "RUN_LOCATION_ACTION", actionId: action.id })} type="button">
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Companions" title="Nearby Allies">
          <div className="card-grid">
            {location.npcIds.map((characterId) => {
              const character = contentRegistry.charactersById[characterId];
              return (
                <article key={character.id} className="character-card">
                  <ArtImage assetId={character.portraitAssetId} alt={character.name} className="art-frame portrait small" />
                  <div>
                    <h3>{character.name}</h3>
                    <p>{character.title}</p>
                    <small>{character.shortBio}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
};
