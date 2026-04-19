export const combatIndex = {
  weapons: [
    "weapon_rust_blade",
    "weapon_lantern_blade",
    "weapon_reed_spear",
    "weapon_lantern_bow",
    "weapon_ember_tome",
  ],
  enemyBehaviors: {
    melee: "Direct chase with close-range strike timing.",
    ranged: "Maintains spacing and fires dodgeable projectiles.",
    charger: "Telegraphs and rushes in a straight line.",
    skirmisher: "Weaves around the player before attacking.",
    boss: "Alternates charges, spreads, summons, and zone denial.",
  },
  bossIds: ["the_hollow_stag"],
  skillIds: ["skill_lantern_spark", "skill_heal_burst"],
};
