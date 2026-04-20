import type { AppSection } from './types'

export const appManifest = {
  id: 'electric-circuit-lab',
  name: 'Circuit Studio',
  tagline: 'Learn, build, wire, simulate, and practice electric circuits in the browser.',
  summary:
    'A hybrid education platform and circuit workspace for beginners, intermediate learners, and curious advanced builders.',
  sections: [
    {
      id: 'home' as AppSection,
      label: 'Home',
      description: 'Overview, quick start, featured lessons, and recent work.',
    },
    {
      id: 'learn' as AppSection,
      label: 'Learn',
      description: 'Guided electronics lessons with examples and sample circuits.',
    },
    {
      id: 'builder' as AppSection,
      label: 'Builder',
      description: 'Visual circuit building with drag and drop placement and terminal wiring.',
    },
    {
      id: 'simulation' as AppSection,
      label: 'Simulation',
      description: 'Run the hybrid analysis engine and inspect current, voltage, and warnings.',
    },
    {
      id: 'practice' as AppSection,
      label: 'Practice',
      description: 'Quizzes, build checks, and troubleshooting challenges.',
    },
    {
      id: 'sandbox' as AppSection,
      label: 'Sandbox',
      description: 'Freeform experimentation with saves, imports, and exports.',
    },
    {
      id: 'library' as AppSection,
      label: 'Library',
      description: 'Reference sheets for components, formulas, and usage examples.',
    },
    {
      id: 'progress' as AppSection,
      label: 'Progress',
      description: 'Saved circuits, lesson completion, quiz performance, and dashboard stats.',
    },
  ],
  featureFlags: {
    dragAndDropBuilder: true,
    terminalWiring: true,
    localPersistence: true,
    guidedLessons: true,
    buildChallenges: true,
    branchReporting: true,
    keyboardBuilderShortcuts: true,
    importExport: true,
  },
}
