import { GameState, SaveData } from './types';

const SAVE_KEY = 'vn_engine_save';
const VERSION = '1.0.0';

export const saveGame = (state: GameState) => {
  const data: SaveData = { version: VERSION, state };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
};

export const loadGame = (): GameState | null => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const data: SaveData = JSON.parse(raw);
    if (data.version !== VERSION) {
      console.warn('Save version mismatch, resetting');
      return null;
    }
    return data.state;
  } catch (e) {
    console.error('Save corrupted', e);
    return null;
  }
};
