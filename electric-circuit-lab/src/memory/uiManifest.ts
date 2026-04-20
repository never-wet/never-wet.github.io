import type { BottomPanelTab, InspectorTab, WorkspaceType } from './types'

export const uiManifest = {
  workspaceModes: [
    {
      id: 'builder' as WorkspaceType,
      label: 'Build Mode',
      description: 'Place parts, wire terminals, and edit values.',
    },
    {
      id: 'simulation' as WorkspaceType,
      label: 'Run Mode',
      description: 'Inspect active paths, voltage hints, and validation warnings.',
    },
    {
      id: 'sandbox' as WorkspaceType,
      label: 'Sandbox',
      description: 'Experiment freely with saved circuits and imports.',
    },
  ],
  inspectorTabs: [
    { id: 'inspector' as InspectorTab, label: 'Inspector' },
    { id: 'simulation' as InspectorTab, label: 'Run Info' },
    { id: 'lesson' as InspectorTab, label: 'Guide' },
  ],
  bottomTabs: [
    { id: 'guide' as BottomPanelTab, label: 'Guide' },
    { id: 'log' as BottomPanelTab, label: 'Log' },
    { id: 'formula' as BottomPanelTab, label: 'Formula' },
  ],
  toolbarActions: [
    'Run simulation',
    'Reset workspace',
    'Toggle grid snapping',
    'Rotate selection',
    'Flip selection',
    'Save current circuit',
    'Export JSON',
  ],
  panels: [
    'Component palette',
    'SVG circuit workspace',
    'Inspector and simulation panel',
    'Bottom dock for notes, logs, formulas, and hints',
  ],
}
