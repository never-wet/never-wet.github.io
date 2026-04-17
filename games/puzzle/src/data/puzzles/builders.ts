import type {
  ArrangeContent,
  ClueBlock,
  EscapeRoomDefinition,
  HotspotContent,
  MatchItem,
  PuzzleCategoryId,
  PuzzleChoice,
  PuzzleDefinition,
  PuzzleDifficulty,
  PuzzleGuide,
  PuzzleVisual,
  PuzzleType,
  SceneDefinition,
  SceneElement,
  SequenceContent,
  SpotDifferenceContent,
  UnlockCondition,
} from "../../memory/types";

type BaseConfig = {
  id: string;
  title: string;
  category: PuzzleCategoryId;
  difficulty: PuzzleDifficulty;
  description: string;
  instructions: string;
  estimatedTime: number;
  assets?: string[];
  clueData?: string[];
  unlock?: UnlockCondition;
  guide?: PuzzleGuide;
  tags?: string[];
  relatedPuzzles?: string[];
  featured?: boolean;
  roomBinding?: PuzzleDefinition["roomBinding"];
  hints?: string[];
};

function buildHints(puzzleId: string, hints: string[] = []) {
  return hints.map((text, index) => ({
    id: `${puzzleId}-hint-${index + 1}`,
    title: index === 0 ? "Nudge" : "Deeper Hint",
    text,
    penalty: index === 0 ? 10 : 20,
  }));
}

function basePuzzle(
  config: BaseConfig,
): Omit<PuzzleDefinition, "content" | "validation" | "hints" | "type"> {
  return {
    ...config,
    assets: config.assets ?? [],
    clueData: config.clueData ?? [],
    relatedPuzzles: config.relatedPuzzles ?? [],
    unlock: config.unlock ?? {},
    tags: config.tags ?? [],
    featured: config.featured ?? false,
  };
}

export function choicePuzzle(
  config: BaseConfig & {
    prompt: string;
    question: string;
    promptVisual?: PuzzleVisual;
    choices: PuzzleChoice[];
    correctChoiceId: string;
    evidence?: string[];
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "multipleChoice",
    validation: {
      mode: "choice",
      acceptableAnswers: [config.correctChoiceId],
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "multipleChoice",
      prompt: config.prompt,
      question: config.question,
      promptVisual: config.promptVisual,
      choices: config.choices,
      correctChoiceId: config.correctChoiceId,
      evidence: config.evidence,
    },
  };
}

export function textPuzzle(
  config: BaseConfig & {
    prompt: string;
    promptVisual?: PuzzleVisual;
    placeholder: string;
    acceptedAnswers: string[];
    clueBlocks?: ClueBlock[];
    answerFormat?: string;
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "textInput",
    validation: {
      mode: "text",
      acceptableAnswers: config.acceptedAnswers,
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "textInput",
      prompt: config.prompt,
      promptVisual: config.promptVisual,
      placeholder: config.placeholder,
      acceptedAnswers: config.acceptedAnswers,
      clueBlocks: config.clueBlocks,
      answerFormat: config.answerFormat,
    },
  };
}

export function sequencePuzzle(
  config: BaseConfig & {
    prompt: string;
    promptVisual?: PuzzleVisual;
    sequence: string[];
    sequenceVisuals?: SequenceContent["sequenceVisuals"];
    options: string[];
    optionVisuals?: SequenceContent["optionVisuals"];
    acceptedAnswer: string;
    missingIndex?: number;
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "sequence",
    validation: {
      mode: "sequence",
      acceptableAnswers: [config.acceptedAnswer],
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "sequence",
      prompt: config.prompt,
      promptVisual: config.promptVisual,
      sequence: config.sequence,
      sequenceVisuals: config.sequenceVisuals,
      options: config.options,
      optionVisuals: config.optionVisuals,
      acceptedAnswer: config.acceptedAnswer,
      missingIndex: config.missingIndex,
    },
  };
}

export function matchPuzzle(
  config: BaseConfig & {
    prompt: string;
    promptVisual?: PuzzleVisual;
    left: MatchItem[];
    right: MatchItem[];
    solution: Record<string, string>;
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "matchPairs",
    validation: {
      mode: "pairs",
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "matchPairs",
      prompt: config.prompt,
      promptVisual: config.promptVisual,
      left: config.left,
      right: config.right,
      solution: config.solution,
    },
  };
}

export function arrangePuzzle(
  config: BaseConfig & {
    prompt: string;
    promptVisual?: PuzzleVisual;
    items: ArrangeContent["items"];
    solution: string[];
    completionText: string;
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "arrange",
    validation: {
      mode: "arrange",
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "arrange",
      prompt: config.prompt,
      promptVisual: config.promptVisual,
      items: config.items,
      solution: config.solution,
      completionText: config.completionText,
    },
  };
}

export function hotspotPuzzle(
  config: BaseConfig & {
    prompt: string;
    mode: HotspotContent["mode"];
    scene: SceneDefinition;
    requiredHotspotIds: string[];
    passcode?: HotspotContent["passcode"];
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "hotspot",
    validation: {
      mode: "hotspot",
      acceptableAnswers: config.passcode ? [config.passcode.acceptedAnswer] : undefined,
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "hotspot",
      prompt: config.prompt,
      mode: config.mode,
      scene: config.scene,
      requiredHotspotIds: config.requiredHotspotIds,
      passcode: config.passcode,
    },
  };
}

export function lockPuzzle(
  config: BaseConfig & {
    prompt: string;
    promptVisual?: PuzzleVisual;
    keypadLabel: string;
    codeLength: number;
    acceptedCode: string;
    clueBlocks?: ClueBlock[];
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "combinationLock",
    validation: {
      mode: "lock",
      acceptableAnswers: [config.acceptedCode],
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "combinationLock",
      prompt: config.prompt,
      promptVisual: config.promptVisual,
      keypadLabel: config.keypadLabel,
      codeLength: config.codeLength,
      acceptedCode: config.acceptedCode,
      clueBlocks: config.clueBlocks,
    },
  };
}

export function differencePuzzle(
  config: BaseConfig & {
    prompt: string;
    leftScene: SpotDifferenceContent["leftScene"];
    rightScene: SpotDifferenceContent["rightScene"];
    requiredHotspotIds: string[];
  },
): PuzzleDefinition {
  const puzzle = basePuzzle(config);

  return {
    ...puzzle,
    type: "spotDifference",
    validation: {
      mode: "hotspot",
    },
    hints: buildHints(config.id, config.hints),
    content: {
      kind: "spotDifference",
      prompt: config.prompt,
      leftScene: config.leftScene,
      rightScene: config.rightScene,
      requiredHotspotIds: config.requiredHotspotIds,
    },
  };
}

export function unlockAfter(requiredTotalSolved: number, description: string): UnlockCondition {
  return {
    requiredTotalSolved,
    description,
  };
}

export function unlockByPuzzle(requiredPuzzleIds: string[], description: string): UnlockCondition {
  return {
    requiredPuzzleIds,
    description,
  };
}

export function rect(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rotation?: number,
): SceneElement {
  return {
    id,
    label,
    shape: "rect",
    x,
    y,
    width,
    height,
    color,
    rotation,
  };
}

export function pill(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rotation?: number,
): SceneElement {
  return {
    id,
    label,
    shape: "pill",
    x,
    y,
    width,
    height,
    color,
    rotation,
  };
}

export function circle(
  id: string,
  label: string,
  x: number,
  y: number,
  size: number,
  color: string,
): SceneElement {
  return {
    id,
    label,
    shape: "circle",
    x,
    y,
    width: size,
    height: size,
    color,
  };
}

export function beam(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rotation?: number,
): SceneElement {
  return {
    id,
    label,
    shape: "beam",
    x,
    y,
    width,
    height,
    color,
    rotation,
    opacity: 0.7,
  };
}

export function ring(
  id: string,
  label: string,
  x: number,
  y: number,
  size: number,
  color: string,
): SceneElement {
  return {
    id,
    label,
    shape: "ring",
    x,
    y,
    width: size,
    height: size,
    color,
  };
}

export function diamond(
  id: string,
  label: string,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation = 45,
): SceneElement {
  return {
    id,
    label,
    shape: "diamond",
    x,
    y,
    width: size,
    height: size,
    color,
    rotation,
  };
}

export function scene(
  id: string,
  title: string,
  subtitle: string,
  description: string,
  accent: string,
  theme: string,
  elements: SceneElement[],
  hotspots: SceneDefinition["hotspots"],
): SceneDefinition {
  return {
    id,
    title,
    subtitle,
    description,
    accent,
    theme,
    backdrop: `radial-gradient(circle at 20% 20%, ${accent}33, transparent 36%), radial-gradient(circle at 85% 10%, #ffffff10, transparent 24%), linear-gradient(160deg, #0d1320 0%, #141a2c 50%, #1c2438 100%)`,
    elements,
    hotspots,
  };
}

export const featuredRoomOrder: EscapeRoomDefinition["id"][] = [
  "clockwork-manor",
  "submerged-archive",
  "polar-signal-lab",
];

export function labelForDifficulty(difficulty: PuzzleDifficulty) {
  return difficulty;
}

export function kindToType(kind: PuzzleType) {
  return kind;
}
