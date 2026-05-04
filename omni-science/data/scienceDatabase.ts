export interface Concept {
  subject: string;
  field: string;
  level: "Basic" | "Intermediate" | "Scientist";
  title: string;
  slug: string;
  formula: string;
  text: string;
  analogy: string;
  visualLogic: string;
  keywords: string[];
  prerequisites: string[];
  applications: string[];
  difficulty_score: number;
}

export const scienceDatabase: Concept[] = [
  {
    subject: "Mathematics",
    field: "Calculus",
    level: "Basic",
    title: "Derivative",
    slug: "derivative",
    formula: "\\frac{dy}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
    text: "The derivative represents the instantaneous rate of change of a function. It measures how a function changes as its input changes slightly.",
    analogy: "Like a speedometer showing your exact speed at one specific moment, rather than your average speed over a whole trip.",
    visualLogic: "A tangent line touching a curve at exactly one point, showing the 'steepness' of the curve at that location.",
    keywords: ["slope", "rate of change", "tangent", "limit"],
    prerequisites: ["Limits", "Functions"],
    applications: ["Physics (Velocity)", "Economics (Marginal Cost)", "AI (Backpropagation)"],
    difficulty_score: 3,
  },
  {
    subject: "Physics",
    field: "Astrophysics",
    level: "Intermediate",
    title: "General Relativity (Gravity)",
    slug: "gravity",
    formula: "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}",
    text: "Gravity is not a force between masses, but a curvature of spacetime caused by mass and energy.",
    analogy: "Imagine a heavy bowling ball on a trampoline. It creates a dip that makes smaller marbles roll towards it.",
    visualLogic: "A 3D grid warped by a central mass, with other objects following 'straight lines' through that curved space.",
    keywords: ["spacetime", "curvature", "mass", "Einstein"],
    prerequisites: ["Classical Mechanics", "Calculus"],
    applications: ["GPS Calibration", "Black Hole Study", "Cosmology"],
    difficulty_score: 8,
  },
  {
    subject: "Physics",
    field: "Thermodynamics",
    level: "Intermediate",
    title: "Entropy",
    slug: "entropy",
    formula: "S = k \\ln W",
    text: "Entropy is a measure of the number of possible microscopic configurations of a system. It is often interpreted as the degree of disorder or randomness.",
    analogy: "If you have a neatly organized deck of cards and throw them in the air, they will land in a messy, high-entropy state, never back in order.",
    visualLogic: "Particles starting in a small, organized box and spreading out to fill a larger space over time.",
    keywords: ["disorder", "probability", "heat", "arrow of time"],
    prerequisites: ["Probability", "Energy"],
    applications: ["Information Theory", "Cosmology", "Chemistry"],
    difficulty_score: 6,
  },
  {
    subject: "Biology",
    field: "Genetics",
    level: "Basic",
    title: "DNA Replication",
    slug: "dna-replication",
    formula: "A \\leftrightarrow T, G \\leftrightarrow C",
    text: "The process by which a double-stranded DNA molecule is copied to produce two identical DNA molecules.",
    analogy: "Unzipping a zipper and using each side as a template to build a brand new, identical second half.",
    visualLogic: "A double helix splitting into two strands, with new nucleotides matching up to form two new helices.",
    keywords: ["nucleotides", "polymerase", "helix", "genetic code"],
    prerequisites: ["Cell Biology"],
    applications: ["Genetic Engineering", "Medicine", "Evolutionary Biology"],
    difficulty_score: 4,
  },
  {
    subject: "Physics",
    field: "Quantum Mechanics",
    level: "Scientist",
    title: "Wave-Particle Duality",
    slug: "wave-particle-duality",
    formula: "E = hf, \\lambda = \\frac{h}{p}",
    text: "The concept that every elementary particle or quantic entity exhibits properties of both particles and waves.",
    analogy: "A platypus is like both a duck (beak) and a beaver (tail), yet it is its own unique thing that doesn't fit simple categories.",
    visualLogic: "A particle passing through two slits simultaneously, creating an interference pattern like a wave, but landing as a single dot.",
    keywords: ["quantum", "interference", "photon", "electron"],
    prerequisites: ["Wave Theory", "Electromagnetism"],
    applications: ["Electron Microscopy", "Quantum Computing", "Lasers"],
    difficulty_score: 9,
  },
];
