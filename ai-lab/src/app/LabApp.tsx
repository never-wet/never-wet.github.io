import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { InspectorPanel } from '../components/InspectorPanel'
import { SectionErrorBoundary } from '../components/SectionErrorBoundary'
import { TopToolbar } from '../components/TopToolbar'
import { WorkspaceSidebar } from '../components/WorkspaceSidebar'
import { uiManifest } from '../memory/uiManifest'
import { createDefaultWorkspaceState } from '../memory/defaultState'
import { normalizeImportedWorkspace } from '../memory/saveSchema'
import { useLabStore } from '../state/useLabStore'
import { downloadWorkspace, readWorkspaceFile, saveWorkspaceSnapshot } from '../utils/persistence'
import { ForceGraphPanel } from '../graph/ForceGraphPanel'

const BuilderCanvas = lazy(async () => import('../builder/BuilderCanvas').then((module) => ({ default: module.BuilderCanvas })))
const TrainingConsole = lazy(async () => import('../training/TrainingConsole').then((module) => ({ default: module.TrainingConsole })))
const NotesWorkbenchLazy = lazy(async () => import('../notes/NotesWorkbench').then((module) => ({ default: module.NotesWorkbench })))
const WorkspacePanel = lazy(async () => import('../components/WorkspacePanel').then((module) => ({ default: module.WorkspacePanel })))

export const LabApp = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    mode,
    nodes,
    links,
    notes,
    datasets,
    experiments,
    models,
    results,
    builder,
    training,
    ui,
    lastSavedAt,
    saveVersion,
    getWorkspaceData,
    importWorkspace,
    resetWorkspace,
    setMode,
    setSearchQuery,
    setBottomTab,
    setShowLabels,
    setShowOnlyConnected,
  } = useLabStore(
    useShallow((state) => ({
      mode: state.mode,
      nodes: state.nodes,
      links: state.links,
      notes: state.notes,
      datasets: state.datasets,
      experiments: state.experiments,
      models: state.models,
      results: state.results,
      builder: state.builder,
      training: state.training,
      ui: state.ui,
      lastSavedAt: state.lastSavedAt,
      saveVersion: state.saveVersion,
      getWorkspaceData: state.getWorkspaceData,
      importWorkspace: state.importWorkspace,
      resetWorkspace: state.resetWorkspace,
      setMode: state.setMode,
      setSearchQuery: state.setSearchQuery,
      setBottomTab: state.setBottomTab,
      setShowLabels: state.setShowLabels,
      setShowOnlyConnected: state.setShowOnlyConnected,
    })),
  )

  const workspaceForAutosave = useMemo(
    () => ({
      mode,
      nodes,
      links,
      notes,
      datasets,
      experiments,
      models,
      results,
      builder,
      training,
      ui: {
        activeBottomTab: ui.activeBottomTab,
        activeInspectorTab: ui.activeInspectorTab,
        selectedNodeId: ui.selectedNodeId,
        focusedNodeId: ui.focusedNodeId,
        searchQuery: ui.searchQuery,
        categoryFilters: ui.categoryFilters,
        showLabels: ui.showLabels,
        showOnlyConnected: ui.showOnlyConnected,
        leftPanelCollapsed: ui.leftPanelCollapsed,
        rightPanelCollapsed: ui.rightPanelCollapsed,
      },
      lastSavedAt,
      saveVersion,
    }),
    [
      mode,
      nodes,
      links,
      notes,
      datasets,
      experiments,
      models,
      results,
      builder,
      training,
      ui.activeBottomTab,
      ui.activeInspectorTab,
      ui.selectedNodeId,
      ui.focusedNodeId,
      ui.searchQuery,
      ui.categoryFilters,
      ui.showLabels,
      ui.showOnlyConnected,
      ui.leftPanelCollapsed,
      ui.rightPanelCollapsed,
      lastSavedAt,
      saveVersion,
    ],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveWorkspaceSnapshot(workspaceForAutosave)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [workspaceForAutosave])

  const activeWorkbench = () => {
    if (ui.activeBottomTab === 'builder') {
      return <BuilderCanvas />
    }

    if (ui.activeBottomTab === 'notes') {
      return <NotesWorkbenchLazy />
    }

    if (ui.activeBottomTab === 'workspace') {
      return (
        <WorkspacePanel
          onExport={() => downloadWorkspace(getWorkspaceData())}
          onImport={() => fileInputRef.current?.click()}
          onReset={resetWorkspace}
        />
      )
    }

    return <TrainingConsole />
  }

  return (
    <div className="lab-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          const payload = await readWorkspaceFile(file)
          const normalized = normalizeImportedWorkspace(
            payload,
            createDefaultWorkspaceState(),
          )
          importWorkspace(normalized)
          event.currentTarget.value = ''
        }}
      />

      <TopToolbar
        mode={mode}
        searchQuery={ui.searchQuery}
        showOnlyConnected={ui.showOnlyConnected}
        showLabels={ui.showLabels}
        lastSavedAt={lastSavedAt}
        onModeChange={setMode}
        onSearchChange={setSearchQuery}
        onExport={() => downloadWorkspace(getWorkspaceData())}
        onImport={() => fileInputRef.current?.click()}
        onReset={resetWorkspace}
        onToggleConnected={setShowOnlyConnected}
        onToggleLabels={setShowLabels}
      />

      <main className="lab-main">
        <WorkspaceSidebar />
        <SectionErrorBoundary
          title="Graph workspace failed to render"
          message="The 3D stage hit a local runtime issue. Reloading the graph should restore the workspace without dropping the rest of the app."
          resetLabel="Reload graph"
          onReset={() => window.location.reload()}
        >
          <ForceGraphPanel />
        </SectionErrorBoundary>
        <InspectorPanel />
      </main>

      <section className="workbench">
        <div className="workbench__tabs">
          {uiManifest.bottomTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={ui.activeBottomTab === tab.id ? 'is-active' : ''}
              onClick={() => setBottomTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.description}</small>
            </button>
          ))}
        </div>
        <div className="workbench__content">
          <SectionErrorBoundary
            title="Workbench tool crashed"
            message="The current tool panel failed, but the graph and workspace are still live. Switch back to the workspace tab to recover."
            resetLabel="Open workspace tab"
            onReset={() => setBottomTab('workspace')}
          >
            <Suspense fallback={<div className="loading-panel">Loading workspace tool...</div>}>
              {activeWorkbench()}
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </section>
    </div>
  )
}
