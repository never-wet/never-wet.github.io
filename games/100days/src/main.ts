import "./styles/main.css";
import { HundredDaysRuntime } from "./game/runtime";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Application root not found");
}

const game = new HundredDaysRuntime(root);
game.start();
