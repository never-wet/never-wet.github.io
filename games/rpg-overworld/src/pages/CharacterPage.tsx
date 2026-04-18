import { Panel } from "../components/common/Panel";
import { ArtImage } from "../components/common/ArtImage";
import { useGame } from "../hooks/useGame";
import { getDerivedPlayerStats } from "../lib/game/helpers";
import { contentRegistry } from "../memory/contentRegistry";

export const CharacterPage = () => {
  const { state } = useGame();
  const derived = getDerivedPlayerStats(state);

  return (
    <div className="page-grid">
      <section className="hero-card compact">
        <div className="hero-copy">
          <p className="eyebrow">Character</p>
          <h1>{state.player.name}</h1>
          <p>{state.player.title}</p>
          <div className="stat-row">
            <span>Level {state.player.level}</span>
            <span>Class {state.player.className}</span>
            <span>{state.player.silver} silver</span>
          </div>
        </div>
        <div className="hero-visual">
          <ArtImage assetId="portrait-rowan" alt={state.player.name} className="hero-art portrait-only" />
        </div>
      </section>

      <div className="two-column">
        <Panel eyebrow="Core Stats" title="Combat Profile">
          <div className="card-grid three-up">
            <article className="feature-card"><strong>HP</strong><span>{state.player.currentHp} / {derived.maxHp}</span></article>
            <article className="feature-card"><strong>MP</strong><span>{state.player.currentMp} / {derived.maxMp}</span></article>
            <article className="feature-card"><strong>Attack</strong><span>{derived.attack}</span></article>
            <article className="feature-card"><strong>Defense</strong><span>{derived.defense}</span></article>
            <article className="feature-card"><strong>Speed</strong><span>{derived.speed}</span></article>
            <article className="feature-card"><strong>Spirit</strong><span>{derived.spirit}</span></article>
          </div>
        </Panel>

        <Panel eyebrow="Equipment" title="Current Loadout">
          <div className="stack-actions">
            {(["weapon", "armor", "accessory"] as const).map((slot) => (
              <article key={slot} className="feature-card">
                <h3>{slot}</h3>
                <p>{state.equipment[slot] ? contentRegistry.itemsById[state.equipment[slot]!].name : "Unequipped"}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Skills" title="Learned Techniques">
        <div className="card-grid three-up">
          {state.player.learnedSkillIds.map((skillId) => {
            const skill = contentRegistry.skillsById[skillId];
            return (
              <article key={skill.id} className="feature-card">
                <h3>{skill.name}</h3>
                <p>{skill.description}</p>
                <small>{skill.cost} MP</small>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel eyebrow="Allies" title="Unlocked Companions">
        <div className="card-grid">
          {state.companionIds.length ? (
            state.companionIds.map((characterId) => {
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
            })
          ) : (
            <p>No companions recruited yet.</p>
          )}
        </div>
      </Panel>
    </div>
  );
};
