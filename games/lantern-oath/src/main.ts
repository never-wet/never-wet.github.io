import "./styles.css";
import { App } from "./game/App";

const root = document.getElementById("app");
if (!root) {
  throw new Error("App root not found.");
}

new App(root);
