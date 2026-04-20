import type { Node } from '@xyflow/react'

import type { CanvasColor, CanvasNodeRecord } from '../memory/types'

export interface CanvasNodeData {
  [key: string]: unknown
  record: CanvasNodeRecord
  title: string
  eyebrow: string
  detail?: string
  body?: string
  accent: string
  onTextChange?: (nodeId: string, nextText: string) => void
  onOpen?: (record: CanvasNodeRecord) => void
}

export interface CanvasGroupData {
  [key: string]: unknown
  record: CanvasNodeRecord
  accent: string
  onLabelChange: (nodeId: string, nextLabel: string) => void
  onColorChange: (nodeId: string, nextColor: CanvasColor) => void
}

export type CanvasCardFlowNode = Node<CanvasNodeData, 'canvasCard'>

export type CanvasGroupFlowNode = Node<CanvasGroupData, 'canvasGroup'>
