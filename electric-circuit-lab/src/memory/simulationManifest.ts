export const simulationManifest = {
  engineName: 'Hybrid Educational Circuit Engine',
  summary:
    'Phase 1 emphasizes understandable browser simulation for closed loops, series or parallel basics, LED behavior, switches, simple loads, logic questions, and clear warnings.',
  phases: [
    {
      id: 'phase-1',
      title: 'Interactive Education Runtime',
      supportedBehaviors: [
        'Battery and voltage source behavior',
        'Open versus closed loop detection',
        'Series and simple parallel current estimates',
        'Resistor voltage drop estimates',
        'LED and lamp on or off feedback',
        'Switch and push button logic',
        'Grounded node hints',
        'Basic logic gate output evaluation',
        'Sensor threshold output evaluation',
      ],
    },
    {
      id: 'phase-2',
      title: 'Expanded Analysis Architecture',
      supportedBehaviors: [
        'Capacitors and inductors over time',
        'Diode and transistor refinement',
        'More accurate branch analysis',
        'Signal and timing behaviors',
        'Microcontroller-style logic blocks',
      ],
    },
  ],
  outputModes: ['voltage hints', 'current estimates', 'component states', 'warnings', 'simulation log'],
  warnings: [
    'Open circuit',
    'Floating terminal',
    'Unsupported component in active loop',
    'Short circuit risk',
    'Complex network approximation',
  ],
}
