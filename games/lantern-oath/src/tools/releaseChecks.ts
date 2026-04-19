import { SaveManager } from "../engine/SaveManager";
import { contentRegistry } from "../memory/contentRegistry";
import { createDefaultState } from "../memory/defaultState";
import { audioManifest } from "../memory/audioManifest";
import { STORAGE_KEYS } from "../memory/storageKeys";
import type { MapDefinition, PortalDefinition, SettingsState } from "../memory/types";
import { readFileSync } from "node:fs";

declare const process: { argv: string[] };

type ReleaseSection = "must-have" | "combat" | "world" | "story" | "content" | "visual" | "audio" | "qol" | "final";

const CARDINAL_STEPS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
] as const;

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

const errors: string[] = [];
const appSource = readFileSync(new URL("../game/App.ts", import.meta.url), "utf8");
const gameSessionSource = readFileSync(new URL("../engine/GameSession.ts", import.meta.url), "utf8");
const rendererSource = readFileSync(new URL("../engine/Renderer.ts", import.meta.url), "utf8");
const pixelFactorySource = readFileSync(new URL("../lib/assets/pixelFactory.ts", import.meta.url), "utf8");

function fail(message: string): void {
  errors.push(message);
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

function inBounds(map: MapDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isWalkable(map: MapDefinition, x: number, y: number): boolean {
  if (!inBounds(map, x, y)) {
    return false;
  }
  const tile = map.layout[y]?.[x] ?? "#";
  return Boolean(map.legend[tile] && !map.legend[tile].solid);
}

function collectReachableTiles(map: MapDefinition): Set<string> {
  const queue = map.spawnPoints
    .map((spawn) => ({ x: Math.floor(spawn.x), y: Math.floor(spawn.y) }))
    .filter((tile) => isWalkable(map, tile.x, tile.y));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = tileKey(current.x, current.y);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    CARDINAL_STEPS.forEach((step) => {
      const next = { x: current.x + step.x, y: current.y + step.y };
      const nextKey = tileKey(next.x, next.y);
      if (!visited.has(nextKey) && isWalkable(map, next.x, next.y)) {
        queue.push(next);
      }
    });
  }

  return visited;
}

function getPortalApproachTiles(map: MapDefinition, portal: PortalDefinition): Array<{ x: number; y: number }> {
  const approaches = new Map<string, { x: number; y: number }>();

  for (let tileY = portal.y; tileY < portal.y + portal.height; tileY += 1) {
    for (let tileX = portal.x; tileX < portal.x + portal.width; tileX += 1) {
      CARDINAL_STEPS.forEach((step) => {
        const candidate = { x: tileX + step.x, y: tileY + step.y };
        if (!isWalkable(map, candidate.x, candidate.y)) {
          return;
        }
        approaches.set(tileKey(candidate.x, candidate.y), candidate);
      });
    }
  }

  return [...approaches.values()];
}

function canReachMap(startMapId: string, targetMapId: string): boolean {
  const queue = [startMapId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const mapId = queue.shift()!;
    if (visited.has(mapId)) {
      continue;
    }
    if (mapId === targetMapId) {
      return true;
    }
    visited.add(mapId);
    const map = contentRegistry.maps[mapId];
    map?.portals.forEach((portal) => {
      if (!visited.has(portal.targetMapId)) {
        queue.push(portal.targetMapId);
      }
    });
  }

  return false;
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} did not round-trip correctly`);
  }
}

function validateMapReachability(): void {
  Object.values(contentRegistry.maps).forEach((map) => {
    const reachable = collectReachableTiles(map);
    if (!reachable.size) {
      fail(`map "${map.id}" has no reachable walkable tiles from its spawn points`);
      return;
    }

    map.portals.forEach((portal) => {
      const approaches = getPortalApproachTiles(map, portal);
      if (!approaches.some((tile) => reachable.has(tileKey(tile.x, tile.y)))) {
        fail(`map "${map.id}" portal "${portal.id}" cannot be reached from any spawn in that map`);
      }
    });

    map.npcPlacements.forEach((npc) => {
      if (!reachable.has(tileKey(Math.floor(npc.x), Math.floor(npc.y)))) {
        fail(`map "${map.id}" npc "${npc.id}" cannot be reached from any spawn in that map`);
      }
    });

    map.enemyPlacements.forEach((enemy) => {
      if (!reachable.has(tileKey(Math.floor(enemy.x), Math.floor(enemy.y)))) {
        fail(`map "${map.id}" enemy "${enemy.id}" cannot be reached from any spawn in that map`);
      }
    });

    map.resourceNodes.forEach((node) => {
      if (!reachable.has(tileKey(Math.floor(node.x), Math.floor(node.y)))) {
        fail(`map "${map.id}" resource node "${node.id}" cannot be reached from any spawn in that map`);
      }
    });
  });
}

function validateCriticalRoutes(): void {
  [
    "old_road",
    "sunglade_city",
    "whisperwood",
    "ridgewatch_mine",
    "glassroot_ruins",
    "glassroot_depths",
  ].forEach((mapId) => {
    if (!canReachMap("emberwharf", mapId)) {
      fail(`critical route is broken: emberwharf cannot reach "${mapId}" through the portal graph`);
    }
  });
}

function validateSaveRoundTrip(): void {
  (globalThis as typeof globalThis & { localStorage: Storage }).localStorage = new MemoryStorage();
  const manager = new SaveManager();

  const settings: SettingsState = {
    masterVolume: 0.55,
    musicVolume: 0.35,
    sfxVolume: 0.8,
    muteMusic: false,
    muteSfx: true,
  };

  manager.saveSettings(settings);
  assertEqual(manager.loadSettings(), settings, "settings");

  const save = createDefaultState(2);
  save.chapter = 3;
  save.currentMapId = "whisperwood";
  save.respawnMapId = "emberwharf";
  save.respawnSpawnId = "from_old_road";
  save.player.x = 10.5 * 16;
  save.player.y = 8.5 * 16;
  save.player.stats.health = 63;
  save.player.stats.stamina = 41;
  save.player.stats.aether = 27;
  save.gold = 173;
  save.playtimeMs = 123456;
  save.settings = settings;
  save.inventory.push({ itemId: "moss_pelt", quantity: 4 });
  save.activeQuestIds = ["main_open_roots", "side_herbal_night"];
  save.completedQuestIds = ["main_gate_embers"];
  save.discoveredMapIds = ["emberwharf", "old_road", "whisperwood"];
  save.discoveredRegionIds = ["emberward", "greenway", "glassroot"];
  save.flags["story.ending_complete"] = true;
  save.flags["story.ending_seen"] = true;

  manager.saveSlot(save);
  const loaded = manager.loadSlot(2);
  if (!loaded) {
    fail("slot 2 save could not be loaded after saving");
    return;
  }

  assertEqual(loaded.chapter, save.chapter, "save.chapter");
  assertEqual(loaded.currentMapId, save.currentMapId, "save.currentMapId");
  assertEqual(loaded.respawnMapId, save.respawnMapId, "save.respawnMapId");
  assertEqual(loaded.respawnSpawnId, save.respawnSpawnId, "save.respawnSpawnId");
  assertEqual(loaded.player, save.player, "save.player");
  assertEqual(loaded.gold, save.gold, "save.gold");
  assertEqual(loaded.inventory, save.inventory, "save.inventory");
  assertEqual(loaded.equipment, save.equipment, "save.equipment");
  assertEqual(loaded.activeQuestIds, save.activeQuestIds, "save.activeQuestIds");
  assertEqual(loaded.completedQuestIds, save.completedQuestIds, "save.completedQuestIds");
  assertEqual(loaded.discoveredMapIds, save.discoveredMapIds, "save.discoveredMapIds");
  assertEqual(loaded.discoveredRegionIds, save.discoveredRegionIds, "save.discoveredRegionIds");
  assertEqual(loaded.flags, save.flags, "save.flags");
  assertEqual(loaded.settings, save.settings, "save.settings");

  const latest = manager.loadLatestSlot();
  if (!latest || latest.slot !== 2) {
    fail("latest-slot loading did not return the most recently saved slot");
  }

  const summary = manager.getAllSlotSummaries().find((entry) => entry.slot === 2);
  if (!summary?.exists) {
    fail("slot summary was not generated for a saved slot");
  } else {
    assertEqual(summary.locationName, "Whisperwood", "slot summary location");
    assertEqual(summary.completedMainStory, true, "slot summary completion state");
  }

  if ((globalThis as typeof globalThis & { localStorage: Storage }).localStorage.getItem(STORAGE_KEYS.latestSlot) !== "2") {
    fail("latest slot storage key was not updated");
  }

  manager.clearAllSaves();
  if (manager.loadSlot(2) !== null) {
    fail("clearAllSaves did not remove saved slot data");
  }
}

function validateMustHaveSection(): void {
  validateMapReachability();
  validateCriticalRoutes();
  validateSaveRoundTrip();
}

function validateCombatSection(): void {
  const weapons = Object.values(contentRegistry.weapons);
  const weaponStyles = new Set(weapons.map((weapon) => weapon.style));
  ["slash", "thrust", "bow", "arcane"].forEach((style) => {
    if (!weaponStyles.has(style as (typeof weapons)[number]["style"])) {
      fail(`combat section is missing weapon style "${style}"`);
    }
  });

  weapons.forEach((weapon) => {
    if ((weapon.style === "slash" || weapon.style === "thrust") && (!weapon.swingWidth || !weapon.swingHeight || !weapon.effectColor)) {
      fail(`weapon "${weapon.id}" is missing melee readability data`);
    }
    if ((weapon.style === "bow" || weapon.style === "arcane") && (!weapon.projectileId || !weapon.projectileSpeed || !weapon.projectileTtlMs)) {
      fail(`weapon "${weapon.id}" is missing projectile feel data`);
    }
  });

  const projectileSpeeds = new Set(
    weapons
      .filter((weapon) => weapon.style === "bow" || weapon.style === "arcane")
      .map((weapon) => weapon.projectileSpeed),
  );
  if (projectileSpeeds.size < 2) {
    fail("ranged weapons do not have distinct projectile speeds");
  }

  const spark = contentRegistry.skills.skill_lantern_spark;
  if (!spark) {
    fail('missing required lantern skill "skill_lantern_spark"');
  } else {
    if ((spark.burstCount ?? 0) < 3) {
      fail("lantern skill should fire a multi-spark burst");
    }
    if (!spark.projectileSpeed || !spark.projectileTtlMs || !spark.spreadRadians) {
      fail("lantern skill is missing special projectile tuning");
    }
  }

  const enemyBehaviors = new Set(Object.values(contentRegistry.enemies).map((enemy) => enemy.behavior));
  ["melee", "skirmisher", "ranged", "charger", "boss"].forEach((behavior) => {
    if (!enemyBehaviors.has(behavior as (typeof contentRegistry.enemies)[keyof typeof contentRegistry.enemies]["behavior"])) {
      fail(`enemy roster is missing behavior "${behavior}"`);
    }
  });

  Object.values(contentRegistry.enemies).forEach((enemy) => {
    if (enemy.windupMs < 180) {
      fail(`enemy "${enemy.id}" telegraph windup is too short`);
    }
    if (!enemy.telegraphColor) {
      fail(`enemy "${enemy.id}" is missing a telegraph color`);
    }
    if ((enemy.behavior === "ranged" || enemy.behavior === "boss" || enemy.projectileId) && (!enemy.projectileSpeed || !enemy.projectileRadius)) {
      fail(`enemy "${enemy.id}" is missing projectile tuning`);
    }
    if (enemy.behavior === "charger" && !enemy.chargeSpeed) {
      fail(`enemy "${enemy.id}" is missing chargeSpeed`);
    }
  });

  const boss = contentRegistry.enemies.the_hollow_stag;
  if (!boss) {
    fail('missing required boss "the_hollow_stag"');
  } else {
    if (!boss.elite) {
      fail("the_hollow_stag should be marked elite");
    }
    if (boss.windupMs < 400) {
      fail("the_hollow_stag windup should be long enough to read");
    }
  }
}

function validateWorldSection(): void {
  const regionIds = Object.keys(contentRegistry.regions);
  if (regionIds.length < 6) {
    fail(`expected at least 6 regions, found ${regionIds.length}`);
  }

  const reachableRegions = new Set<string>();
  const regionQueue = ["emberward"];
  while (regionQueue.length > 0) {
    const regionId = regionQueue.shift()!;
    if (reachableRegions.has(regionId)) {
      continue;
    }
    reachableRegions.add(regionId);
    contentRegistry.regions[regionId]?.connections.forEach((connection) => {
      if (!reachableRegions.has(connection)) {
        regionQueue.push(connection);
      }
    });
  }

  regionIds.forEach((regionId) => {
    const region = contentRegistry.regions[regionId];
    if (!region.summary.trim()) {
      fail(`region "${regionId}" is missing a summary`);
    }
    if (!region.biome.trim()) {
      fail(`region "${regionId}" is missing a biome`);
    }
    if (!region.mapIds.length) {
      fail(`region "${regionId}" has no maps`);
    }
    if (!reachableRegions.has(regionId)) {
      fail(`region "${regionId}" is not reachable from emberward in the region graph`);
    }
  });

  Object.values(contentRegistry.maps).forEach((map) => {
    if (map.theme !== "interior" && map.portals.length === 0) {
      fail(`world map "${map.id}" has no portals`);
    }
  });

  ["emberwharf", "old_road", "southfields", "whisperwood", "ridgewatch_mine", "sunglade_city", "glassroot_ruins"].forEach((mapId) => {
    const map = contentRegistry.maps[mapId];
    if (!map) {
      fail(`missing required landmark map "${mapId}"`);
      return;
    }
    const landmarkCount = map.resourceNodes.filter((node) => node.type === "sign" || node.type === "lore").length;
    if (landmarkCount < 1) {
      fail(`map "${mapId}" should have at least one sign or lore landmark`);
    }
  });

  const mainQuestChain = [
    "main_embers_at_gate",
    "main_bells_of_sunglade",
    "main_open_the_roots",
    "main_last_hearth",
  ];
  mainQuestChain.forEach((questId, index) => {
    const quest = contentRegistry.quests[questId];
    if (!quest) {
      fail(`missing required quest "${questId}"`);
      return;
    }
    if (!quest.journalSummary.trim()) {
      fail(`quest "${questId}" is missing a journal summary`);
    }
    if (!quest.routeHint.trim()) {
      fail(`quest "${questId}" is missing a route hint`);
    }
    if (index < mainQuestChain.length - 1 && quest.followupQuestId !== mainQuestChain[index + 1]) {
      fail(`quest "${questId}" should point to followup "${mainQuestChain[index + 1]}"`);
    }
  });
}

function validateStorySection(): void {
  ["sable_voss", "captain_hale", "lyra_quill", "mara_ashdown"].forEach((npcId) => {
    const npc = contentRegistry.characters[npcId];
    if (!npc) {
      fail(`missing story NPC "${npcId}"`);
      return;
    }
    if (!npc.questIds?.length) {
      fail(`story NPC "${npcId}" is missing quest links`);
    }
  });

  ["main_embers_at_gate", "main_bells_of_sunglade", "main_open_the_roots", "main_last_hearth"].forEach((questId) => {
    const quest = contentRegistry.quests[questId];
    if (!quest?.summary.trim() || !quest?.journalSummary.trim() || !quest?.routeHint.trim()) {
      fail(`story quest "${questId}" is missing summary guidance`);
    }
  });

  [
    { source: gameSessionSource, text: "Begin in Emberwharf Guildhall by speaking with Warden Sable." },
    { source: appSource, text: "Main story complete. Your cleared route is still open for side stories, jobs, and secrets." },
    { source: appSource, text: "Return to Title" },
  ].forEach(({ source, text }) => {
    if (!source.includes(text)) {
      fail(`story UI is missing required text "${text}"`);
    }
  });
}

function validateContentSection(): void {
  [
    { mapId: "emberwharf", minimumNpcs: 4 },
    { mapId: "southfields", minimumNpcs: 2 },
    { mapId: "sunglade_city", minimumNpcs: 3 },
  ].forEach(({ mapId, minimumNpcs }) => {
    const map = contentRegistry.maps[mapId];
    if (!map) {
      fail(`missing required population map "${mapId}"`);
      return;
    }
    if (map.npcPlacements.length < minimumNpcs) {
      fail(`map "${mapId}" should have at least ${minimumNpcs} NPCs to feel populated`);
    }
  });

  const items = Object.values(contentRegistry.items);
  const weapons = items.filter((item) => item.category === "weapon");
  const armors = items.filter((item) => item.category === "armor");
  const trinkets = items.filter((item) => item.category === "trinket");
  if (weapons.length < 5 || armors.length < 3 || trinkets.length < 3) {
    fail("equipment roster is too small to read as progression");
  }
  if ((Math.max(...weapons.map((item) => item.statBonuses?.attack ?? 0)) ?? 0) <= (contentRegistry.items.rust_blade.statBonuses?.attack ?? 0)) {
    fail("weapon progression does not improve beyond the starter blade");
  }

  const shopItems = Object.values(contentRegistry.shops).flatMap((shop) => shop.inventory.map((entry) => contentRegistry.items[entry.itemId]));
  if (!shopItems.some((item) => item.category === "consumable")) {
    fail("shops do not sell consumables");
  }
  if (!shopItems.some((item) => item.category === "weapon")) {
    fail("shops do not sell weapon upgrades");
  }
  if (!shopItems.some((item) => item.category === "armor" || item.category === "trinket")) {
    fail("shops do not sell defensive or support gear");
  }

  Object.values(contentRegistry.jobs).forEach((job) => {
    if (!contentRegistry.characters[job.mentorId]) {
      fail(`job "${job.id}" is missing a valid mentor`);
    }
    if (!contentRegistry.maps[job.locationId]) {
      fail(`job "${job.id}" is missing a valid location`);
    }
    if (!job.description.trim() || !job.perkText.trim()) {
      fail(`job "${job.id}" is missing descriptive payoff text`);
    }
    if (job.baseRewardGold < 10 || job.xpPerLoop <= 0) {
      fail(`job "${job.id}" rewards are too weak to feel worthwhile`);
    }
  });

  const sideQuests = Object.values(contentRegistry.quests).filter((quest) => quest.category === "side");
  if (sideQuests.some((quest) => !quest.rewards.gold && !quest.rewards.items?.length)) {
    fail("some side quests are missing useful rewards");
  }

  const moonwellChest = contentRegistry.maps.moonwell_glen?.resourceNodes.find((node) => node.id === "hidden_chest");
  if (!moonwellChest?.itemDrops?.some((drop) => drop.itemId === "moonwell_band")) {
    fail("Moonwell Glen should grant a secret gear reward");
  }
}

function validateVisualSection(): void {
  ["quest_marker", "turnin_marker", "job_marker", "shop_marker", "icon_charm"].forEach((spriteId) => {
    if (!pixelFactorySource.includes(`case "${spriteId}"`)) {
      fail(`pixelFactory is missing visual asset "${spriteId}"`);
    }
  });

  if (!rendererSource.includes('npc.marker === "job"') || !rendererSource.includes('npc.marker === "shop"')) {
    fail("NPC role markers are not visually distinct for job and shop interactions");
  }

  const iconIds = new Set(Object.values(contentRegistry.items).map((item) => item.iconId));
  iconIds.forEach((iconId) => {
    if (!pixelFactorySource.includes(`case "${iconId}"`)) {
      fail(`item icon "${iconId}" does not have a pixel sprite definition`);
    }
  });
}

function validateAudioSection(): void {
  ["title_theme", "emberwharf_theme", "sunglade_theme", "wilds_theme", "ruin_theme", "battle_theme", "boss_theme", "menu_theme"].forEach((trackId) => {
    if (!audioManifest.music.includes(trackId as (typeof audioManifest.music)[number])) {
      fail(`audio manifest is missing music track "${trackId}"`);
    }
    if (!contentRegistry.audioTracks[trackId as keyof typeof contentRegistry.audioTracks]) {
      fail(`content registry is missing audio track "${trackId}"`);
    }
  });

  Object.values(contentRegistry.maps).forEach((map) => {
    if (!contentRegistry.audioTracks[map.musicTrack]) {
      fail(`map "${map.id}" references missing music track "${map.musicTrack}"`);
    }
  });

  ["menu_move", "menu_accept", "dialogue", "swing", "hit", "dodge", "projectile", "pickup", "coin", "quest", "heal", "enemy_down", "save"].forEach((sfxId) => {
    if (!audioManifest.sfx.includes(sfxId as (typeof audioManifest.sfx)[number])) {
      fail(`audio manifest is missing SFX "${sfxId}"`);
    }
  });

  validateSaveRoundTrip();
}

function validateQolSection(): void {
  [
    "Move: WASD or arrow keys",
    "Attack: J",
    "Lantern Skill: K",
    "Dodge: Space",
    "Interact: E",
    "Pause: Esc",
    "<h3>Main Story</h3>",
    "<h3>Side Stories</h3>",
    "Owned:",
    "(Equipped)",
  ].forEach((text) => {
    if (!appSource.includes(text)) {
      fail(`quality-of-life UI is missing required text "${text}"`);
    }
  });

  if (!rendererSource.includes("Math.max(2, Math.min(CANVAS_WIDTH - totalWidth - 2, x - Math.floor(totalWidth / 2)))")) {
    fail("interaction prompt should clamp horizontally inside the canvas");
  }
  if (!rendererSource.includes("Math.max(2, Math.min(CANVAS_HEIGHT - keyHeight - 2, y - 8))")) {
    fail("interaction prompt should clamp vertically inside the canvas");
  }
}

const section = (process.argv[2] ?? "must-have") as ReleaseSection;
if (!["must-have", "combat", "world", "story", "content", "visual", "audio", "qol", "final"].includes(section)) {
  throw new Error(`Unknown release section "${section}"`);
}

if (section === "must-have") {
  validateMustHaveSection();
}
if (section === "combat") {
  validateCombatSection();
}
if (section === "world") {
  validateWorldSection();
}
if (section === "story") {
  validateStorySection();
}
if (section === "content") {
  validateContentSection();
}
if (section === "visual") {
  validateVisualSection();
}
if (section === "audio") {
  validateAudioSection();
}
if (section === "qol") {
  validateQolSection();
}
if (section === "final") {
  validateMustHaveSection();
  validateCombatSection();
  validateWorldSection();
  validateStorySection();
  validateContentSection();
  validateVisualSection();
  validateAudioSection();
  validateQolSection();
}

if (errors.length > 0) {
  console.error(`release checks failed for section "${section}" with ${errors.length} issue(s)`);
  errors.forEach((error) => console.error(`- ${error}`));
  throw new Error("Release checks failed.");
}

console.log(`release checks passed for section "${section}"`);
