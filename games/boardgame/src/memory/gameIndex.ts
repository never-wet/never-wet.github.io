import type { GameCardMeta } from "./types";

export const gameIndex: Record<GameCardMeta["id"], GameCardMeta> = {
  chess: {
    id: "chess",
    title: "Chess",
    tag: "Grand Strategy",
    accent: "var(--accent-gold)",
    boardShape: "8x8 board",
    heroMetric: "Full legal rule set",
    shortDescription: "Classic chess with legal move validation and heuristic AI.",
    longDescription:
      "Play a complete browser-based chess board with castling, en passant, promotion, check detection, and move history.",
    bullets: [
      "Check, checkmate, stalemate, castling, promotion, and en passant",
      "Move list with coordinates and status banners",
      "Three AI settings powered by legal move search",
    ],
    difficultyNote: "Hard searches deeper and values positional pressure more sharply.",
  },
  connect4: {
    id: "connect4",
    title: "Connect 4",
    tag: "Vertical Tactics",
    accent: "var(--accent-cyan)",
    boardShape: "7x6 grid",
    heroMetric: "Gravity-driven play",
    shortDescription: "Drop discs into a live board with tactical AI.",
    longDescription:
      "A polished four-in-a-row board with drop previews, column targeting, and alpha-beta search.",
    bullets: [
      "Proper gravity and instant win checking",
      "Board evaluation tuned for lines and center control",
      "Fast rematches and autosave resume",
    ],
    difficultyNote: "Easy makes more human mistakes while hard hunts tactical forks.",
  },
  checkers: {
    id: "checkers",
    title: "Checkers",
    tag: "Capture Duel",
    accent: "var(--accent-coral)",
    boardShape: "8x8 dark squares",
    heroMetric: "Forced captures supported",
    shortDescription: "American-style checkers with kings and multi-jump sequences.",
    longDescription:
      "Play diagonal captures, chained jumps, and kinged pieces against an AI that values tempo and material.",
    bullets: [
      "Mandatory captures and chained jump turns",
      "Kinging and board highlights for legal landings",
      "Difficulty tiers driven by heuristic search",
    ],
    difficultyNote: "Hard plans farther ahead and punishes loose edge play.",
  },
  tictactoe: {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    tag: "Perfect Mini-Game",
    accent: "var(--accent-lime)",
    boardShape: "3x3 grid",
    heroMetric: "Perfect play on hard",
    shortDescription: "A crisp classic with perfect or near-perfect AI.",
    longDescription:
      "Quick-play tic-tac-toe with move history, instant resets, and a perfect hard difficulty.",
    bullets: [
      "Perfect minimax at high difficulty",
      "Great for fast sessions and testing streaks",
      "Instant autosave and rematch flow",
    ],
    difficultyNote: "Hard never loses. Easy adds intentional randomness.",
  },
  reversi: {
    id: "reversi",
    title: "Reversi",
    tag: "Disc Control",
    accent: "var(--accent-emerald)",
    boardShape: "8x8 board",
    heroMetric: "Mobility + corners AI",
    shortDescription: "Flip discs, seize corners, and manage tempo in a clean Othello board.",
    longDescription:
      "Control mobility, punish weak edges, and build stable corners in a full reversi implementation.",
    bullets: [
      "Valid move detection with live flip previews",
      "Pass turns automatically when no legal move exists",
      "Corner-weighted evaluation and move counts",
    ],
    difficultyNote: "Hard emphasizes corners, mobility, and late-game parity.",
  },
  gomoku: {
    id: "gomoku",
    title: "Gomoku",
    tag: "Five in a Row",
    accent: "var(--accent-violet)",
    boardShape: "15x15 grid",
    heroMetric: "Threat-scanning AI",
    shortDescription: "Build lines, block threats, and race to five in a row.",
    longDescription:
      "A large-grid abstract strategy game with candidate-move pruning and evaluation for open fours and threat balance.",
    bullets: [
      "Five-in-a-row rules on a responsive board",
      "Candidate move generation near active stones",
      "Strong tactical emphasis on open lines and blocks",
    ],
    difficultyNote: "Hard looks deeper around contested lines and urgent threats.",
  },
};
