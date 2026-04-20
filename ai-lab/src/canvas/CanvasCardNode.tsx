import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { FileText, FolderKanban, Globe2, StickyNote } from 'lucide-react'

import type { CanvasCardFlowNode } from './types'

const sideHandles = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const

export const CanvasCardNode = ({ data, selected }: NodeProps<CanvasCardFlowNode>) => (
  <div
    className={`obsidian-card obsidian-card--${data.record.type}${selected ? ' is-selected' : ''}`}
    style={{ ['--canvas-card-accent' as string]: data.accent }}
    onDoubleClick={() => data.onOpen?.(data.record)}
  >
    <NodeResizer
      isVisible={selected}
      minWidth={180}
      minHeight={120}
      lineClassName="obsidian-card__resizer-line"
      handleClassName="obsidian-card__resizer-handle"
    />

    {sideHandles.map((handle) => (
      <Handle
        key={`target-${handle.id}`}
        id={`${handle.id}-target`}
        type="target"
        position={handle.position}
        className={`obsidian-card__handle obsidian-card__handle--${handle.id}`}
      />
    ))}

    {sideHandles.map((handle) => (
      <Handle
        key={`source-${handle.id}`}
        id={`${handle.id}-source`}
        type="source"
        position={handle.position}
        className={`obsidian-card__handle obsidian-card__handle--${handle.id}`}
      />
    ))}

    <div className="obsidian-card__chrome">
      <div className="obsidian-card__eyebrow">
        <span className="obsidian-card__eyebrow-icon" aria-hidden="true">
          {data.record.type === 'text' ? (
            <StickyNote size={12} />
          ) : data.record.type === 'link' ? (
            <Globe2 size={12} />
          ) : data.record.entityKind === 'experiment' ? (
            <FolderKanban size={12} />
          ) : (
            <FileText size={12} />
          )}
        </span>
        <span>{data.eyebrow}</span>
      </div>
      <div className="obsidian-card__title">{data.title}</div>
      {data.detail ? <div className="obsidian-card__detail">{data.detail}</div> : null}
    </div>

    {data.record.type === 'text' ? (
      <textarea
        className="obsidian-card__textarea"
        value={data.record.text ?? ''}
        onChange={(event) => data.onTextChange?.(data.record.id, event.target.value)}
      />
    ) : (
      <div className="obsidian-card__body">{data.body}</div>
    )}
  </div>
)
