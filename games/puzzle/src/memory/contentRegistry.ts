import { cipherPuzzles } from "../data/puzzles/cipherPuzzles";
import { deductionPuzzles } from "../data/puzzles/deductionPuzzles";
import { logicPuzzles } from "../data/puzzles/logicPuzzles";
import { metaPuzzles } from "../data/puzzles/metaPuzzles";
import { passcodePuzzles } from "../data/puzzles/passcodePuzzles";
import { scenePuzzles } from "../data/puzzles/scenePuzzles";
import { wordPuzzles } from "../data/puzzles/wordPuzzles";
import type { PuzzleDefinition } from "./types";

export const allPuzzles: PuzzleDefinition[] = [
  ...logicPuzzles,
  ...deductionPuzzles,
  ...cipherPuzzles,
  ...scenePuzzles,
  ...passcodePuzzles,
  ...wordPuzzles,
  ...metaPuzzles,
];

export const contentRegistry = Object.fromEntries(
  allPuzzles.map((puzzle) => [puzzle.id, puzzle]),
) as Record<string, PuzzleDefinition>;
