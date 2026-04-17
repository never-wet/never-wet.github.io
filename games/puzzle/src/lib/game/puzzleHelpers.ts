import type { PuzzleDefinition } from "../../memory/types";

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function arrayIncludesNormalized(expected: string[], actual: string) {
  const normalized = normalizeAnswer(actual);
  return expected.some((value) => normalizeAnswer(value) === normalized);
}

export function validatePuzzleAnswer(
  puzzle: PuzzleDefinition,
  answer: unknown,
  sessionData?: Record<string, unknown>,
) {
  switch (puzzle.content.kind) {
    case "multipleChoice":
      return typeof answer === "string" && answer === puzzle.content.correctChoiceId;
    case "textInput":
      return typeof answer === "string" && arrayIncludesNormalized(puzzle.content.acceptedAnswers, answer);
    case "sequence":
      return typeof answer === "string" && normalizeAnswer(answer) === normalizeAnswer(puzzle.content.acceptedAnswer);
    case "matchPairs":
      if (typeof answer !== "object" || answer === null) {
        return false;
      }

      return Object.entries(puzzle.content.solution).every(([key, expected]) => {
        const actual = (answer as Record<string, string>)[key];
        return actual === expected;
      });
    case "arrange":
      return Array.isArray(answer) && answer.join("|") === puzzle.content.solution.join("|");
    case "combinationLock":
      return typeof answer === "string" && arrayIncludesNormalized([puzzle.content.acceptedCode], answer);
    case "hotspot": {
      const found = Array.isArray((answer as Record<string, unknown>)?.foundHotspots)
        ? ((answer as Record<string, unknown>).foundHotspots as string[])
        : Array.isArray(sessionData?.foundHotspots)
          ? (sessionData?.foundHotspots as string[])
          : [];
      const foundRequired = puzzle.content.requiredHotspotIds.every((id) => found.includes(id));
      const code = typeof (answer as Record<string, unknown>)?.code === "string"
        ? ((answer as Record<string, unknown>).code as string)
        : "";

      if (!puzzle.content.passcode) {
        return foundRequired;
      }

      return foundRequired && arrayIncludesNormalized([puzzle.content.passcode.acceptedAnswer], code);
    }
    case "spotDifference": {
      const found = Array.isArray((answer as Record<string, unknown>)?.foundHotspots)
        ? ((answer as Record<string, unknown>).foundHotspots as string[])
        : Array.isArray(sessionData?.foundHotspots)
          ? (sessionData?.foundHotspots as string[])
          : [];

      return puzzle.content.requiredHotspotIds.every((id) => found.includes(id));
    }
    default:
      return false;
  }
}

const scoreBaseByDifficulty = {
  Novice: 120,
  Analyst: 180,
  Expert: 260,
  Mastermind: 340,
} as const;

export function calculateScore(
  puzzle: PuzzleDefinition,
  hintsUsed: number,
  elapsedSeconds?: number,
) {
  const base = scoreBaseByDifficulty[puzzle.difficulty];
  const hintPenalty = hintsUsed * 18;
  const timePenalty = elapsedSeconds ? Math.min(50, Math.floor(elapsedSeconds / 18)) : 0;
  const score = Math.max(40, base - hintPenalty - timePenalty);
  const stars = score >= base - 20 ? 3 : score >= base - 70 ? 2 : 1;

  return { score, stars };
}

export function getPuzzleAnswerPreview(puzzle: PuzzleDefinition) {
  const content = puzzle.content;

  switch (content.kind) {
    case "multipleChoice":
      return content.choices.find((choice) => choice.id === content.correctChoiceId)?.label ?? "Correct option";
    case "textInput":
      return content.acceptedAnswers[0] ?? "Text answer";
    case "sequence":
      return content.acceptedAnswer;
    case "matchPairs":
      return "Correct pairings";
    case "arrange":
      return content.solution.join(" -> ");
    case "combinationLock":
      return content.acceptedCode;
    case "hotspot":
      return content.passcode?.acceptedAnswer ?? "All required hotspots";
    case "spotDifference":
      return "All marked differences";
    default:
      return "Hidden answer";
  }
}
