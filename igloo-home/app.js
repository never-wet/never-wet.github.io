import { createIglooExperience } from "./scene.js";

try {
  createIglooExperience({
    canvas: document.getElementById("igloo-canvas"),
  });
} catch (error) {
  console.error(error);
  document.body.classList.add("scene-failed");
}
