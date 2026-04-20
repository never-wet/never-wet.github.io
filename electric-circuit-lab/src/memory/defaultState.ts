import { sampleCircuitRegistry } from './contentRegistry'
import type { CircuitLabState } from './types'

const starterCircuit = structuredClone(sampleCircuitRegistry['starter-led'].circuit)

export const defaultState: CircuitLabState = {
  schemaVersion: 1,
  currentCircuit: starterCircuit,
  savedCircuits: [],
  learning: {
    activeLessonId: 'current-voltage-basics',
    completedLessonIds: [],
    unlockedLessonIds: ['current-voltage-basics', 'ohms-law', 'switches-leds'],
  },
  practice: {
    activeQuizId: 'identify-resistor',
    unlockedQuizIds: ['identify-resistor', 'predict-led', 'series-current', 'build-led-loop'],
    results: {},
  },
  dashboard: {
    recentCircuitIds: [starterCircuit.id],
    unlockedChallengeIds: ['build-led-loop'],
  },
  ui: {
    activeSection: 'home',
    activeWorkspace: 'builder',
    inspectorTab: 'inspector',
    bottomPanelTab: 'guide',
  },
  simulationPreferences: {
    autoRun: false,
    highlightCurrent: true,
  },
  lastOpenedWorkspaceId: starterCircuit.id,
  selection: {
    componentIds: [],
    wireIds: [],
  },
  draftWire: null,
  simulationResult: null,
}
