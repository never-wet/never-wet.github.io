import { AudioManager } from "../engine/audioManager";
import { Camera } from "../engine/camera";
import {
  add,
  angleTo,
  applySoftWorldBounds,
  circlesOverlap,
  clamp,
  clampToWorld,
  copyVec,
  directionFromAngle,
  distance,
  limit,
  normalize,
  pointToSegmentDistance,
  randomRange,
  scale,
  subtract,
  vec,
} from "../engine/collision";
import { EntityManager } from "../engine/entityManager";
import { GameLoop } from "../engine/gameLoop";
import { InputManager } from "../engine/input";
import { ParticleManager } from "../engine/particleManager";
import { Renderer } from "../engine/renderer";
import { SaveManager } from "../engine/saveManager";
import { SpawnManager } from "../engine/spawnManager";
import { SpriteLibrary } from "../engine/assets";
import {
  LEVEL_UP_CHOICE_COUNT,
  rollDayRewardOptions,
  rollUpgradeChoices,
} from "../data/upgrades/choicePool";
import { createDefaultPlayerStats } from "../memory/defaultState";
import { getDayPlan } from "../memory/dayProgression";
import { gameManifest } from "../memory/gameManifest";
import { startingPassives, startingWeapons } from "../memory/playerDefaults";
import type {
  DayPlan,
  DayObjectiveState,
  DaySummary,
  DroneRuntime,
  EnemyEffectId,
  EnemyDefinition,
  EnemyRuntime,
  EventState,
  GameModeId,
  PickupRuntime,
  PlayerRuntime,
  ProjectileRuntime,
  RunPassiveState,
  RunSnapshot,
  RunWeaponState,
  SaveData,
  SceneId,
  SettingsData,
  UpgradeChoice,
  Vec2,
  WarningMessage,
} from "../memory/types";
import { contentRegistry } from "../memory/contentRegistry";
import { applyPassiveDefinition, applyModifier, nextXpThreshold, resolveWeaponStats } from "./rules";
import { GameUI, type UiModel } from "./ui";

interface ActiveRun {
  modeId: GameModeId;
  characterId: string;
  day: number;
  dayPlan: DayPlan;
  player: PlayerRuntime;
  weapons: RunWeaponState[];
  passives: RunPassiveState[];
  relicIds: string[];
  objective: DayObjectiveState | null;
  warnings: WarningMessage[];
  upgradeChoices: UpgradeChoice[];
  daySummary: DaySummary | null;
  pendingLevels: number;
  dayTimeRemaining: number;
  elapsedInDay: number;
  totalRunTime: number;
  killCount: number;
  usedContinue: boolean;
  flash: number;
  dayStartSnapshot: RunSnapshot | null;
  shrineTimer: number;
  shrineSpawned: boolean;
  hazardTimer: number;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class HundredDaysRuntime {
  private readonly canvas = document.createElement("canvas");
  private readonly overlay = document.createElement("div");
  private readonly camera = new Camera();
  private readonly input = new InputManager(window);
  private readonly entities = new EntityManager();
  private readonly sprites = new SpriteLibrary();
  private readonly renderer = new Renderer(this.canvas, this.camera, this.sprites);
  private readonly particles = new ParticleManager(this.entities, () => this.nextUid++);
  private readonly spawner = new SpawnManager();
  private readonly audio = new AudioManager();
  private readonly saves = new SaveManager();
  private readonly ui = new GameUI(this.overlay, (action, value) => this.handleAction(action, value));
  private readonly loop = new GameLoop((dt) => this.frame(dt));

  private saveData: SaveData = this.saves.load();
  private scene: SceneId = "title";
  private previousScene: SceneId = "title";
  private run: ActiveRun | null = null;
  private selectedModeId: GameModeId = "standard";
  private selectedCharacterId = "ash-warden";
  private activeEvent: EventState | null = null;
  private nextUid = 1;
  private time = 0;
  private autosaveTimer = 0;

  constructor(private readonly root: HTMLElement) {
    root.classList.add("game-root");
    this.canvas.className = "game-canvas";
    this.overlay.className = "game-overlay";
    root.append(this.canvas, this.overlay);
    this.renderer.resize();
    this.audio.applySettings(this.saveData.settings);
    window.addEventListener("resize", this.handleResize);
  }

  start(): void {
    this.loop.start();
  }

  destroy(): void {
    this.loop.stop();
    this.input.dispose();
    window.removeEventListener("resize", this.handleResize);
  }

  private readonly handleResize = (): void => {
    this.renderer.resize();
  };

  private getModeDefinition(modeId: GameModeId = this.selectedModeId) {
    return gameManifest.modes.find((mode) => mode.id === modeId) ?? gameManifest.modes[0];
  }

  private getCharacterDefinition(characterId: string = this.selectedCharacterId) {
    return contentRegistry.characters[characterId] ?? Object.values(contentRegistry.characters)[0];
  }

  private rememberCodex<K extends keyof SaveData["profile"]["codex"]>(section: K, id: SaveData["profile"]["codex"][K][number]): boolean {
    const bucket = this.saveData.profile.codex[section] as Array<string | GameModeId>;
    if (bucket.includes(id as string | GameModeId)) {
      return false;
    }
    bucket.push(id as string | GameModeId);
    return true;
  }

  private hasPassive(passiveId: string): boolean {
    return Boolean(this.run?.passives.some((passive) => passive.id === passiveId));
  }

  private hasWeapon(weaponId: string): boolean {
    return Boolean(this.run?.weapons.some((weapon) => weapon.id === weaponId));
  }

  private getEvolutionForWeapon(weapon: RunWeaponState) {
    if (weapon.level < contentRegistry.weapons[weapon.id].maxLevel) {
      return null;
    }
    return (
      Object.values(contentRegistry.evolutions).find(
        (evolution) => evolution.weaponId === weapon.id && this.run?.passives.some((passive) => passive.id === evolution.passiveId),
      ) ?? null
    );
  }

  private getResolvedWeaponStats(weapon: RunWeaponState) {
    const stats = { ...resolveWeaponStats(weapon) };
    const evolution = this.getEvolutionForWeapon(weapon);
    if (evolution) {
      for (const [key, value] of Object.entries(evolution.bonuses) as Array<[keyof typeof stats, number]>) {
        stats[key] += value;
      }
    }
    return stats;
  }

  private getWeaponDisplayName(weapon: RunWeaponState): string {
    return this.getEvolutionForWeapon(weapon)?.evolvedName ?? contentRegistry.weapons[weapon.id].name;
  }

  private getActiveSynergies() {
    if (!this.run) {
      return [];
    }
    const run = this.run;
    return Object.values(contentRegistry.synergies).filter((synergy) => {
      const ownsWeapons = synergy.weaponIds.every((weaponId) => run.weapons.some((weapon) => weapon.id === weaponId));
      const ownsPassive = synergy.passiveId ? run.passives.some((passive) => passive.id === synergy.passiveId) : true;
      return ownsWeapons && ownsPassive;
    });
  }

  private hasSynergy(synergyId: string): boolean {
    return this.getActiveSynergies().some((synergy) => synergy.id === synergyId);
  }

  private emitEnemyEffectParticle(enemy: EnemyRuntime, effect: EnemyEffectId, count = 1): void {
    const color =
      effect === "slow"
        ? "#9dffb5"
        : effect === "shock"
          ? "#d5f8ff"
          : effect === "rupture"
            ? "#ffb07a"
            : "#ffd37a";
    const force = effect === "shock" ? 34 : effect === "rupture" ? 30 : 24;
    const life = effect === "shock" ? 0.34 : 0.28;
    this.particles.trail(enemy.position, color, count, enemy.radius * 0.55, force, life);
  }

  private markEnemyEffect(enemy: EnemyRuntime, effect: EnemyEffectId): void {
    const fresh =
      effect === "slow"
        ? enemy.slowFx <= 0.05
        : effect === "shock"
          ? enemy.shockFx <= 0.05
          : effect === "rupture"
            ? enemy.ruptureFx <= 0.05
            : enemy.searFx <= 0.05;

    switch (effect) {
      case "slow":
        enemy.slowFx = Math.max(enemy.slowFx, 0.48);
        break;
      case "shock":
        enemy.shockFx = Math.max(enemy.shockFx, 0.42);
        break;
      case "rupture":
        enemy.ruptureFx = Math.max(enemy.ruptureFx, 0.5);
        break;
      case "sear":
        enemy.searFx = Math.max(enemy.searFx, 0.4);
        break;
    }

    if (fresh) {
      this.emitEnemyEffectParticle(enemy, effect, effect === "shock" ? 2 : 1);
    }
    enemy.effectPulseTimer = Math.min(enemy.effectPulseTimer, 0.08);
  }

  private refreshDerivedDiscoveries(showWarnings: boolean): void {
    if (!this.run) {
      return;
    }
    for (const weapon of this.run.weapons) {
      const evolution = this.getEvolutionForWeapon(weapon);
      if (!evolution) {
        continue;
      }
      const added = this.rememberCodex("evolutions", evolution.id);
      if (added && showWarnings) {
        this.pushWarning(`${evolution.evolvedName} awakened`, "level");
      }
    }
    for (const synergy of this.getActiveSynergies()) {
      this.rememberCodex("synergies", synergy.id);
    }
  }

  private applyRelic(relicId: string, showWarning = true): void {
    if (!this.run || this.run.relicIds.includes(relicId)) {
      return;
    }
    const relic = contentRegistry.relics[relicId];
    if (!relic) {
      return;
    }
    this.run.relicIds.push(relicId);
    applyModifier(this.run.player.stats, relic.statModifiers);
    this.normalizePlayerStats();
    this.rememberCodex("relics", relicId);
    if (showWarning) {
      this.pushWarning(`${relic.name} claimed`, "event");
    }
  }

  private rollRelic(excluded: string[] = []): string | null {
    const options = Object.values(contentRegistry.relics).filter((relic) => !excluded.includes(relic.id));
    if (options.length === 0) {
      return null;
    }
    return options[Math.floor(Math.random() * options.length)]?.id ?? null;
  }

  private createObjective(day: number, modeId: GameModeId): DayObjectiveState | null {
    const plan = this.getModeAdjustedDayPlan(day, modeId);
    if (plan.bossId) {
      return {
        kind: "boss",
        title: "Boss Target",
        description: `Defeat ${contentRegistry.enemies[plan.bossId].name} before dawn ends.`,
        current: 0,
        target: 1,
        completed: false,
        rewardText: "Boss objective reward: surge heal, XP pulse, and luck boost.",
      };
    }

    const selector = (day + (modeId === "fragile" ? 1 : 0)) % 3;
    if (selector === 0) {
      return {
        kind: "slayer",
        title: "Slayer Contract",
        description: `Defeat ${18 + Math.floor(day * 0.75)} enemies this day.`,
        current: 0,
        target: 18 + Math.floor(day * 0.75),
        completed: false,
        rewardText: "Objective reward: heal, XP burst, and a steadier aim bonus.",
      };
    }
    if (selector === 1) {
      return {
        kind: "collector",
        title: "Salvage Sweep",
        description: `Collect ${16 + Math.floor(day * 0.45)} pickups before dusk.`,
        current: 0,
        target: 16 + Math.floor(day * 0.45),
        completed: false,
        rewardText: "Objective reward: pickup reach, XP gain, and a short heal pulse.",
      };
    }
    return {
      kind: "shrine",
      title: "Field Pilgrimage",
      description: "Find and activate a field shrine hidden in the arena.",
      current: 0,
      target: 1,
      completed: false,
      rewardText: "Objective reward: shrine blessing, luck, and a restored guard.",
    };
  }

  private progressObjective(kind: DayObjectiveState["kind"], amount = 1): void {
    if (!this.run?.objective || this.run.objective.completed || this.run.objective.kind !== kind) {
      return;
    }
    this.run.objective.current = Math.min(this.run.objective.target, this.run.objective.current + amount);
    if (this.run.objective.current < this.run.objective.target) {
      return;
    }
    this.run.objective.completed = true;
    this.run.player.stats.hp = Math.min(this.run.player.stats.maxHp, this.run.player.stats.hp + this.run.player.stats.maxHp * 0.12);
    this.run.player.stats.xp = Math.min(this.run.player.stats.xpToNext - 1, this.run.player.stats.xp + this.run.player.stats.xpToNext * 0.22);
    this.run.player.stats.luck += 0.01;
    this.pushWarning(`${this.run.objective.title} complete`, "event");
  }

  private getModeAdjustedDayPlan(day: number, modeId: GameModeId): DayPlan {
    const source = clone(getDayPlan(modeId === "endless" ? Math.min(day, gameManifest.dayCount) : day));
    source.day = day;
    if (modeId === "endless" && day > gameManifest.dayCount) {
      source.spawnRate += 0.2;
      source.enemyCap = Math.min(source.enemyCap + 20, 260);
      source.eliteChance = Math.min(source.eliteChance + 0.04, 0.4);
      source.summary = `Endless Day ${day}. The Day 100 threat level persists with additional pressure.`;
    }
    if (modeId === "boss-rush") {
      source.duration = Math.max(84, Math.round(source.duration * 0.78));
      source.spawnRate += 0.28;
      source.enemyCap = Math.min(source.enemyCap + 18, 250);
      source.eliteChance = Math.min(source.eliteChance + 0.05, 0.4);
      const rushBosses = ["mire-titan", "ash-monarch", "glacier-revenant", "night-seraph", "hundredth-dawn"];
      if (!source.bossId && day >= 5 && day % 5 === 0) {
        source.bossId = rushBosses[Math.floor(day / 5 - 1) % rushBosses.length];
        source.bossSpawnAt = 0.55;
      }
      source.summary = `Boss Rush Day ${day}. Faster pacing and rotating champion pressure define the run.`;
    }
    if (modeId === "fragile") {
      source.spawnRate += 0.12;
      source.eliteChance = Math.min(source.eliteChance + 0.04, 0.38);
      source.summary = `Fragile Circuit Day ${day}. Lower survivability makes every spacing mistake matter more.`;
    }
    return source;
  }

  private spawnBiomeHazard(): void {
    if (!this.run) {
      return;
    }
    const biome = this.run.dayPlan.biomeId;
    const angle = randomRange(0, Math.PI * 2);
    const offset = scale(directionFromAngle(angle), randomRange(180, 320));
    const hazardByBiome: Record<string, { kind: string; radius: number; damage: number; color: string }> = {
      "verdant-reach": { kind: "bramble patch", radius: 72, damage: 8, color: "rgba(134, 255, 146, 0.24)" },
      "sunken-ruins": { kind: "ruin pulse", radius: 78, damage: 10, color: "rgba(132, 218, 228, 0.24)" },
      "ember-waste": { kind: "cinder vent", radius: 84, damage: 12, color: "rgba(255, 155, 98, 0.24)" },
      "frost-hollow": { kind: "whiteout ring", radius: 88, damage: 11, color: "rgba(166, 227, 255, 0.24)" },
      "eclipse-rift": { kind: "rift tear", radius: 94, damage: 14, color: "rgba(208, 148, 255, 0.24)" },
    };
    const config = hazardByBiome[biome];
    this.entities.hazards.push({
      uid: this.nextUid++,
      kind: config.kind,
      biomeId: biome,
      position: add(this.run.player.position, offset),
      radius: config.radius + this.run.day * 0.35,
      life: 5.6,
      warmup: 1.2,
      pulseTimer: 0.48,
      damage: config.damage + this.run.day * 0.08,
      color: config.color,
    });
  }

  private updateHazards(dt: number): void {
    if (!this.run) {
      return;
    }
    this.run.hazardTimer -= dt;
    if (this.run.hazardTimer <= 0) {
      this.run.hazardTimer = Math.max(5.5, 10.5 - this.run.day * 0.06);
      this.spawnBiomeHazard();
    }

    for (const hazard of this.entities.hazards) {
      hazard.life -= dt;
      hazard.warmup = Math.max(0, hazard.warmup - dt);
      if (hazard.warmup > 0) {
        continue;
      }
      hazard.pulseTimer -= dt;
      if (hazard.pulseTimer > 0) {
        continue;
      }
      hazard.pulseTimer = 0.65;
      if (distance(hazard.position, this.run.player.position) <= hazard.radius + this.run.player.radius) {
        this.damagePlayer(hazard.damage, hazard.position);
      }
      for (const enemy of this.entities.enemies) {
        if (distance(hazard.position, enemy.position) <= hazard.radius + enemy.radius) {
          this.damageEnemy(enemy, hazard.damage * 0.48, hazard.position, 0, 18, "#dff6ff", false);
        }
      }
    }
  }

  private spawnShrine(): void {
    if (!this.run) {
      return;
    }
    const angle = randomRange(0, Math.PI * 2);
    const position = add(this.run.player.position, scale(directionFromAngle(angle), randomRange(260, 360)));
    this.entities.shrines.push({
      uid: this.nextUid++,
      title: "Wayfarer Shrine",
      description: "A dormant relay offers a hard bargain and a stronger tomorrow.",
      position,
      radius: 26,
      life: 999,
      used: false,
      choices: [
        {
          id: "blood-price",
          title: "Blood Price",
          description: "Lose 20% max HP now and claim a random relic.",
        },
        {
          id: "forge-draft",
          title: "Forge Draft",
          description: "Upgrade your weakest weapon or gain a strong damage surge.",
        },
        {
          id: "pilgrim-rest",
          title: "Pilgrim Rest",
          description: "Recover health, steady regen, and count the shrine toward your objective.",
        },
      ],
    });
    this.pushWarning("A shrine hums nearby", "event");
  }

  private updateShrines(dt: number): void {
    if (!this.run) {
      return;
    }
    if (!this.run.shrineSpawned && this.run.day >= 4) {
      this.run.shrineTimer -= dt;
      if (this.run.shrineTimer <= 0) {
        this.run.shrineSpawned = true;
        this.spawnShrine();
      }
    }
    if (this.scene !== "playing") {
      return;
    }
    for (const shrine of this.entities.shrines) {
      shrine.life -= dt * 0;
      if (shrine.used) {
        continue;
      }
      if (distance(shrine.position, this.run.player.position) <= shrine.radius + this.run.player.radius + 8) {
        shrine.used = true;
        this.activeEvent = {
          shrineUid: shrine.uid,
          title: shrine.title,
          description: shrine.description,
          choices: shrine.choices,
        };
        this.previousScene = "playing";
        this.scene = "event";
        return;
      }
    }
  }

  private takeShrineChoice(choiceId: string): void {
    if (!this.run || !this.activeEvent) {
      return;
    }
    switch (choiceId) {
      case "blood-price": {
        this.run.player.stats.hp = Math.max(1, this.run.player.stats.hp - this.run.player.stats.maxHp * 0.2);
        const relicId = this.rollRelic(this.run.relicIds);
        if (relicId) {
          this.applyRelic(relicId);
        } else {
          this.run.player.stats.damageMultiplier += 0.1;
        }
        break;
      }
      case "forge-draft": {
        const weakest = [...this.run.weapons]
          .filter((weapon) => weapon.level < contentRegistry.weapons[weapon.id].maxLevel)
          .sort((left, right) => left.level - right.level)[0];
        if (weakest && weakest.level < contentRegistry.weapons[weakest.id].maxLevel) {
          weakest.level += 1;
        } else {
          this.run.player.stats.damageMultiplier += 0.12;
          this.run.player.stats.cooldownMultiplier -= 0.04;
        }
        break;
      }
      case "pilgrim-rest":
        this.run.player.stats.hp = Math.min(this.run.player.stats.maxHp, this.run.player.stats.hp + this.run.player.stats.maxHp * 0.32);
        this.run.player.stats.regen += 0.14;
        this.run.player.stats.luck += 0.02;
        break;
    }
    this.progressObjective("shrine", 1);
    this.normalizePlayerStats();
    this.activeEvent = null;
    this.scene = "playing";
    this.persistRun();
  }

  private buildCodexSections(): UiModel["codexSections"] {
    const codex = this.saveData.profile.codex;
    return [
      {
        title: "Modes",
        entries: gameManifest.modes.map((mode) => ({
          id: mode.id,
          label: mode.label,
          subtitle: "Challenge Mode",
          description: mode.description,
          discovered: codex.modes.includes(mode.id),
        })),
      },
      {
        title: "Survivors",
        entries: Object.values(contentRegistry.characters).map((character) => ({
          id: character.id,
          label: character.name,
          subtitle: character.title,
          description: character.description,
          discovered: codex.characters.includes(character.id),
        })),
      },
      {
        title: "Relics",
        entries: Object.values(contentRegistry.relics).map((relic) => ({
          id: relic.id,
          label: relic.name,
          subtitle: relic.rarity,
          description: relic.description,
          discovered: codex.relics.includes(relic.id),
        })),
      },
      {
        title: "Weapons",
        entries: Object.values(contentRegistry.weapons).map((weapon) => ({
          id: weapon.id,
          label: weapon.name,
          subtitle: weapon.rarity,
          description: weapon.description,
          discovered: codex.weapons.includes(weapon.id),
        })),
      },
      {
        title: "Passives",
        entries: Object.values(contentRegistry.passives).map((passive) => ({
          id: passive.id,
          label: passive.name,
          subtitle: passive.rarity,
          description: passive.description,
          discovered: codex.passives.includes(passive.id),
        })),
      },
      {
        title: "Enemies",
        entries: Object.values(contentRegistry.enemies).map((enemy) => ({
          id: enemy.id,
          label: enemy.name,
          subtitle: enemy.faction,
          description: enemy.description,
          discovered: codex.enemies.includes(enemy.id),
        })),
      },
      {
        title: "Evolutions",
        entries: Object.values(contentRegistry.evolutions).map((evolution) => ({
          id: evolution.id,
          label: evolution.evolvedName,
          subtitle: contentRegistry.weapons[evolution.weaponId].name,
          description: evolution.description,
          discovered: codex.evolutions.includes(evolution.id),
        })),
      },
      {
        title: "Synergies",
        entries: Object.values(contentRegistry.synergies).map((synergy) => ({
          id: synergy.id,
          label: synergy.name,
          subtitle: "Loadout Synergy",
          description: synergy.description,
          discovered: codex.synergies.includes(synergy.id),
        })),
      },
    ];
  }

  private frame(dt: number): void {
    this.time += dt;
    this.processGlobalInput();

    if (this.scene === "playing") {
      this.updatePlaying(dt);
    } else {
      this.camera.update(this.run?.player.position ?? vec(0, 0), dt);
    }

    this.updateMusic();
    this.audio.tick();

    this.renderer.render({
      scene: this.scene,
      run: this.run
        ? {
            dayPlan: this.run.dayPlan,
            player: this.run.player,
            weapons: this.run.weapons,
            entities: this.entities,
            warnings: this.run.warnings,
            flash: this.run.flash,
            time: this.time,
          }
        : null,
      time: this.time,
      reducedFlash: this.saveData.settings.reducedFlash,
    });

    this.ui.render(this.buildUiModel());
    this.input.endFrame();
  }

  private processGlobalInput(): void {
    const escapePressed = this.input.consumePress("Escape");
    const pausePressed = this.input.consumePress("KeyP") || this.input.consumePress("Space");

    if (!escapePressed && !pausePressed) {
      return;
    }

    if (this.scene === "playing" && (escapePressed || pausePressed)) {
      this.previousScene = "playing";
      this.scene = "paused";
      return;
    }

    if (this.scene === "paused" && (escapePressed || pausePressed)) {
      this.scene = "playing";
      return;
    }

    if (this.scene === "settings" && escapePressed) {
      this.scene = this.previousScene;
      return;
    }

    if (this.scene === "codex" && escapePressed) {
      this.scene = "title";
    }
  }

  private updateMusic(): void {
    if (this.scene === "victory") {
      this.audio.setTrack("victory-rise");
      return;
    }

    if (
      this.scene === "title" ||
      this.scene === "settings" ||
      this.scene === "paused" ||
      this.scene === "game-over" ||
      this.scene === "codex" ||
      this.scene === "event"
    ) {
      this.audio.setTrack("menu-drift");
      return;
    }

    if (this.run && this.getBossEntity()) {
      this.audio.setTrack("danger-bloom");
      return;
    }

    if (this.run) {
      this.audio.setTrack("field-drive");
      return;
    }

    this.audio.setTrack("menu-drift");
  }

  private updatePlaying(dt: number): void {
    if (!this.run) {
      return;
    }

    this.run.flash = Math.max(0, this.run.flash - dt * 1.2);
    this.updateWarnings(dt);
    this.updatePlayer(dt);
    this.updateDayTimer(dt);
    this.spawnEnemies(dt);
    this.updateWeapons(dt);
    this.syncDroneCount();
    this.updateDrones(dt);
    this.updateHazards(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateBeams(dt);
    this.updateMines(dt);
    this.updatePickups(dt);
    this.updateShrines(dt);
    this.particles.update(dt);
    this.entities.cleanup();
    this.processLevelUps();
    this.camera.update(this.run.player.position, dt);

    this.autosaveTimer += dt;
    if (this.autosaveTimer >= 8) {
      this.autosaveTimer = 0;
      this.persistRun();
    }

    const boss = this.getBossEntity();
    if (this.run.dayTimeRemaining <= 0 && !boss) {
      this.finishDay();
    }
  }

  private updateWarnings(dt: number): void {
    if (!this.run) {
      return;
    }
    for (const warning of this.run.warnings) {
      warning.timer -= dt;
    }
    this.run.warnings = this.run.warnings.filter((warning) => warning.timer > 0);
  }

  private updatePlayer(dt: number): void {
    if (!this.run) {
      return;
    }
    const axis = this.input.getMoveAxis();
    const movement = normalize(axis);
    const speed = this.run.player.stats.moveSpeed;
    this.run.player.velocity = scale(movement, speed);
    this.run.player.position = clampToWorld(add(this.run.player.position, scale(this.run.player.velocity, dt)));
    this.run.player.hitFlash = Math.max(0, this.run.player.hitFlash - dt * 3.2);
    this.run.player.invulnerable = Math.max(0, this.run.player.invulnerable - dt);
    this.run.player.stats.hp = Math.min(this.run.player.stats.maxHp, this.run.player.stats.hp + this.run.player.stats.regen * dt);

    if (movement.x !== 0 || movement.y !== 0) {
      this.run.player.facing = Math.atan2(movement.y, movement.x);
    }
  }

  private updateDayTimer(dt: number): void {
    if (!this.run) {
      return;
    }
    this.run.elapsedInDay += dt;
    this.run.totalRunTime += dt;
    this.run.dayTimeRemaining = Math.max(0, this.run.dayPlan.duration - this.run.elapsedInDay);
  }

  private spawnEnemies(dt: number): void {
    if (!this.run) {
      return;
    }
    const dayProgress = clamp(this.run.elapsedInDay / this.run.dayPlan.duration, 0, 1);
    const result = this.spawner.update(dt, this.run.dayPlan, dayProgress, this.run.player.position, this.entities.enemies.length);
    for (const spawn of result.enemies) {
      this.spawnEnemy(spawn.definitionId, spawn.position);
    }
    if (result.bossId) {
      this.spawnEnemy(result.bossId, add(this.run.player.position, { x: 0, y: -420 }));
      this.pushWarning(result.warningText ?? "Boss incoming", "boss");
      this.audio.playCue("boss-warning");
    }
  }

  private updateWeapons(dt: number): void {
    if (!this.run) {
      return;
    }
    for (const weapon of this.run.weapons) {
      const definition = contentRegistry.weapons[weapon.id];
      const stats = this.getResolvedWeaponStats(weapon);
      const cooldown = Math.max(0.08, stats.cooldown * Math.max(0.4, this.run.player.stats.cooldownMultiplier));
      weapon.cooldown -= dt;

      if (weapon.id === "sun-orbiters") {
        weapon.orbitAngle += dt * (1.6 + weapon.level * 0.18);
      }

      if (weapon.cooldown > 0) {
        continue;
      }

      switch (definition.archetype) {
        case "projectile":
          this.fireAutoProjectiles(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "spread":
          this.fireSpread(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "pierce":
          this.firePiercingShot(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "orbit":
          this.pulseOrbiters(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "blast":
          this.castBlast(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "beam":
          this.castBeam(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "mine":
          this.deployMines(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "summon":
          weapon.cooldown += cooldown;
          break;
        case "chain":
          this.castChain(weapon, stats);
          weapon.cooldown += cooldown;
          break;
        case "aura":
          this.pulseAura(weapon, stats);
          weapon.cooldown += cooldown;
          break;
      }
    }
  }

  private updateDrones(dt: number): void {
    if (!this.run) {
      return;
    }
    const summon = this.run.weapons.find((weapon) => weapon.id === "drone-sentinels");
    if (!summon) {
      return;
    }
    const stats = this.getResolvedWeaponStats(summon);
    for (const drone of this.entities.drones) {
      drone.orbitAngle += dt * 0.95;
      drone.fireCooldown -= dt;
      if (drone.fireCooldown > 0) {
        continue;
      }
      const position = this.getDronePosition(drone);
      const target = this.findNearestEnemy(position, stats.range);
      if (!target) {
        continue;
      }
      drone.fireCooldown = Math.max(0.18, stats.cooldown * Math.max(0.4, this.run.player.stats.cooldownMultiplier));
      this.spawnProjectile({
        source: "player",
        kind: "drone-shot",
        position,
        velocity: scale(directionFromAngle(angleTo(position, target.position)), 480 * this.run.player.stats.projectileSpeed),
        radius: 8,
        damage: stats.damage * this.run.player.stats.damageMultiplier,
        life: 1.1,
        maxLife: 1.1,
        pierce: 0,
        color: "#a8ffe3",
        knockback: 70,
        critChance: this.run.player.stats.critChance,
        chain: 0,
        spriteId: "weapon-drone-sentinels",
      });
    }
  }

  private updateEnemies(dt: number): void {
    if (!this.run) {
      return;
    }
    for (const enemy of this.entities.enemies) {
      const definition = contentRegistry.enemies[enemy.definitionId];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.slow = Math.max(0, enemy.slow - dt * 1.2);
      enemy.slowFx = Math.max(0, enemy.slowFx - dt * 1.8);
      enemy.shockFx = Math.max(0, enemy.shockFx - dt * 2);
      enemy.ruptureFx = Math.max(0, enemy.ruptureFx - dt * 1.6);
      enemy.searFx = Math.max(0, enemy.searFx - dt * 1.7);
      enemy.attackTimer -= dt;
      enemy.dashTimer = Math.max(0, enemy.dashTimer - dt);
      enemy.contactTimer -= dt;
      enemy.summonTimer -= dt;
      enemy.effectPulseTimer -= dt;
      enemy.stateTimer += dt;

      const activeEffects: EnemyEffectId[] = [];
      if (enemy.slowFx > 0) {
        activeEffects.push("slow");
      }
      if (enemy.shockFx > 0) {
        activeEffects.push("shock");
      }
      if (enemy.ruptureFx > 0) {
        activeEffects.push("rupture");
      }
      if (enemy.searFx > 0) {
        activeEffects.push("sear");
      }
      if (activeEffects.length > 0 && enemy.effectPulseTimer <= 0) {
        const effect = activeEffects[Math.floor(Math.random() * activeEffects.length)];
        this.emitEnemyEffectParticle(enemy, effect);
        enemy.effectPulseTimer = 0.16 + Math.random() * 0.18;
      }

      const toPlayer = subtract(this.run.player.position, enemy.position);
      const distanceToPlayer = distance(enemy.position, this.run.player.position);
      const direction = normalize(toPlayer);
      const side = { x: -direction.y, y: direction.x };
      this.updateBossPhase(enemy, definition);
      const speedScale =
        1 +
        this.run.day * 0.004 +
        (enemy.elite ? 0.1 : 0) +
        (enemy.affix === "hasted" ? 0.24 : 0) +
        enemy.phase * 0.08;
      const baseSpeed = definition.speed * speedScale * (1 - enemy.slow * 0.45);
      let desired = scale(direction, baseSpeed);

      if (enemy.dashTimer > 0 && definition.charge) {
        desired = scale(direction, definition.charge.speed);
      } else {
        switch (definition.behavior) {
          case "fast":
            desired = add(scale(direction, baseSpeed), scale(side, Math.sin(enemy.stateTimer * 8) * 40));
            break;
          case "tank":
          case "swarm":
          case "splitter":
            desired = scale(direction, baseSpeed);
            break;
          case "ranged":
          case "wisp":
            desired = this.computeRangedVelocity(enemy, definition, direction, side, distanceToPlayer, baseSpeed);
            this.handleRangedAttack(enemy, definition, direction, distanceToPlayer);
            break;
          case "charger":
            if (definition.charge && enemy.attackTimer <= 0 && distanceToPlayer < 320) {
              enemy.attackTimer = definition.charge.cooldown;
              enemy.dashTimer = definition.charge.duration;
            }
            break;
          case "boss":
            desired = this.computeBossVelocity(enemy, definition, direction, side, distanceToPlayer, baseSpeed);
            this.handleBossActions(enemy, definition, direction, distanceToPlayer);
            break;
        }
      }

      enemy.velocity.x += (desired.x - enemy.velocity.x) * Math.min(dt * 5, 1);
      enemy.velocity.y += (desired.y - enemy.velocity.y) * Math.min(dt * 5, 1);
      applySoftWorldBounds(enemy.position, enemy.velocity, dt);
      enemy.position.x += enemy.velocity.x * dt;
      enemy.position.y += enemy.velocity.y * dt;
      enemy.position = clampToWorld(enemy.position);

      if (circlesOverlap(enemy.position, enemy.radius, this.run.player.position, this.run.player.radius) && enemy.contactTimer <= 0) {
        enemy.contactTimer = definition.touchCooldown;
        this.damagePlayer(definition.damage * (1 + this.run.day * 0.01), enemy.position);
        if (enemy.affix === "siphon") {
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + definition.maxHp * 0.05);
        }
      }
    }
  }

  private computeRangedVelocity(
    enemy: EnemyRuntime,
    definition: EnemyDefinition,
    direction: Vec2,
    side: Vec2,
    distanceToPlayer: number,
    baseSpeed: number,
  ): Vec2 {
    const range = definition.ranged?.range ?? 320;
    if (distanceToPlayer < range * 0.45) {
      return scale(direction, -baseSpeed * 0.75);
    }
    if (distanceToPlayer > range * 0.82) {
      return scale(direction, baseSpeed);
    }
    return add(scale(side, Math.sin(enemy.stateTimer * 4) > 0 ? baseSpeed * 0.8 : -baseSpeed * 0.8), scale(direction, baseSpeed * 0.15));
  }

  private handleRangedAttack(enemy: EnemyRuntime, definition: EnemyDefinition, direction: Vec2, distanceToPlayer: number): void {
    if (!this.run || !definition.ranged || enemy.attackTimer > 0 || distanceToPlayer > definition.ranged.range) {
      return;
    }
    enemy.attackTimer = definition.ranged.cooldown;
    this.spawnProjectile({
      source: "enemy",
      kind: "spore",
      position: copyVec(enemy.position),
      velocity: scale(direction, definition.ranged.speed),
      radius: 9,
      damage: definition.ranged.damage * (1 + this.run.day * 0.012),
      life: 2.6,
      maxLife: 2.6,
      pierce: 0,
      color: "#ff92c1",
      knockback: 30,
      critChance: 0,
      chain: 0,
      spriteId: "weapon-bloom-spread",
    });
  }

  private computeBossVelocity(
    enemy: EnemyRuntime,
    definition: EnemyDefinition,
    direction: Vec2,
    side: Vec2,
    distanceToPlayer: number,
    baseSpeed: number,
  ): Vec2 {
    if (definition.charge && enemy.attackTimer <= 0 && distanceToPlayer < 260 && Math.random() < 0.012 + enemy.phase * 0.005) {
      enemy.dashTimer = definition.charge.duration;
      enemy.attackTimer = Math.max(definition.ranged?.cooldown ?? 2.2, definition.charge.cooldown);
      return scale(direction, definition.charge.speed);
    }
    return add(scale(direction, baseSpeed * (0.72 + enemy.phase * 0.06)), scale(side, Math.sin(enemy.stateTimer * (1.8 + enemy.phase * 0.3)) * 68));
  }

  private handleBossActions(enemy: EnemyRuntime, definition: EnemyDefinition, direction: Vec2, distanceToPlayer: number): void {
    if (!this.run) {
      return;
    }
    if (definition.ranged && enemy.attackTimer <= 0 && distanceToPlayer < definition.ranged.range) {
      enemy.attackTimer = Math.max(0.55, definition.ranged.cooldown - enemy.phase * 0.2);
      const bolts = (definition.id === "hundredth-dawn" ? 12 : definition.id === "night-seraph" ? 10 : 8) + enemy.phase * 2;
      for (let index = 0; index < bolts; index += 1) {
        const angle = (Math.PI * 2 * index) / bolts + enemy.stateTimer * 0.15;
        this.spawnProjectile({
          source: "enemy",
          kind: "boss-bolt",
          position: copyVec(enemy.position),
          velocity: scale(directionFromAngle(angle), definition.ranged.speed),
          radius: definition.id === "hundredth-dawn" ? 12 : 10,
          damage: definition.ranged.damage * (1 + enemy.phase * 0.14),
          life: 2.5,
          maxLife: 2.5,
          pierce: 0,
          color: "#ffd166",
          knockback: 40,
          critChance: 0,
          chain: 0,
          spriteId: "weapon-ember-darts",
        });
      }
      this.spawnProjectile({
        source: "enemy",
        kind: "aimed-bolt",
        position: copyVec(enemy.position),
        velocity: scale(direction, definition.ranged.speed * 1.15),
        radius: 12,
        damage: definition.ranged.damage * (1.15 + enemy.phase * 0.12),
        life: 2.8,
        maxLife: 2.8,
        pierce: 0,
        color: "#ffb05e",
        knockback: 50,
        critChance: 0,
        chain: 0,
        spriteId: "weapon-rail-splinter",
      });
    }

    if (definition.summonIds && enemy.summonTimer <= 0) {
      enemy.summonTimer = Math.max(4.6, 7.5 - enemy.phase * 1.2);
      for (let index = 0; index < 2 + enemy.phase; index += 1) {
        const summonId = definition.summonIds[index % definition.summonIds.length];
        this.spawnEnemy(
          summonId,
          add(enemy.position, scale(directionFromAngle((Math.PI * 2 * index) / 2 + randomRange(-0.2, 0.2)), 82)),
        );
      }
    }
  }

  private updateBossPhase(enemy: EnemyRuntime, definition: EnemyDefinition): void {
    if (!this.run || !enemy.boss) {
      return;
    }
    const hpRatio = enemy.hp / enemy.maxHp;
    if (enemy.phase === 0 && hpRatio <= 0.7) {
      enemy.phase = 1;
      enemy.attackTimer = 0;
      enemy.summonTimer = 0;
      this.run.flash = Math.max(this.run.flash, 0.26);
      this.pushWarning(`${definition.name} enters phase two`, "boss");
      return;
    }
    if (enemy.phase === 1 && hpRatio <= 0.35) {
      enemy.phase = 2;
      enemy.attackTimer = 0;
      enemy.summonTimer = 0;
      this.run.flash = Math.max(this.run.flash, 0.32);
      this.pushWarning(`${definition.name} goes berserk`, "boss");
    }
  }

  private updateProjectiles(dt: number): void {
    if (!this.run) {
      return;
    }
    for (const projectile of this.entities.projectiles) {
      projectile.life -= dt;
      projectile.position.x += projectile.velocity.x * dt;
      projectile.position.y += projectile.velocity.y * dt;

      if (projectile.source === "player") {
        for (const enemy of this.entities.enemies) {
          if (projectile.pierce < 0) {
            break;
          }
          if (!circlesOverlap(projectile.position, projectile.radius, enemy.position, enemy.radius)) {
            continue;
          }
          this.damageEnemy(enemy, projectile.damage, projectile.position, projectile.critChance, projectile.knockback, projectile.color, true);
          if (projectile.kind === "rail" && this.hasSynergy("searing-rake")) {
            this.markEnemyEffect(enemy, "sear");
          }
          projectile.pierce -= 1;
          const nudge = normalize(projectile.velocity);
          projectile.position.x += nudge.x * (enemy.radius + 4);
          projectile.position.y += nudge.y * (enemy.radius + 4);
        }
      } else if (circlesOverlap(projectile.position, projectile.radius, this.run.player.position, this.run.player.radius)) {
        projectile.life = 0;
        this.damagePlayer(projectile.damage, projectile.position);
      }
    }
  }

  private updateBeams(dt: number): void {
    for (const beam of this.entities.beams) {
      beam.life -= dt;
      if (beam.source !== "player") {
        continue;
      }
      for (const enemy of this.entities.enemies) {
        if (pointToSegmentDistance(enemy.position, beam.origin, beam.target) <= beam.width + enemy.radius) {
          this.damageEnemy(enemy, beam.damagePerSecond * dt, beam.target, 0.04, 24, beam.color, false);
          this.markEnemyEffect(enemy, "shock");
        }
      }
    }
  }

  private updateMines(dt: number): void {
    for (const mine of this.entities.mines) {
      mine.fuse -= dt;
      if (mine.fuse <= 0) {
        const faultline = this.hasSynergy("faultline-charge");
        this.explode(mine.position, mine.explosionRadius * (faultline ? 1.24 : 1), mine.damage * (faultline ? 1.1 : 1), "#ffae7c");
      }
    }
  }

  private updatePickups(dt: number): void {
    if (!this.run) {
      return;
    }
    for (const pickup of this.entities.pickups) {
      pickup.life -= dt;
      const toPlayer = subtract(this.run.player.position, pickup.position);
      const pickupDistance = distance(pickup.position, this.run.player.position);
      if (pickupDistance <= this.run.player.stats.pickupRadius * 1.5) {
        pickup.attracted = true;
      }
      if (pickup.attracted) {
        const force = scale(normalize(toPlayer), this.run.player.stats.magnetStrength * dt);
        pickup.velocity = add(pickup.velocity, force);
      }
      pickup.velocity = scale(pickup.velocity, 0.95);
      pickup.position = add(pickup.position, scale(pickup.velocity, dt));

      if (circlesOverlap(pickup.position, pickup.radius, this.run.player.position, this.run.player.radius + 4)) {
        this.collectPickup(pickup);
      }
    }
  }

  private collectPickup(pickup: PickupRuntime): void {
    if (!this.run) {
      return;
    }
    pickup.life = 0;
    this.audio.playCue("pickup");

    if (pickup.type.startsWith("xp")) {
      this.run.player.stats.xp += pickup.value * this.run.player.stats.xpMultiplier;
      this.progressObjective("collector", 1);
      return;
    }

    if (pickup.type === "heal-orb") {
      this.run.player.stats.hp = Math.min(this.run.player.stats.maxHp, this.run.player.stats.hp + pickup.value + this.run.player.stats.luck * 20);
      this.progressObjective("collector", 1);
      return;
    }

    if (pickup.type === "magnet-star") {
      this.progressObjective("collector", 1);
      for (const candidate of this.entities.pickups) {
        candidate.attracted = true;
      }
    }
  }

  private processLevelUps(): void {
    if (!this.run || this.scene !== "playing") {
      return;
    }
    while (this.run.player.stats.xp >= this.run.player.stats.xpToNext) {
      this.run.player.stats.xp -= this.run.player.stats.xpToNext;
      this.run.player.stats.level += 1;
      this.run.player.stats.xpToNext = nextXpThreshold(this.run.player.stats.xpToNext, this.run.player.stats.level);
      this.run.pendingLevels += 1;
    }

    if (this.run.pendingLevels > 0) {
      this.run.upgradeChoices = rollUpgradeChoices(this.run.day, this.run.weapons, this.run.passives, LEVEL_UP_CHOICE_COUNT);
      this.scene = "upgrade";
      this.audio.playCue("level-up");
    }
  }

  private fireAutoProjectiles(weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const target = this.findNearestEnemy(this.run.player.position, stats.range);
    if (!target) {
      return;
    }
    const count = Math.max(1, Math.round(stats.count));
    for (let index = 0; index < count; index += 1) {
      const angle = angleTo(this.run.player.position, target.position) + randomRange(-0.05, 0.05);
      this.spawnProjectile({
        source: "player",
        kind: "dart",
        position: copyVec(this.run.player.position),
        velocity: scale(directionFromAngle(angle), stats.speed * this.run.player.stats.projectileSpeed),
        radius: stats.size,
        damage: stats.damage * this.run.player.stats.damageMultiplier,
        life: stats.range / (stats.speed * this.run.player.stats.projectileSpeed),
        maxLife: 1.2,
        pierce: Math.round(stats.pierce),
        color: "#ffd279",
        knockback: stats.knockback,
        critChance: this.run.player.stats.critChance,
        chain: 0,
        spriteId: "weapon-ember-darts",
      });
    }
    this.audio.playCue("weapon-fire");
  }

  private fireSpread(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const target = this.findNearestEnemy(this.run.player.position, stats.range);
    const baseAngle = target ? angleTo(this.run.player.position, target.position) : this.run.player.facing;
    const count = Math.max(3, Math.round(stats.count));
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : -stats.spread * 0.5 + (stats.spread * index) / (count - 1);
      const angle = baseAngle + offset;
      this.spawnProjectile({
        source: "player",
        kind: "spread",
        position: copyVec(this.run.player.position),
        velocity: scale(directionFromAngle(angle), stats.speed * this.run.player.stats.projectileSpeed),
        radius: stats.size,
        damage: stats.damage * this.run.player.stats.damageMultiplier,
        life: stats.range / Math.max(stats.speed, 1),
        maxLife: 1.2,
        pierce: 0,
        color: "#baff95",
        knockback: stats.knockback,
        critChance: this.run.player.stats.critChance,
        chain: 0,
        spriteId: "weapon-bloom-spread",
      });
    }
  }

  private firePiercingShot(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const target = this.findNearestEnemy(this.run.player.position, stats.range);
    if (!target) {
      return;
    }
    const angle = angleTo(this.run.player.position, target.position);
    const searingRake = this.hasSynergy("searing-rake");
    this.spawnProjectile({
      source: "player",
      kind: "rail",
      position: copyVec(this.run.player.position),
      velocity: scale(directionFromAngle(angle), stats.speed * this.run.player.stats.projectileSpeed),
      radius: stats.size,
      damage: stats.damage * this.run.player.stats.damageMultiplier * (searingRake ? 1.12 : 1),
      life: stats.range / Math.max(stats.speed, 1),
      maxLife: 1,
      pierce: Math.max(1, Math.round(stats.pierce) + (searingRake ? 2 : 0)),
      color: "#baf2ff",
      knockback: stats.knockback + (searingRake ? 60 : 0),
      critChance: this.run.player.stats.critChance + 0.06,
      chain: 0,
      spriteId: "weapon-rail-splinter",
    });
  }

  private pulseOrbiters(weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const count = Math.max(1, Math.round(stats.orbitals));
    const orbitRadius = stats.orbitRadius * this.run.player.stats.areaMultiplier;
    for (let index = 0; index < count; index += 1) {
      const angle = weapon.orbitAngle + (Math.PI * 2 * index) / count;
      const position = add(this.run.player.position, scale(directionFromAngle(angle), orbitRadius));
      for (const enemy of this.entities.enemies) {
        if (circlesOverlap(position, stats.size, enemy.position, enemy.radius)) {
          this.damageEnemy(enemy, stats.damage * this.run.player.stats.damageMultiplier, position, this.run.player.stats.critChance, stats.knockback, "#ffe18c", false);
        }
      }
    }
  }

  private castBlast(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const radius = stats.radius * this.run.player.stats.areaMultiplier;
    for (const enemy of this.entities.enemies) {
      if (distance(enemy.position, this.run.player.position) <= radius + enemy.radius) {
        this.damageEnemy(enemy, stats.damage * this.run.player.stats.damageMultiplier, this.run.player.position, this.run.player.stats.critChance * 0.5, stats.knockback, "#ffba8b", false);
      }
    }
    this.particles.burst(this.run.player.position, "#ffba8b", 20, 240);
    this.run.flash = Math.max(this.run.flash, 0.22);
  }

  private castBeam(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const target = this.findNearestEnemy(this.run.player.position, stats.range);
    if (!target) {
      return;
    }
    this.entities.beams.push({
      uid: this.nextUid++,
      source: "player",
      origin: copyVec(this.run.player.position),
      target: copyVec(target.position),
      width: stats.beamWidth * this.run.player.stats.areaMultiplier,
      damagePerSecond: stats.damage * this.run.player.stats.damageMultiplier,
      life: stats.duration * this.run.player.stats.durationMultiplier,
      color: "#9ff4ff",
    });
    if (this.hasSynergy("arc-conduit")) {
      const chained = this.entities.enemies
        .filter((enemy) => enemy.uid !== target.uid)
        .sort((left, right) => distance(left.position, target.position) - distance(right.position, target.position))[0];
      if (chained && distance(chained.position, target.position) < 210) {
        this.entities.beams.push({
          uid: this.nextUid++,
          source: "player",
          origin: copyVec(target.position),
          target: copyVec(chained.position),
          width: 7,
          damagePerSecond: stats.damage * this.run.player.stats.damageMultiplier * 0.45,
          life: 0.16,
          color: "#d5f8ff",
        });
        this.damageEnemy(chained, stats.damage * this.run.player.stats.damageMultiplier * 0.5, target.position, this.run.player.stats.critChance, 40, "#d5f8ff", true);
        this.markEnemyEffect(chained, "shock");
      }
    }
  }

  private deployMines(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const count = Math.max(1, Math.round(stats.count));
    const target = this.findNearestEnemy(this.run.player.position, 420);
    for (let index = 0; index < count; index += 1) {
      const position = target
        ? add(target.position, { x: randomRange(-28, 28), y: randomRange(-28, 28) })
        : add(this.run.player.position, { x: randomRange(-70, 70), y: randomRange(-70, 70) });
      this.entities.mines.push({
        uid: this.nextUid++,
        position,
        fuse: Math.max(0.2, stats.fuse * this.run.player.stats.durationMultiplier),
        explosionRadius: stats.radius * this.run.player.stats.areaMultiplier,
        damage: stats.damage * this.run.player.stats.damageMultiplier,
        radius: stats.size,
        spriteId: "weapon-ember-mines",
      });
    }
  }

  private castChain(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const first = this.findNearestEnemy(this.run.player.position, stats.range);
    if (!first) {
      return;
    }
    const targets: EnemyRuntime[] = [first];
    while (targets.length < Math.max(2, Math.round(stats.chain))) {
      const last = targets[targets.length - 1];
      const next = this.entities.enemies
        .filter((enemy) => !targets.includes(enemy))
        .sort((left, right) => distance(left.position, last.position) - distance(right.position, last.position))[0];
      if (!next || distance(next.position, last.position) > 220) {
        break;
      }
      targets.push(next);
    }

    let origin = this.run.player.position;
    for (const enemy of targets) {
      this.entities.beams.push({
        uid: this.nextUid++,
        source: "player",
        origin: copyVec(origin),
        target: copyVec(enemy.position),
        width: 8,
        damagePerSecond: 0,
        life: 0.12,
        color: "#d5f8ff",
      });
      this.damageEnemy(enemy, stats.damage * this.run.player.stats.damageMultiplier, origin, this.run.player.stats.critChance, 90, "#d5f8ff", true);
      this.markEnemyEffect(enemy, "shock");
      origin = enemy.position;
    }
  }

  private pulseAura(_weapon: RunWeaponState, stats: ReturnType<typeof resolveWeaponStats>): void {
    if (!this.run) {
      return;
    }
    const radius = stats.radius * this.run.player.stats.areaMultiplier * (this.hasSynergy("halo-garden") ? 1.18 : 1);
    for (const enemy of this.entities.enemies) {
      if (distance(enemy.position, this.run.player.position) <= radius + enemy.radius) {
        enemy.slow = Math.max(enemy.slow, this.hasSynergy("halo-garden") ? 1 : 0.8);
        this.damageEnemy(enemy, stats.damage * this.run.player.stats.damageMultiplier, this.run.player.position, 0, 45, "#bbffb6", false);
        this.markEnemyEffect(enemy, "slow");
      }
    }
  }

  private spawnProjectile(projectile: Omit<ProjectileRuntime, "uid">): void {
    this.entities.projectiles.push({
      uid: this.nextUid++,
      ...projectile,
    });
  }

  private explode(position: Vec2, radius: number, damage: number, color: string): void {
    for (const enemy of this.entities.enemies) {
      if (distance(enemy.position, position) <= radius + enemy.radius) {
        this.damageEnemy(enemy, damage, position, this.run?.player.stats.critChance ?? 0, 120, color, true);
        this.markEnemyEffect(enemy, "rupture");
      }
    }
    this.particles.burst(position, color, 26, 260);
    if (this.run) {
      this.run.flash = Math.max(this.run.flash, 0.3);
    }
  }

  private damageEnemy(
    enemy: EnemyRuntime,
    amount: number,
    from: Vec2,
    critChance: number,
    knockback: number,
    color: string,
    canCrit: boolean,
  ): void {
    if (!this.run || enemy.hp <= 0) {
      return;
    }
    const crit = canCrit && Math.random() < critChance;
    const damage = amount * (crit ? this.run.player.stats.critMultiplier : 1) * (enemy.affix === "bulwark" ? 0.82 : 1);
    enemy.hp -= damage;
    enemy.hitFlash = 0.16;
    const push = normalize(subtract(enemy.position, from));
    const definition = contentRegistry.enemies[enemy.definitionId];
    enemy.velocity.x += (push.x * knockback) / Math.max(0.3, definition.knockbackResistance);
    enemy.velocity.y += (push.y * knockback) / Math.max(0.3, definition.knockbackResistance);
    this.particles.burst(enemy.position, color, crit ? 6 : 3, crit ? 220 : 140);
    if (this.saveData.settings.damageNumbers) {
      this.particles.text(enemy.position, `${Math.round(damage)}`, crit ? "#fff4ce" : color, crit);
    }
    this.audio.playCue("enemy-hit");
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private damagePlayer(amount: number, from: Vec2): void {
    if (!this.run || this.run.player.invulnerable > 0) {
      return;
    }
    if (Math.random() < this.run.player.stats.dodgeChance) {
      return;
    }
    const armorReduction = this.run.player.stats.armor * 2.2;
    const damage = Math.max(1, amount - armorReduction);
    this.run.player.stats.hp -= damage;
    this.run.player.hitFlash = 0.3;
    this.run.player.invulnerable = 0.28;
    this.run.flash = Math.max(this.run.flash, 0.22);
    this.audio.playCue("player-hit");
    this.camera.addShake(this.saveData.settings.screenshake ? 0.32 : 0);

    const recoil = normalize(subtract(this.run.player.position, from));
    this.run.player.position = clampToWorld(add(this.run.player.position, scale(recoil, 18)));

    if (this.run.player.stats.hp > 0) {
      return;
    }

    if (this.run.player.stats.reviveCharges > 0) {
      this.run.player.stats.reviveCharges -= 1;
      this.run.player.stats.hp = this.run.player.stats.maxHp * 0.45;
      this.run.player.invulnerable = 2;
      this.pushWarning("Second Wind triggered", "level");
      return;
    }

    this.gameOver();
  }

  private killEnemy(enemy: EnemyRuntime): void {
    if (!this.run) {
      return;
    }
    const definition = contentRegistry.enemies[enemy.definitionId];
    enemy.hp = 0;
    this.run.killCount += 1;
    this.progressObjective("slayer", 1);
    this.audio.playCue("enemy-die");
    this.particles.burst(enemy.position, enemy.boss ? "#ffd166" : "#ffae7c", enemy.boss ? 24 : 8, enemy.boss ? 260 : 160);

    if (definition.splitInto && definition.splitCount) {
      for (let index = 0; index < definition.splitCount; index += 1) {
        this.spawnEnemy(definition.splitInto, add(enemy.position, { x: randomRange(-12, 12), y: randomRange(-12, 12) }));
      }
    }

    if (enemy.affix === "splitter") {
      for (let index = 0; index < 2; index += 1) {
        this.spawnEnemy("racer-mite", add(enemy.position, { x: randomRange(-16, 16), y: randomRange(-16, 16) }));
      }
    }

    if (enemy.affix === "explosive") {
      this.explode(enemy.position, 72, definition.damage * 1.2, "#ff9f7a");
    }

    this.dropLoot(enemy.position, definition.xp, enemy.boss);

    if (enemy.boss) {
      this.progressObjective("boss", 1);
    }

    if (enemy.boss && this.run.day === 100) {
      this.finishDay();
    }
  }

  private dropLoot(position: Vec2, xp: number, isBoss: boolean): void {
    const choices: Array<{ type: string; value: number }> = [];
    let remaining = xp;
    while (remaining > 0) {
      if (remaining >= contentRegistry.loot["xp-large"].value) {
        choices.push({ type: "xp-large", value: contentRegistry.loot["xp-large"].value });
        remaining -= contentRegistry.loot["xp-large"].value;
      } else if (remaining >= contentRegistry.loot["xp-medium"].value) {
        choices.push({ type: "xp-medium", value: contentRegistry.loot["xp-medium"].value });
        remaining -= contentRegistry.loot["xp-medium"].value;
      } else {
        const value = Math.min(remaining, contentRegistry.loot["xp-small"].value);
        choices.push({ type: "xp-small", value });
        remaining -= value;
      }
    }

    for (const choice of choices) {
      this.entities.pickups.push({
        uid: this.nextUid++,
        type: choice.type,
        position: add(position, { x: randomRange(-10, 10), y: randomRange(-10, 10) }),
        velocity: { x: randomRange(-30, 30), y: randomRange(-30, 30) },
        value: choice.value,
        radius: contentRegistry.loot[choice.type].radius,
        life: 28,
        attracted: false,
        spriteId: contentRegistry.loot[choice.type].spriteId,
      });
    }

    const healChance = isBoss ? 1 : 0.05 + this.run!.player.stats.luck * 0.5;
    if (Math.random() < healChance) {
      this.entities.pickups.push({
        uid: this.nextUid++,
        type: "heal-orb",
        position: add(position, { x: randomRange(-8, 8), y: randomRange(-8, 8) }),
        velocity: { x: randomRange(-24, 24), y: randomRange(-24, 24) },
        value: contentRegistry.loot["heal-orb"].value,
        radius: contentRegistry.loot["heal-orb"].radius,
        life: 24,
        attracted: false,
        spriteId: contentRegistry.loot["heal-orb"].spriteId,
      });
    }

    const magnetChance = isBoss ? 0.6 : 0.015 + this.run!.player.stats.luck * 0.2;
    if (Math.random() < magnetChance) {
      this.entities.pickups.push({
        uid: this.nextUid++,
        type: "magnet-star",
        position: add(position, { x: randomRange(-10, 10), y: randomRange(-10, 10) }),
        velocity: { x: randomRange(-22, 22), y: randomRange(-22, 22) },
        value: 0,
        radius: contentRegistry.loot["magnet-star"].radius,
        life: 20,
        attracted: false,
        spriteId: contentRegistry.loot["magnet-star"].spriteId,
      });
    }
  }

  private findNearestEnemy(from: Vec2, range: number): EnemyRuntime | null {
    let best: EnemyRuntime | null = null;
    let bestDistance = range;
    for (const enemy of this.entities.enemies) {
      const current = distance(from, enemy.position);
      if (current < bestDistance) {
        bestDistance = current;
        best = enemy;
      }
    }
    return best;
  }

  private spawnEnemy(definitionId: string, position: Vec2): void {
    const definition = contentRegistry.enemies[definitionId];
    if (!definition || !this.run) {
      return;
    }
    const elite = Boolean(definition.isElite);
    const boss = Boolean(definition.isBoss);
    const eliteAffixes = ["explosive", "hasted", "bulwark", "splitter", "siphon"] as const;
    const affix = elite ? eliteAffixes[Math.floor(Math.random() * eliteAffixes.length)] : undefined;
    const hpScale = boss ? 1 : 1 + this.run.day * 0.07 + (elite ? 0.9 : 0) + (affix === "bulwark" ? 0.35 : 0);
    this.rememberCodex("enemies", definitionId);

    this.entities.enemies.push({
      uid: this.nextUid++,
      definitionId,
      position: clampToWorld(position),
      velocity: { x: 0, y: 0 },
      radius: definition.radius * (elite || boss ? 1.08 : 1),
      hp: definition.maxHp * hpScale,
      maxHp: definition.maxHp * hpScale,
      hitFlash: 0,
      slow: 0,
      slowFx: 0,
      shockFx: 0,
      ruptureFx: 0,
      searFx: 0,
      attackTimer: randomRange(0.1, 0.8),
      stateTimer: randomRange(0, 10),
      dashTimer: 0,
      contactTimer: randomRange(0.1, 0.4),
      summonTimer: randomRange(3.5, 6.5),
      effectPulseTimer: randomRange(0.08, 0.2),
      elite,
      boss,
      affix,
      phase: 0,
    });
  }

  private getDronePosition(drone: DroneRuntime): Vec2 {
    if (!this.run) {
      return vec(0, 0);
    }
    return add(this.run.player.position, scale(directionFromAngle(drone.orbitAngle), 118));
  }

  private syncDroneCount(): void {
    if (!this.run) {
      return;
    }
    const weapon = this.run.weapons.find((entry) => entry.id === "drone-sentinels");
    const count = weapon ? Math.max(0, Math.round(this.getResolvedWeaponStats(weapon).drones)) : 0;
    while (this.entities.drones.length < count) {
      this.entities.drones.push({
        uid: this.nextUid++,
        weaponId: "drone-sentinels",
        orbitAngle: (Math.PI * 2 * this.entities.drones.length) / Math.max(count, 1),
        fireCooldown: randomRange(0.1, 0.5),
        radius: 14,
        damage: weapon ? this.getResolvedWeaponStats(weapon).damage : 12,
      });
    }
    while (this.entities.drones.length > count) {
      this.entities.drones.pop();
    }
  }

  private getBossEntity(): EnemyRuntime | null {
    return this.entities.enemies.find((enemy) => enemy.boss) ?? null;
  }

  private finishDay(): void {
    if (!this.run) {
      return;
    }

    if (this.run.modeId !== "endless" && this.run.day >= gameManifest.dayCount) {
      this.scene = "victory";
      this.saveData.profile.bestDay = gameManifest.dayCount;
      this.saveData.profile.completedDay100 = true;
      this.persistProfile();
      this.saveData = this.saves.clearRun(this.saveData);
      this.audio.playCue("victory");
      return;
    }

    this.audio.playCue("day-clear");
    this.saveData.profile.bestDay = Math.max(this.saveData.profile.bestDay, this.run.day);
    this.persistProfile();

    this.run.player.stats.hp = Math.min(
      this.run.player.stats.maxHp,
      this.run.player.stats.hp + this.run.player.stats.maxHp * this.run.dayPlan.restHealRatio,
    );
    this.run.daySummary = {
      day: this.run.day,
      killCount: this.run.killCount,
      summaryText: this.run.dayPlan.summary,
      rewardOptions: rollDayRewardOptions(this.run.weapons, this.run.passives),
      objectiveText: this.run.objective?.title,
      objectiveComplete: this.run.objective?.completed,
      objectiveRewardText: this.run.objective?.rewardText,
    };
    this.scene = "day-summary";
    this.entities.reset();
    this.run.warnings = [];
    this.persistRun();
  }

  private gameOver(): void {
    if (!this.run) {
      return;
    }
    this.scene = "game-over";
    this.saveData.profile.bestDay = Math.max(this.saveData.profile.bestDay, this.run.day);
    this.saveData.profile.totalDeaths += 1;
    this.persistProfile();
    if (this.run.dayStartSnapshot && !this.run.usedContinue) {
      this.saveData = this.saves.saveRun(this.saveData, clone(this.run.dayStartSnapshot));
    } else {
      this.saveData = this.saves.clearRun(this.saveData);
    }
    this.audio.playCue("game-over");
  }

  private pushWarning(text: string, emphasis: WarningMessage["emphasis"]): void {
    if (!this.run) {
      return;
    }
    this.run.warnings.push({
      id: this.nextUid++,
      text,
      timer: emphasis === "boss" ? 3.8 : 2.6,
      emphasis,
    });
  }

  private beginNewRun(): void {
    const mode = this.getModeDefinition();
    const character = this.getCharacterDefinition();
    const playerStats = createDefaultPlayerStats();
    applyModifier(playerStats, character.statModifiers);
    if (mode.id === "fragile") {
      playerStats.maxHp = Math.max(56, playerStats.maxHp - 44);
      playerStats.xpMultiplier += 0.14;
      playerStats.moveSpeed += 10;
    } else if (mode.id === "boss-rush") {
      playerStats.damageMultiplier += 0.08;
      playerStats.moveSpeed += 8;
    } else if (mode.id === "endless") {
      playerStats.luck += 0.03;
      playerStats.pickupRadius += 10;
    }
    playerStats.hp = playerStats.maxHp;
    const player: PlayerRuntime = {
      position: vec(0, 0),
      velocity: vec(0, 0),
      radius: 17,
      facing: 0,
      hitFlash: 0,
      invulnerable: 0,
      stats: playerStats,
    };

    const starterWeapons = [character.starterWeaponId ?? startingWeapons[0]];
    const weapons = starterWeapons.map<RunWeaponState>((id, index) => ({
      id,
      level: 1,
      cooldown: 0,
      orbitAngle: index,
      droneSeed: Math.random(),
    }));
    const passives = [...startingPassives, ...character.starterPassiveIds].map<RunPassiveState>((id) => ({ id, level: 1 }));
    for (const passive of passives) {
      applyPassiveDefinition(player.stats, contentRegistry.passives[passive.id]);
    }

    this.entities.reset();
    this.spawner.beginDay();
    this.run = {
      modeId: mode.id,
      characterId: character.id,
      day: 1,
      dayPlan: this.getModeAdjustedDayPlan(1, mode.id),
      player,
      weapons,
      passives,
      relicIds: [],
      objective: this.createObjective(1, mode.id),
      warnings: [],
      upgradeChoices: [],
      daySummary: null,
      pendingLevels: 0,
      dayTimeRemaining: this.getModeAdjustedDayPlan(1, mode.id).duration,
      elapsedInDay: 0,
      totalRunTime: 0,
      killCount: 0,
      usedContinue: false,
      flash: 0,
      dayStartSnapshot: null,
      shrineTimer: randomRange(4.8, 7.4),
      shrineSpawned: false,
      hazardTimer: randomRange(3.8, 5.8),
    };
    this.rememberCodex("modes", mode.id);
    this.rememberCodex("characters", character.id);
    for (const weapon of weapons) {
      this.rememberCodex("weapons", weapon.id);
    }
    for (const passive of passives) {
      this.rememberCodex("passives", passive.id);
    }
    this.applyRelic(character.starterRelicId, false);
    this.refreshDerivedDiscoveries(false);
    this.syncDroneCount();
    this.run.dayStartSnapshot = this.serializeRun();
    this.pushWarning("Day 1 begins", "day");
    this.scene = "playing";
    this.saveData.profile.totalRuns += 1;
    this.persistProfile();
    this.persistRun();
  }

  private loadRun(snapshot: RunSnapshot): void {
    this.entities.reset();
    this.spawner.beginDay();
    const modeId = snapshot.modeId ?? "standard";
    const characterId = snapshot.characterId ?? this.selectedCharacterId;
    this.run = {
      modeId,
      characterId,
      day: snapshot.day,
      dayPlan: this.getModeAdjustedDayPlan(snapshot.day, modeId),
      player: clone(snapshot.player),
      weapons: clone(snapshot.weapons),
      passives: clone(snapshot.passives),
      relicIds: clone(snapshot.relicIds ?? []),
      objective: clone(snapshot.objective ?? this.createObjective(snapshot.day, modeId)),
      warnings: [],
      upgradeChoices: [],
      daySummary: null,
      pendingLevels: 0,
      dayTimeRemaining: snapshot.dayTimeRemaining,
      elapsedInDay: Math.max(0, this.getModeAdjustedDayPlan(snapshot.day, modeId).duration - snapshot.dayTimeRemaining),
      totalRunTime: snapshot.totalRunTime,
      killCount: 0,
      usedContinue: snapshot.usedContinue,
      flash: 0,
      dayStartSnapshot: clone(snapshot),
      shrineTimer: randomRange(3.8, 6.4),
      shrineSpawned: Boolean(snapshot.objective && snapshot.objective.kind === "shrine" && snapshot.objective.completed),
      hazardTimer: randomRange(2.4, 4.4),
    };
    this.selectedModeId = modeId;
    this.selectedCharacterId = characterId;
    this.rememberCodex("modes", modeId);
    this.rememberCodex("characters", characterId);
    for (const relicId of this.run.relicIds) {
      this.rememberCodex("relics", relicId);
    }
    this.refreshDerivedDiscoveries(false);
    this.syncDroneCount();
    this.scene = "playing";
    this.pushWarning(`Day ${snapshot.day} resumed`, "day");
  }

  private continueFromDawn(): void {
    if (!this.run?.dayStartSnapshot || this.run.usedContinue) {
      return;
    }
    const snapshot = clone(this.run.dayStartSnapshot);
    snapshot.usedContinue = true;
    this.loadRun(snapshot);
    if (this.run) {
      this.run.usedContinue = true;
      this.run.dayStartSnapshot = clone(snapshot);
    }
    this.persistRun();
  }

  private takeUpgrade(choiceId: string): void {
    if (!this.run || this.scene !== "upgrade") {
      return;
    }
    const choice = this.run.upgradeChoices.find((entry) => entry.id === choiceId);
    if (!choice) {
      return;
    }

    if (choice.type === "weapon") {
      const existing = this.run.weapons.find((weapon) => weapon.id === choice.targetId);
      if (existing) {
        existing.level = choice.nextLevel;
      } else {
        this.run.weapons.push({
          id: choice.targetId,
          level: choice.nextLevel,
          cooldown: 0,
          orbitAngle: randomRange(0, Math.PI * 2),
          droneSeed: Math.random(),
        });
      }
      this.rememberCodex("weapons", choice.targetId);
      this.syncDroneCount();
    } else if (choice.type === "passive") {
      const definition = contentRegistry.passives[choice.targetId];
      const existing = this.run.passives.find((passive) => passive.id === choice.targetId);
      if (existing) {
        existing.level = choice.nextLevel;
      } else {
        this.run.passives.push({ id: choice.targetId, level: choice.nextLevel });
      }
      applyPassiveDefinition(this.run.player.stats, definition);
      this.rememberCodex("passives", choice.targetId);
      this.normalizePlayerStats();
    }

    this.refreshDerivedDiscoveries(true);
    this.run.pendingLevels -= 1;
    this.audio.playCue("upgrade-lock");
    if (this.run.pendingLevels > 0) {
      this.run.upgradeChoices = rollUpgradeChoices(this.run.day, this.run.weapons, this.run.passives, LEVEL_UP_CHOICE_COUNT);
      return;
    }
    this.run.upgradeChoices = [];
    this.scene = "playing";
    this.persistRun();
  }

  private takeReward(rewardId: string): void {
    if (!this.run || !this.run.daySummary) {
      return;
    }
    const reward = this.run.daySummary.rewardOptions.find((option) => option.id === rewardId);
    if (!reward) {
      return;
    }

    switch (reward.id) {
      case "rest-mend":
        this.run.player.stats.maxHp += 6;
        this.run.player.stats.hp = Math.min(this.run.player.stats.maxHp, this.run.player.stats.hp + this.run.player.stats.maxHp * 0.35);
        break;
      case "forge-weapon": {
        const upgradeable = this.run.weapons
          .filter((weapon) => weapon.level < contentRegistry.weapons[weapon.id].maxLevel)
          .sort((left, right) => left.level - right.level)[0];
        if (upgradeable) {
          upgradeable.level += 1;
        } else {
          this.run.player.stats.damageMultiplier += 0.08;
        }
        break;
      }
      case "field-scout":
        applyModifier(this.run.player.stats, { moveSpeed: 18, pickupRadius: 16, luck: 0.03 });
        break;
      case "tempered-shell":
        applyModifier(this.run.player.stats, { armor: 0.8, regen: 0.25 });
        break;
      case "lattice-tune":
        applyModifier(this.run.player.stats, { cooldownMultiplier: -0.05, projectileSpeed: 0.08 });
        break;
      case "battle-tonic":
        this.run.player.stats.hp = Math.min(this.run.player.stats.maxHp, this.run.player.stats.hp + this.run.player.stats.maxHp * 0.22);
        applyModifier(this.run.player.stats, { damageMultiplier: 0.08 });
        break;
      case "cache-surge":
        this.run.player.stats.xp = Math.min(
          this.run.player.stats.xpToNext - 1,
          this.run.player.stats.xp + this.run.player.stats.xpToNext * 0.45,
        );
        break;
      case "phase-route":
        applyModifier(this.run.player.stats, { moveSpeed: 16, dodgeChance: 0.03 });
        break;
      case "harvest-scan":
        applyModifier(this.run.player.stats, { xpMultiplier: 0.07, pickupRadius: 14, luck: 0.03 });
        break;
    }

    this.normalizePlayerStats();
    this.startNextDay();
  }

  private startNextDay(): void {
    if (!this.run) {
      return;
    }
    const nextDay = this.run.day + 1;
    this.entities.reset();
    this.spawner.beginDay();
    this.run.day = nextDay;
    this.run.dayPlan = this.getModeAdjustedDayPlan(nextDay, this.run.modeId);
    this.run.dayTimeRemaining = this.run.dayPlan.duration;
    this.run.elapsedInDay = 0;
    this.run.killCount = 0;
    this.run.daySummary = null;
    this.run.objective = this.createObjective(nextDay, this.run.modeId);
    this.run.warnings = [];
    this.run.flash = 0;
    this.run.upgradeChoices = [];
    this.run.player.position = vec(0, 0);
    this.run.player.velocity = vec(0, 0);
    this.run.shrineTimer = randomRange(4.8, 7.8);
    this.run.shrineSpawned = false;
    this.run.hazardTimer = randomRange(3.2, 5.2);
    this.syncDroneCount();
    this.refreshDerivedDiscoveries(false);
    this.run.dayStartSnapshot = this.serializeRun();
    this.pushWarning(`Day ${nextDay} begins`, "day");
    this.scene = "playing";
    this.persistRun();
  }

  private normalizePlayerStats(): void {
    if (!this.run) {
      return;
    }
    this.run.player.stats.maxHp = Math.max(1, this.run.player.stats.maxHp);
    this.run.player.stats.hp = clamp(this.run.player.stats.hp, 0, this.run.player.stats.maxHp);
    this.run.player.stats.moveSpeed = Math.max(120, this.run.player.stats.moveSpeed);
    this.run.player.stats.pickupRadius = Math.max(40, this.run.player.stats.pickupRadius);
    this.run.player.stats.cooldownMultiplier = Math.max(0.35, this.run.player.stats.cooldownMultiplier);
    this.run.player.stats.critChance = clamp(this.run.player.stats.critChance, 0, 0.75);
    this.run.player.stats.dodgeChance = clamp(this.run.player.stats.dodgeChance, 0, 0.4);
  }

  private serializeRun(): RunSnapshot {
    if (!this.run) {
      throw new Error("No active run to serialize");
    }
    return {
      version: 2,
      day: this.run.day,
      dayTimeRemaining: this.run.dayTimeRemaining,
      totalRunTime: this.run.totalRunTime,
      player: clone(this.run.player),
      weapons: clone(this.run.weapons),
      passives: clone(this.run.passives),
      relicIds: clone(this.run.relicIds),
      modeId: this.run.modeId,
      characterId: this.run.characterId,
      objective: clone(this.run.objective),
      usedContinue: this.run.usedContinue,
    };
  }

  private persistProfile(): void {
    this.saves.save(this.saveData);
  }

  private persistRun(): void {
    if (!this.run) {
      return;
    }
    this.saveData = this.saves.saveRun(this.saveData, this.serializeRun());
  }

  private updateSetting(key: keyof SettingsData, rawValue: string): void {
    const nextSettings: SettingsData = {
      ...this.saveData.settings,
      [key]:
        rawValue === "true"
          ? true
          : rawValue === "false"
            ? false
            : Number.isNaN(Number(rawValue))
              ? rawValue
              : Number(rawValue),
    } as SettingsData;
    this.saveData = this.saves.saveSettings(this.saveData, nextSettings);
    this.audio.applySettings(this.saveData.settings);
  }

  private goToGames(): void {
    if (this.run && this.scene !== "game-over" && this.scene !== "victory") {
      this.persistRun();
    }
    window.location.assign(new URL("../index.html", window.location.href).toString());
  }

  private handleAction(action: string, value?: string): void {
    this.audio.unlock();

    if (action.startsWith("setting:")) {
      const key = action.replace("setting:", "") as keyof SettingsData;
      this.updateSetting(key, value ?? "");
      return;
    }

    switch (action) {
      case "start-new":
        this.beginNewRun();
        break;
      case "select-mode":
        if (value && gameManifest.modes.some((mode) => mode.id === value)) {
          this.selectedModeId = value as GameModeId;
        }
        break;
      case "select-character":
        if (value && contentRegistry.characters[value]) {
          this.selectedCharacterId = value;
        }
        break;
      case "continue-run":
        if (this.saveData.currentRun) {
          this.loadRun(this.saveData.currentRun);
        }
        break;
      case "resume":
        this.scene = "playing";
        break;
      case "pause":
        if (this.scene === "playing") {
          this.previousScene = "playing";
          this.scene = "paused";
        }
        break;
      case "open-settings":
        this.previousScene = this.scene;
        this.scene = "settings";
        break;
      case "close-settings":
        this.scene = this.previousScene;
        break;
      case "open-codex":
        this.previousScene = this.scene;
        this.scene = "codex";
        break;
      case "close-codex":
        this.scene = "title";
        break;
      case "back-title":
        if (this.run && this.scene !== "game-over") {
          this.persistRun();
        }
        this.run = null;
        this.activeEvent = null;
        this.entities.reset();
        this.scene = "title";
        break;
      case "restart-run":
        this.beginNewRun();
        break;
      case "reset-save":
        this.saveData = this.saves.reset();
        this.audio.applySettings(this.saveData.settings);
        this.run = null;
        this.scene = "title";
        break;
      case "take-upgrade":
        if (value) {
          this.takeUpgrade(value);
        }
        break;
      case "take-reward":
        if (value) {
          this.takeReward(value);
        }
        break;
      case "take-event":
        if (value) {
          this.takeShrineChoice(value);
        }
        break;
      case "continue-dawn":
        this.continueFromDawn();
        break;
      case "go-games":
        this.goToGames();
        break;
    }
  }

  private buildUiModel(): UiModel {
    const boss = this.getBossEntity();
    const modeDefinition = this.run ? this.getModeDefinition(this.run.modeId) : this.getModeDefinition(this.selectedModeId);
    const characterDefinition = this.run ? this.getCharacterDefinition(this.run.characterId) : this.getCharacterDefinition(this.selectedCharacterId);
    const activeSynergies = this.run ? this.getActiveSynergies() : [];
    return {
      scene: this.scene,
      hasContinueRun: this.saveData.currentRun !== null,
      canContinueFromDawn: this.scene === "game-over" && Boolean(this.run?.dayStartSnapshot) && !Boolean(this.run?.usedContinue),
      profile: this.saveData.profile,
      settings: this.saveData.settings,
      modes: gameManifest.modes.map((mode) => ({
        id: mode.id,
        name: mode.shortLabel ?? mode.label,
        description: mode.description,
        selected: mode.id === this.selectedModeId,
      })),
      characters: Object.values(contentRegistry.characters).map((character) => ({
        id: character.id,
        name: character.name,
        title: character.title,
        description: character.description,
        accent: character.accent,
        selected: character.id === this.selectedCharacterId,
      })),
      codexSections: this.buildCodexSections(),
      eventState: this.activeEvent
        ? {
            title: this.activeEvent.title,
            description: this.activeEvent.description,
            choices: this.activeEvent.choices,
          }
        : undefined,
      hud:
        this.run && this.scene !== "title" && this.scene !== "victory" && this.scene !== "game-over" && this.scene !== "codex"
          ? {
              day: this.run.day,
              timeLeft: this.run.dayTimeRemaining,
              level: this.run.player.stats.level,
              hp: this.run.player.stats.hp,
              maxHp: this.run.player.stats.maxHp,
              xp: this.run.player.stats.xp,
              xpToNext: this.run.player.stats.xpToNext,
              currentBiome: contentRegistry.biomes[this.run.dayPlan.biomeId].name,
              weapons: this.run.weapons.map((weapon) => `${this.getWeaponDisplayName(weapon)} Lv ${weapon.level}`),
              passives: this.run.passives.map((passive) => `${contentRegistry.passives[passive.id].name} Lv ${passive.level}`),
              relics: this.run.relicIds.map((relicId) => contentRegistry.relics[relicId]?.name ?? relicId),
              synergies: activeSynergies.map((synergy) => synergy.name),
              objectiveText: this.run.objective?.title,
              objectiveProgress: this.run.objective ? `${this.run.objective.current}/${this.run.objective.target}` : undefined,
              modeLabel: modeDefinition.label,
              characterName: characterDefinition.name,
              warningText: this.run.warnings[this.run.warnings.length - 1]?.text,
              bossName: boss ? contentRegistry.enemies[boss.definitionId].name : undefined,
              bossHpRatio: boss ? boss.hp / boss.maxHp : undefined,
            }
          : undefined,
      upgradeChoices: this.run?.upgradeChoices,
      daySummary: this.run?.daySummary ?? undefined,
    };
  }
}
