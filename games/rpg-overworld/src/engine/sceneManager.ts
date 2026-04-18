import type { GameState } from "../memory/types";

export type SceneMode = "title" | "overworld" | "dialogue" | "battle" | "gameover";

export const getSceneMode = (state: GameState): SceneMode => {
  if (state.status === "title") {
    return "title";
  }
  if (state.status === "gameover") {
    return "gameover";
  }
  if (state.combat) {
    return "battle";
  }
  if (state.activeSceneId) {
    return "dialogue";
  }
  return "overworld";
};
