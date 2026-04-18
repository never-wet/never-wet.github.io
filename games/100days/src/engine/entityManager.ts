import type {
  BeamRuntime,
  DamageTextRuntime,
  DroneRuntime,
  EnemyRuntime,
  HazardRuntime,
  MineRuntime,
  ParticleRuntime,
  PickupRuntime,
  ProjectileRuntime,
  ShrineRuntime,
} from "../memory/types";

export class EntityManager {
  enemies: EnemyRuntime[] = [];
  projectiles: ProjectileRuntime[] = [];
  beams: BeamRuntime[] = [];
  mines: MineRuntime[] = [];
  drones: DroneRuntime[] = [];
  pickups: PickupRuntime[] = [];
  hazards: HazardRuntime[] = [];
  shrines: ShrineRuntime[] = [];
  particles: ParticleRuntime[] = [];
  damageTexts: DamageTextRuntime[] = [];

  reset(): void {
    this.enemies = [];
    this.projectiles = [];
    this.beams = [];
    this.mines = [];
    this.drones = [];
    this.pickups = [];
    this.hazards = [];
    this.shrines = [];
    this.particles = [];
    this.damageTexts = [];
  }

  cleanup(): void {
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0 && projectile.pierce >= 0);
    this.beams = this.beams.filter((beam) => beam.life > 0);
    this.mines = this.mines.filter((mine) => mine.fuse > 0);
    this.pickups = this.pickups.filter((pickup) => pickup.life > 0);
    this.hazards = this.hazards.filter((hazard) => hazard.life > 0);
    this.shrines = this.shrines.filter((shrine) => shrine.life > 0 && !shrine.used);
    this.particles = this.particles.filter((particle) => particle.life > 0 && particle.alpha > 0);
    this.damageTexts = this.damageTexts.filter((text) => text.life > 0);
  }
}
