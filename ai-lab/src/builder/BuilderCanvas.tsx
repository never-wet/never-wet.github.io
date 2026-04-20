import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
} from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import '@xyflow/react/dist/style.css'
import { useShallow } from 'zustand/react/shallow'

import { modelBlockIndex } from '../memory/modelBlockIndex'
import { trainingManifest } from '../memory/trainingManifest'
import type {
  BuilderBlockKind,
  BuilderFlowEdge,
  BuilderFlowNode,
  BuilderFlowState,
} from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { createBuilderNode, isBlockAvailableInMode, isLayerBlock, validateBuilderFlow } from '../utils/builder'
import { PanelFrame } from '../components/PanelFrame'
import { TagPill } from '../components/TagPill'
import { BuilderBlockNode } from './BuilderBlockNode'

const DND_KEY = 'application/cortex-builder-kind'

const nodeTypes = {
  builderBlock: BuilderBlockNode,
}

const toFlowNodes = (nodes: BuilderFlowNode[]): Node[] =>
  nodes.map((node) => ({
    id: node.id,
    type: 'builderBlock',
    position: node.position,
    data: {
      label: node.label,
      kind: node.kind,
      description: node.description,
      color: modelBlockIndex[node.kind].color,
    },
  }))

const toFlowEdges = (edges: BuilderFlowEdge[]): Edge[] =>
  edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#88caff',
    },
    style: {
      stroke: '#5f8fb1',
      strokeWidth: 1.4,
    },
  }))

const syncBuilderNodesFromFlow = (
  builderNodes: BuilderFlowNode[],
  flowNodes: Node[],
): BuilderFlowNode[] =>
  flowNodes.flatMap((flowNode) => {
    const updated = builderNodes.find((builderNode) => builderNode.id === flowNode.id)

    if (!updated) {
      return []
    }

    return [
      {
        ...updated,
        position: flowNode.position,
      },
    ]
  })

const mergeEdges = (flowEdges: Edge[]): BuilderFlowEdge[] =>
  flowEdges.map((edge) => ({
    id: edge.id,
    source: String(edge.source),
    target: String(edge.target),
  }))

const wouldCreateCycle = (edges: BuilderFlowEdge[], source: string, target: string) => {
  const adjacency = new Map<string, string[]>()

  for (const edge of [...edges, { id: 'candidate', source, target }]) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source)?.push(edge.target)
  }

  const visited = new Set<string>()
  const stack = [target]

  while (stack.length > 0) {
    const current = stack.pop()

    if (!current || visited.has(current)) {
      continue
    }

    if (current === source) {
      return true
    }

    visited.add(current)
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next)
    }
  }

  return false
}

const isConnectionAllowed = (
  builder: BuilderFlowState,
  connection: Connection,
) => {
  if (!connection.source || !connection.target || connection.source === connection.target) {
    return false
  }

  const source = builder.nodes.find((node) => node.id === connection.source)
  const target = builder.nodes.find((node) => node.id === connection.target)

  if (!source || !target) {
    return false
  }

  const duplicate = builder.edges.some(
    (edge) => edge.source === connection.source && edge.target === connection.target,
  )

  if (duplicate) {
    return false
  }

  const sourceDefinition = modelBlockIndex[source.kind]
  const targetDefinition = modelBlockIndex[target.kind]

  if (
    sourceDefinition.emitsTo !== 'any' &&
    !sourceDefinition.emitsTo.includes(target.kind)
  ) {
    return false
  }

  if (
    targetDefinition.acceptsFrom !== 'any' &&
    !targetDefinition.acceptsFrom.includes(source.kind)
  ) {
    return false
  }

  if (isLayerBlock(source.kind)) {
    const outgoing = builder.edges.filter((edge) => edge.source === source.id)
    if (outgoing.length >= 1) {
      return false
    }
  }

  if (isLayerBlock(target.kind)) {
    const incoming = builder.edges.filter((edge) => edge.target === target.id)
    if (incoming.length >= 1) {
      return false
    }
  }

  return !wouldCreateCycle(builder.edges, connection.source, connection.target)
}

const nodeChangeAffectsGraph = (change: { type: string }) =>
  change.type === 'add' ||
  change.type === 'remove' ||
  change.type === 'replace' ||
  change.type === 'position'

const edgeChangeAffectsGraph = (change: { type: string }) =>
  change.type === 'add' || change.type === 'remove' || change.type === 'replace'

const sameBuilderNodes = (left: BuilderFlowNode[], right: BuilderFlowNode[]) =>
  left.length === right.length &&
  left.every((node, index) => {
    const other = right[index]

    return (
      other !== undefined &&
      node.id === other.id &&
      node.position.x === other.position.x &&
      node.position.y === other.position.y
    )
  })

const sameBuilderEdges = (left: BuilderFlowEdge[], right: BuilderFlowEdge[]) =>
  left.length === right.length &&
  left.every((edge, index) => {
    const other = right[index]

    return (
      other !== undefined &&
      edge.id === other.id &&
      edge.source === other.source &&
      edge.target === other.target
    )
  })

const BlockPalette = () => {
  const { mode, selectTrainingPreset, loadPresetArchitecture } = useLabStore(
    useShallow((state) => ({
      mode: state.mode,
      selectTrainingPreset: state.selectTrainingPreset,
      loadPresetArchitecture: state.loadPresetArchitecture,
    })),
  )

  return (
    <aside className="builder-sidebar">
      <div className="builder-section">
        <p className="section-kicker">Palette</p>
        <h3>Drag blocks into the canvas</h3>
        <div className="builder-palette">
          {(Object.keys(modelBlockIndex) as BuilderBlockKind[])
            .filter((kind) => isBlockAvailableInMode(kind, mode))
            .map((kind) => (
              <button
                key={kind}
                type="button"
                className="builder-palette__item"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(DND_KEY, kind)
                  event.dataTransfer.effectAllowed = 'move'
                }}
              >
                <span
                  className="builder-palette__swatch"
                  style={{ background: modelBlockIndex[kind].color }}
                />
                <div>
                  <strong>{modelBlockIndex[kind].label}</strong>
                  <small>{modelBlockIndex[kind].description}</small>
                </div>
              </button>
            ))}
        </div>
      </div>

      <div className="builder-section">
        <p className="section-kicker">Preset architectures</p>
        <h3>Load a guided starting point</h3>
        <div className="preset-stack">
          {trainingManifest.presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-card"
              onClick={() => {
                selectTrainingPreset(preset.id)
                loadPresetArchitecture(preset.id)
              }}
            >
              <strong>{preset.name}</strong>
              <small>{preset.description}</small>
              <div className="tag-row">
                <TagPill label={preset.recommendedMode} muted />
                <TagPill label={`${preset.defaultConfig.epochs} epochs`} muted />
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

const BlockInspector = () => {
  const { builder, selectedBuilderNodeId, updateBuilderNodeConfig, deleteBuilderNode } =
    useLabStore(
      useShallow((state) => ({
        builder: state.builder,
        selectedBuilderNodeId: state.ui.selectedBuilderNodeId,
        updateBuilderNodeConfig: state.updateBuilderNodeConfig,
        deleteBuilderNode: state.deleteBuilderNode,
      })),
    )

  const selectedNode =
    builder.nodes.find((node) => node.id === selectedBuilderNodeId) ??
    builder.nodes.find((node) => isLayerBlock(node.kind))

  if (!selectedNode) {
    return (
      <aside className="builder-inspector">
        <p className="muted-copy">Select a block to inspect and edit its configuration.</p>
      </aside>
    )
  }

  const definition = modelBlockIndex[selectedNode.kind]

  return (
    <aside className="builder-inspector">
      <div className="builder-section">
        <p className="section-kicker">Block inspector</p>
        <h3>{selectedNode.label}</h3>
        <p>{selectedNode.description}</p>
      </div>

      <div className="builder-fields">
        {definition.configFields.length === 0 ? (
          <p className="muted-copy">This block has no editable fields.</p>
        ) : (
          definition.configFields.map((field) => {
            const value = selectedNode.config[field.id]

            if (field.input === 'select') {
              return (
                <label key={field.id} className="field-group">
                  <span>{field.label}</span>
                  <select
                    value={String(value ?? field.options?.[0]?.value ?? '')}
                    onChange={(event) =>
                      updateBuilderNodeConfig(selectedNode.id, field.id, event.target.value)
                    }
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>{field.helper}</small>
                </label>
              )
            }

            if (field.input === 'textarea') {
              return (
                <label key={field.id} className="field-group">
                  <span>{field.label}</span>
                  <textarea
                    rows={4}
                    value={String(value ?? '')}
                    onChange={(event) =>
                      updateBuilderNodeConfig(selectedNode.id, field.id, event.target.value)
                    }
                  />
                  <small>{field.helper}</small>
                </label>
              )
            }

            return (
              <label key={field.id} className="field-group">
                <span>{field.label}</span>
                <input
                  type="number"
                  value={String(value ?? field.min ?? 0)}
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 1}
                  onChange={(event) =>
                    updateBuilderNodeConfig(
                      selectedNode.id,
                      field.id,
                      Number(event.target.value),
                    )
                  }
                />
                <small>{field.helper}</small>
              </label>
            )
          })
        )}
      </div>

      <button
        type="button"
        className="secondary-button secondary-button--danger"
        onClick={() => deleteBuilderNode(selectedNode.id)}
      >
        Remove block
      </button>
    </aside>
  )
}

const BuilderCanvasInner = () => {
  const reactFlow = useReactFlow()
  const {
    builder,
    mode,
    setBuilderSelection,
    updateBuilderGraph,
  } = useLabStore(
    useShallow((state) => ({
      builder: state.builder,
      mode: state.mode,
      setBuilderSelection: state.setBuilderSelection,
      updateBuilderGraph: state.updateBuilderGraph,
    })),
  )

  const validation = validateBuilderFlow(builder)
  const flowNodes = useMemo(() => toFlowNodes(builder.nodes), [builder.nodes])
  const flowEdges = useMemo(() => toFlowEdges(builder.edges), [builder.edges])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void reactFlow.fitView({ padding: 0.18, duration: 350 })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [reactFlow, builder.id, builder.nodes.length])

  const onConnect: OnConnect = (connection) => {
    if (!isConnectionAllowed(builder, connection)) {
      return
    }

    const nextEdges = addEdge(
      {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#88caff',
        },
      },
      flowEdges,
    )

    updateBuilderGraph(builder.nodes, mergeEdges(nextEdges))
  }

  return (
    <div className="builder-workbench">
      <BlockPalette />

      <div
        className="builder-canvas-shell"
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(event) => {
          event.preventDefault()
          const kind = event.dataTransfer.getData(DND_KEY) as BuilderBlockKind
          if (!kind) {
            return
          }

          const position = reactFlow.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          })

          const nextNode = createBuilderNode(kind, position)
          updateBuilderGraph([...builder.nodes, nextNode], builder.edges)
          setBuilderSelection(nextNode.id)
        }}
      >
        <div className="builder-canvas-header">
          <div>
            <p className="section-kicker">Neural builder</p>
            <h3>{builder.title}</h3>
            <p>
              {mode === 'beginner'
                ? 'Use the guided block set to keep the model path simple and valid.'
                : 'Advanced mode unlocks dropout, normalization, reshape, and standalone activations.'}
            </p>
          </div>
          <div className="builder-validation">
            <TagPill
              label={validation.valid ? 'Valid sequential flow' : 'Needs attention'}
              accent={validation.valid ? '#68dfb1' : '#ffbf7a'}
            />
            <TagPill label={`~${validation.parameterEstimate} params`} muted />
          </div>
        </div>

        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          nodesDraggable
          edgesFocusable
          onNodeClick={(_, node) => setBuilderSelection(node.id)}
          onSelectionChange={({ nodes }) => setBuilderSelection(nodes[0]?.id)}
          onNodesChange={(changes) => {
            const meaningfulChanges = changes.filter(nodeChangeAffectsGraph)

            if (meaningfulChanges.length === 0) {
              return
            }

            const nextNodes = applyNodeChanges(meaningfulChanges, flowNodes)
            const mergedNodes = syncBuilderNodesFromFlow(builder.nodes, nextNodes)

            if (sameBuilderNodes(builder.nodes, mergedNodes)) {
              return
            }

            updateBuilderGraph(mergedNodes, builder.edges)
          }}
          onEdgesChange={(changes) => {
            const meaningfulChanges = changes.filter(edgeChangeAffectsGraph)

            if (meaningfulChanges.length === 0) {
              return
            }

            const nextEdges = mergeEdges(applyEdgeChanges(meaningfulChanges, flowEdges))

            if (sameBuilderEdges(builder.edges, nextEdges)) {
              return
            }

            updateBuilderGraph(builder.nodes, nextEdges)
          }}
          onConnect={onConnect}
          deleteKeyCode={['Backspace', 'Delete']}
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.35}
          maxZoom={1.7}
        >
          <Background color="#193246" gap={22} size={1} />
          <MiniMap
            nodeColor={(node) =>
              modelBlockIndex[(node.data as { kind: BuilderBlockKind }).kind].color
            }
            pannable
            zoomable
          />
          <Controls position="bottom-right" />
        </ReactFlow>

        <div className="builder-footer">
          {validation.issues.length === 0 ? (
            <p className="muted-copy">
              Sequential model chain looks valid. Training will use the blocks in their current order.
            </p>
          ) : (
            validation.issues.map((issue) => (
              <p key={issue} className="warning-copy">
                {issue}
              </p>
            ))
          )}
        </div>
      </div>

      <BlockInspector />
    </div>
  )
}

export const BuilderCanvas = () => (
  <PanelFrame
    eyebrow="Builder"
    title="Visual neural network builder"
    subtitle="Drag blocks, wire a valid sequential flow, and inspect parameters before training."
    className="builder-panel"
  >
    <ReactFlowProvider>
      <BuilderCanvasInner />
    </ReactFlowProvider>
  </PanelFrame>
)
