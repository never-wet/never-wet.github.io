export const uiManifest = {
  leftRailSections: ['workspace lens', 'collections', 'graph filters'],
  rightRailSections: ['selected item', 'connections', 'metrics'],
  bottomTabs: [
    {
      id: 'canvas',
      label: 'Canvas Workspace',
      description: 'Lay out notes, web cards, and experiment artifacts on an infinite 2D canvas.',
    },
    {
      id: 'builder',
      label: 'Network Builder',
      description: 'Drag blocks, wire layers, and validate the current architecture.',
    },
    {
      id: 'training',
      label: 'Model Trainer',
      description: 'Train in the browser, compare saved runs, and test local model predictions.',
    },
    {
      id: 'notes',
      label: 'Research Notes',
      description: 'Keep markdown notes, backlinks, and linked insights next to the graph.',
    },
    {
      id: 'workspace',
      label: 'Storage & Export',
      description: 'Import, export, load sample setups, and inspect local persistence.',
    },
  ],
  toolbarControls: ['mode', 'search', 'filters', 'autosave', 'export', 'import', 'reset'],
} as const
