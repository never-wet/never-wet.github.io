import { useState } from 'react'
import { Layers3, NotebookPen, Orbit, TestTubeDiagonal } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { nodeCategoryVisuals } from '../memory/graphIndex'
import type { GraphNodeRecord, NodeCategory } from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { groupNodesByCategory } from '../utils/graph'
import { PanelFrame } from './PanelFrame'
import { StatCard } from './StatCard'
import { TagPill } from './TagPill'

const findNodeForEntity = (
  nodes: GraphNodeRecord[],
  entityId: string,
  category?: NodeCategory,
) =>
  nodes.find((node) => node.entityId === entityId && (category ? node.category === category : true))

type CollectionTab = 'notes' | 'datasets' | 'experiments'

export const WorkspaceSidebar = () => {
  const [activeCollection, setActiveCollection] = useState<CollectionTab>('notes')

  const {
    nodes,
    notes,
    datasets,
    experiments,
    models,
    ui,
    selectNode,
    toggleCategoryFilter,
    createLinkedNote,
  } = useLabStore(
    useShallow((state) => ({
      nodes: state.nodes,
      notes: state.notes,
      datasets: state.datasets,
      experiments: state.experiments,
      models: state.models,
      ui: state.ui,
      selectNode: state.selectNode,
      toggleCategoryFilter: state.toggleCategoryFilter,
      createLinkedNote: state.createLinkedNote,
    })),
  )

  const grouped = groupNodesByCategory(nodes)
  const collectionTabs = [
    {
      id: 'notes' as const,
      label: 'Notes',
      icon: Layers3,
      count: notes.length,
    },
    {
      id: 'datasets' as const,
      label: 'Datasets',
      icon: Orbit,
      count: datasets.length,
    },
    {
      id: 'experiments' as const,
      label: 'Experiments',
      icon: TestTubeDiagonal,
      count: experiments.length,
    },
  ]
  const activeCollectionMeta =
    collectionTabs.find((entry) => entry.id === activeCollection) ?? collectionTabs[0]
  const ActiveCollectionIcon = activeCollectionMeta.icon

  return (
    <aside className={`workspace-sidebar${ui.leftPanelCollapsed ? ' is-collapsed' : ''}`}>
      <PanelFrame
        eyebrow="Workspace Lens"
        title="Live graph overview"
        subtitle="Collections, filters, and quick note capture all stay tied to the 3D workspace."
      >
        <div className="stat-grid">
          <StatCard label="Nodes" value={String(nodes.length)} accent="#79d8ff" />
          <StatCard label="Notes" value={String(notes.length)} accent="#9fe9ff" />
          <StatCard label="Experiments" value={String(experiments.length)} accent="#ffb26b" />
          <StatCard label="Models" value={String(models.length)} accent="#c39eff" />
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => createLinkedNote(ui.selectedNodeId)}
        >
          <NotebookPen size={16} />
          Quick note from focus
        </button>
      </PanelFrame>

      <PanelFrame
        eyebrow="Filters"
        title="Graph categories"
        subtitle="Toggle clusters on and off without losing the relationship map."
      >
        <div className="filter-list">
          {(Object.keys(nodeCategoryVisuals) as NodeCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-chip${ui.categoryFilters[category] ? ' is-active' : ''}`}
              onClick={() => toggleCategoryFilter(category)}
            >
              <span
                className="filter-chip__dot"
                style={{ background: nodeCategoryVisuals[category].color }}
              />
              <span>{nodeCategoryVisuals[category].label}</span>
              <TagPill label={String(grouped[category].length)} muted />
            </button>
          ))}
        </div>
      </PanelFrame>

      <PanelFrame
        eyebrow="Collections"
        title="Linked workspace items"
        subtitle="Every list item is a graph node you can jump to."
      >
        <div className="collection-switcher" role="tablist" aria-label="Linked workspace collections">
          {collectionTabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={activeCollection === entry.id}
              className={activeCollection === entry.id ? 'is-active' : ''}
              onClick={() => setActiveCollection(entry.id)}
            >
              <span>{entry.label}</span>
              <small>{entry.count}</small>
            </button>
          ))}
        </div>

        <div className="collection-scroll">
          <div className="collection-scroll__header">
            <div className="collection-block__heading">
              <ActiveCollectionIcon size={15} />
              {activeCollectionMeta.label}
            </div>
            <TagPill label={String(activeCollectionMeta.count)} muted />
          </div>

          {activeCollection === 'notes' ? (
            notes.length > 0 ? (
              notes.map((note) => {
                const node = findNodeForEntity(nodes, note.id, 'note')
                return (
                  <button
                    key={note.id}
                    type="button"
                    className="collection-item"
                    title={note.title}
                    onClick={() => selectNode(node?.id)}
                  >
                    <span>{note.title}</span>
                    <small>{note.tags.join(' / ')}</small>
                  </button>
                )
              })
            ) : (
              <p className="collection-empty">No notes yet.</p>
            )
          ) : null}

          {activeCollection === 'datasets' ? (
            datasets.length > 0 ? (
              datasets.map((dataset) => {
                const node = findNodeForEntity(nodes, dataset.id, 'dataset')
                return (
                  <button
                    key={dataset.id}
                    type="button"
                    className="collection-item"
                    title={dataset.title}
                    onClick={() => selectNode(node?.id)}
                  >
                    <span>{dataset.title}</span>
                    <small>{dataset.targetField} target</small>
                  </button>
                )
              })
            ) : (
              <p className="collection-empty">No datasets yet.</p>
            )
          ) : null}

          {activeCollection === 'experiments' ? (
            experiments.length > 0 ? (
              experiments.map((experiment) => {
                const node = findNodeForEntity(nodes, experiment.id, 'experiment')
                return (
                  <button
                    key={experiment.id}
                    type="button"
                    className="collection-item"
                    title={experiment.title}
                    onClick={() => selectNode(node?.id)}
                  >
                    <span>{experiment.title}</span>
                    <small>{experiment.status}</small>
                  </button>
                )
              })
            ) : (
              <p className="collection-empty">No experiments yet.</p>
            )
          ) : null}
        </div>
      </PanelFrame>
    </aside>
  )
}
