import React, { useState } from 'react';
import { storyData } from '../data/story';
import { GameState } from '../engine/types';
import { getNextState } from '../engine/storyEngine';
import { saveGame } from '../systems/saveSystem';
import { DialogueBox } from '../components/DialogueBox';
import { ChoiceList } from '../components/ChoiceList';

export const Game: React.FC = () => {
  const [state, setState] = useState<GameState>({
    currentNode: 'start',
    history: ['start'],
    flags: {},
    stats: {},
    inventory: []
  });

  const node = storyData[state.currentNode];

  const handleChoice = (choice: any) => {
    const next = getNextState(state, choice.next, choice.effect);
    setState(next);
    saveGame(next);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="max-w-2xl w-full">
        <DialogueBox node={node} />
        {node.choices && (
          <ChoiceList choices={node.choices} state={state} onSelect={handleChoice} />
        )}
      </div>
    </div>
  );
};
