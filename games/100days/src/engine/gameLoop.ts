export class GameLoop {
  private running = false;
  private lastTime = 0;
  private frameHandle = 0;

  constructor(private readonly onFrame: (dt: number) => void) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
  }

  private readonly frame = (time: number): void => {
    if (!this.running) {
      return;
    }
    const dt = Math.min((time - this.lastTime) / 1000, 1 / 20);
    this.lastTime = time;
    this.onFrame(dt);
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}
