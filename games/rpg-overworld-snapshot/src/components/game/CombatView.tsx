import { useEffect, useState } from "react";
import { audioManager } from "../../lib/audio/audioManager";
import { useGame } from "../../hooks/useGame";
import type { CombatEntityState } from "../../memory/types";
import { ArtImage } from "../common/ArtImage";
import { Panel } from "../common/Panel";

const EntityCard = ({
  entity,
  selected,
  onSelect,
}: {
  entity: CombatEntityState;
  selected?: boolean;
  onSelect?: () => void;
}) => (
  <button className={`entity-card ${selected ? "selected" : ""}`} onClick={onSelect} type="button">
    <ArtImage assetId={entity.portraitAssetId} alt={entity.name} className="art-frame portrait" />
    <strong>{entity.name}</strong>
    <span>
      HP {Math.max(0, entity.hp)} / {entity.maxHp}
    </span>
    <span>
      MP {entity.mp} / {entity.maxMp}
    </span>
  </button>
);

export const CombatView = () => {
  const { state, dispatch } = useGame();
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);

  useEffect(() => {
    const firstEnemy = state.combat?.enemies[0];
    if (firstEnemy) {
      setSelectedEnemyId(firstEnemy.id);
    }
  }, [state.combat]);

  if (!state.combat) {
    return null;
  }

  const quickItem = state.inventory.find((entry) => entry.itemId === "moonwater-tonic" || entry.itemId === "emberleaf-poultice");
  const offensiveSkills = state.player.learnedSkillIds.filter((skillId) => skillId !== "restoration-hymn" && skillId !== "veil-ward");

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
    <div className="combat-layout">
      <Panel eyebrow="Battle" title={state.combat.boss ? "Boss Encounter" : "Encounter"} className="combat-panel">
        <div className="combat-grid">
          <div className="combat-side">
            <EntityCard entity={state.combat.player} />
            <div className="battle-actions">
              <button className="primary-button" onClick={() => runAction({ action: "attack" })} type="button">
                1. Attack
              </button>
              {offensiveSkills.slice(0, 2).map((skillId, index) => (
                <button
                  key={skillId}
                  className="secondary-button"
                  onClick={() => runAction({ action: "skill", skillId })}
                  type="button"
                >
                  {index + 2}. {skillId.replace(/-/g, " ")}
                </button>
              ))}
              <button className="secondary-button" onClick={() => runAction({ action: "defend" })} type="button">
                3. Defend
              </button>
              <button
                className="secondary-button"
                onClick={() => quickItem && runAction({ action: "item", itemId: quickItem.itemId })}
                type="button"
              >
                4. Use Tonic
              </button>
            </div>
          </div>
          <div className="combat-side">
            {state.combat.enemies.map((enemy) => (
              <EntityCard
                key={enemy.id}
                entity={enemy}
                selected={selectedEnemyId === enemy.id}
                onSelect={() => setSelectedEnemyId(enemy.id)}
              />
            ))}
          </div>
        </div>
        <div className="battle-log">
          {state.combat.log.map((entry) => (
            <p key={entry.id} className={`battle-log-${entry.tone}`}>
              {entry.message}
            </p>
          ))}
        </div>
      </Panel>
    </div>
  );
};
