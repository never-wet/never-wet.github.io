import type { BottomTabId } from './types'

export interface TutorialStep {
  id: string
  eyebrow: string
  title: string
  summary: string
  bullets: string[]
  targetBottomTab?: BottomTabId
  areaLabel: string
}

export const tutorialManifest: TutorialStep[] = [
  {
    id: 'orientation',
    eyebrow: 'Orientation',
    title: 'Three different work areas',
    summary:
      'The app has three visual systems that look similar at first but do different jobs.',
    bullets: [
      '3D Graph: explore how notes, datasets, experiments, and models relate to each other.',
      'Canvas Workspace: arrange ideas on a flat 2D board like a visual research whiteboard.',
      'Network Builder: define the actual neural network architecture that training will use.',
    ],
    areaLabel: 'Whole app',
  },
  {
    id: 'graph',
    eyebrow: '3D Graph',
    title: 'Use the center graph to explore relationships',
    summary:
      'The big 3D stage is for browsing the workspace, not for building the model itself.',
    bullets: [
      'Rotate, zoom, and drag nodes to inspect the workspace from different angles.',
      'Click a node to see its details in the inspector and jump to the related tool tab.',
      'Think of this as the global map of the lab.',
    ],
    areaLabel: 'Center graph',
  },
  {
    id: 'canvas',
    eyebrow: 'Canvas Workspace',
    title: 'Use canvas to lay out research visually',
    summary:
      'Canvas is the 2D board for spatial thinking: notes, links, experiments, and models placed side by side.',
    bullets: [
      'Double-click empty space to create a text card.',
      'Use the left floating action rail to add text, file, link, or group cards.',
      'Drag from a card edge to connect cards with labeled lines.',
    ],
    targetBottomTab: 'canvas',
    areaLabel: 'Bottom tab: Canvas Workspace',
  },
  {
    id: 'builder',
    eyebrow: 'Network Builder',
    title: 'Use the builder to define the neural network',
    summary:
      'The builder is where the model architecture is made: inputs, dense layers, outputs, and config blocks.',
    bullets: [
      'Drag blocks into the builder and connect them to form a valid network flow.',
      'Select a block to edit its parameters in the inspector.',
      'Saved model runs can now be loaded back into the builder so you can continue iterating from previous versions.',
    ],
    targetBottomTab: 'builder',
    areaLabel: 'Bottom tab: Network Builder',
  },
  {
    id: 'training',
    eyebrow: 'Model Trainer',
    title: 'Train, compare, and test models in the browser',
    summary:
      'Model Trainer runs the current architecture against built-in or imported tabular datasets, saves completed runs, and lets you test saved models with custom inputs.',
    bullets: [
      'Choose a preset recipe like XOR, or import your own CSV or JSON dataset and set its target field.',
      'Watch the loss and accuracy charts, then compare saved runs side by side like an experiment tracker.',
      'After training, use the interactive sandbox to test the saved browser model with your own inputs or load that run back into the builder.',
    ],
    targetBottomTab: 'training',
    areaLabel: 'Bottom tab: Model Trainer',
  },
  {
    id: 'notes',
    eyebrow: 'Notes',
    title: 'Use notes for explanations and findings',
    summary:
      'Notes are where you capture why an experiment mattered, what worked, and what to try next.',
    bullets: [
      'Link notes to experiments, datasets, and results so the graph stays meaningful.',
      'Use notes when you want durable explanations, not just visual placement.',
      'Think of notes as the written memory of the lab.',
    ],
    targetBottomTab: 'notes',
    areaLabel: 'Bottom tab: Research Notes',
  },
  {
    id: 'workspace',
    eyebrow: 'Saving',
    title: 'Use storage tools for backup, reset, and sample starts',
    summary:
      'The lab autosaves locally in your browser, and the storage panel is where you export backups, import workspaces, reset safely, or launch sample setups.',
    bullets: [
      'The main workspace data is autosaved locally for quick reloads.',
      'Use Export when you want a shareable or backup file.',
      'Use the sample launch buttons when you want to jump straight into XOR, spiral, or sine workflows.',
      'Use Storage & Export when you want to inspect persistence, import data, or reset the demo.',
    ],
    targetBottomTab: 'workspace',
    areaLabel: 'Bottom tab: Storage & Export',
  },
]
