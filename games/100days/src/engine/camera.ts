import { lerp, randomRange } from "./collision";
import type { Vec2 } from "../memory/types";

export class Camera {
  position: Vec2 = { x: 0, y: 0 };
  shakeOffset: Vec2 = { x: 0, y: 0 };
  private shakeStrength = 0;

  update(target: Vec2, dt: number): void {
    this.position.x = lerp(this.position.x, target.x, Math.min(dt * 6, 1));
    this.position.y = lerp(this.position.y, target.y, Math.min(dt * 6, 1));

    this.shakeStrength = Math.max(0, this.shakeStrength - dt * 2.8);
    this.shakeOffset.x = randomRange(-1, 1) * this.shakeStrength * 10;
    this.shakeOffset.y = randomRange(-1, 1) * this.shakeStrength * 10;
  }

  addShake(amount: number): void {
    this.shakeStrength = Math.min(this.shakeStrength + amount, 1.6);
  }
}
