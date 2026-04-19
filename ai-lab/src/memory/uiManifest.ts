export const uiManifest = {
  leftRailSections: ['workspace lens', 'collections', 'graph filters'],
  rightRailSections: ['selected item', 'connections', 'metrics'],
  bottomTabs: [
    {
      id: 'builder',
      label: 'Network Builder',
      description: 'Drag blocks, wire layers, and validate the current architecture.',
    },
    {
      id: 'training',
      label: 'Training Console',
      description: 'Run TensorFlow.js training, inspect metrics, and review predictions.',
    },
    {
      id: 'notes',
      label: 'Research Notes',
      description: 'Keep markdown notes, backlinks, and linked insights next to the graph.',
    },
    {
      id: 'workspace',
      label: 'Workspace',
      description: 'Export, import, reset, and inspect persistence state.',
    },
  ],
  toolbarControls: ['mode', 'search', 'filters', 'autosave', 'export', 'import', 'reset'],
} as const
