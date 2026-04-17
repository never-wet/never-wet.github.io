import { allPuzzles } from "./contentRegistry";
import type { PuzzleIndexEntry } from "./types";

function summarizeUnlock(description?: string) {
  return description ?? "Available from the start.";
}

export const puzzleIndex: PuzzleIndexEntry[] = allPuzzles.map((puzzle) => ({
  id: puzzle.id,
  title: puzzle.title,
  category: puzzle.category,
  difficulty: puzzle.difficulty,
  type: puzzle.type,
  tags: puzzle.tags,
  estimatedTime: puzzle.estimatedTime,
  featured: puzzle.featured,
  unlockSummary: summarizeUnlock(puzzle.unlock.description),
}));
