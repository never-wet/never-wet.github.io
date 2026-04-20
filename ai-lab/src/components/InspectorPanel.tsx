import { ArrowRight, Link2, NotebookPen, Sigma, TestTubeDiagonal } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { nodeTypeIndex } from '../memory/nodeTypeIndex'
import type { GraphNodeRecord } from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { formatMetric, formatPercent } from '../utils/format'
import { PanelFrame } from './PanelFrame'
import { TagPill } from './TagPill'

const metricContent = (node?: GraphNodeRecord, metrics?: { loss?: number; accuracy?: number }) => {
  if (!node || !metrics) {
    return <p className="muted-copy">No stored metrics for the current selection yet.</p>
  }

  return (
    <div className="metric-list">
      <div className="metric-row">
        <span>Loss</span>
        <strong>{formatMetric(metrics.loss)}</strong>
      </div>
      <div className="metric-row">
        <span>Accuracy</span>
        <strong>{formatPercent(metrics.accuracy)}</strong>
      </div>
    </div>
  )
}

export const InspectorPanel = () => {
  const {
    nodes,
    links,
    notes,
    datasets,
    experiments,
    models,
    results,
    ui,
    setBottomTab,
    setInspectorTab,
    createLinkedNote,
    loadModelIntoBuilder,
  } = useLabStore(
    useShallow((state) => ({
      nodes: state.nodes,
      links: state.links,
      notes: state.notes,
      datasets: state.datasets,
      experiments: state.experiments,
      models: state.models,
      results: state.results,
      ui: state.ui,
      setBottomTab: state.setBottomTab,
      setInspectorTab: state.setInspectorTab,
      createLinkedNote: state.createLinkedNote,
      loadModelIntoBuilder: state.loadModelIntoBuilder,
    })),
  )

  const selectedNode = nodes.find((node) => node.id === ui.selectedNodeId) ?? nodes[0]
  const selectedType = selectedNode ? nodeTypeIndex[selectedNode.category] : undefined
  const relatedLinks = selectedNode
    ? links.filter((link) => link.source === selectedNode.id || link.target === selectedNode.id)
    : []
  const connectedNodes = relatedLinks
    .map((link) => nodes.find((entry) => entry.id === (link.source === selectedNode.id ? link.target : link.source)))
    .filter((entry): entry is GraphNodeRecord => Boolean(entry))

  const note = notes.find((entry) => entry.id === selectedNode?.entityId)
  const dataset = datasets.find((entry) => entry.id === selectedNode?.entityId)
  const experiment = experiments.find((entry) => entry.id === selectedNode?.entityId)
  const model = models.find((entry) => entry.id === selectedNode?.entityId)
  const result = results.find((entry) => entry.id === selectedNode?.entityId)

  return (
    <aside className={`inspector-panel${ui.rightPanelCollapsed ? ' is-collapsed' : ''}`}>
      <PanelFrame
        eyebrow="Inspector"
        title={selectedNode?.title ?? 'No selection'}
        subtitle={selectedType?.description ?? 'Click a node in the graph to inspect its connections.'}
        actions={
          selectedType ? (
            <button
              type="button"
              className="toolbar-button"
              onClick={() => setBottomTab(selectedType.defaultBottomTab)}
            >
              {selectedType.quickActionLabel}
              <ArrowRight size={14} />
            </button>
          ) : null
        }
      >
        {selectedNode ? (
          <>
            <div className="inspector-tabbar">
              {(['overview', 'connections', 'metrics'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={ui.activeInspectorTab === tab ? 'is-active' : ''}
                  onClick={() => setInspectorTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {ui.activeInspectorTab === 'overview' ? (
              <div className="inspector-section">
                <p>{selectedNode.summary}</p>
                <div className="tag-row">
                  {selectedNode.tags.map((tag) => (
                    <TagPill key={tag} label={tag} />
                  ))}
                </div>
                {note ? (
                  <div className="inspector-entity">
                    <h3>Note preview</h3>
                    <p>{note.markdown.slice(0, 180)}...</p>
                  </div>
                ) : null}
                {dataset ? (
                  <div className="inspector-entity">
                    <h3>Dataset schema</h3>
                    <div className="tag-row">
                      {dataset.schema.map((field) => (
                        <TagPill key={field} label={field} muted />
                      ))}
                    </div>
                  </div>
                ) : null}
                {experiment ? (
                  <div className="inspector-entity">
                    <h3>Experiment</h3>
                    <p>{experiment.description}</p>
                  </div>
                ) : null}
                {model ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => loadModelIntoBuilder(model.id)}
                  >
                    Load model into builder
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => createLinkedNote(selectedNode.id)}
                >
                  <NotebookPen size={15} />
                  Create linked note
                </button>
              </div>
            ) : null}

            {ui.activeInspectorTab === 'connections' ? (
              <div className="inspector-section">
                <div className="connection-header">
                  <Link2 size={15} />
                  <span>{selectedType?.relationHint}</span>
                </div>
                <div className="connection-list">
                  {relatedLinks.length === 0 ? (
                    <p className="muted-copy">This node does not have visible links in the current filter set.</p>
                  ) : (
                    relatedLinks.map((link) => {
                      const otherId =
                        link.source === selectedNode.id ? link.target : link.source
                      const other = nodes.find((entry) => entry.id === otherId)
                      return (
                        <div key={link.id} className="connection-item">
                          <strong>{link.relation}</strong>
                          <span>{other?.title ?? otherId}</span>
                        </div>
                      )
                    })
                  )}
                </div>
                {note ? (
                  <div className="inspector-entity">
                    <h3>Backlinks</h3>
                    <div className="tag-row">
                      {note.linkedNodeIds.map((linkedId) => {
                        const linkedNode = nodes.find((entry) => entry.id === linkedId)
                        return <TagPill key={linkedId} label={linkedNode?.title ?? linkedId} muted />
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {ui.activeInspectorTab === 'metrics' ? (
              <div className="inspector-section">
                <div className="metric-group">
                  <div className="metric-group__header">
                    <Sigma size={15} />
                    <span>Stored metrics</span>
                  </div>
                  {metricContent(selectedNode, model?.metrics ?? result?.metrics)}
                </div>
                <div className="metric-group">
                  <div className="metric-group__header">
                    <TestTubeDiagonal size={15} />
                    <span>Visible neighbors</span>
                  </div>
                  <div className="tag-row">
                    {connectedNodes.map((node) => (
                      <TagPill key={node.id} label={node.title} muted />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="muted-copy">Select a node to inspect it.</p>
        )}
      </PanelFrame>
    </aside>
  )
}
