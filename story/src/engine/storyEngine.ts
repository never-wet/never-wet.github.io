import { GameState, Node } from './types';
import { storyData } from '../data/story';

export const getNextState = (
  currentState: GameState,
  nextNodeId: string,
  effect?: (state: GameState) => void
): GameState => {
  const nextNode = storyData[nextNodeId];
  
  const newState = {
    ...currentState,
    currentNode: nextNodeId,
    history: [...currentState.history, nextNodeId]
  };

  if (effect) {
    effect(newState);
  }

  if (nextNode?.onEnter) {
    nextNode.onEnter(newState);
  }

  return newState;
};
