import { defaultState } from './defaultState'
import type { CircuitDocument, PersistedCircuitLabState } from './types'

export const SAVE_SCHEMA_VERSION = 1

const cloneCircuit = (circuit: CircuitDocument): CircuitDocument => structuredClone(circuit)

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const getPersistedFallbackState = (): PersistedCircuitLabState => ({
  schemaVersion: SAVE_SCHEMA_VERSION,
  currentCircuit: cloneCircuit(defaultState.currentCircuit),
  savedCircuits: [],
  learning: structuredClone(defaultState.learning),
  practice: structuredClone(defaultState.practice),
  dashboard: structuredClone(defaultState.dashboard),
  ui: structuredClone(defaultState.ui),
  simulationPreferences: structuredClone(defaultState.simulationPreferences),
  lastOpenedWorkspaceId: defaultState.lastOpenedWorkspaceId,
})

export const migratePersistedState = (raw: unknown): PersistedCircuitLabState => {
  const fallback = getPersistedFallbackState()

  if (!isObject(raw)) {
    return fallback
  }

  const currentCircuit = isObject(raw.currentCircuit)
    ? (raw.currentCircuit as unknown as CircuitDocument)
    : fallback.currentCircuit
  const savedCircuits = Array.isArray(raw.savedCircuits) ? (raw.savedCircuits as CircuitDocument[]) : fallback.savedCircuits
  const learning = isObject(raw.learning) ? { ...fallback.learning, ...raw.learning } : fallback.learning
  const practice = isObject(raw.practice)
    ? {
        ...fallback.practice,
        ...raw.practice,
        results: isObject(raw.practice.results)
          ? { ...fallback.practice.results, ...(raw.practice.results as PersistedCircuitLabState['practice']['results']) }
          : fallback.practice.results,
      }
    : fallback.practice
  const dashboard = isObject(raw.dashboard) ? { ...fallback.dashboard, ...raw.dashboard } : fallback.dashboard
  const ui = isObject(raw.ui) ? { ...fallback.ui, ...raw.ui } : fallback.ui
  const simulationPreferences = isObject(raw.simulationPreferences)
    ? { ...fallback.simulationPreferences, ...raw.simulationPreferences }
    : fallback.simulationPreferences
  const schemaVersion =
    typeof raw.schemaVersion === 'number' && Number.isFinite(raw.schemaVersion)
      ? raw.schemaVersion
      : SAVE_SCHEMA_VERSION

  return {
    schemaVersion: schemaVersion < SAVE_SCHEMA_VERSION ? SAVE_SCHEMA_VERSION : schemaVersion,
    currentCircuit,
    savedCircuits,
    learning,
    practice,
    dashboard,
    ui,
    simulationPreferences,
    lastOpenedWorkspaceId:
      typeof raw.lastOpenedWorkspaceId === 'string' ? raw.lastOpenedWorkspaceId : fallback.lastOpenedWorkspaceId,
  }
}
