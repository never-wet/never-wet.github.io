import type { CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface BuilderBlockNodeData {
  label: string
  kind: string
  description: string
  color: string
}

export const BuilderBlockNode = ({ data, selected }: NodeProps) => {
  const payload = data as unknown as BuilderBlockNodeData

  return (
    <div
      className={`builder-node${selected ? ' is-selected' : ''}`}
      style={{ '--builder-node-accent': payload.color } as CSSProperties}
    >
      <Handle type="target" position={Position.Left} />
      <p className="builder-node__kind">{payload.kind}</p>
      <strong>{payload.label}</strong>
      <span>{payload.description}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
