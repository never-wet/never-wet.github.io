import { contentRegistry } from "../memory/contentRegistry";
import type { DayPlan, Vec2 } from "../memory/types";
import { directionFromAngle, randomRange, weightedChoice } from "./collision";

export interface SpawnRequest {
  definitionId: string;
  position: Vec2;
  elite: boolean;
}

export interface SpawnUpdateResult {
  enemies: SpawnRequest[];
  bossId?: string;
  warningText?: string;
}

export class SpawnManager {
  private spawnAccumulator = 0;
  private bossSpawned = false;

  private factionFocusForBiome(biomeId: DayPlan["biomeId"]): string {
    switch (biomeId) {
      case "sunken-ruins":
        return "ruinborn";
      case "ember-waste":
        return "embercourt";
      case "frost-hollow":
        return "frostkin";
      case "eclipse-rift":
        return "riftspawn";
      default:
        return "wildroot";
    }
  }

  beginDay(): void {
    this.spawnAccumulator = 0;
    this.bossSpawned = false;
  }

  setBossSpawned(): void {
    this.bossSpawned = true;
  }

  hasBossSpawned(): boolean {
    return this.bossSpawned;
  }

  update(dt: number, plan: DayPlan, dayProgress: number, playerPosition: Vec2, enemyCount: number): SpawnUpdateResult {
    const result: SpawnUpdateResult = { enemies: [] };

    if (plan.bossId && !this.bossSpawned && dayProgress >= (plan.bossSpawnAt ?? 0.5)) {
      this.bossSpawned = true;
      result.bossId = plan.bossId;
      result.warningText = `${contentRegistry.enemies[plan.bossId].name} incoming`;
    }

    this.spawnAccumulator += dt * plan.spawnRate * (1 + dayProgress * 0.8);
    while (this.spawnAccumulator >= 1 && enemyCount + result.enemies.length < plan.enemyCap) {
      this.spawnAccumulator -= 1;
      const baseIds = Object.entries(plan.enemyWeights)
        .filter(([, weight]) => weight > 0)
        .map(([id]) => id);
      const focusedFaction = this.factionFocusForBiome(plan.biomeId);
      const definitionId = weightedChoice(baseIds, (id) => {
        const factionBoost = contentRegistry.enemies[id]?.faction === focusedFaction ? 1.28 : 1;
        return (plan.enemyWeights[id] ?? 0) * factionBoost;
      });
      if (!definitionId) {
        break;
      }
      const elite = plan.elitePool.length > 0 && Math.random() < plan.eliteChance * (0.4 + dayProgress);
      const eliteId = elite
        ? weightedChoice(plan.elitePool, (id) => contentRegistry.enemies[id]?.unlockDay ?? 0)
        : null;
      const idToSpawn = elite && eliteId ? eliteId : definitionId;
      result.enemies.push({
        definitionId: idToSpawn,
        position: this.createSpawnPosition(playerPosition),
        elite,
      });
    }

    return result;
  }

  private createSpawnPosition(playerPosition: Vec2): Vec2 {
    const angle = randomRange(0, Math.PI * 2);
    const distance = randomRange(720, 980);
    const direction = directionFromAngle(angle);
    return {
      x: playerPosition.x + direction.x * distance,
      y: playerPosition.y + direction.y * distance,
    };
  }
}
