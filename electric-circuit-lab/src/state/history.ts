import { performanceConfig } from '../memory/performanceConfig'
import type { CircuitDocument, CircuitHistoryState } from '../memory/types'

const cloneCircuitStack = (stack: CircuitDocument[]): CircuitDocument[] =>
  stack.map((circuit) => structuredClone(circuit))

const trimHistoryStack = (stack: CircuitDocument[]): CircuitDocument[] =>
  stack.slice(-performanceConfig.maxUndoDepth)

const createComparableCircuit = (circuit: CircuitDocument): CircuitDocument => ({
  ...structuredClone(circuit),
  updatedAt: '',
})

export const createEmptyHistoryState = (): CircuitHistoryState => ({
  past: [],
  future: [],
})

export const circuitsMatchForHistory = (
  left: CircuitDocument,
  right: CircuitDocument,
): boolean =>
  JSON.stringify(createComparableCircuit(left)) ===
  JSON.stringify(createComparableCircuit(right))

export const pushCircuitHistory = (
  history: CircuitHistoryState,
  snapshot: CircuitDocument,
): CircuitHistoryState => ({
  past: trimHistoryStack([...cloneCircuitStack(history.past), structuredClone(snapshot)]),
  future: [],
})

export const undoCircuitHistory = (
  history: CircuitHistoryState,
  currentCircuit: CircuitDocument,
): { currentCircuit: CircuitDocument; history: CircuitHistoryState } | null => {
  const previous = history.past.at(-1)
  if (!previous) {
    return null
  }

  return {
    currentCircuit: structuredClone(previous),
    history: {
      past: cloneCircuitStack(history.past.slice(0, -1)),
      future: trimHistoryStack([structuredClone(currentCircuit), ...cloneCircuitStack(history.future)]),
    },
  }
}

export const redoCircuitHistory = (
  history: CircuitHistoryState,
  currentCircuit: CircuitDocument,
): { currentCircuit: CircuitDocument; history: CircuitHistoryState } | null => {
  const [next, ...remainingFuture] = history.future
  if (!next) {
    return null
  }

  return {
    currentCircuit: structuredClone(next),
    history: {
      past: trimHistoryStack([...cloneCircuitStack(history.past), structuredClone(currentCircuit)]),
      future: cloneCircuitStack(remainingFuture),
    },
  }
}
