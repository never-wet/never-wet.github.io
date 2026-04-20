import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  Position,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  useReactFlow,
} from '@xyflow/react'
import {
  Copy,
  Download,
  FilePlus2,
  FileUp,
  Focus,
  Globe,
  Layers3,
  Link2,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import '@xyflow/react/dist/style.css'
import { useShallow } from 'zustand/react/shallow'

import { PanelFrame } from '../components/PanelFrame'
import { TagPill } from '../components/TagPill'
import { canvasColorPresets, canvasManifest } from '../memory/canvasManifest'
import type {
  CanvasColor,
  CanvasEdgeRecord,
  CanvasNodeRecord,
  CanvasSide,
  CanvasState,
} from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { formatMetric, formatPercent } from '../utils/format'
import {
  canvasDocumentFromState,
  createCanvasEntityNode,
  createCanvasGroupNode,
  createCanvasLinkNode,
  createCanvasTextNode,
  duplicateCanvasNode,
  getCanvasCardTitle,
  getCanvasEntityOptions,
  getSelectionBounds,
  resolveCanvasColor,
} from '../utils/canvas'
import { CanvasCardNode } from './CanvasCardNode'
import { CanvasGroupNode } from './CanvasGroupNode'
import type {
  CanvasCardFlowNode,
  CanvasGroupData,
  CanvasGroupFlowNode,
  CanvasNodeData,
} from './types'

const canvasNodeTypes: NodeTypes = {
  canvasCard: CanvasCardNode,
  canvasGroup: CanvasGroupNode,
}

const colorOptions = [
  { label: 'Default', value: '#101923' },
  ...Object.entries(canvasColorPresets).map(([value, hex]) => ({
    label: `${value} - ${hex}`,
    value,
  })),
] as const

const positionBySide: Record<CanvasSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
}

const createId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`

const canvasTitleFromFile = (fileName: string) => {
  const title = fileName
    .replace(/\.canvas$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()

  return title || 'Imported Canvas'
}

const sideFromHandle = (handleId?: string | null): CanvasSide | undefined => {
  if (!handleId) {
    return undefined
  }

  const [side] = handleId.split('-')
  return side === 'top' || side === 'right' || side === 'bottom' || side === 'left'
    ? side
    : undefined
}

const syncCanvasNodesFromFlow = (
  currentNodes: CanvasNodeRecord[],
  flowNodes: Node[],
): CanvasNodeRecord[] =>
  flowNodes.flatMap((flowNode) => {
    const current = currentNodes.find((node) => node.id === flowNode.id)

    if (!current) {
      return []
    }

    return [
      {
        ...current,
        x: Math.round(flowNode.position.x),
        y: Math.round(flowNode.position.y),
        width: Math.round(flowNode.width ?? current.width),
        height: Math.round(flowNode.height ?? current.height),
      },
    ]
  })

const mergeCanvasEdges = (
  flowEdges: Edge[],
  currentEdges: CanvasEdgeRecord[],
): CanvasEdgeRecord[] =>
  flowEdges.map((edge) => {
    const current = currentEdges.find((entry) => entry.id === edge.id)

    return {
      id: edge.id,
      fromNode: String(edge.source),
      toNode: String(edge.target),
      fromSide: sideFromHandle(edge.sourceHandle) ?? current?.fromSide ?? 'right',
      toSide: sideFromHandle(edge.targetHandle) ?? current?.toSide ?? 'left',
      fromEnd: current?.fromEnd ?? 'none',
      toEnd: current?.toEnd ?? 'arrow',
      color:
        typeof edge.style?.stroke === 'string'
          ? (edge.style.stroke as CanvasColor)
          : current?.color ?? '#4d87a8',
      label: typeof edge.label === 'string' ? edge.label : current?.label,
    }
  })

const sameCanvasNodes = (left: CanvasNodeRecord[], right: CanvasNodeRecord[]) =>
  left.length === right.length &&
  left.every((node, index) => {
    const other = right[index]

    return (
      other !== undefined &&
      node.id === other.id &&
      node.x === other.x &&
      node.y === other.y &&
      node.width === other.width &&
      node.height === other.height &&
      node.text === other.text &&
      node.label === other.label &&
      node.url === other.url &&
      node.color === other.color &&
      node.zIndex === other.zIndex
    )
  })

const sameCanvasEdges = (left: CanvasEdgeRecord[], right: CanvasEdgeRecord[]) =>
  left.length === right.length &&
  left.every((edge, index) => {
    const other = right[index]

    return (
      other !== undefined &&
      edge.id === other.id &&
      edge.fromNode === other.fromNode &&
      edge.toNode === other.toNode &&
      edge.fromSide === other.fromSide &&
      edge.toSide === other.toSide &&
      edge.label === other.label &&
      edge.color === other.color
    )
  })

type CanvasRecordLookup = {
  notes: ReturnType<typeof useCanvasRecords>['notes']
  datasets: ReturnType<typeof useCanvasRecords>['datasets']
  experiments: ReturnType<typeof useCanvasRecords>['experiments']
  models: ReturnType<typeof useCanvasRecords>['models']
  results: ReturnType<typeof useCanvasRecords>['results']
}

const describeCanvasNode = (record: CanvasNodeRecord, records: CanvasRecordLookup) => {
  if (record.type === 'text') {
    return {
      title: getCanvasCardTitle(record, records),
      eyebrow: 'Text card',
      detail: 'Markdown-ready scratch space',
      body: undefined,
    }
  }

  if (record.type === 'group') {
    return {
      title: record.label ?? 'Group',
      eyebrow: 'Group',
      detail: undefined,
      body: undefined,
    }
  }

  if (record.type === 'link') {
    let host = 'Web card'

    try {
      host = record.url ? new URL(record.url).hostname : host
    } catch {
      host = record.url ?? host
    }

    return {
      title: host,
      eyebrow: 'Web page',
      detail: record.url,
      body: 'External reference card for research, docs, and live demos.',
    }
  }

  if (record.entityKind === 'note') {
    const note = records.notes.find((entry) => entry.id === record.entityId)
    return {
      title: note?.title ?? record.file ?? 'Note card',
      eyebrow: 'Note',
      detail: record.file,
      body: note?.markdown.slice(0, 180) ?? 'Linked note card.',
    }
  }

  if (record.entityKind === 'dataset') {
    const dataset = records.datasets.find((entry) => entry.id === record.entityId)
    return {
      title: dataset?.title ?? record.file ?? 'Dataset card',
      eyebrow: 'Dataset',
      detail: record.file,
      body: dataset
        ? `${dataset.description}\nTarget field: ${dataset.targetField}`
        : 'Linked dataset card.',
    }
  }

  if (record.entityKind === 'experiment') {
    const experiment = records.experiments.find((entry) => entry.id === record.entityId)
    return {
      title: experiment?.title ?? record.file ?? 'Experiment card',
      eyebrow: 'Experiment',
      detail: record.file,
      body: experiment?.description ?? 'Linked experiment card.',
    }
  }

  if (record.entityKind === 'model') {
    const model = records.models.find((entry) => entry.id === record.entityId)
    return {
      title: model?.title ?? record.file ?? 'Model card',
      eyebrow: 'Model',
      detail: record.file,
      body: model?.metrics
        ? `Accuracy ${formatPercent(model.metrics.accuracy)} - Loss ${formatMetric(model.metrics.loss)}`
        : model?.description ?? 'Linked model card.',
    }
  }

  if (record.entityKind === 'result') {
    const result = records.results.find((entry) => entry.id === record.entityId)
    return {
      title: result?.title ?? record.file ?? 'Result card',
      eyebrow: 'Result',
      detail: record.file,
      body: result?.observations[0] ?? 'Linked result card.',
    }
  }

  return {
    title: record.file ?? 'File card',
    eyebrow: 'File',
    detail: record.file,
    body: 'Imported file-style canvas card.',
  }
}

const useCanvasRecords = () =>
  useLabStore(
    useShallow((state) => ({
      notes: state.notes,
      datasets: state.datasets,
      experiments: state.experiments,
      models: state.models,
      results: state.results,
      graphNodes: state.nodes,
      canvas: state.canvas,
      setCanvasState: state.setCanvasState,
      selectNode: state.selectNode,
      setBottomTab: state.setBottomTab,
    })),
  )

const CanvasWorkbenchInner = () => {
  const reactFlow = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(undefined)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const {
    notes,
    datasets,
    experiments,
    models,
    results,
    graphNodes,
    canvas,
    setCanvasState,
    selectNode,
    setBottomTab,
  } = useCanvasRecords()

  const entityOptions = useMemo(
    () => getCanvasEntityOptions({ notes, datasets, experiments, models, results }),
    [notes, datasets, experiments, models, results],
  )

  const selectedEntityValue =
    selectedEntity && entityOptions.some((entry) => entry.entityId === selectedEntity)
      ? selectedEntity
      : (entityOptions[0]?.entityId ?? '')

  const records = { notes, datasets, experiments, models, results }

  const selectedNode = canvas.nodes.find((node) => node.id === selectedNodeId)
  const selectedEdge = canvas.edges.find((edge) => edge.id === selectedEdgeId)

  const upsertCanvas = (nextCanvas: CanvasState) => {
    setCanvasState(nextCanvas)
  }

  const patchNode = (nodeId: string, patch: Partial<CanvasNodeRecord>) => {
    upsertCanvas({
      ...canvas,
      nodes: canvas.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    })
  }

  const patchEdge = (edgeId: string, patch: Partial<CanvasEdgeRecord>) => {
    upsertCanvas({
      ...canvas,
      edges: canvas.edges.map((edge) => (edge.id === edgeId ? { ...edge, ...patch } : edge)),
    })
  }

  const bringNodesToFront = (nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      return
    }

    const selected = new Set(nodeIds)
    const currentMax = canvas.nodes.reduce(
      (max, node) => Math.max(max, node.zIndex ?? (node.type === 'group' ? 0 : 10)),
      0,
    )

    upsertCanvas({
      ...canvas,
      nodes: canvas.nodes.map((node) => {
        if (!selected.has(node.id)) {
          return node
        }

        return {
          ...node,
          zIndex: currentMax + nodeIds.indexOf(node.id) + 1,
        }
      }),
    })
  }

  const openLinkedItem = (record: CanvasNodeRecord) => {
    if (record.type === 'link' && record.url) {
      window.open(record.url, '_blank', 'noopener,noreferrer')
      return
    }

    if (!record.entityId) {
      return
    }

    const graphNode = graphNodes.find((node) => node.entityId === record.entityId)
    if (graphNode) {
      selectNode(graphNode.id)
    }

    if (record.entityKind === 'note') {
      setBottomTab('notes')
      return
    }

    if (
      record.entityKind === 'dataset' ||
      record.entityKind === 'experiment' ||
      record.entityKind === 'model' ||
      record.entityKind === 'result'
    ) {
      setBottomTab('training')
    }
  }

  const flowNodes: Array<CanvasCardFlowNode | CanvasGroupFlowNode> = [...canvas.nodes]
    .sort(
      (left, right) =>
        (left.zIndex ?? (left.type === 'group' ? 0 : 10)) -
        (right.zIndex ?? (right.type === 'group' ? 0 : 10)),
    )
    .map((node) => {
      if (node.type === 'group') {
        return {
          id: node.id,
          type: 'canvasGroup',
          position: { x: node.x, y: node.y },
          style: {
            width: node.width,
            height: node.height,
            zIndex: node.zIndex ?? 0,
          },
          draggable: true,
          selectable: true,
          data: {
            record: node,
            accent: resolveCanvasColor(node.color, '#4d87a8'),
            onLabelChange: (nodeId: string, nextLabel: string) =>
              patchNode(nodeId, { label: nextLabel }),
            onColorChange: (nodeId: string, nextColor: CanvasColor) =>
              patchNode(nodeId, { color: nextColor }),
          } satisfies CanvasGroupData,
        }
      }

      const description = describeCanvasNode(node, records)

      return {
        id: node.id,
        type: 'canvasCard',
        position: { x: node.x, y: node.y },
        style: {
          width: node.width,
          height: node.height,
          zIndex: node.zIndex ?? 10,
        },
        data: {
          record: node,
          title: description.title,
          eyebrow: description.eyebrow,
          detail: description.detail,
          body: description.body,
          accent: resolveCanvasColor(node.color, '#4d87a8'),
          onTextChange: (nodeId: string, nextText: string) =>
            patchNode(nodeId, { text: nextText }),
          onOpen: openLinkedItem,
        } satisfies CanvasNodeData,
      }
    })

  const flowEdges: Edge[] = canvas.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    sourceHandle: edge.fromSide ? `${edge.fromSide}-source` : undefined,
    targetHandle: edge.toSide ? `${edge.toSide}-target` : undefined,
    sourcePosition: edge.fromSide ? positionBySide[edge.fromSide] : Position.Right,
    targetPosition: edge.toSide ? positionBySide[edge.toSide] : Position.Left,
    type: 'smoothstep',
    label: edge.label,
    markerEnd:
      edge.toEnd === 'none'
        ? undefined
        : {
            type: MarkerType.ArrowClosed,
            color: resolveCanvasColor(edge.color, '#4d87a8'),
          },
    markerStart:
      edge.fromEnd === 'arrow'
        ? {
            type: MarkerType.ArrowClosed,
            color: resolveCanvasColor(edge.color, '#4d87a8'),
          }
        : undefined,
    style: {
      stroke: resolveCanvasColor(edge.color, '#4d87a8'),
      strokeWidth: 1.6,
    },
    labelStyle: {
      fill: '#dbefff',
      fontSize: 12,
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: '#07121d',
      fillOpacity: 0.92,
    },
  }))

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void reactFlow.fitView({ padding: 0.18, duration: 250 })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [reactFlow, canvas.id])

  const centerPosition = () => {
    const shell = shellRef.current

    if (!shell) {
      return { x: 0, y: 0 }
    }

    const rect = shell.getBoundingClientRect()

    return reactFlow.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }

  const addTextCard = () => {
    const nextNode = createCanvasTextNode(
      createId('canvas-text'),
      centerPosition(),
      'New text card',
    )

    upsertCanvas({
      ...canvas,
      nodes: [...canvas.nodes, nextNode],
    })
    setSelectedNodeId(nextNode.id)
    setSelectedEdgeId(undefined)
  }

  const addSelectedEntityCard = () => {
    const option = entityOptions.find((entry) => entry.entityId === selectedEntityValue)

    if (!option) {
      return
    }

    const nextNode = createCanvasEntityNode(createId('canvas-file'), centerPosition(), option)
    upsertCanvas({
      ...canvas,
      nodes: [...canvas.nodes, nextNode],
    })
    setSelectedNodeId(nextNode.id)
    setSelectedEdgeId(undefined)
  }

  const addWebCard = () => {
    const url = window.prompt('Enter a web page URL to embed on the canvas.', 'https://')
    if (!url) {
      return
    }

    const nextNode = createCanvasLinkNode(createId('canvas-link'), centerPosition(), url)
    upsertCanvas({
      ...canvas,
      nodes: [...canvas.nodes, nextNode],
    })
    setSelectedNodeId(nextNode.id)
    setSelectedEdgeId(undefined)
  }

  const createGroupFromSelection = () => {
    const selectedNodes = canvas.nodes.filter(
      (node) => selectedNodeIds.includes(node.id) && node.type !== 'group',
    )
    const bounds = getSelectionBounds(selectedNodes)

    const nextNode = createCanvasGroupNode(
      createId('canvas-group'),
      bounds ?? {
        ...centerPosition(),
        width: 320,
        height: 220,
      },
      window.prompt('Group name', 'New group') ?? 'New group',
    )

    upsertCanvas({
      ...canvas,
      nodes: [nextNode, ...canvas.nodes],
    })
    setSelectedNodeId(nextNode.id)
    setSelectedEdgeId(undefined)
  }

  const duplicateSelection = () => {
    const selectedNodes = canvas.nodes.filter((node) => selectedNodeIds.includes(node.id))

    if (selectedNodes.length === 0) {
      return
    }

    const duplicates = selectedNodes.map((node) => duplicateCanvasNode(node, createId(node.type)))
    upsertCanvas({
      ...canvas,
      nodes: [...canvas.nodes, ...duplicates],
    })
    setSelectedNodeIds(duplicates.map((node) => node.id))
    setSelectedNodeId(duplicates[0]?.id)
    setSelectedEdgeId(undefined)
  }

  const deleteSelection = () => {
    if (selectedEdgeId) {
      upsertCanvas({
        ...canvas,
        edges: canvas.edges.filter((edge) => edge.id !== selectedEdgeId),
      })
      setSelectedEdgeId(undefined)
      return
    }

    const candidateNodeIds =
      selectedNodeIds.length > 0
        ? selectedNodeIds
        : selectedNodeId
          ? [selectedNodeId]
          : []

    if (candidateNodeIds.length === 0) {
      return
    }

    const removed = new Set(candidateNodeIds)
    upsertCanvas({
      ...canvas,
      nodes: canvas.nodes.filter((node) => !removed.has(node.id)),
      edges: canvas.edges.filter(
        (edge) => !removed.has(edge.fromNode) && !removed.has(edge.toNode),
      ),
    })
    setSelectedNodeIds([])
    setSelectedNodeId(undefined)
  }

  const exportCanvasFile = () => {
    const payload = canvasDocumentFromState(canvas.nodes, canvas.edges)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${canvas.title.toLowerCase().replace(/\s+/g, '-')}.canvas`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importCanvasFile = async (file: File) => {
    const payload = JSON.parse(await file.text()) as {
      nodes?: unknown
      edges?: unknown
    }

    if (!Array.isArray(payload.nodes) && !Array.isArray(payload.edges)) {
      return
    }

    const importedNodes = (Array.isArray(payload.nodes) ? payload.nodes : [])
      .filter((entry): entry is CanvasNodeRecord => {
        if (!entry || typeof entry !== 'object') {
          return false
        }

        return 'id' in entry && 'type' in entry && 'x' in entry && 'y' in entry
      })
      .map((node, index) => ({
        ...node,
        zIndex: index,
      }))

    const importedEdges = (Array.isArray(payload.edges) ? payload.edges : []).filter(
      (entry): entry is CanvasEdgeRecord => {
        if (!entry || typeof entry !== 'object') {
          return false
        }

        return 'id' in entry && 'fromNode' in entry && 'toNode' in entry
      },
    )

    upsertCanvas({
      id: canvas.id,
      title: canvasTitleFromFile(file.name),
      nodes: importedNodes,
      edges: importedEdges,
    })
    setSelectedNodeId(undefined)
    setSelectedEdgeId(undefined)
    setSelectedNodeIds([])
  }

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) {
      return
    }

    const nextEdges = addEdge(
      {
        id: createId('canvas-edge'),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'smoothstep',
        label: '',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4d87a8',
        },
      },
      flowEdges,
    )

    const mergedEdges = mergeCanvasEdges(nextEdges, canvas.edges)
    upsertCanvas({
      ...canvas,
      edges: mergedEdges,
    })
  }

  const onNodesChange = (changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, flowNodes)
    const mergedNodes = syncCanvasNodesFromFlow(canvas.nodes, nextNodes)

    if (sameCanvasNodes(canvas.nodes, mergedNodes)) {
      return
    }

    upsertCanvas({
      ...canvas,
      nodes: mergedNodes,
    })
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, flowEdges)
    const mergedEdges = mergeCanvasEdges(nextEdges, canvas.edges)

    if (sameCanvasEdges(canvas.edges, mergedEdges)) {
      return
    }

    upsertCanvas({
      ...canvas,
      edges: mergedEdges,
    })
  }

  const zoomToSelection = () => {
    const activeNodes = canvas.nodes.filter((node) => selectedNodeIds.includes(node.id))
    const bounds = getSelectionBounds(activeNodes)

    if (!bounds) {
      void reactFlow.fitView({ padding: 0.18, duration: 250 })
      return
    }

    void reactFlow.fitBounds(bounds, { padding: 0.16, duration: 260 })
  }

  return (
    <div className="canvas-workbench">
      <aside className="canvas-inspector">
        <div className="canvas-inspector__section">
          <p className="section-kicker">Canvas vault</p>
          <h3>{canvas.title}</h3>
          <p className="muted-copy">
            A 2D research board for notes, experiments, datasets, model versions, and web references.
          </p>
          <div className="tag-row">
            <TagPill label={`${canvas.nodes.length} cards`} muted />
            <TagPill label={`${canvas.edges.length} connections`} muted />
          </div>
        </div>

        <div className="canvas-inspector__section">
          <p className="section-kicker">Workspace items</p>
          <h3>Create file card</h3>
          <label className="field-group">
            <span>Workspace item</span>
            <select
              value={selectedEntityValue}
              onChange={(event) => setSelectedEntity(event.target.value)}
            >
              {entityOptions.map((option) => (
                <option key={`${option.entityKind}-${option.entityId}`} value={option.entityId}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={addSelectedEntityCard}>
            <FilePlus2 size={16} />
            Add selected item
          </button>
        </div>

        <div className="canvas-inspector__section">
          <p className="section-kicker">Selection</p>
          {selectedNode ? (
            <>
              <h3>{describeCanvasNode(selectedNode, records).title}</h3>
              <label className="field-group">
                <span>Color</span>
                <select
                  value={selectedNode.color ?? '#101923'}
                  onChange={(event) =>
                    patchNode(selectedNode.id, { color: event.target.value as CanvasColor })
                  }
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {selectedNode.type === 'link' ? (
                <label className="field-group">
                  <span>URL</span>
                  <input
                    value={selectedNode.url ?? ''}
                    onChange={(event) => patchNode(selectedNode.id, { url: event.target.value })}
                  />
                </label>
              ) : null}
              {selectedNode.type === 'group' ? (
                <label className="field-group">
                  <span>Label</span>
                  <input
                    value={selectedNode.label ?? ''}
                    onChange={(event) => patchNode(selectedNode.id, { label: event.target.value })}
                  />
                </label>
              ) : null}
              {selectedNode.type !== 'text' ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => openLinkedItem(selectedNode)}
                >
                  Open linked item
                </button>
              ) : null}
            </>
          ) : selectedEdge ? (
            <>
              <h3>Connection</h3>
              <label className="field-group">
                <span>Label</span>
                <input
                  value={selectedEdge.label ?? ''}
                  onChange={(event) => patchEdge(selectedEdge.id, { label: event.target.value })}
                />
              </label>
              <label className="field-group">
                <span>Color</span>
                <select
                  value={selectedEdge.color ?? '#4d87a8'}
                  onChange={(event) =>
                    patchEdge(selectedEdge.id, { color: event.target.value as CanvasColor })
                  }
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <p className="muted-copy">
              Select a card or a connection to edit labels, colors, and linked content.
            </p>
          )}
        </div>

        <div className="canvas-inspector__section">
          <p className="section-kicker">JSON Canvas</p>
          <h3>Portable format</h3>
          <div className="canvas-action-grid">
            <button type="button" className="secondary-button" onClick={exportCanvasFile}>
              <Download size={16} />
              Export .canvas
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={16} />
              Import .canvas
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".canvas,application/json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              await importCanvasFile(file)
              event.currentTarget.value = ''
            }}
          />
        </div>
      </aside>

      <div className="canvas-shell" ref={shellRef}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={canvasNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={(event) => {
            if (event.detail === 2) {
              addTextCard()
              return
            }

            setSelectedNodeId(undefined)
            setSelectedEdgeId(undefined)
            setSelectedNodeIds([])
          }}
          onNodeClick={(_, node) => {
            bringNodesToFront([node.id])
            setSelectedNodeId(node.id)
            setSelectedNodeIds([node.id])
            setSelectedEdgeId(undefined)
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id)
            setSelectedNodeId(undefined)
          }}
          onSelectionChange={({ nodes: selectionNodes, edges: selectionEdges }) => {
            const nextNodeIds = selectionNodes.map((node) => node.id)

            if (nextNodeIds.length > 0) {
              bringNodesToFront(nextNodeIds)
            }

            setSelectedNodeIds(nextNodeIds)
            setSelectedNodeId(selectionNodes[0]?.id)
            setSelectedEdgeId(selectionEdges[0]?.id)
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag
          snapToGrid
          snapGrid={[24, 24]}
          minZoom={canvasManifest.zoom.min}
          maxZoom={canvasManifest.zoom.max}
          fitViewOptions={{ padding: 0.18 }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#4d87a8',
            },
          }}
        >
          <Background color="#183040" gap={24} size={1} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const record = canvas.nodes.find((entry) => entry.id === node.id)
              return resolveCanvasColor(
                record?.color,
                record?.type === 'group' ? '#183243' : '#7dcfff',
              )
            }}
          />
          <Controls position="top-right" />
          <Panel position="top-left" className="canvas-titlebar">
            <div className="canvas-titlebar__stack">
              <span className="canvas-titlebar__eyebrow">Canvas mode</span>
              <strong>{canvas.title}</strong>
            </div>
            <div className="canvas-titlebar__meta">
              <span>Double-click empty space to add a text card.</span>
              <span>Drag from any card edge to create a link.</span>
            </div>
          </Panel>
          <Panel position="bottom-left" className="canvas-statusbar">
            <span>{selectedNodeIds.length > 1 ? `${selectedNodeIds.length} cards selected` : selectedNode ? 'Card selected' : selectedEdge ? 'Connection selected' : 'Canvas ready'}</span>
            <span>{canvas.nodes.filter((node) => node.type === 'group').length} groups</span>
          </Panel>
          <Panel position="top-left" className="canvas-action-rail">
            <button type="button" className="canvas-action-rail__button is-primary" onClick={addTextCard} title="Add text card" aria-label="Add text card">
              <StickyNote size={16} />
            </button>
            <button type="button" className="canvas-action-rail__button" onClick={addSelectedEntityCard} title="Add workspace item card" aria-label="Add workspace item card">
              <FilePlus2 size={16} />
            </button>
            <button type="button" className="canvas-action-rail__button" onClick={addWebCard} title="Add web card" aria-label="Add web card">
              <Globe size={16} />
            </button>
            <button type="button" className="canvas-action-rail__button" onClick={createGroupFromSelection} title="Group selection" aria-label="Group selection">
              <Layers3 size={16} />
            </button>
            <button type="button" className="canvas-action-rail__button" onClick={duplicateSelection} title="Duplicate selection" aria-label="Duplicate selection">
              <Copy size={16} />
            </button>
            <button type="button" className="canvas-action-rail__button" onClick={zoomToSelection} title="Zoom to selection" aria-label="Zoom to selection">
              <Focus size={16} />
            </button>
            <button type="button" className="canvas-action-rail__button is-danger" onClick={deleteSelection} title="Delete selection" aria-label="Delete selection">
              <Trash2 size={16} />
            </button>
          </Panel>
          <Panel position="top-left" className="canvas-panel-banner">
            <button type="button" className="canvas-chip" onClick={addTextCard}>
              <StickyNote size={14} />
              Text
            </button>
            <button type="button" className="canvas-chip" onClick={addSelectedEntityCard}>
              <FilePlus2 size={14} />
              File
            </button>
            <button type="button" className="canvas-chip" onClick={addWebCard}>
              <Link2 size={14} />
              Link
            </button>
            <button type="button" className="canvas-chip" onClick={createGroupFromSelection}>
              <Layers3 size={14} />
              Group
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

export const CanvasWorkbench = () => (
  <PanelFrame
    eyebrow="Canvas"
    title="Obsidian-style infinite canvas"
    subtitle="Text cards, file cards, web cards, groups, and labeled edges now live in a local-first canvas workspace."
    className="canvas-panel"
  >
    <ReactFlowProvider>
      <CanvasWorkbenchInner />
    </ReactFlowProvider>
  </PanelFrame>
)
