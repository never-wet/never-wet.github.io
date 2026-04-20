import { storageKeys } from '../memory/storageKeys'
import { getPersistedFallbackState, migratePersistedState } from '../memory/saveSchema'
import type { CircuitDocument, CircuitLabState, PersistedCircuitLabState } from '../memory/types'

export const pickPersistedState = (state: CircuitLabState): PersistedCircuitLabState => ({
  schemaVersion: state.schemaVersion,
  currentCircuit: structuredClone(state.currentCircuit),
  savedCircuits: structuredClone(state.savedCircuits),
  learning: structuredClone(state.learning),
  practice: structuredClone(state.practice),
  dashboard: structuredClone(state.dashboard),
  ui: structuredClone(state.ui),
  simulationPreferences: structuredClone(state.simulationPreferences),
  lastOpenedWorkspaceId: state.lastOpenedWorkspaceId,
})

export const loadPersistedState = (): PersistedCircuitLabState => {
  try {
    const raw = localStorage.getItem(storageKeys.appState)

    if (!raw) {
      return getPersistedFallbackState()
    }

    return migratePersistedState(JSON.parse(raw))
  } catch {
    return getPersistedFallbackState()
  }
}

export const savePersistedState = (state: PersistedCircuitLabState): void => {
  localStorage.setItem(storageKeys.appState, JSON.stringify(state))
}

export const exportCircuitJson = (circuit: CircuitDocument): string => JSON.stringify(circuit, null, 2)

export const parseImportedCircuit = (raw: string): CircuitDocument => {
  const parsed = JSON.parse(raw) as CircuitDocument

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
    throw new Error('Invalid circuit JSON.')
  }

  return parsed
}
