import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { lessonIndex } from '../memory/lessonIndex'
import { componentRegistry, sampleCircuitIndex } from '../memory/contentRegistry'
import { defaultState } from '../memory/defaultState'
import { performanceConfig } from '../memory/performanceConfig'
import { quizIndex } from '../memory/quizIndex'
import type {
  AppSection,
  BottomPanelTab,
  CircuitDocument,
  CircuitLabState,
  ComponentInstance,
  InspectorTab,
  Point,
  PrimitiveValue,
  SelectionState,
  WireEndpoint,
  WorkspaceType,
} from '../memory/types'
import { snapPoint } from '../builder/geometry'
import { simulateCircuit } from '../simulation/engine'
import { loadPersistedState, pickPersistedState, savePersistedState } from './persistence'
import {
  circuitsMatchForHistory,
  createEmptyHistoryState,
  pushCircuitHistory,
  redoCircuitHistory,
  undoCircuitHistory,
} from './history'
import {
  cloneCircuit,
  createBlankCircuit,
  createComponentInstance,
  getWireKey,
  loadSampleCircuit,
  mergeRecentIds,
  nowIso,
  removeComponentsFromCircuit,
  stampCircuit,
} from '../utils/circuit'
import { createId } from '../utils/ids'

interface CircuitLabContextValue {
  state: CircuitLabState
  canUndo: boolean
  canRedo: boolean
  statusNotice: StatusNotice | null
  setActiveSection: (section: AppSection) => void
  setWorkspace: (workspace: WorkspaceType) => void
  setInspectorTab: (tab: InspectorTab) => void
  setBottomPanelTab: (tab: BottomPanelTab) => void
  setBoardViewport: (pan: Point, zoom: number) => void
  toggleGrid: () => void
  setPlacementMode: (mode: CircuitDocument['board']['placementMode']) => void
  addComponent: (typeId: string, position: Point) => void
  setSelection: (selection: SelectionState) => void
  selectAllCircuitItems: () => void
  selectComponent: (componentId: string, additive?: boolean) => void
  selectWire: (wireId: string, additive?: boolean) => void
  clearSelection: () => void
  moveComponents: (updates: Array<{ id: string; position: Point }>) => void
  nudgeSelection: (delta: Point) => void
  duplicateSelection: () => void
  rotateSelected: () => void
  flipSelected: () => void
  deleteSelection: () => void
  removeWire: (wireId: string) => void
  updateComponentParams: (componentId: string, patch: Record<string, PrimitiveValue>) => void
  startWire: (endpoint: WireEndpoint) => void
  updateDraftPointer: (point: Point | null) => void
  finishWire: (endpoint: WireEndpoint) => void
  cancelWire: () => void
  beginUndoGroup: () => void
  endUndoGroup: () => void
  undoCircuit: () => void
  redoCircuit: () => void
  runSimulation: () => void
  clearSimulation: () => void
  loadSample: (sampleId: string) => void
  loadSavedCircuit: (circuitId: string) => void
  saveCurrentCircuit: (name?: string) => void
  renameCurrentCircuit: (name: string) => void
  renameSavedCircuit: (circuitId: string, name: string) => void
  deleteSavedCircuit: (circuitId: string) => void
  duplicateCurrentCircuit: (name?: string) => void
  resetCurrentCircuit: () => void
  openBlankSandbox: () => void
  importCircuit: (circuit: CircuitDocument) => void
  markLessonComplete: (lessonId: string) => void
  setActiveLesson: (lessonId: string) => void
  setActiveQuiz: (quizId: string) => void
  submitQuizAnswer: (quizId: string, isCorrect: boolean) => void
  toggleSimulationPreference: (key: 'autoRun' | 'highlightCurrent') => void
}

const CircuitLabContext = createContext<CircuitLabContextValue | null>(null)

interface CircuitStateUpdateOptions {
  recordHistory?: boolean
  groupedHistory?: boolean
  resetHistory?: boolean
}

interface StatusNotice {
  message: string
  tone: 'info' | 'success' | 'warning'
}

const createInitialState = (): CircuitLabState => {
  const persisted = loadPersistedState()

  return {
    ...structuredClone(defaultState),
    ...persisted,
    currentCircuit: structuredClone(persisted.currentCircuit),
    savedCircuits: structuredClone(persisted.savedCircuits),
    learning: structuredClone(persisted.learning),
    practice: structuredClone(persisted.practice),
    dashboard: structuredClone(persisted.dashboard),
    ui: structuredClone(persisted.ui),
    simulationPreferences: structuredClone(persisted.simulationPreferences),
    history: createEmptyHistoryState(),
    selection: { componentIds: [], wireIds: [] },
    draftWire: null,
    simulationResult: null,
  }
}

const deriveWorkspace = (section: AppSection): WorkspaceType => {
  if (section === 'simulation') {
    return 'simulation'
  }

  if (section === 'sandbox') {
    return 'sandbox'
  }

  return 'builder'
}

export const CircuitLabProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<CircuitLabState>(createInitialState)
  const [statusNotice, setStatusNotice] = useState<StatusNotice | null>(null)
  const mountedRef = useRef(false)
  const groupedUndoSnapshotRef = useRef<CircuitDocument | null>(null)

  useEffect(() => {
    if (!statusNotice) {
      return
    }

    const timeout = window.setTimeout(() => setStatusNotice(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [statusNotice])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    const timeout = window.setTimeout(() => {
      savePersistedState(pickPersistedState(state))
    }, performanceConfig.autosaveDebounceMs)

    return () => window.clearTimeout(timeout)
  }, [
    state.currentCircuit,
    state.savedCircuits,
    state.learning,
    state.practice,
    state.dashboard,
    state.ui,
    state.simulationPreferences,
    state.schemaVersion,
    state.lastOpenedWorkspaceId,
  ])

  useEffect(() => {
    if (!state.simulationPreferences.autoRun) {
      return
    }

    setState((prev) => ({
      ...prev,
      simulationResult: simulateCircuit(prev.currentCircuit),
    }))
  }, [state.currentCircuit, state.simulationPreferences.autoRun])

  const setActiveSection = (section: AppSection) => {
    setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeSection: section,
        activeWorkspace: deriveWorkspace(section),
      },
    }))
  }

  const applyCircuitState = (
    updater: (prev: CircuitLabState) => CircuitLabState,
    options: CircuitStateUpdateOptions = {},
  ) => {
    if (options.resetHistory) {
      groupedUndoSnapshotRef.current = null
    }

    setState((prev) => {
      const next = updater(prev)
      if (next === prev) {
        return prev
      }

      if (options.resetHistory) {
        return {
          ...next,
          history: createEmptyHistoryState(),
        }
      }

      if (!options.recordHistory) {
        return next
      }

      if (circuitsMatchForHistory(prev.currentCircuit, next.currentCircuit)) {
        return next
      }

      const groupedSnapshot = options.groupedHistory ? groupedUndoSnapshotRef.current : null
      if (
        groupedSnapshot &&
        prev.history.past.length > 0 &&
        circuitsMatchForHistory(prev.history.past[prev.history.past.length - 1], groupedSnapshot)
      ) {
        return next
      }

      return {
        ...next,
        history: pushCircuitHistory(prev.history, groupedSnapshot ?? prev.currentCircuit),
      }
    })
  }

  const pushStatus = (message: string, tone: StatusNotice['tone'] = 'info') => {
    setStatusNotice({ message, tone })
  }

  const setWorkspace = (workspace: WorkspaceType) => {
    const section = workspace === 'simulation' ? 'simulation' : workspace === 'sandbox' ? 'sandbox' : 'builder'
    setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeWorkspace: workspace,
        activeSection: section,
      },
    }))
  }

  const setInspectorTab = (tab: InspectorTab) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, inspectorTab: tab },
    }))
  }

  const setBottomPanelTab = (tab: BottomPanelTab) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, bottomPanelTab: tab },
    }))
  }

  const setBoardViewport = (pan: Point, zoom: number) => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        board: {
          ...prev.currentCircuit.board,
          pan,
          zoom,
        },
      }),
    }))
  }

  const toggleGrid = () => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        board: {
          ...prev.currentCircuit.board,
          showGrid: !prev.currentCircuit.board.showGrid,
        },
      }),
    }), { recordHistory: true })
  }

  const setPlacementMode = (mode: CircuitDocument['board']['placementMode']) => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        board: {
          ...prev.currentCircuit.board,
          placementMode: mode,
        },
      }),
    }), { recordHistory: true })
  }

  const addComponent = (typeId: string, position: Point) => {
    applyCircuitState((prev) => {
      const snapped = snapPoint(position, prev.currentCircuit.board.placementMode === 'grid')
      const instance = createComponentInstance(typeId, snapped)

      return {
        ...prev,
        currentCircuit: stampCircuit({
          ...prev.currentCircuit,
          components: [...prev.currentCircuit.components, instance],
        }),
        selection: {
          componentIds: [instance.id],
          wireIds: [],
        },
        ui: {
          ...prev.ui,
          activeSection: prev.ui.activeSection === 'home' ? 'builder' : prev.ui.activeSection,
          activeWorkspace: prev.ui.activeWorkspace,
          inspectorTab: 'inspector',
        },
      }
    }, { recordHistory: true })
  }

  const setSelection = (selection: SelectionState) => {
    setState((prev) => ({ ...prev, selection }))
  }

  const selectAllCircuitItems = () => {
    setState((prev) => ({
      ...prev,
      selection: {
        componentIds: prev.currentCircuit.components.map((component) => component.id),
        wireIds: prev.currentCircuit.wires.map((wire) => wire.id),
      },
      ui: {
        ...prev.ui,
        inspectorTab: 'inspector',
      },
    }))
  }

  const selectComponent = (componentId: string, additive = false) => {
    setState((prev) => {
      const currentIds = prev.selection.componentIds
      const nextIds = additive
        ? currentIds.includes(componentId)
          ? currentIds.filter((id) => id !== componentId)
          : [...currentIds, componentId]
        : [componentId]

      return {
        ...prev,
        selection: {
          componentIds: nextIds,
          wireIds: [],
        },
        ui: { ...prev.ui, inspectorTab: 'inspector' },
      }
    })
  }

  const selectWire = (wireId: string, additive = false) => {
    setState((prev) => {
      const currentIds = prev.selection.wireIds
      const nextIds = additive
        ? currentIds.includes(wireId)
          ? currentIds.filter((id) => id !== wireId)
          : [...currentIds, wireId]
        : [wireId]

      return {
        ...prev,
        selection: {
          componentIds: additive ? prev.selection.componentIds : [],
          wireIds: nextIds,
        },
      }
    })
  }

  const clearSelection = () => {
    setState((prev) => ({
      ...prev,
      selection: { componentIds: [], wireIds: [] },
    }))
  }

  const moveComponents = (updates: Array<{ id: string; position: Point }>) => {
    const updateMap = new Map(updates.map((entry) => [entry.id, entry.position]))

    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        components: prev.currentCircuit.components.map((component) => {
          const nextPosition = updateMap.get(component.id)

          if (!nextPosition) {
            return component
          }

          return {
            ...component,
            position: snapPoint(
              nextPosition,
              prev.currentCircuit.board.placementMode === 'grid',
            ),
          }
        }),
      }),
    }), { recordHistory: true, groupedHistory: true })
  }

  const nudgeSelection = (delta: Point) => {
    applyCircuitState((prev) => {
      if (prev.selection.componentIds.length === 0) {
        return prev
      }

      return {
        ...prev,
        currentCircuit: stampCircuit({
          ...prev.currentCircuit,
          components: prev.currentCircuit.components.map((component) =>
            prev.selection.componentIds.includes(component.id)
              ? {
                  ...component,
                  position: snapPoint(
                    {
                      x: component.position.x + delta.x,
                      y: component.position.y + delta.y,
                    },
                    prev.currentCircuit.board.placementMode === 'grid',
                  ),
                }
              : component,
          ),
        }),
      }
    }, { recordHistory: true })
  }

  const duplicateSelection = () => {
    applyCircuitState((prev) => {
      if (prev.selection.componentIds.length === 0) {
        return prev
      }

      const selectedIds = new Set(prev.selection.componentIds)
      const cloneMap = new Map<string, string>()
      const offset = prev.currentCircuit.board.placementMode === 'grid' ? performanceConfig.gridSize * 2 : 36
      const duplicatedComponents = prev.currentCircuit.components
        .filter((component) => selectedIds.has(component.id))
        .map((component) => {
          const nextId = createId(component.typeId)
          cloneMap.set(component.id, nextId)
          return {
            ...structuredClone(component),
            id: nextId,
            position: {
              x: component.position.x + offset,
              y: component.position.y + offset,
            },
          }
        })

      if (duplicatedComponents.length === 0) {
        return prev
      }

      const duplicatedWires = prev.currentCircuit.wires
        .filter(
          (wire) =>
            selectedIds.has(wire.from.componentId) &&
            selectedIds.has(wire.to.componentId),
        )
        .map((wire) => ({
          ...structuredClone(wire),
          id: createId('wire'),
          from: {
            componentId: cloneMap.get(wire.from.componentId)!,
            terminalId: wire.from.terminalId,
          },
          to: {
            componentId: cloneMap.get(wire.to.componentId)!,
            terminalId: wire.to.terminalId,
          },
        }))

      return {
        ...prev,
        currentCircuit: stampCircuit({
          ...prev.currentCircuit,
          components: [...prev.currentCircuit.components, ...duplicatedComponents],
          wires: [...prev.currentCircuit.wires, ...duplicatedWires],
        }),
        selection: {
          componentIds: duplicatedComponents.map((component) => component.id),
          wireIds: duplicatedWires.map((wire) => wire.id),
        },
      }
    }, { recordHistory: true })

    pushStatus('Duplicated the current selection.', 'success')
  }

  const rotateSelected = () => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        components: prev.currentCircuit.components.map((component) =>
          prev.selection.componentIds.includes(component.id)
            ? {
                ...component,
                rotation: (((component.rotation + 90) % 360) || 0) as ComponentInstance['rotation'],
              }
            : component,
        ),
      }),
    }), { recordHistory: true })
  }

  const flipSelected = () => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        components: prev.currentCircuit.components.map((component) =>
          prev.selection.componentIds.includes(component.id)
            ? { ...component, flipX: !component.flipX }
            : component,
        ),
      }),
    }), { recordHistory: true })
  }

  const deleteSelection = () => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: removeComponentsFromCircuit(prev.currentCircuit, prev.selection),
      selection: { componentIds: [], wireIds: [] },
      draftWire: null,
    }), { recordHistory: true })
  }

  const removeWire = (wireId: string) => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        wires: prev.currentCircuit.wires.filter((wire) => wire.id !== wireId),
      }),
      selection: {
        componentIds: prev.selection.componentIds,
        wireIds: prev.selection.wireIds.filter((id) => id !== wireId),
      },
    }), { recordHistory: true })
  }

  const updateComponentParams = (componentId: string, patch: Record<string, PrimitiveValue>) => {
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        components: prev.currentCircuit.components.map((component) =>
          component.id === componentId
            ? { ...component, params: { ...component.params, ...patch } }
            : component,
        ),
      }),
    }), { recordHistory: true })
  }

  const startWire = (endpoint: WireEndpoint) => {
    setState((prev) => ({
      ...prev,
      draftWire: {
        start: endpoint,
        pointer: null,
      },
      selection: {
        componentIds: [endpoint.componentId],
        wireIds: [],
      },
    }))
  }

  const updateDraftPointer = (point: Point | null) => {
    setState((prev) => ({
      ...prev,
      draftWire: prev.draftWire ? { ...prev.draftWire, pointer: point } : null,
    }))
  }

  const finishWire = (endpoint: WireEndpoint) => {
    applyCircuitState((prev) => {
      if (!prev.draftWire) {
        return prev
      }

      const start = prev.draftWire.start
      if (
        start.componentId === endpoint.componentId &&
        start.terminalId === endpoint.terminalId
      ) {
        return {
          ...prev,
          draftWire: null,
        }
      }

      const nextWire = {
        id: createId('wire'),
        from: start,
        to: endpoint,
      }
      const nextKey = getWireKey(nextWire)
      const alreadyExists = prev.currentCircuit.wires.some((wire) => getWireKey(wire) === nextKey)

      if (alreadyExists) {
        return {
          ...prev,
          draftWire: null,
        }
      }

      return {
        ...prev,
        currentCircuit: stampCircuit({
          ...prev.currentCircuit,
          wires: [...prev.currentCircuit.wires, nextWire],
        }),
        draftWire: null,
      }
    }, { recordHistory: true })
  }

  const cancelWire = () => {
    setState((prev) => ({
      ...prev,
      draftWire: null,
    }))
  }

  const beginUndoGroup = () => {
    if (!groupedUndoSnapshotRef.current) {
      groupedUndoSnapshotRef.current = cloneCircuit(state.currentCircuit)
    }
  }

  const endUndoGroup = () => {
    groupedUndoSnapshotRef.current = null
  }

  const undoCircuit = () => {
    groupedUndoSnapshotRef.current = null
    setState((prev) => {
      const restored = undoCircuitHistory(prev.history, prev.currentCircuit)
      if (!restored) {
        return prev
      }

      return {
        ...prev,
        currentCircuit: restored.currentCircuit,
        history: restored.history,
        selection: { componentIds: [], wireIds: [] },
        draftWire: null,
      }
    })
    pushStatus('Undid the last circuit edit.', 'info')
  }

  const redoCircuit = () => {
    groupedUndoSnapshotRef.current = null
    setState((prev) => {
      const restored = redoCircuitHistory(prev.history, prev.currentCircuit)
      if (!restored) {
        return prev
      }

      return {
        ...prev,
        currentCircuit: restored.currentCircuit,
        history: restored.history,
        selection: { componentIds: [], wireIds: [] },
        draftWire: null,
      }
    })
    pushStatus('Restored the next circuit edit.', 'info')
  }

  const runSimulation = () => {
    setState((prev) => ({
      ...prev,
      simulationResult: simulateCircuit(prev.currentCircuit),
      ui: {
        ...prev.ui,
        inspectorTab: 'simulation',
        activeSection: prev.ui.activeSection === 'home' ? 'simulation' : prev.ui.activeSection,
        activeWorkspace:
          prev.ui.activeSection === 'home' ? 'simulation' : prev.ui.activeWorkspace,
      },
    }))
  }

  const clearSimulation = () => {
    setState((prev) => ({
      ...prev,
      simulationResult: null,
    }))
  }

  const loadSample = (sampleId: string) => {
    const sample = loadSampleCircuit(sampleId)
    if (!sample) {
      return
    }

    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: cloneCircuit(sample.circuit),
      selection: { componentIds: [], wireIds: [] },
      draftWire: null,
      simulationResult: null,
      dashboard: {
        ...prev.dashboard,
        recentCircuitIds: mergeRecentIds(sample.circuit.id, prev.dashboard.recentCircuitIds),
      },
      lastOpenedWorkspaceId: sample.circuit.id,
      learning: sample.circuit.linkedLessonId
        ? { ...prev.learning, activeLessonId: sample.circuit.linkedLessonId }
        : prev.learning,
      ui: {
        ...prev.ui,
        activeSection: sample.circuit.mode === 'sandbox' ? 'sandbox' : 'builder',
        activeWorkspace: sample.circuit.mode === 'sandbox' ? 'sandbox' : 'builder',
      },
    }), { resetHistory: true })
    pushStatus(`Loaded sample board "${sample.title}".`, 'success')
  }

  const loadSavedCircuit = (circuitId: string) => {
    const savedCircuitName = state.savedCircuits.find((entry) => entry.id === circuitId)?.name
    applyCircuitState((prev) => {
      const saved = prev.savedCircuits.find((entry) => entry.id === circuitId)
      if (!saved) {
        return prev
      }

      return {
        ...prev,
        currentCircuit: cloneCircuit(saved),
        selection: { componentIds: [], wireIds: [] },
        draftWire: null,
        simulationResult: null,
        dashboard: {
          ...prev.dashboard,
          recentCircuitIds: mergeRecentIds(saved.id, prev.dashboard.recentCircuitIds),
        },
        lastOpenedWorkspaceId: saved.id,
        ui: {
          ...prev.ui,
          activeSection: saved.mode === 'sandbox' ? 'sandbox' : 'builder',
          activeWorkspace: saved.mode === 'sandbox' ? 'sandbox' : 'builder',
        },
      }
    }, { resetHistory: true })

    if (savedCircuitName) {
      pushStatus(`Loaded saved circuit "${savedCircuitName}".`, 'success')
    }
  }

  const saveCurrentCircuit = (name?: string) => {
    setState((prev) => {
      const nextName = name?.trim() || prev.currentCircuit.name
      const namedCircuit = stampCircuit({
        ...prev.currentCircuit,
        name: nextName,
      })
      const existingIndex = prev.savedCircuits.findIndex((entry) => entry.id === namedCircuit.id)
      const savedCircuits = [...prev.savedCircuits]

      if (existingIndex >= 0) {
        savedCircuits[existingIndex] = namedCircuit
      } else {
        savedCircuits.unshift(namedCircuit)
      }

      return {
        ...prev,
        currentCircuit: namedCircuit,
        savedCircuits,
        dashboard: {
          ...prev.dashboard,
          recentCircuitIds: mergeRecentIds(namedCircuit.id, prev.dashboard.recentCircuitIds),
        },
        lastOpenedWorkspaceId: namedCircuit.id,
      }
    })
    pushStatus(`Saved "${name?.trim() || state.currentCircuit.name}" locally.`, 'success')
  }

  const renameCurrentCircuit = (name: string) => {
    const nextName = name.trim()
    if (!nextName) {
      return
    }

    setState((prev) => {
      const renamedCircuit = stampCircuit({
        ...prev.currentCircuit,
        name: nextName,
      })

      return {
        ...prev,
        currentCircuit: renamedCircuit,
        savedCircuits: prev.savedCircuits.map((entry) =>
          entry.id === renamedCircuit.id ? renamedCircuit : entry,
        ),
      }
    })

    pushStatus(`Renamed the current circuit to "${nextName}".`, 'success')
  }

  const renameSavedCircuit = (circuitId: string, name: string) => {
    const nextName = name.trim()
    if (!nextName) {
      return
    }

    setState((prev) => {
      const saved = prev.savedCircuits.find((entry) => entry.id === circuitId)
      if (!saved) {
        return prev
      }

      const renamed = stampCircuit({
        ...saved,
        name: nextName,
      })

      return {
        ...prev,
        currentCircuit:
          prev.currentCircuit.id === circuitId ? renamed : prev.currentCircuit,
        savedCircuits: prev.savedCircuits.map((entry) =>
          entry.id === circuitId ? renamed : entry,
        ),
      }
    })

    pushStatus(`Renamed a saved circuit to "${nextName}".`, 'success')
  }

  const deleteSavedCircuit = (circuitId: string) => {
    setState((prev) => ({
      ...prev,
      savedCircuits: prev.savedCircuits.filter((entry) => entry.id !== circuitId),
      dashboard: {
        ...prev.dashboard,
        recentCircuitIds: prev.dashboard.recentCircuitIds.filter((id) => id !== circuitId),
      },
      lastOpenedWorkspaceId:
        prev.lastOpenedWorkspaceId === circuitId ? prev.currentCircuit.id : prev.lastOpenedWorkspaceId,
    }))

    pushStatus('Deleted the saved circuit from local storage.', 'warning')
  }

  const duplicateCurrentCircuit = (name?: string) => {
    applyCircuitState((prev) => {
      const copied = stampCircuit(
        {
          ...cloneCircuit(prev.currentCircuit),
          id: createId('circuit'),
          createdAt: nowIso(),
          name: name?.trim() || `${prev.currentCircuit.name} Copy`,
        },
        {},
      )

      return {
        ...prev,
        currentCircuit: copied,
        savedCircuits: [copied, ...prev.savedCircuits],
        dashboard: {
          ...prev.dashboard,
          recentCircuitIds: mergeRecentIds(copied.id, prev.dashboard.recentCircuitIds),
        },
        lastOpenedWorkspaceId: copied.id,
        selection: { componentIds: [], wireIds: [] },
      }
    }, { resetHistory: true })
    pushStatus(`Created "${name?.trim() || `${state.currentCircuit.name} Copy`}".`, 'success')
  }

  const resetCurrentCircuit = () => {
    applyCircuitState((prev) => {
      const matchingSample = sampleCircuitIndex.find(
        (sample) =>
          sample.circuit.id === prev.currentCircuit.id ||
          (prev.currentCircuit.linkedLessonId && sample.circuit.linkedLessonId === prev.currentCircuit.linkedLessonId),
      )

      const nextCircuit = matchingSample
        ? cloneCircuit(matchingSample.circuit)
        : createBlankCircuit(prev.currentCircuit.name, prev.currentCircuit.board.placementMode)

      return {
        ...prev,
        currentCircuit: nextCircuit,
        selection: { componentIds: [], wireIds: [] },
        draftWire: null,
        simulationResult: null,
      }
    }, { resetHistory: true })
    pushStatus('Reset the workspace to its starter state.', 'warning')
  }

  const openBlankSandbox = () => {
    const blank = createBlankCircuit()
    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: blank,
      selection: { componentIds: [], wireIds: [] },
      draftWire: null,
      simulationResult: null,
      ui: {
        ...prev.ui,
        activeSection: 'sandbox',
        activeWorkspace: 'sandbox',
      },
      lastOpenedWorkspaceId: blank.id,
    }), { resetHistory: true })
    pushStatus('Opened a blank sandbox board.', 'success')
  }

  const importCircuit = (circuit: CircuitDocument) => {
    const imported = stampCircuit({
      ...structuredClone(circuit),
      id: circuit.id || createId('imported-circuit'),
      name: circuit.name || 'Imported Circuit',
    })

    applyCircuitState((prev) => ({
      ...prev,
      currentCircuit: imported,
      selection: { componentIds: [], wireIds: [] },
      draftWire: null,
      simulationResult: null,
      savedCircuits: [imported, ...prev.savedCircuits.filter((entry) => entry.id !== imported.id)],
      dashboard: {
        ...prev.dashboard,
        recentCircuitIds: mergeRecentIds(imported.id, prev.dashboard.recentCircuitIds),
      },
      lastOpenedWorkspaceId: imported.id,
      ui: {
        ...prev.ui,
        activeSection: imported.mode === 'sandbox' ? 'sandbox' : 'builder',
        activeWorkspace: imported.mode === 'sandbox' ? 'sandbox' : 'builder',
      },
    }), { resetHistory: true })
    pushStatus(`Imported "${imported.name}" from JSON.`, 'success')
  }

  const markLessonComplete = (lessonId: string) => {
    setState((prev) => {
      const completed = Array.from(new Set([...prev.learning.completedLessonIds, lessonId]))
      const currentIndex = lessonIndex.findIndex((lesson) => lesson.id === lessonId)
      const nextLessonId = currentIndex >= 0 ? lessonIndex[currentIndex + 1]?.id : undefined
      const unlocked = Array.from(
        new Set([
          ...prev.learning.unlockedLessonIds,
          lessonId,
          ...(nextLessonId ? [nextLessonId] : []),
        ]),
      )

      return {
        ...prev,
        learning: {
          ...prev.learning,
          completedLessonIds: completed,
          unlockedLessonIds: unlocked,
        },
      }
    })
  }

  const setActiveLesson = (lessonId: string) => {
    setState((prev) => ({
      ...prev,
      learning: {
        ...prev.learning,
        activeLessonId: lessonId,
        unlockedLessonIds: Array.from(new Set([...prev.learning.unlockedLessonIds, lessonId])),
      },
      ui: {
        ...prev.ui,
        activeSection: 'learn',
      },
    }))
  }

  const setActiveQuiz = (quizId: string) => {
    setState((prev) => ({
      ...prev,
      practice: {
        ...prev.practice,
        activeQuizId: quizId,
        unlockedQuizIds: Array.from(new Set([...prev.practice.unlockedQuizIds, quizId])),
      },
      ui: {
        ...prev.ui,
        activeSection: 'practice',
      },
    }))
  }

  const submitQuizAnswer = (quizId: string, isCorrect: boolean) => {
    setState((prev) => {
      const previous = prev.practice.results[quizId] ?? {
        attempts: 0,
        bestScore: 0,
        lastCorrect: false,
      }
      const nextResult = {
        attempts: previous.attempts + 1,
        bestScore: Math.max(previous.bestScore, isCorrect ? 1 : 0),
        lastCorrect: isCorrect,
        completedAt: isCorrect ? nowIso() : previous.completedAt,
      }

      const currentIndex = quizIndex.findIndex((quiz) => quiz.id === quizId)
      const nextQuizId = currentIndex >= 0 ? quizIndex[currentIndex + 1]?.id : undefined

      return {
        ...prev,
        practice: {
          ...prev.practice,
          results: {
            ...prev.practice.results,
            [quizId]: nextResult,
          },
          unlockedQuizIds: Array.from(
            new Set([
              ...prev.practice.unlockedQuizIds,
              quizId,
              ...(isCorrect && nextQuizId ? [nextQuizId] : []),
            ]),
          ),
        },
      }
    })
  }

  const toggleSimulationPreference = (key: 'autoRun' | 'highlightCurrent') => {
    setState((prev) => ({
      ...prev,
      simulationPreferences: {
        ...prev.simulationPreferences,
        [key]: !prev.simulationPreferences[key],
      },
    }))
  }

  return (
    <CircuitLabContext.Provider
      value={{
        state,
        canUndo: state.history.past.length > 0,
        canRedo: state.history.future.length > 0,
        statusNotice,
        setActiveSection,
        setWorkspace,
        setInspectorTab,
        setBottomPanelTab,
        setBoardViewport,
        toggleGrid,
        setPlacementMode,
        addComponent,
        setSelection,
        selectAllCircuitItems,
        selectComponent,
        selectWire,
        clearSelection,
        moveComponents,
        nudgeSelection,
        duplicateSelection,
        rotateSelected,
        flipSelected,
        deleteSelection,
        removeWire,
        updateComponentParams,
        startWire,
        updateDraftPointer,
        finishWire,
        cancelWire,
        beginUndoGroup,
        endUndoGroup,
        undoCircuit,
        redoCircuit,
        runSimulation,
        clearSimulation,
        loadSample,
        loadSavedCircuit,
        saveCurrentCircuit,
        renameCurrentCircuit,
        renameSavedCircuit,
        deleteSavedCircuit,
        duplicateCurrentCircuit,
        resetCurrentCircuit,
        openBlankSandbox,
        importCircuit,
        markLessonComplete,
        setActiveLesson,
        setActiveQuiz,
        submitQuizAnswer,
        toggleSimulationPreference,
      }}
    >
      {children}
    </CircuitLabContext.Provider>
  )
}

export const useCircuitLab = () => {
  const context = useContext(CircuitLabContext)

  if (!context) {
    throw new Error('useCircuitLab must be used inside CircuitLabProvider.')
  }

  return context
}
