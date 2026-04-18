export class InputManager {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();

  constructor(private readonly target: Window) {
    target.addEventListener("keydown", this.handleKeyDown);
    target.addEventListener("keyup", this.handleKeyUp);
    target.addEventListener("blur", this.handleBlur);
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("keyup", this.handleKeyUp);
    this.target.removeEventListener("blur", this.handleBlur);
  }

  isDown(code: string): boolean {
    return this.pressed.has(code);
  }

  consumePress(code: string): boolean {
    if (!this.justPressed.has(code)) {
      return false;
    }
    this.justPressed.delete(code);
    return true;
  }

  endFrame(): void {
    this.justPressed.clear();
  }

  getMoveAxis(): { x: number; y: number } {
    const left = this.isDown("KeyA") || this.isDown("ArrowLeft");
    const right = this.isDown("KeyD") || this.isDown("ArrowRight");
    const up = this.isDown("KeyW") || this.isDown("ArrowUp");
    const down = this.isDown("KeyS") || this.isDown("ArrowDown");

    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0),
    };
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.pressed.has(event.code)) {
      this.justPressed.add(event.code);
    }
    this.pressed.add(event.code);

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly handleBlur = (): void => {
    this.pressed.clear();
    this.justPressed.clear();
  };
}
