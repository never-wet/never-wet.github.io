import { contentRegistry } from "../../memory/contentRegistry";
import type {
  CombatActionType,
  CombatLogEntry,
  CombatState,
  CombatEntityState,
  GameState,
  NotificationTone,
} from "../../memory/types";
import {
  addInventoryItem,
  awardSilver,
  awardXp,
  createEnemyCombatant,
  createPlayerCombatant,
  pushNotification,
  removeInventoryItem,
} from "./helpers";

const randomFromRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const makeLog = (message: string, tone: NotificationTone = "info"): CombatLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  message,
  tone,
});

const calcDamage = (attack: number, defense: number, power = 0, targetDefending = false) => {
  const base = Math.max(4, attack + power + randomFromRange(0, 4) - Math.floor(defense * 0.55));
  return targetDefending ? Math.max(2, Math.floor(base * 0.6)) : base;
};

const chooseEnemyAction = (enemyState: CombatEntityState, enemyId: string) => {
  const enemyDef = contentRegistry.enemiesById[enemyId];
  const filtered = enemyDef.behavior.filter(
    (behavior) => behavior.whenBelowHpPct === undefined || enemyState.hp / enemyState.maxHp <= behavior.whenBelowHpPct,
  );
  const pool = filtered.length > 0 ? filtered : enemyDef.behavior;
  const total = pool.reduce((sum, behavior) => sum + behavior.weight, 0);
  let roll = Math.random() * total;

  for (const behavior of pool) {
    roll -= behavior.weight;
    if (roll <= 0) {
      return behavior;
    }
  }

  return pool[0];
};

export const createCombatState = (state: GameState, encounterId: string): CombatState => {
  const encounter = contentRegistry.encountersById[encounterId];
  const player = createPlayerCombatant(state);
  const enemies = encounter.enemyIds.map((enemyId) => createEnemyCombatant(enemyId));

  return {
    encounterId,
    turnNumber: 1,
    player,
    enemies,
    queue: ["player"],
    currentTurnOwnerId: "player",
    resolved: null,
    log: [makeLog(encounter.intro, encounter.boss ? "danger" : "info")],
    boss: Boolean(encounter.boss),
  };
};

const applySkill = (
  combat: CombatState,
  actor: CombatEntityState,
  target: CombatEntityState,
  skillId: string,
  log: CombatLogEntry[],
) => {
  const skill = contentRegistry.skillsById[skillId];
  if (!skill || actor.mp < skill.cost) {
    log.push(makeLog(`${actor.name} fumbles the spell.`, "danger"));
    return;
  }

  actor.mp -= skill.cost;

  if (skill.effect === "heal") {
    const healed = Math.min(skill.power + actor.spirit, actor.maxHp - actor.hp);
    actor.hp += healed;
    log.push(makeLog(`${actor.name} uses ${skill.name} and restores ${healed} HP.`, "reward"));
    return;
  }

  if (skill.effect === "shield") {
    actor.defending = true;
    log.push(makeLog(`${actor.name} uses ${skill.name} and braces for impact.`, "reward"));
    return;
  }

  if (skill.effect === "guardBreak") {
    target.defending = false;
    const damage = calcDamage(actor.attack, target.defense, skill.power, false);
    target.hp -= damage;
    log.push(makeLog(`${actor.name} shatters ${target.name}'s guard with ${skill.name} for ${damage}.`, "reward"));
    return;
  }

  const damage = calcDamage(actor.attack, target.defense, skill.power + actor.spirit / 2, target.defending);
  target.hp -= damage;
  log.push(makeLog(`${actor.name} uses ${skill.name} on ${target.name} for ${damage}.`, "info"));
};

const enemyIdFromCombatant = (combatant: CombatEntityState, encounterId: string) => {
  const encounter = contentRegistry.encountersById[encounterId];
  return encounter.enemyIds.find((enemyId) => contentRegistry.enemiesById[enemyId].name === combatant.name) ?? encounter.enemyIds[0];
};

export const runCombatRound = (
  state: GameState,
  action: { type: CombatActionType; skillId?: string; itemId?: string; targetId?: string },
) => {
  if (!state.combat) {
    return;
  }

  const combat = state.combat;
  const log = [...combat.log];
  const liveEnemies = combat.enemies.filter((enemy) => enemy.hp > 0);
  const target = liveEnemies.find((enemy) => enemy.id === action.targetId) ?? liveEnemies[0];

  if (!target && action.type !== "defend" && action.type !== "item") {
    return;
  }

  if (action.type === "attack" && target) {
    const damage = calcDamage(combat.player.attack, target.defense, 0, target.defending);
    target.hp -= damage;
    log.push(makeLog(`${combat.player.name} strikes ${target.name} for ${damage}.`, "info"));
  }

  if (action.type === "skill" && target && action.skillId) {
    applySkill(combat, combat.player, target, action.skillId, log);
  }

  if (action.type === "defend") {
    combat.player.defending = true;
    log.push(makeLog(`${combat.player.name} takes a defensive stance.`, "reward"));
  }

  if (action.type === "item" && action.itemId) {
    const item = contentRegistry.itemsById[action.itemId];
    if (item?.consumeEffect && removeInventoryItem(state, item.id, 1)) {
      if (item.consumeEffect.type === "heal") {
        const healed = Math.min(item.consumeEffect.amount, combat.player.maxHp - combat.player.hp);
        combat.player.hp += healed;
        log.push(makeLog(`${combat.player.name} uses ${item.name} and restores ${healed} HP.`, "reward"));
      }
      if (item.consumeEffect.type === "restoreMp") {
        const restored = Math.min(item.consumeEffect.amount, combat.player.maxMp - combat.player.mp);
        combat.player.mp += restored;
        log.push(makeLog(`${combat.player.name} uses ${item.name} and restores ${restored} MP.`, "reward"));
      }
    }
  }

  combat.enemies = combat.enemies.filter((enemy) => enemy.hp > 0);
  if (combat.enemies.length === 0) {
    combat.resolved = "victory";
  }

  if (!combat.resolved) {
    combat.enemies.forEach((enemyState) => {
      if (combat.player.hp <= 0) {
        return;
      }

      const enemyKey = enemyIdFromCombatant(enemyState, combat.encounterId);
      const behavior = chooseEnemyAction(enemyState, enemyKey);

      if (behavior.action === "defend") {
        enemyState.defending = true;
        log.push(makeLog(`${enemyState.name} braces itself.`, "danger"));
        return;
      }

      if (behavior.action === "skill" && behavior.skillId) {
        applySkill(combat, enemyState, combat.player, behavior.skillId, log);
        return;
      }

      const damage = calcDamage(enemyState.attack, combat.player.defense, 0, combat.player.defending);
      combat.player.hp -= damage;
      log.push(makeLog(`${enemyState.name} hits ${combat.player.name} for ${damage}.`, "danger"));
    });

    combat.player.defending = false;
    if (combat.player.hp <= 0) {
      combat.resolved = "defeat";
    } else {
      combat.turnNumber += 1;
    }
  }

  combat.log = log.slice(-8);

  if (combat.resolved === "victory") {
    const encounter = contentRegistry.encountersById[combat.encounterId];
    state.player.currentHp = combat.player.hp;
    state.player.currentMp = combat.player.mp;
    state.defeatedEncounterIds.push(combat.encounterId);
    awardSilver(state, encounter.rewardSilver);
    awardXp(state, encounter.rewardXp);
    encounter.rewardItemIds.forEach((itemId) => addInventoryItem(state, itemId, 1));
    pushNotification(state, `Victory: ${encounter.title}`, "reward");
    state.combat = null;
  }

  if (combat.resolved === "defeat") {
    state.player.currentHp = 0;
    state.player.currentMp = combat.player.mp;
    state.status = "gameover";
    state.combat = null;
    pushNotification(state, "The Veil Shard dims. You collapse beneath the rain.", "danger");
  }
};
