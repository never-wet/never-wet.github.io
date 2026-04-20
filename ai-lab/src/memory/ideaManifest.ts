export interface IdeaPrompt {
  id: string
  title: string
  category: string
  summary: string
  startingPoint: string
  whyItFits: string
}

export const ideaManifest: IdeaPrompt[] = [
  {
    id: 'xor-walkthrough',
    title: 'Build an XOR learning lab',
    category: 'Learning demo',
    summary:
      'Use the builder, trainer, and notes together to explain why hidden layers matter on a classic XOR task.',
    startingPoint: 'Load the XOR starter in Storage & Export, then train and compare versions.',
    whyItFits: 'Great for understanding the full build -> train -> test -> note workflow.',
  },
  {
    id: 'csv-binary-classifier',
    title: 'Turn a small CSV into a browser classifier',
    category: 'Custom dataset',
    summary:
      'Import a small two-class CSV, choose the target field, and train a local tabular model without any backend.',
    startingPoint: 'Open Model Trainer and import a CSV or JSON dataset.',
    whyItFits: 'Shows the app working as a real lightweight AI lab instead of only using presets.',
  },
  {
    id: 'regression-playground',
    title: 'Make a regression playground',
    category: 'Experiment sandbox',
    summary:
      'Use sine regression or an imported numeric dataset to study learning rate, hidden units, and validation behavior.',
    startingPoint: 'Load the Sine starter, then compare multiple saved runs.',
    whyItFits: 'Ideal for visualizing how configuration changes affect training curves.',
  },
  {
    id: 'research-notebook',
    title: 'Create an AI research notebook',
    category: 'Knowledge workspace',
    summary:
      'Link notes, datasets, models, and results into one connected graph and canvas-based research workspace.',
    startingPoint: 'Use Canvas Workspace for layout and Research Notes templates for writeups.',
    whyItFits: 'This is one of the clearest ways to use the Obsidian-inspired side of the product.',
  },
  {
    id: 'model-comparison-board',
    title: 'Make a model comparison board',
    category: 'Evaluation',
    summary:
      'Train several versions of the same architecture, compare them, and document what changed between runs.',
    startingPoint: 'Use Model Trainer run comparison and result interpretation note templates.',
    whyItFits: 'Good for class projects, portfolio demos, and experiment tracking.',
  },
  {
    id: 'architecture-concept-map',
    title: 'Build an architecture concept map',
    category: 'Teaching tool',
    summary:
      'Use the graph and canvas to map how datasets, hidden layers, outputs, experiments, and notes relate to each other.',
    startingPoint: 'Start from Canvas Workspace and create linked cards around a single experiment.',
    whyItFits: 'Helpful for teaching or presenting neural network ideas visually.',
  },
  {
    id: 'class-project-lab',
    title: 'Use it as a class project lab notebook',
    category: 'School project',
    summary:
      'Keep experiments, observations, dataset choices, and model versions in one shareable local workspace.',
    startingPoint: 'Create experiment-summary and training-observation notes as you go.',
    whyItFits: 'Makes assignments look more structured and easier to present.',
  },
  {
    id: 'portfolio-piece',
    title: 'Turn it into an interactive portfolio case study',
    category: 'Portfolio',
    summary:
      'Use the app to present a visual ML experiment with architecture, training, saved runs, and notes all connected.',
    startingPoint: 'Train one polished experiment, then curate the graph, canvas, and notes around it.',
    whyItFits: 'Shows both technical and product-thinking skills in one demo.',
  },
]
