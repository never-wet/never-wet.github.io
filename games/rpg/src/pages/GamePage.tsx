import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DialogueView } from "../components/game/DialogueView";
import { CombatView } from "../components/game/CombatView";
import { ArtImage } from "../components/common/ArtImage";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { getAvailableLocationActions, getCurrentLocation, getCurrentNode, getCurrentScene, getTravelOptions } from "../lib/game/selectors";
import { contentRegistry } from "../memory/contentRegistry";

export const GamePage = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const location = getCurrentLocation(state);
  const scene = getCurrentScene(state);
  const node = getCurrentNode(state);
  const actions = getAvailableLocationActions(state);
  const travelOptions = getTravelOptions(state);
  const activeQuests = contentRegistry.quests.filter((quest) => state.quests[quest.id]?.status === "active").slice(0, 3);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.combat) {
        if (event.key === "1") dispatch({ type: "BATTLE_ACTION", action: "attack" });
        if (event.key === "2") dispatch({ type: "BATTLE_ACTION", action: "skill", skillId: state.player.learnedSkillIds[0] });
        if (event.key === "3") dispatch({ type: "BATTLE_ACTION", action: "defend" });
        if (event.key === "4") dispatch({ type: "BATTLE_ACTION", action: "item", itemId: "moonwater-tonic" });
      } else if (scene && node && !node.choices?.length && (event.key === "Enter" || event.key === " ")) {
        dispatch({ type: "ADVANCE_SCENE" });
      } else if (event.key === "Escape") {
        dispatch({ type: "SET_ACTIVE_SHOP", shopId: null });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, node, scene, state.combat, state.player.learnedSkillIds]);

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
    <div className="page-grid">
      <section className="hero-card compact">
        <div className="hero-copy">
          <p className="eyebrow">
            {location.name} • {state.chapterId}
          </p>
          <h1>{location.subtitle}</h1>
          <p>{location.description}</p>
          <p className="support-copy">{location.travelDescription}</p>
        </div>
        <div className="hero-visual">
          <ArtImage assetId={location.backgroundAssetId} alt={location.name} className="hero-art" />
        </div>
      </section>

      <div className="two-column">
        <Panel eyebrow="Explore" title="Location Actions">
          <div className="stack-actions">
            {actions.map((action) => (
              <button key={action.id} className="choice-button" onClick={() => dispatch({ type: "RUN_LOCATION_ACTION", actionId: action.id })} type="button">
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Travel" title="Connected Routes">
          <div className="card-grid">
            {travelOptions.map((travel) => (
              <article key={travel.id} className="feature-card">
                <h3>{travel.name}</h3>
                <p>{travel.subtitle}</p>
                <button className="secondary-button" onClick={() => dispatch({ type: "TRAVEL", locationId: travel.id })} type="button">
                  Travel
                </button>
              </article>
            ))}
          </div>
        </Panel>
      </div>

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

        <Panel eyebrow="Quests" title="Immediate Goals">
          <div className="stack-actions">
            {activeQuests.map((quest) => {
              const progress = state.quests[quest.id];
              const objective = quest.objectives[progress.currentObjectiveIndex];
              return (
                <article key={quest.id} className="quest-card">
                  <h3>{quest.title}</h3>
                  <p>{quest.summary}</p>
                  <strong>{objective?.text ?? "Ready to turn in."}</strong>
                </article>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
};
