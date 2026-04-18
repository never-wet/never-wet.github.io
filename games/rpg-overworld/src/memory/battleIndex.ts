import type { BattleIndexEntry } from "./types";

export const battleIndex: BattleIndexEntry[] = [
  {
    id: "marketfire-raiders",
    chapterId: "prologue",
    locationId: "thornwake",
    tier: "tutorial",
    enemyIds: ["lantern-leech", "briar-wolf"],
    rewardPreview: ["Moonwater Tonic", "Bell in the Fog quest advance"],
  },
  {
    id: "gloamwood-roamers",
    chapterId: "chapter1",
    locationId: "gloamwood-trail",
    tier: "field",
    enemyIds: ["briar-wolf", "hollow-moth"],
    rewardPreview: ["Emberleaf Poultice", "XP", "Silver"],
  },
  {
    id: "gloamwood-briar-pack",
    chapterId: "chapter1",
    locationId: "gloamwood-trail",
    tier: "elite",
    enemyIds: ["briar-wolf", "briar-wolf", "hollow-moth"],
    rewardPreview: ["Lantern Oil", "Main quest advance"],
  },
  {
    id: "rainmire-troll",
    chapterId: "chapter1",
    locationId: "rainmire-crossing",
    tier: "elite",
    enemyIds: ["mossback-troll"],
    rewardPreview: ["Thornwake Buckler", "Bridge reopened"],
  },
  {
    id: "abbey-sentinels",
    chapterId: "chapter2",
    locationId: "saint-veyra-abbey",
    tier: "elite",
    enemyIds: ["ruin-sentinel", "lantern-leech"],
    rewardPreview: ["Pilgrim Mail", "Abbey story advance"],
  },
  {
    id: "mirror-warden-duel",
    chapterId: "chapter3",
    locationId: "skyglass-spire",
    tier: "boss",
    enemyIds: ["mirror-warden"],
    rewardPreview: ["Glassbreaker Charm", "Ending scene", "Achievement"],
  },
];
