import { useEffect, useRef, useState } from "react";
import { audioManager } from "../../lib/audio/audioManager";
import { useGame } from "../../hooks/useGame";
import { contentRegistry } from "../../memory/contentRegistry";
import type { CombatEntityState } from "../../memory/types";
import { ArtImage } from "../common/ArtImage";

const EntityCard = ({
  entity,
  role,
  selected,
  onSelect,
}: {
  entity: CombatEntityState;
  role: "player" | "enemy";
  selected?: boolean;
  onSelect?: () => void;
}) => (
  <button className={`entity-card ${selected ? "selected" : ""} ${role}-entity-card`} onClick={onSelect} type="button">
    <ArtImage assetId={entity.portraitAssetId} alt={entity.name} className="battle-portrait-art" />
    <div className="entity-copy">
      <p className="hud-label">{role === "player" ? "Wayfinder" : "Target"}</p>
      <strong>{entity.name}</strong>
      <div className="entity-stats">
        <span>
          HP {Math.max(0, entity.hp)} / {entity.maxHp}
        </span>
        <span>
          MP {entity.mp} / {entity.maxMp}
        </span>
      </div>
    </div>
  </button>
);

export const CombatView = () => {
  const { state, dispatch } = useGame();
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);
  const previousBattleState = useRef<"victory" | "defeat" | null>(null);
  const encounterId = state.combat?.encounterId ?? null;
  const enemySelectionKey = state.combat?.enemies.map((enemy) => enemy.id).join("|") ?? "";

  useEffect(() => {
    if (!state.combat) {
      setSelectedEnemyId(null);
      return;
    }

    const hasCurrentSelection = selectedEnemyId ? state.combat.enemies.some((enemy) => enemy.id === selectedEnemyId) : false;
    if (!hasCurrentSelection) {
      setSelectedEnemyId(state.combat.enemies[0]?.id ?? null);
    }
  }, [encounterId, enemySelectionKey, selectedEnemyId, state.combat]);

  useEffect(() => {
    if (!state.combat && previousBattleState.current === "victory") {
      audioManager.playSfx("victory");
    }
    if (!state.combat && previousBattleState.current === "defeat") {
      audioManager.playSfx("defeat");
    }
    previousBattleState.current = state.combat?.resolved ?? previousBattleState.current;
  }, [state.combat]);

  if (!state.combat) {
    return null;
  }

  const encounter = contentRegistry.encountersById[state.combat.encounterId];
  const currentLocation = contentRegistry.locationsById[state.currentLocationId];
  const quickItem = state.inventory.find((entry) => entry.itemId === "moonwater-tonic" || entry.itemId === "emberleaf-poultice");
  const offensiveSkills = state.player.learnedSkillIds.filter((skillId) => skillId !== "restoration-hymn" && skillId !== "veil-ward");
  const selectedEnemy = state.combat.enemies.find((enemy) => enemy.id === selectedEnemyId) ?? state.combat.enemies[0];
  const firstSkillId = offensiveSkills[0];
  const firstSkillName = firstSkillId ? contentRegistry.skillsById[firstSkillId]?.name ?? firstSkillId : "No skill";
  const quickItemLabel = quickItem ? contentRegistry.itemsById[quickItem.itemId]?.name ?? "Use Item" : "No Tonic";

  const runAction = (action: { action: "attack" | "skill" | "defend" | "item"; skillId?: string; itemId?: string }) => {
    audioManager.playSfx(action.action === "item" ? "heal" : "hit");
    dispatch({
      type: "BATTLE_ACTION",
      action: action.action,
      skillId: action.skillId,
      itemId: action.itemId,
      targetId: selectedEnemyId ?? state.combat?.enemies[0]?.id,
    });
  };

  return (
    <div className="scene-overlay battle-overlay">
      <div className="battle-scene">
        <ArtImage assetId={currentLocation.backgroundAssetId} alt={currentLocation.name} className="battle-scene-bg" />
        <div className="battle-scene-ui">
          <section className="battle-header-card">
            <p className="hud-label">{state.combat.boss ? "Boss Battle" : "Encounter"}</p>
            <h2>{encounter.title}</h2>
            <p>{encounter.intro}</p>
            <p className="battle-instruction">
              Tap an enemy to target it, then use the command buttons below. Keyboard shortcuts: `1` Attack, `2` Skill, `3` Defend,
              `4` Item.
            </p>
          </section>

          <section className="battle-stage">
            <div className="battle-arena">
              <div className="battle-roster enemy-roster">
                {state.combat.enemies.map((enemy) => (
                  <EntityCard
                    key={enemy.id}
                    entity={enemy}
                    role="enemy"
                    selected={selectedEnemyId === enemy.id}
                    onSelect={() => setSelectedEnemyId(enemy.id)}
                  />
                ))}
              </div>

              <div className="battle-roster player-roster">
                <EntityCard entity={state.combat.player} role="player" />
              </div>
            </div>

            <aside className="battle-command-card">
              <p className="hud-label">Your Turn</p>
              <h3>{selectedEnemy ? `Target: ${selectedEnemy.name}` : "Choose a target"}</h3>
              <p>{selectedEnemy ? "Select a command to act against this enemy." : "Tap one of the enemy cards first."}</p>
              <div className="battle-actions">
                <button className="primary-button" onClick={() => runAction({ action: "attack" })} type="button">
                  1. Attack
                  <span>Strike the selected enemy.</span>
                </button>
                <button
                  className="secondary-button"
                  disabled={!firstSkillId}
                  onClick={() => firstSkillId && runAction({ action: "skill", skillId: firstSkillId })}
                  type="button"
                >
                  2. {firstSkillName}
                  <span>Use your main offensive skill.</span>
                </button>
                <button className="secondary-button" onClick={() => runAction({ action: "defend" })} type="button">
                  3. Defend
                  <span>Brace to reduce incoming damage.</span>
                </button>
                <button
                  className="secondary-button"
                  disabled={!quickItem}
                  onClick={() => quickItem && runAction({ action: "item", itemId: quickItem.itemId })}
                  type="button"
                >
                  4. {quickItemLabel}
                  <span>{quickItem ? "Recover with your current quick item." : "No quick healing item available."}</span>
                </button>
              </div>
            </aside>
          </section>

          <section className="battle-log-card">
            <p className="hud-label">Battle Log</p>
            {state.combat.log.map((entry) => (
              <p key={entry.id} className={`battle-log-${entry.tone}`}>
                {entry.message}
              </p>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};
