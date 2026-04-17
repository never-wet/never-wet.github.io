import { textPuzzle, unlockByPuzzle } from "./builders";
import type { PuzzleDefinition } from "../../memory/types";

export const metaPuzzles: PuzzleDefinition[] = [
  textPuzzle({
    id: "residue-equation",
    title: "Residue Equation",
    category: "meta-puzzles",
    difficulty: "Mastermind",
    description: "Combine earlier answers into a final synthesis code.",
    instructions: "Use solved puzzle answers and clue initials to derive the final lab word.",
    estimatedTime: 10,
    clueData: [
      "Take the first letter of the answers from Lantern Matrix, Double Bluff Ledger, and Museum Substitution.",
      "Then append the final digit of Signal Ladder's answer.",
    ],
    tags: ["meta", "answer-combination", "featured"],
    featured: true,
    prompt: "Enter the final residue code.",
    placeholder: "Code",
    acceptedAnswers: ["ldm2", "ldm-2"],
    answerFormat: "letters + digit",
    hints: [
      "Use the solved outcomes, not the puzzle titles.",
      "Lantern Matrix resolves to option B, Double Bluff Ledger to Nera, Museum Substitution to HEART, and Signal Ladder to 42, giving LDM2 as the lab shorthand.",
    ],
    relatedPuzzles: ["lantern-matrix", "double-bluff-ledger", "museum-substitution", "signal-ladder"],
    assets: ["meta-board"],
    unlock: unlockByPuzzle(
      ["lantern-matrix", "double-bluff-ledger", "museum-substitution", "signal-ladder"],
      "Unlocks after solving four linked foundation puzzles.",
    ),
  }),
  textPuzzle({
    id: "house-master-key",
    title: "House Master Key",
    category: "meta-puzzles",
    difficulty: "Mastermind",
    description: "The final house escape key combines answers from across the platform.",
    instructions: "Use the linked puzzle answers to assemble the final escape phrase.",
    estimatedTime: 12,
    clueData: [
      "Take ROOK from Atlas Passphrase.",
      "Take MAP from Morse Balcony.",
      "Take DOOR from Rail Fence Dossier.",
      "Order them as object, guide, destination.",
    ],
    tags: ["meta", "escape", "finale"],
    prompt: "Enter the final escape phrase.",
    placeholder: "Three words",
    acceptedAnswers: ["rook map door"],
    answerFormat: "three words",
    hints: [
      "The clue already tells you the three source answers.",
      "Object, guide, destination yields ROOK MAP DOOR.",
    ],
    relatedPuzzles: ["atlas-passphrase", "morse-balcony", "rail-fence-dossier"],
    assets: ["master-key-note"],
    unlock: unlockByPuzzle(
      ["atlas-passphrase", "morse-balcony", "rail-fence-dossier"],
      "Unlocks once the atlas, balcony, and dossier are solved.",
    ),
  }),
];
