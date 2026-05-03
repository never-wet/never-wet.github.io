import Phaser from "phaser";
import { useWorldStore, type DayPhase } from "../../store/useWorldStore";

export class DayNightSystem {
  private progress = 0.18;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private storeTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.overlay = scene.add.rectangle(0, 0, 10, 10, 0x0b1020, 0);
    this.overlay.setOrigin(0);
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(8500);

    scene.scale.on("resize", () => this.resize(scene));
    this.resize(scene);
  }

  update(deltaSeconds: number, scene: Phaser.Scene) {
    this.progress = (this.progress + deltaSeconds / 240) % 1;
    const phase = getPhase(this.progress);
    const lighting = getLighting(phase, this.progress);

    this.overlay.setFillStyle(lighting.color, lighting.alpha);
    this.storeTimer += deltaSeconds;

    if (this.storeTimer > 0.25) {
      this.storeTimer = 0;
      useWorldStore.getState().setDayNight(phase, this.progress);
    }

    this.resize(scene);
  }

  private resize(scene: Phaser.Scene) {
    this.overlay.setSize(scene.scale.width, scene.scale.height);
  }
}

function getPhase(progress: number): DayPhase {
  if (progress < 0.25) {
    return "morning";
  }

  if (progress < 0.58) {
    return "afternoon";
  }

  if (progress < 0.74) {
    return "sunset";
  }

  return "night";
}

function getLighting(phase: DayPhase, progress: number) {
  if (phase === "morning") {
    return { color: 0xffd889, alpha: 0.08 };
  }

  if (phase === "afternoon") {
    return { color: 0xffffff, alpha: 0.01 };
  }

  if (phase === "sunset") {
    return { color: 0xff7f5d, alpha: 0.16 + Math.sin(progress * Math.PI) * 0.03 };
  }

  return { color: 0x07122c, alpha: 0.38 };
}
