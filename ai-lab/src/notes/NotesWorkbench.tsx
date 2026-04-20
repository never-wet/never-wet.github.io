import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link2, NotebookPen, Plus } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { PanelFrame } from '../components/PanelFrame'
import { noteTemplates } from '../memory/noteTemplates'
import { TagPill } from '../components/TagPill'
import { useLabStore } from '../state/useLabStore'
import { formatTimestamp } from '../utils/format'

export const NotesWorkbench = () => {
  const {
    nodes,
    notes,
    selectedNodeId,
    selectNode,
    updateNote,
    createLinkedNote,
    linkNoteToNode,
    applyNoteTemplate,
  } = useLabStore(
    useShallow((state) => ({
      nodes: state.nodes,
      notes: state.notes,
      selectedNodeId: state.ui.selectedNodeId,
      selectNode: state.selectNode,
      updateNote: state.updateNote,
      createLinkedNote: state.createLinkedNote,
      linkNoteToNode: state.linkNoteToNode,
      applyNoteTemplate: state.applyNoteTemplate,
    })),
  )

  const selectedGraphNode = nodes.find((node) => node.id === selectedNodeId)
  const selectedNote =
    notes.find((note) => note.id === selectedGraphNode?.entityId) ?? notes[0]
  const selectedNoteNode = nodes.find(
    (node) => node.entityId === selectedNote?.id && node.category === 'note',
  )
  const backlinks = notes.filter((note) => note.linkedNoteIds.includes(selectedNote?.id ?? ''))

  if (!selectedNote) {
    return (
      <PanelFrame
        eyebrow="Notes"
        title="Research notes"
        subtitle="Create your first note to connect experiments, datasets, and models."
      >
        <button type="button" className="primary-button" onClick={() => createLinkedNote(selectedNodeId)}>
          <Plus size={16} />
          Create note
        </button>
      </PanelFrame>
    )
  }

  return (
    <PanelFrame
      eyebrow="Notes"
      title="Obsidian-like research notebook"
      subtitle="Markdown notes, backlinks, and graph links stay embedded in the AI workspace."
      className="notes-panel"
      actions={
        <button type="button" className="primary-button" onClick={() => createLinkedNote(selectedNodeId)}>
          <NotebookPen size={16} />
          New linked note
        </button>
      }
    >
      <div className="notes-layout">
        <aside className="notes-list">
          {notes.map((note) => {
            const node = nodes.find((entry) => entry.entityId === note.id && entry.category === 'note')
            return (
              <button
                key={note.id}
                type="button"
                className={`notes-list__item${note.id === selectedNote.id ? ' is-active' : ''}`}
                onClick={() => selectNode(node?.id)}
              >
                <strong>{note.title}</strong>
                <small>{formatTimestamp(note.updatedAt)}</small>
                <div className="tag-row">
                  {note.tags.slice(0, 3).map((tag) => (
                    <TagPill key={tag} label={tag} muted />
                  ))}
                </div>
              </button>
            )
          })}
        </aside>

        <section className="notes-editor">
          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Templates</p>
                <h3>Research note starters</h3>
              </div>
            </div>
            <div className="tag-row">
              {noteTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    applyNoteTemplate(selectedNote.id, template.id, selectedGraphNode?.id)
                  }
                >
                  {template.label}
                </button>
              ))}
            </div>
            <p className="muted-copy">
              Templates use the current graph selection as context, so you can turn a model,
              result, or experiment into a structured research note quickly.
            </p>
          </div>

          <label className="field-group">
            <span>Title</span>
            <input
              value={selectedNote.title}
              onChange={(event) =>
                updateNote(selectedNote.id, {
                  title: event.target.value,
                })
              }
            />
          </label>

          <label className="field-group">
            <span>Tags</span>
            <input
              value={selectedNote.tags.join(', ')}
              onChange={(event) =>
                updateNote(selectedNote.id, {
                  tags: event.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>

          <label className="field-group">
            <span>Markdown</span>
            <textarea
              rows={18}
              value={selectedNote.markdown}
              onChange={(event) =>
                updateNote(selectedNote.id, {
                  markdown: event.target.value,
                })
              }
            />
          </label>
        </section>

        <aside className="notes-preview">
          <div className="notes-preview__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (selectedGraphNode && selectedGraphNode.id !== selectedNoteNode?.id) {
                  linkNoteToNode(selectedNote.id, selectedGraphNode.id)
                }
              }}
            >
              <Link2 size={15} />
              Link selected graph item
            </button>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Preview</p>
                <h3>{selectedNote.title}</h3>
              </div>
            </div>
            <div className="markdown-surface">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedNote.markdown}
              </ReactMarkdown>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <div>
                <p className="section-kicker">Connections</p>
                <h3>Backlinks and linked entities</h3>
              </div>
            </div>
            <div className="tag-row">
              {selectedNote.linkedNodeIds.map((nodeId) => {
                const node = nodes.find((entry) => entry.id === nodeId)
                return <TagPill key={nodeId} label={node?.title ?? nodeId} />
              })}
            </div>
            <div className="tag-row">
              {backlinks.map((note) => (
                <TagPill key={note.id} label={`Backlink: ${note.title}`} muted />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </PanelFrame>
  )
}
