import type { ExportEnvelope, WorkspaceStateData } from './types'

export const SAVE_SCHEMA_VERSION = 2

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const normalizeImportedWorkspace = (
  payload: unknown,
  fallback: WorkspaceStateData,
): WorkspaceStateData => {
  if (!isObject(payload)) {
    return fallback
  }

  const workspace =
    'workspace' in payload && isObject(payload.workspace)
      ? (payload.workspace as unknown as WorkspaceStateData)
      : (payload as unknown as WorkspaceStateData)

  const normalizedDatasets = Array.isArray(workspace.datasets)
    ? workspace.datasets.map((dataset) => {
        const fallbackDataset = fallback.datasets.find((entry) => entry.id === dataset.id)
        return {
          ...fallbackDataset,
          ...dataset,
          source: dataset.source ?? fallbackDataset?.source ?? 'preset',
          taskType:
            dataset.taskType ??
            fallbackDataset?.taskType ??
            (dataset.presetId === 'sine-lab' ? 'regression' : 'binary-classification'),
        }
      })
    : fallback.datasets

  return {
    ...fallback,
    ...workspace,
    canvas: workspace.canvas ?? fallback.canvas,
    builder: workspace.builder ?? fallback.builder,
    training: workspace.training ?? fallback.training,
    ui: {
      ...fallback.ui,
      ...(workspace.ui ?? {}),
      categoryFilters: {
        ...fallback.ui.categoryFilters,
        ...(workspace.ui?.categoryFilters ?? {}),
      },
    },
    nodes: Array.isArray(workspace.nodes) ? workspace.nodes : fallback.nodes,
    links: Array.isArray(workspace.links) ? workspace.links : fallback.links,
    notes: Array.isArray(workspace.notes) ? workspace.notes : fallback.notes,
    datasets: normalizedDatasets,
    experiments: Array.isArray(workspace.experiments)
      ? workspace.experiments
      : fallback.experiments,
    models: Array.isArray(workspace.models) ? workspace.models : fallback.models,
    results: Array.isArray(workspace.results) ? workspace.results : fallback.results,
    saveVersion: SAVE_SCHEMA_VERSION,
    lastSavedAt: new Date().toISOString(),
  }
}

export const wrapWorkspaceForExport = (workspace: WorkspaceStateData): ExportEnvelope => ({
  version: SAVE_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  workspace: {
    ...workspace,
    saveVersion: SAVE_SCHEMA_VERSION,
  },
})
