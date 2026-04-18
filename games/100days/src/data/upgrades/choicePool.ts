import { contentRegistry } from "../../memory/contentRegistry";
import type { DayRewardOption, RunPassiveState, RunWeaponState, UpgradeChoice } from "../../memory/types";
import { weightedChoice } from "../../engine/collision";

export const LEVEL_UP_CHOICE_COUNT = 3;
export const DAY_REWARD_CHOICE_COUNT = 3;

const uniquePush = <T extends { id: string }>(items: T[], item: T): void => {
  if (!items.some((existing) => existing.id === item.id)) {
    items.push(item);
  }
};

const describeWeaponChoice = (targetId: string, nextLevel: number): string => {
  const weapon = contentRegistry.weapons[targetId];
  return `Lv ${nextLevel} ${weapon.name}: ${weapon.description}`;
};

const describePassiveChoice = (targetId: string, nextLevel: number): string => {
  const passive = contentRegistry.passives[targetId];
  return `Lv ${nextLevel} ${passive.name}: ${passive.description}`;
};

export const rollUpgradeChoices = (
  day: number,
  weapons: RunWeaponState[],
  passives: RunPassiveState[],
  count = LEVEL_UP_CHOICE_COUNT,
): UpgradeChoice[] => {
  const candidates: UpgradeChoice[] = [];

  for (const weapon of Object.values(contentRegistry.weapons)) {
    if (weapon.unlockDay > day) {
      continue;
    }
    const owned = weapons.find((entry) => entry.id === weapon.id);
    const nextLevel = (owned?.level ?? 0) + 1;
    if (nextLevel > weapon.maxLevel) {
      continue;
    }
    uniquePush(candidates, {
      id: `weapon:${weapon.id}:${nextLevel}`,
      title: owned ? `${weapon.name} +` : weapon.name,
      description: describeWeaponChoice(weapon.id, nextLevel),
      iconId: weapon.iconId,
      rarity: weapon.rarity,
      type: "weapon",
      targetId: weapon.id,
      nextLevel,
    });
  }

  for (const passive of Object.values(contentRegistry.passives)) {
    if (passive.unlockDay > day) {
      continue;
    }
    const owned = passives.find((entry) => entry.id === passive.id);
    const nextLevel = (owned?.level ?? 0) + 1;
    if (nextLevel > passive.maxLevel) {
      continue;
    }
    uniquePush(candidates, {
      id: `passive:${passive.id}:${nextLevel}`,
      title: owned ? `${passive.name} +` : passive.name,
      description: describePassiveChoice(passive.id, nextLevel),
      iconId: passive.iconId,
      rarity: passive.rarity,
      type: "passive",
      targetId: passive.id,
      nextLevel,
    });
  }

  const selected: UpgradeChoice[] = [];
  while (selected.length < count && candidates.length > 0) {
    const choice = weightedChoice(candidates, (candidate) => {
      const baseWeight =
        candidate.type === "weapon"
          ? contentRegistry.weapons[candidate.targetId].weight
          : contentRegistry.passives[candidate.targetId].weight;
      const ownedBoost =
        candidate.type === "weapon"
          ? weapons.some((weapon) => weapon.id === candidate.targetId)
            ? 1.4
            : 1
          : passives.some((passive) => passive.id === candidate.targetId)
            ? 1.25
            : 1;
      return baseWeight * ownedBoost;
    });

    if (!choice) {
      break;
    }
    selected.push(choice);
    const index = candidates.findIndex((candidate) => candidate.id === choice.id);
    if (index >= 0) {
      candidates.splice(index, 1);
    }
  }
  return selected;
};

export const rollDayRewardOptions = (weapons: RunWeaponState[], passives: RunPassiveState[]): DayRewardOption[] => {
  const options: DayRewardOption[] = [
    {
      id: "rest-mend",
      title: "Rest and Mend",
      description: "Recover 35% max HP and reinforce the frame.",
      iconId: "icon-heartforge",
      type: "day-reward",
      targetId: "rest-mend",
    },
    {
      id: "forge-weapon",
      title: "Forge Weapon",
      description: "Upgrade a random owned weapon or gain bonus damage if everything is capped.",
      iconId: "icon-overcharge-core",
      type: "day-reward",
      targetId: weapons[Math.floor(Math.random() * Math.max(weapons.length, 1))]?.id ?? "forge-weapon",
    },
    {
      id: "field-scout",
      title: "Scout Route",
      description: "Gain speed, pickup reach, and a little luck for the next day.",
      iconId: "icon-stride-engine",
      type: "day-reward",
      targetId: "field-scout",
    },
    {
      id: "tempered-shell",
      title: "Tempered Shell",
      description: "Gain armor and regeneration before the next push.",
      iconId: "icon-plate-shell",
      type: "day-reward",
      targetId: "tempered-shell",
    },
    {
      id: "lattice-tune",
      title: "Lattice Tune",
      description: "Sharpen cooldown and projectile flow.",
      iconId: "icon-chrono-lattice",
      type: "day-reward",
      targetId: passives[Math.floor(Math.random() * Math.max(passives.length, 1))]?.id ?? "lattice-tune",
    },
    {
      id: "battle-tonic",
      title: "Battle Tonic",
      description: "Recover 22% max HP and gain bonus damage for the next day.",
      iconId: "icon-overcharge-core",
      type: "day-reward",
      targetId: "battle-tonic",
    },
    {
      id: "cache-surge",
      title: "Cache Surge",
      description: "Gain a burst of experience toward your next level immediately.",
      iconId: "icon-salvage-sense",
      type: "day-reward",
      targetId: "cache-surge",
    },
    {
      id: "phase-route",
      title: "Phase Route",
      description: "Gain speed, dodge chance, and cleaner escape routes.",
      iconId: "icon-stride-engine",
      type: "day-reward",
      targetId: "phase-route",
    },
    {
      id: "harvest-scan",
      title: "Harvest Scan",
      description: "Improve XP gain, pickup reach, and luck before dawn.",
      iconId: "icon-magnet-array",
      type: "day-reward",
      targetId: "harvest-scan",
    },
  ];

  const selected: DayRewardOption[] = [];
  while (selected.length < DAY_REWARD_CHOICE_COUNT && options.length > 0) {
    const choice = options.splice(Math.floor(Math.random() * options.length), 1)[0];
    selected.push(choice);
  }
  return selected;
};
