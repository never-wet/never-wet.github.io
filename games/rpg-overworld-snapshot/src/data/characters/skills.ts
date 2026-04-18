import type { SkillDefinition } from "../../memory/types";

export const skills: SkillDefinition[] = [
  {
    id: "moonlit-cut",
    name: "Moonlit Cut",
    description: "A balanced arc of lantern light that cuts cleanly through veiled targets.",
    cost: 4,
    target: "enemy",
    effect: "damage",
    power: 18,
  },
  {
    id: "ember-thread",
    name: "Ember Thread",
    description: "A hot stitched spark that scorches one foe and rattles their focus.",
    cost: 6,
    target: "enemy",
    effect: "damage",
    power: 24,
  },
  {
    id: "veil-ward",
    name: "Veil Ward",
    description: "Wrap yourself in a wavering barrier, reducing the next blow.",
    cost: 5,
    target: "self",
    effect: "shield",
    power: 10,
  },
  {
    id: "restoration-hymn",
    name: "Restoration Hymn",
    description: "Borrow an old abbey cadence to mend wounds and steady your breathing.",
    cost: 8,
    target: "self",
    effect: "heal",
    power: 28,
  },
  {
    id: "glass-break",
    name: "Glass Break",
    description: "A focused strike meant to crack wards and shatter defensive postures.",
    cost: 7,
    target: "enemy",
    effect: "guardBreak",
    power: 20,
  },
];
