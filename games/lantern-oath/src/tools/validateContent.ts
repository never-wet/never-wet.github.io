import { contentRegistry } from "../memory/contentRegistry";
import { createDefaultState } from "../memory/defaultState";
import type { Condition, DialogueAction, MapDefinition, PortalDefinition, QuestObjectiveDefinition } from "../memory/types";

const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function warn(message: string): void {
  warnings.push(message);
}

function inBounds(map: MapDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function getTileChar(map: MapDefinition, x: number, y: number): string | null {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  if (!inBounds(map, tileX, tileY)) {
    return null;
  }
  return map.layout[tileY]?.[tileX] ?? null;
}

function isWalkable(map: MapDefinition, x: number, y: number): boolean {
  const tile = getTileChar(map, x, y);
  if (!tile) {
    return false;
  }
  const legendEntry = map.legend[tile];
  return Boolean(legendEntry) && !legendEntry.solid;
}

function hasPortalApproach(map: MapDefinition, portal: PortalDefinition): boolean {
  const seen = new Set<string>();
  for (let tileY = portal.y; tileY < portal.y + portal.height; tileY += 1) {
    for (let tileX = portal.x; tileX < portal.x + portal.width; tileX += 1) {
      for (const [offsetX, offsetY] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as const) {
        const sampleX = tileX + offsetX;
        const sampleY = tileY + offsetY;
        const key = `${sampleX},${sampleY}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        if (inBounds(map, sampleX, sampleY) && isWalkable(map, sampleX, sampleY)) {
          return true;
        }
      }
    }
  }
  return false;
}

function validateCondition(condition: Condition, owner: string): void {
  if (condition.type === "quest" && !contentRegistry.quests[condition.key]) {
    fail(`${owner}: unknown quest condition target "${condition.key}"`);
  }
  if (condition.type === "jobRank" && !contentRegistry.jobs[condition.key]) {
    fail(`${owner}: unknown job condition target "${condition.key}"`);
  }
  if (condition.type === "inventory" && !contentRegistry.items[condition.key]) {
    fail(`${owner}: unknown inventory condition target "${condition.key}"`);
  }
  if (condition.type === "map" && !contentRegistry.maps[condition.key]) {
    fail(`${owner}: unknown map condition target "${condition.key}"`);
  }
  if (condition.type === "flag" && !condition.key) {
    fail(`${owner}: flag condition is missing a key`);
  }
}

function validateObjective(objective: QuestObjectiveDefinition, owner: string): void {
  if (objective.kind === "talk" || objective.kind === "deliver") {
    if (!contentRegistry.characters[objective.targetId]) {
      fail(`${owner}: objective "${objective.id}" points to unknown character "${objective.targetId}"`);
    }
  }
  if (objective.kind === "defeat" && !contentRegistry.enemies[objective.targetId]) {
    fail(`${owner}: objective "${objective.id}" points to unknown enemy "${objective.targetId}"`);
  }
  if (objective.kind === "collect" && !contentRegistry.items[objective.targetId]) {
    fail(`${owner}: objective "${objective.id}" points to unknown item "${objective.targetId}"`);
  }
  if (objective.kind === "visit" && !contentRegistry.maps[objective.targetId]) {
    fail(`${owner}: objective "${objective.id}" points to unknown map "${objective.targetId}"`);
  }
  if (objective.kind === "job" && !contentRegistry.jobs[objective.targetId]) {
    fail(`${owner}: objective "${objective.id}" points to unknown job "${objective.targetId}"`);
  }
  if (objective.requiredItemId && !contentRegistry.items[objective.requiredItemId]) {
    fail(`${owner}: objective "${objective.id}" requires missing item "${objective.requiredItemId}"`);
  }
}

function validateAction(action: DialogueAction, owner: string): void {
  if ((action.type === "startQuest" || action.type === "completeQuest") && action.id && !contentRegistry.quests[action.id]) {
    fail(`${owner}: action "${action.type}" points to unknown quest "${action.id}"`);
  }
  if ((action.type === "grantItem" || action.type === "takeItem") && action.id && !contentRegistry.items[action.id]) {
    fail(`${owner}: action "${action.type}" points to unknown item "${action.id}"`);
  }
  if (action.type === "openShop" && action.id && !contentRegistry.shops[action.id]) {
    fail(`${owner}: action "openShop" points to unknown shop "${action.id}"`);
  }
  if (action.type === "openJob" && action.id && !contentRegistry.jobs[action.id]) {
    fail(`${owner}: action "openJob" points to unknown job "${action.id}"`);
  }
  if (action.type === "loadMap") {
    if (action.mapId && !contentRegistry.maps[action.mapId]) {
      fail(`${owner}: action "loadMap" points to unknown map "${action.mapId}"`);
    }
    if (action.mapId && action.spawnId && !contentRegistry.maps[action.mapId]?.spawnPoints.some((spawn) => spawn.id === action.spawnId)) {
      fail(`${owner}: action "loadMap" points to missing spawn "${action.spawnId}" on "${action.mapId}"`);
    }
  }
  if (action.type === "startDialogue" && action.id && action.id !== "system_intro" && !contentRegistry.characters[action.id]) {
    fail(`${owner}: action "startDialogue" points to unknown character "${action.id}"`);
  }
  if (action.type === "setFlag" && !action.key) {
    fail(`${owner}: action "setFlag" is missing a key`);
  }
}

function validateMaps(): void {
  Object.values(contentRegistry.maps).forEach((map) => {
    if (map.layout.length !== map.height) {
      fail(`map "${map.id}" height mismatch: expected ${map.height}, found ${map.layout.length}`);
    }

    const portalIds = new Set<string>();
    const spawnIds = new Set<string>();
    const nodeIds = new Set<string>();
    const npcIds = new Set<string>();
    const enemyIds = new Set<string>();

    map.layout.forEach((row, rowIndex) => {
      if (row.length !== map.width) {
        fail(`map "${map.id}" row ${rowIndex} width mismatch: expected ${map.width}, found ${row.length}`);
      }
      [...row].forEach((tile, columnIndex) => {
        if (!map.legend[tile]) {
          fail(`map "${map.id}" row ${rowIndex} col ${columnIndex} uses unknown tile "${tile}"`);
        }
      });
    });

    if (map.revealRegionId && !contentRegistry.regions[map.revealRegionId]) {
      fail(`map "${map.id}" reveals missing region "${map.revealRegionId}"`);
    }

    map.portals.forEach((portal) => {
      if (portalIds.has(portal.id)) {
        fail(`map "${map.id}" has duplicate portal id "${portal.id}"`);
      }
      portalIds.add(portal.id);

      if (!inBounds(map, portal.x, portal.y) || !inBounds(map, portal.x + portal.width - 1, portal.y + portal.height - 1)) {
        fail(`map "${map.id}" portal "${portal.id}" is out of bounds`);
      }
      if (!contentRegistry.maps[portal.targetMapId]) {
        fail(`map "${map.id}" portal "${portal.id}" points to missing map "${portal.targetMapId}"`);
      } else if (!contentRegistry.maps[portal.targetMapId].spawnPoints.some((spawn) => spawn.id === portal.targetSpawnId)) {
        fail(`map "${map.id}" portal "${portal.id}" points to missing spawn "${portal.targetSpawnId}" on "${portal.targetMapId}"`);
      }
      if (!hasPortalApproach(map, portal)) {
        fail(`map "${map.id}" portal "${portal.id}" has no walkable approach tile`);
      }
      if (portal.lockedFlag && typeof portal.lockedFlag !== "string") {
        fail(`map "${map.id}" portal "${portal.id}" has an invalid lockedFlag value`);
      }
    });

    map.spawnPoints.forEach((spawn) => {
      if (spawnIds.has(spawn.id)) {
        fail(`map "${map.id}" has duplicate spawn id "${spawn.id}"`);
      }
      spawnIds.add(spawn.id);

      if (!inBounds(map, Math.floor(spawn.x), Math.floor(spawn.y))) {
        fail(`map "${map.id}" spawn "${spawn.id}" is out of bounds`);
      } else if (!isWalkable(map, spawn.x, spawn.y)) {
        fail(`map "${map.id}" spawn "${spawn.id}" is not on a walkable tile`);
      }
    });

    map.npcPlacements.forEach((placement) => {
      if (npcIds.has(placement.id)) {
        fail(`map "${map.id}" has duplicate npc placement id "${placement.id}"`);
      }
      npcIds.add(placement.id);

      if (!contentRegistry.characters[placement.npcId]) {
        fail(`map "${map.id}" places missing npc "${placement.npcId}"`);
      } else if (!contentRegistry.dialogue[placement.npcId]) {
        warn(`map "${map.id}" places npc "${placement.npcId}" without a dialogue profile`);
      }
      if (!inBounds(map, Math.floor(placement.x), Math.floor(placement.y))) {
        fail(`map "${map.id}" npc "${placement.id}" is out of bounds`);
      } else if (!isWalkable(map, placement.x, placement.y)) {
        fail(`map "${map.id}" npc "${placement.id}" is not on a walkable tile`);
      }
    });

    map.enemyPlacements.forEach((placement) => {
      if (enemyIds.has(placement.id)) {
        fail(`map "${map.id}" has duplicate enemy placement id "${placement.id}"`);
      }
      enemyIds.add(placement.id);

      if (!contentRegistry.enemies[placement.enemyId]) {
        fail(`map "${map.id}" places missing enemy "${placement.enemyId}"`);
      }
      if (!inBounds(map, Math.floor(placement.x), Math.floor(placement.y))) {
        fail(`map "${map.id}" enemy "${placement.id}" is out of bounds`);
      } else if (!isWalkable(map, placement.x, placement.y)) {
        fail(`map "${map.id}" enemy "${placement.id}" is not on a walkable tile`);
      }
    });

    map.resourceNodes.forEach((node) => {
      if (nodeIds.has(node.id)) {
        fail(`map "${map.id}" has duplicate resource node id "${node.id}"`);
      }
      nodeIds.add(node.id);

      if (!inBounds(map, Math.floor(node.x), Math.floor(node.y))) {
        fail(`map "${map.id}" resource node "${node.id}" is out of bounds`);
      } else if (!isWalkable(map, node.x, node.y)) {
        fail(`map "${map.id}" resource node "${node.id}" is not on a walkable tile`);
      }
    });
  });
}

function validateWorld(): void {
  Object.values(contentRegistry.regions).forEach((region) => {
    region.mapIds.forEach((mapId) => {
      if (!contentRegistry.maps[mapId]) {
        fail(`region "${region.id}" references missing map "${mapId}"`);
      }
    });
    region.connections.forEach((regionId) => {
      if (!contentRegistry.regions[regionId]) {
        fail(`region "${region.id}" references missing connection "${regionId}"`);
      }
    });
  });
}

function validateCharacters(): void {
  Object.values(contentRegistry.characters).forEach((character) => {
    if (!contentRegistry.regions[character.regionId]) {
      fail(`character "${character.id}" references missing region "${character.regionId}"`);
    }
    if (character.shopId && !contentRegistry.shops[character.shopId]) {
      fail(`character "${character.id}" references missing shop "${character.shopId}"`);
    }
    if (character.jobId && !contentRegistry.jobs[character.jobId]) {
      fail(`character "${character.id}" references missing job "${character.jobId}"`);
    }
    character.questIds?.forEach((questId) => {
      if (!contentRegistry.quests[questId]) {
        fail(`character "${character.id}" references missing quest "${questId}"`);
      }
    });
  });
}

function validateQuests(): void {
  const mainQuestCount = Object.values(contentRegistry.quests).filter((quest) => quest.category === "main").length;
  const sideQuestCount = Object.values(contentRegistry.quests).filter((quest) => quest.category === "side").length;
  if (mainQuestCount < 4) {
    fail(`expected at least 4 main quests, found ${mainQuestCount}`);
  }
  if (sideQuestCount < 10) {
    fail(`expected at least 10 side quests, found ${sideQuestCount}`);
  }

  Object.values(contentRegistry.quests).forEach((quest) => {
    if (!contentRegistry.characters[quest.giverId]) {
      fail(`quest "${quest.id}" references missing giver "${quest.giverId}"`);
    }
    if (!quest.routeHint.trim()) {
      fail(`quest "${quest.id}" is missing a routeHint`);
    }
    quest.unlockConditions?.forEach((condition) => validateCondition(condition, `quest "${quest.id}"`));
    quest.objectives.forEach((objective) => validateObjective(objective, `quest "${quest.id}"`));
    quest.rewards.items?.forEach((item) => {
      if (!contentRegistry.items[item.itemId]) {
        fail(`quest "${quest.id}" rewards missing item "${item.itemId}"`);
      }
    });
    quest.followupQuestId && !contentRegistry.quests[quest.followupQuestId] && fail(`quest "${quest.id}" references missing followup "${quest.followupQuestId}"`);
  });

  const finalQuest = contentRegistry.quests.main_last_hearth;
  if (!finalQuest) {
    fail(`missing required main quest "main_last_hearth"`);
  } else if (!finalQuest.rewards.unlockFlags?.some((flag) => flag.key === "story.ending_complete" && flag.value === true)) {
    fail(`"main_last_hearth" must unlock the "story.ending_complete" flag`);
  }
}

function validateJobs(): void {
  const jobCount = Object.values(contentRegistry.jobs).length;
  if (jobCount < 8) {
    fail(`expected at least 8 jobs, found ${jobCount}`);
  }

  Object.values(contentRegistry.jobs).forEach((job) => {
    if (!contentRegistry.characters[job.mentorId]) {
      fail(`job "${job.id}" references missing mentor "${job.mentorId}"`);
    }
    if (!contentRegistry.maps[job.locationId]) {
      fail(`job "${job.id}" references missing location "${job.locationId}"`);
    }
    job.unlockConditions?.forEach((condition) => validateCondition(condition, `job "${job.id}"`));
    validateObjective(job.objective, `job "${job.id}"`);
  });
}

function validateDialogue(): void {
  Object.values(contentRegistry.dialogue).forEach((profile) => {
    if (profile.npcId !== "system_intro" && !contentRegistry.characters[profile.npcId]) {
      fail(`dialogue profile "${profile.npcId}" references missing character`);
    }

    profile.variants.forEach((variant) => {
      const pages = new Map(variant.pages.map((page) => [page.id, page]));
      if (!pages.has(variant.entryPageId)) {
        fail(`dialogue "${profile.npcId}" variant "${variant.id}" has missing entry page "${variant.entryPageId}"`);
      }
      if (pages.size !== variant.pages.length) {
        fail(`dialogue "${profile.npcId}" variant "${variant.id}" has duplicate page ids`);
      }

      variant.conditions?.forEach((condition) => validateCondition(condition, `dialogue "${profile.npcId}" variant "${variant.id}"`));

      variant.pages.forEach((page) => {
        if (page.nextPageId && !pages.has(page.nextPageId)) {
          fail(`dialogue "${profile.npcId}" page "${page.id}" points to missing next page "${page.nextPageId}"`);
        }
        page.actions?.forEach((action) => validateAction(action, `dialogue "${profile.npcId}" page "${page.id}"`));
        page.choices?.forEach((choice) => {
          if (choice.nextPageId && !pages.has(choice.nextPageId)) {
            fail(`dialogue "${profile.npcId}" choice "${choice.id}" points to missing page "${choice.nextPageId}"`);
          }
          choice.actions?.forEach((action) => validateAction(action, `dialogue "${profile.npcId}" choice "${choice.id}"`));
        });
      });
    });
  });
}

function validateDefaultSave(): void {
  const save = createDefaultState(1);
  if (!contentRegistry.maps[save.currentMapId]) {
    fail(`default save starts on missing map "${save.currentMapId}"`);
  }
  if (!contentRegistry.maps[save.respawnMapId]?.spawnPoints.some((spawn) => spawn.id === save.respawnSpawnId)) {
    fail(`default save respawn target "${save.respawnMapId}:${save.respawnSpawnId}" is invalid`);
  }
  save.inventory.forEach((entry) => {
    if (!contentRegistry.items[entry.itemId]) {
      fail(`default save includes missing item "${entry.itemId}"`);
    }
  });
  Object.values(save.equipment).forEach((itemId) => {
    if (itemId && !contentRegistry.items[itemId]) {
      fail(`default save equips missing item "${itemId}"`);
    }
  });
  ["story.ending_complete", "story.ending_seen"].forEach((flag) => {
    if (!(flag in save.flags)) {
      fail(`default save is missing required flag "${flag}"`);
    }
  });
}

validateWorld();
validateMaps();
validateCharacters();
validateQuests();
validateJobs();
validateDialogue();
validateDefaultSave();

const summary = [
  `maps=${Object.keys(contentRegistry.maps).length}`,
  `regions=${Object.keys(contentRegistry.regions).length}`,
  `quests=${Object.keys(contentRegistry.quests).length}`,
  `jobs=${Object.keys(contentRegistry.jobs).length}`,
  `dialogueProfiles=${Object.keys(contentRegistry.dialogue).length}`,
].join(" ");

if (warnings.length) {
  console.warn(`content warnings (${warnings.length})`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error(`content validation failed with ${errors.length} error(s)`);
  errors.forEach((error) => console.error(`- ${error}`));
  throw new Error("Content validation failed.");
}

console.log(`content validation passed: ${summary}`);
