import { Node, GameState } from './types';

export const storyData: Record<string, Node> = {
  'start': {
    id: 'start',
    speaker: 'Narrator',
    text: 'You stand at the edge of the forbidden forest. The air is cold and heavy with secrets.',
    choices: [
      { text: 'Enter the forest', next: 'forest_entrance' },
      { text: 'Go home', next: 'home' }
    ]
  },
  'forest_entrance': {
    id: 'forest_entrance',
    speaker: 'Shadow',
    text: 'You have entered the darkness. What are you looking for?',
    choices: [
      { text: 'The ancient relic', next: 'find_relic', effect: (s) => s.flags['seeking_relic'] = true },
      { text: 'Just exploring', next: 'exploring' }
    ]
  },
  'find_relic': {
    id: 'find_relic',
    speaker: 'Narrator',
    text: 'You find the relic! It glows with strange power.',
    choices: [{ text: 'Take it', next: 'good_ending', effect: (s) => s.inventory.push('relic') }]
  },
  'home': {
    id: 'home',
    speaker: 'Narrator',
    text: 'You return home, safe but forever wondering what was hidden in the trees.',
    choices: [{ text: 'End', next: 'start' }]
  },
  'exploring': {
    id: 'exploring',
    speaker: 'Shadow',
    text: 'Exploring without purpose leads to trouble.',
    choices: [{ text: 'Fight back', next: 'bad_ending' }, { text: 'Run', next: 'start' }]
  },
  'good_ending': { id: 'good_ending', speaker: 'Narrator', text: 'You possess the relic and bring balance to the land. You win!' },
  'bad_ending': { id: 'bad_ending', speaker: 'Narrator', text: 'The forest consumes you. Game Over.' },
  'secret_ending': { id: 'secret_ending', speaker: 'Narrator', text: 'You found the secret path! You win the secret ending!' }
};
