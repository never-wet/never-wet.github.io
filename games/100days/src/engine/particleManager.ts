import { randomRange } from "./collision";
import type { DamageTextRuntime, ParticleRuntime, Vec2 } from "../memory/types";
import { EntityManager } from "./entityManager";

export class ParticleManager {
  constructor(private readonly entities: EntityManager, private readonly getUid: () => number) {}

  burst(position: Vec2, color: string, count: number, force = 150): void {
    for (let index = 0; index < count; index += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(force * 0.4, force);
      const particle: ParticleRuntime = {
        uid: this.getUid(),
        position: { x: position.x, y: position.y },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: randomRange(0.22, 0.5),
        maxLife: 0.5,
        radius: randomRange(2, 5),
        color,
        alpha: 1,
      };
      this.entities.particles.push(particle);
    }
  }

  trail(position: Vec2, color: string, count = 1, spread = 14, force = 30, life = 0.28): void {
    for (let index = 0; index < count; index += 1) {
      const offsetAngle = randomRange(0, Math.PI * 2);
      const offsetRadius = randomRange(0, spread);
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(force * 0.4, force);
      const particleLife = randomRange(life * 0.6, life);
      const particle: ParticleRuntime = {
        uid: this.getUid(),
        position: {
          x: position.x + Math.cos(offsetAngle) * offsetRadius,
          y: position.y + Math.sin(offsetAngle) * offsetRadius,
        },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - randomRange(6, 18) },
        life: particleLife,
        maxLife: particleLife,
        radius: randomRange(1.4, 3),
        color,
        alpha: 1,
      };
      this.entities.particles.push(particle);
    }
  }

  text(position: Vec2, value: string, color: string, crit = false): void {
    const entry: DamageTextRuntime = {
      uid: this.getUid(),
      text: value,
      position: { x: position.x, y: position.y },
      velocity: { x: randomRange(-20, 20), y: randomRange(-70, -48) },
      life: 0.75,
      color,
      crit,
    };
    this.entities.damageTexts.push(entry);
  }

  update(dt: number): void {
    for (const particle of this.entities.particles) {
      particle.life -= dt;
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;
      particle.velocity.x *= 0.96;
      particle.velocity.y *= 0.96;
      particle.alpha = Math.max(0, particle.life / particle.maxLife);
    }

    for (const text of this.entities.damageTexts) {
      text.life -= dt;
      text.position.x += text.velocity.x * dt;
      text.position.y += text.velocity.y * dt;
      text.velocity.y += 40 * dt;
    }
  }
}
