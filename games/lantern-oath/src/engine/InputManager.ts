export class InputManager {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();

  constructor(target: Window = window) {
    target.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (!this.down.has(key)) {
        this.pressed.add(key);
      }
      this.down.add(key);
    });

    target.addEventListener("keyup", (event) => {
      this.down.delete(event.key.toLowerCase());
    });

    target.addEventListener("blur", () => {
      this.down.clear();
      this.pressed.clear();
    });
  }

  beginFrame(): void {
    this.pressed.clear();
  }

  isDown(key: string): boolean {
    return this.down.has(key.toLowerCase());
  }

  wasPressed(key: string): boolean {
    return this.pressed.has(key.toLowerCase());
  }

  getMovementVector(): { x: number; y: number } {
    const left = this.isDown("a") || this.isDown("arrowleft");
    const right = this.isDown("d") || this.isDown("arrowright");
    const up = this.isDown("w") || this.isDown("arrowup");
    const down = this.isDown("s") || this.isDown("arrowdown");

    let x = 0;
    let y = 0;
    if (left) x -= 1;
    if (right) x += 1;
    if (up) y -= 1;
    if (down) y += 1;

    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(2);
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }
}
