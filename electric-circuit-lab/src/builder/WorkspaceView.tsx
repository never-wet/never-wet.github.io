import { useEffect, useRef } from 'react'
import { componentRegistry } from '../memory/contentRegistry'
import { uiManifest } from '../memory/uiManifest'
import { exportCircuitJson, parseImportedCircuit } from '../state/persistence'
import { useCircuitLab } from '../state/CircuitLabContext'
import { formatNumber } from '../utils/format'
import { CircuitBoard } from './CircuitBoard'
import { ComponentPalette } from './ComponentPalette'
import { InspectorPanel } from './InspectorPanel'
import { SignalMonitor } from './SignalMonitor'

const quickAddComponentIds = [
  'battery',
  'switch',
  'resistor',
  'led',
  'ground',
  'lamp',
  'capacitor',
  'inductor',
  'and-gate',
  'output-indicator',
] as const

export const WorkspaceView = () => {
  const {
    state,
    setWorkspace,
    setPlacementMode,
    toggleGrid,
    addComponent,
    runSimulation,
    clearSimulation,
    saveCurrentCircuit,
    duplicateCurrentCircuit,
    resetCurrentCircuit,
    openBlankSandbox,
    importCircuit,
    toggleSimulationPreference,
    deleteSelection,
  } = useCircuitLab()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && (state.selection.componentIds.length || state.selection.wireIds.length)) {
        event.preventDefault()
        deleteSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteSelection, state.selection.componentIds.length, state.selection.wireIds.length])

  const handleSave = () => {
    const name = window.prompt('Save this circuit as', state.currentCircuit.name)
    if (name !== null) {
      saveCurrentCircuit(name)
    }
  }

  const handleDuplicate = () => {
    const name = window.prompt('Duplicate circuit as', `${state.currentCircuit.name} Copy`)
    if (name !== null) {
      duplicateCurrentCircuit(name)
    }
  }

  const handleExport = () => {
    const blob = new Blob([exportCircuitJson(state.currentCircuit)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${state.currentCircuit.name.replace(/\s+/g, '-').toLowerCase() || 'circuit'}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const addAtCenter = (typeId: string) => {
    addComponent(typeId, {
      x: (420 - state.currentCircuit.board.pan.x) / state.currentCircuit.board.zoom,
      y: (220 - state.currentCircuit.board.pan.y) / state.currentCircuit.board.zoom,
    })
  }

  const loopStateLabel = state.simulationResult
    ? state.simulationResult.isClosedCircuit
      ? 'Closed loop'
      : 'Open loop'
    : 'Ready'

  return (
    <section className="workspace-stack studio-workspace">
      <div className="workspace-layout studio-layout">
        <ComponentPalette onAddAtCenter={addAtCenter} />
        <InspectorPanel />

        <section className="stage-panel">
          <div className="stage-panel-header">
            <div className="stage-panel-copy">
              <span className="eyebrow">Circuit</span>
              <h2>{state.currentCircuit.name}</h2>
              <p>{state.currentCircuit.description}</p>
            </div>

            <div className="stage-panel-actions">
              <button className="ghost-button" onClick={handleDuplicate} type="button">
                Save a copy
              </button>
              <button className="ghost-button" onClick={() => fileInputRef.current?.click()} type="button">
                Import JSON
              </button>
              <button className="ghost-button" onClick={handleExport} type="button">
                Export JSON
              </button>
            </div>
          </div>

          <div className="stage-toolbar">
            <div className="stage-toolbar-group">
              {uiManifest.workspaceModes.map((mode) => (
                <button
                  key={mode.id}
                  className={state.ui.activeWorkspace === mode.id ? 'nav-pill is-active' : 'nav-pill'}
                  onClick={() => setWorkspace(mode.id)}
                  type="button"
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="stage-toolbar-group stage-toolbar-group-tools">
              {quickAddComponentIds.map((typeId) => (
                <button className="quick-tool" key={typeId} onClick={() => addAtCenter(typeId)} type="button">
                  <span className="quick-tool-label">{componentRegistry[typeId].shortName}</span>
                  <span className="quick-tool-meta">{componentRegistry[typeId].name}</span>
                </button>
              ))}
            </div>

            <div className="stage-toolbar-group">
              <button
                className={state.currentCircuit.board.placementMode === 'grid' ? 'nav-pill is-active' : 'nav-pill'}
                onClick={() => setPlacementMode('grid')}
                type="button"
              >
                Grid snap
              </button>
              <button
                className={state.currentCircuit.board.placementMode === 'freeform' ? 'nav-pill is-active' : 'nav-pill'}
                onClick={() => setPlacementMode('freeform')}
                type="button"
              >
                Freeform
              </button>
              <button className="ghost-button" onClick={toggleGrid} type="button">
                {state.currentCircuit.board.showGrid ? 'Hide grid' : 'Show grid'}
              </button>
              <button className="ghost-button" onClick={() => toggleSimulationPreference('autoRun')} type="button">
                Auto run {state.simulationPreferences.autoRun ? 'on' : 'off'}
              </button>
              <button className="ghost-button" onClick={() => toggleSimulationPreference('highlightCurrent')} type="button">
                Atom motion {state.simulationPreferences.highlightCurrent ? 'on' : 'off'}
              </button>
            </div>
          </div>

          <SignalMonitor circuit={state.currentCircuit} simulationResult={state.simulationResult} />
          <CircuitBoard />

          <div className="stage-statusbar">
            <div className="workspace-meta-grid">
              <div className="meta-stat">
                <span>State</span>
                <strong>{loopStateLabel}</strong>
              </div>
              <div className="meta-stat">
                <span>Components</span>
                <strong>{state.currentCircuit.components.length}</strong>
              </div>
              <div className="meta-stat">
                <span>Wires</span>
                <strong>{state.currentCircuit.wires.length}</strong>
              </div>
              <div className="meta-stat">
                <span>Current</span>
                <strong>{formatNumber(state.simulationResult?.estimatedCurrent ?? 0, 3)} A</strong>
              </div>
            </div>

            <div className="stage-toolbar-group">
              <button className="primary-button" onClick={runSimulation} type="button">
                Run
              </button>
              <button className="ghost-button" onClick={clearSimulation} type="button">
                Clear
              </button>
              <button className="ghost-button" onClick={handleSave} type="button">
                Save
              </button>
              <button className="ghost-button" onClick={resetCurrentCircuit} type="button">
                Reset
              </button>
              <button className="ghost-button" onClick={openBlankSandbox} type="button">
                Blank sandbox
              </button>
              {(state.selection.componentIds.length > 0 || state.selection.wireIds.length > 0) && (
                <button className="ghost-button danger" onClick={deleteSelection} type="button">
                  Delete selection
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <input
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          try {
            const raw = await file.text()
            importCircuit(parseImportedCircuit(raw))
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Unable to import circuit JSON.')
          } finally {
            event.target.value = ''
          }
        }}
        ref={fileInputRef}
        type="file"
      />
    </section>
  )
}
