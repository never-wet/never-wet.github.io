import { storyData } from '../data/story';
import { Node } from './types';

export const validateStory = (data: Record<string, Node>) => {
  const nodeIds = Object.keys(data);
  const errors: string[] = [];

  nodeIds.forEach(id => {
    const node = data[id];
    if (node.choices) {
      node.choices.forEach(choice => {
        if (!data[choice.next]) {
          errors.push(`Node '${id}' has a choice pointing to missing node '${choice.next}'`);
        }
      });
    }
  });

  return errors;
};
