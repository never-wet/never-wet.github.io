import type { ChapterId } from "./types";

export const storyIndex: Record<
  ChapterId,
  {
    sceneIds: string[];
    coreQuestIds: string[];
    unlockLocationIds: string[];
    climaxSceneId?: string;
  }
> = {
  prologue: {
    sceneIds: ["prologue-arrival", "prologue-marketfire", "council-of-lanterns"],
    coreQuestIds: ["main-bell-in-the-fog"],
    unlockLocationIds: ["thornwake", "gloamwood-trail"],
    climaxSceneId: "council-of-lanterns",
  },
  chapter1: {
    sceneIds: ["gloamwood-camp", "whispering-oak", "mire-campfire"],
    coreQuestIds: ["main-roots-of-the-whisperblight", "side-herbal-remedy", "side-missing-caravan"],
    unlockLocationIds: ["gloamwood-trail", "rainmire-crossing"],
    climaxSceneId: "whispering-oak",
  },
  chapter2: {
    sceneIds: ["abbey-gate", "abbey-betrayal", "vault-of-vows"],
    coreQuestIds: ["main-abbey-of-broken-vows", "side-smuggler-ledger"],
    unlockLocationIds: ["saint-veyra-abbey"],
    climaxSceneId: "abbey-betrayal",
  },
  chapter3: {
    sceneIds: ["spire-threshold", "regent-parley", "hollow-star-ending"],
    coreQuestIds: ["main-hollow-star"],
    unlockLocationIds: ["skyglass-spire"],
    climaxSceneId: "hollow-star-ending",
  },
  epilogue: {
    sceneIds: ["epilogue-dawn"],
    coreQuestIds: [],
    unlockLocationIds: [],
    climaxSceneId: "epilogue-dawn",
  },
};
