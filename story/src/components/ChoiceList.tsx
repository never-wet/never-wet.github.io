import React from 'react';
import { Choice, GameState } from '../engine/types';

interface Props {
  choices: Choice[];
  state: GameState;
  onSelect: (choice: Choice) => void;
}

export const ChoiceList: React.FC<Props> = ({ choices, state, onSelect }) => (
  <div className="flex flex-col gap-2 mt-4">
    {choices
      .filter(c => !c.condition || c.condition(state))
      .map((c, i) => (
        <button
          key={i}
          className="px-6 py-3 bg-white/5 hover:bg-white/20 transition-all border border-white/10 text-white rounded-md"
          onClick={() => onSelect(c)}
        >
          {c.text}
        </button>
      ))}
  </div>
);
