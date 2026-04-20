import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'

import type { CanvasGroupFlowNode } from './types'

const sideHandles = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const

export const CanvasGroupNode = ({ data, selected }: NodeProps<CanvasGroupFlowNode>) => (
  <div
    className={`obsidian-group${selected ? ' is-selected' : ''}`}
    style={{ ['--canvas-card-accent' as string]: data.accent }}
  >
    <NodeResizer
      isVisible={selected}
      minWidth={220}
      minHeight={160}
      lineClassName="obsidian-card__resizer-line"
      handleClassName="obsidian-card__resizer-handle"
    />

    {sideHandles.map((handle) => (
      <Handle
        key={`group-target-${handle.id}`}
        id={`${handle.id}-target`}
        type="target"
        position={handle.position}
        className={`obsidian-card__handle obsidian-card__handle--${handle.id}`}
      />
    ))}

    {sideHandles.map((handle) => (
      <Handle
        key={`group-source-${handle.id}`}
        id={`${handle.id}-source`}
        type="source"
        position={handle.position}
        className={`obsidian-card__handle obsidian-card__handle--${handle.id}`}
      />
    ))}

    <div className="obsidian-group__header">
      <input
        className="obsidian-group__label"
        value={data.record.label ?? ''}
        onChange={(event) => data.onLabelChange(data.record.id, event.target.value)}
      />
    </div>
  </div>
)
