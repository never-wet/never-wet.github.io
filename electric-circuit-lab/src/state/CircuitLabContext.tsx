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
  setActiveSection: (section: AppSection) => void
  setWorkspace: (workspace: WorkspaceType) => void
  setInspectorTab: (tab: InspectorTab) => void
  setBottomPanelTab: (tab: BottomPanelTab) => void
  setBoardViewport: (pan: Point, zoom: number) => void
  toggleGrid: () => void
  setPlacementMode: (mode: CircuitDocument['board']['placementMode']) => void
  addComponent: (typeId: string, position: Point) => void
  setSelection: (selection: SelectionState) => void
  selectComponent: (componentId: string, additive?: boolean) => void
  selectWire: (wireId: string, additive?: boolean) => void
  clearSelection: () => void
  moveComponents: (updates: Array<{ id: string; position: Point }>) => void
  rotateSelected: () => void
  flipSelected: () => void
  deleteSelection: () => void
  removeWire: (wireId: string) => void
  updateComponentParams: (componentId: string, patch: Record<string, PrimitiveValue>) => void
  startWire: (endpoint: WireEndpoint) => void
  updateDraftPointer: (point: Point | null) => void
  finishWire: (endpoint: WireEndpoint) => void
  cancelWire: () => void
  runSimulation: () => void
  clearSimulation: () => void
  loadSample: (sampleId: string) => void
  loadSavedCircuit: (circuitId: string) => void
  saveCurrentCircuit: (name?: string) => void
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
  const mountedRef = useRef(false)

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
    setState((prev) => ({
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
    setState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        board: {
          ...prev.currentCircuit.board,
          showGrid: !prev.currentCircuit.board.showGrid,
        },
      }),
    }))
  }

  const setPlacementMode = (mode: CircuitDocument['board']['placementMode']) => {
    setState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        board: {
          ...prev.currentCircuit.board,
          placementMode: mode,
        },
      }),
    }))
  }

  const addComponent = (typeId: string, position: Point) => {
    setState((prev) => {
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
    })
  }

  const setSelection = (selection: SelectionState) => {
    setState((prev) => ({ ...prev, selection }))
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

    setState((prev) => ({
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
    }))
  }

  const rotateSelected = () => {
    setState((prev) => ({
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
    }))
  }

  const flipSelected = () => {
    setState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        components: prev.currentCircuit.components.map((component) =>
          prev.selection.componentIds.includes(component.id)
            ? { ...component, flipX: !component.flipX }
            : component,
        ),
      }),
    }))
  }

  const deleteSelection = () => {
    setState((prev) => ({
      ...prev,
      currentCircuit: removeComponentsFromCircuit(prev.currentCircuit, prev.selection),
      selection: { componentIds: [], wireIds: [] },
      draftWire: null,
    }))
  }

  const removeWire = (wireId: string) => {
    setState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        wires: prev.currentCircuit.wires.filter((wire) => wire.id !== wireId),
      }),
      selection: {
        componentIds: prev.selection.componentIds,
        wireIds: prev.selection.wireIds.filter((id) => id !== wireId),
      },
    }))
  }

  const updateComponentParams = (componentId: string, patch: Record<string, PrimitiveValue>) => {
    setState((prev) => ({
      ...prev,
      currentCircuit: stampCircuit({
        ...prev.currentCircuit,
        components: prev.currentCircuit.components.map((component) =>
          component.id === componentId
            ? { ...component, params: { ...component.params, ...patch } }
            : component,
        ),
      }),
    }))
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
    setState((prev) => {
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
    })
  }

  const cancelWire = () => {
    setState((prev) => ({
      ...prev,
      draftWire: null,
    }))
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

    setState((prev) => ({
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
    }))
  }

  const loadSavedCircuit = (circuitId: string) => {
    setState((prev) => {
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
    })
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
  }

  const duplicateCurrentCircuit = (name?: string) => {
    setState((prev) => {
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
    })
  }

  const resetCurrentCircuit = () => {
    setState((prev) => {
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
    })
  }

  const openBlankSandbox = () => {
    const blank = createBlankCircuit()
    setState((prev) => ({
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
    }))
  }

  const importCircuit = (circuit: CircuitDocument) => {
    const imported = stampCircuit({
      ...structuredClone(circuit),
      id: circuit.id || createId('imported-circuit'),
      name: circuit.name || 'Imported Circuit',
    })

    setState((prev) => ({
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
    }))
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
        setActiveSection,
        setWorkspace,
        setInspectorTab,
        setBottomPanelTab,
        setBoardViewport,
        toggleGrid,
        setPlacementMode,
        addComponent,
        setSelection,
        selectComponent,
        selectWire,
        clearSelection,
        moveComponents,
        rotateSelected,
        flipSelected,
        deleteSelection,
        removeWire,
        updateComponentParams,
        startWire,
        updateDraftPointer,
        finishWire,
        cancelWire,
        runSimulation,
        clearSimulation,
        loadSample,
        loadSavedCircuit,
        saveCurrentCircuit,
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
