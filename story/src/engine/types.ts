export type GameState = {
  currentNode: string;
  history: string[];
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  inventory: string[];
};

export type Choice = {
  text: string;
  next: string;
  condition?: (state: GameState) => boolean;
  effect?: (state: GameState) => void;
};

export type Node = {
  id: string;
  speaker: string;
  text: string;
  background?: string;
  character?: string;
  choices?: Choice[];
  onEnter?: (state: GameState) => void;
};

export type SaveData = {
  version: string;
  state: GameState;
};
