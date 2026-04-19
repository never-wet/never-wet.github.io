import { useDeferredValue, useEffect, useMemo, useRef } from 'react'
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d'
import SpriteText from 'three-spritetext'
import * as THREE from 'three'
import { useShallow } from 'zustand/react/shallow'

import { graphBehaviorManifest, nodeCategoryVisuals } from '../memory/graphIndex'
import { performanceConfig } from '../memory/performanceConfig'
import type { GraphLinkRecord, GraphNodeRecord } from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { filterGraph } from '../utils/graph'
import { useElementSize } from '../utils/useElementSize'

const createNodeObject = ({
  node,
  selectedNodeId,
  neighborIds,
  showLabels,
}: {
  node: GraphNodeRecord
  selectedNodeId?: string
  neighborIds: Set<string>
  showLabels: boolean
}) => {
  const visual = nodeCategoryVisuals[node.category]
  const isSelected = node.id === selectedNodeId
  const isNeighbor = neighborIds.has(node.id)
  const radius = visual.size * (isSelected ? 1.2 : 1)

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 18, 18),
    new THREE.MeshStandardMaterial({
      color: visual.color,
      emissive: isSelected ? visual.accent : visual.color,
      emissiveIntensity: isSelected ? 1 : visual.glow * 0.42,
      roughness: 0.26,
      metalness: 0.52,
    }),
  )

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.22, 18, 18),
    new THREE.MeshBasicMaterial({
      color: visual.accent,
      transparent: true,
      opacity: isSelected ? 0.18 : isNeighbor ? 0.12 : 0.05,
      side: THREE.BackSide,
    }),
  )

  const group = new THREE.Group()
  group.add(sphere)
  group.add(halo)

  if (showLabels || isSelected) {
    const label = new SpriteText(node.title)
    label.color = isSelected ? '#ffffff' : '#cfe7ff'
    label.textHeight = isSelected ? 6.5 : 5.2
    label.position.set(0, radius + 10, 0)
    label.backgroundColor = 'rgba(4, 12, 22, 0.62)'
    label.padding = 2
    group.add(label)
  }

  return group
}

export const ForceGraphPanel = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const graphRef = useRef<ForceGraphMethods<GraphNodeRecord, GraphLinkRecord> | undefined>(
    undefined,
  )
  const sceneConfiguredRef = useRef(false)
  const { width, height } = useElementSize(containerRef)

  const {
    nodes,
    links,
    ui,
    selectNode,
    updateGraphNodePosition,
  } = useLabStore(
    useShallow((state) => ({
      nodes: state.nodes,
      links: state.links,
      ui: state.ui,
      selectNode: state.selectNode,
      updateGraphNodePosition: state.updateGraphNodePosition,
    })),
  )

  const deferredSearch = useDeferredValue(ui.searchQuery)
  const filtered = useMemo(
    () =>
      filterGraph({
        nodes,
        links,
        categoryFilters: ui.categoryFilters,
        search: deferredSearch,
        selectedNodeId: ui.selectedNodeId,
        showOnlyConnected: ui.showOnlyConnected,
      }),
    [
      nodes,
      links,
      ui.categoryFilters,
      deferredSearch,
      ui.selectedNodeId,
      ui.showOnlyConnected,
    ],
  )

  const activeLinkIds = useMemo(() => {
    const selectedId = ui.selectedNodeId
    if (!selectedId) {
      return new Set<string>()
    }

    return new Set(
      filtered.links
        .filter((link) => link.source === selectedId || link.target === selectedId)
        .map((link) => link.id),
    )
  }, [filtered.links, ui.selectedNodeId])

  useEffect(() => {
    if (!graphRef.current) {
      return
    }

    graphRef.current.d3Force('charge')?.strength(graphBehaviorManifest.chargeStrength)
    graphRef.current.d3Force('link')?.distance((link: GraphLinkRecord) => {
      const source = filtered.nodes.find((node) => node.id === link.source)
      const target = filtered.nodes.find((node) => node.id === link.target)
      const sourceBoost = source ? nodeCategoryVisuals[source.category].size : 6
      const targetBoost = target ? nodeCategoryVisuals[target.category].size : 6
      return graphBehaviorManifest.linkDistance + sourceBoost + targetBoost
    })
    graphRef.current.d3ReheatSimulation()
  }, [filtered.nodes, filtered.links])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph || sceneConfiguredRef.current) {
      return
    }

    const scene = graph.scene()

    const ambient = new THREE.AmbientLight('#8ab4ff', 1.1)
    const point = new THREE.PointLight('#7fdfff', 1.3)
    point.position.set(120, 180, 90)

    const rim = new THREE.PointLight('#ffd087', 0.62)
    rim.position.set(-160, -90, -110)

    const grid = new THREE.GridHelper(520, 28, '#2c4962', '#0f2130')
    grid.position.y = -132
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.18

    scene.add(ambient)
    scene.add(point)
    scene.add(rim)
    scene.add(grid)
    sceneConfiguredRef.current = true
  }, [])

  useEffect(() => {
    const graph = graphRef.current
    const selectedNode = filtered.nodes.find((node) => node.id === ui.focusedNodeId)

    if (!graph || !selectedNode) {
      return
    }

    const distance = graphBehaviorManifest.focusCameraDistance
    const magnitude = Math.hypot(selectedNode.x ?? 0, selectedNode.y ?? 0, selectedNode.z ?? 0) || 1
    const ratio = 1 + distance / magnitude

    graph.cameraPosition(
      {
        x: (selectedNode.x ?? 0) * ratio,
        y: (selectedNode.y ?? 0) * ratio,
        z: (selectedNode.z ?? 0) * ratio,
      },
      {
        x: selectedNode.x ?? 0,
        y: selectedNode.y ?? 0,
        z: selectedNode.z ?? 0,
      },
      850,
    )
  }, [filtered.nodes, ui.focusedNodeId])

  return (
    <section className="graph-panel" ref={containerRef}>
      <div className="graph-overlay graph-overlay--left">
        <div>
          <p className="graph-overlay__eyebrow">3D workspace</p>
          <strong>Floating knowledge graph</strong>
          <p>Rotate, zoom, and drag nodes to reorganize the AI lab spatially.</p>
        </div>
        <div className="graph-overlay__legend">
          {(['experiment', 'dataset', 'note', 'model'] as const).map((category) => (
            <span key={category}>
              <i style={{ background: nodeCategoryVisuals[category].color }} />
              {nodeCategoryVisuals[category].label}
            </span>
          ))}
        </div>
      </div>

      <div className="graph-overlay graph-overlay--right">
        <button type="button" onClick={() => graphRef.current?.zoomToFit(700, 90)}>
          Zoom to fit
        </button>
        <button
          type="button"
          onClick={() => {
            const selected = filtered.nodes.find((node) => node.id === ui.selectedNodeId)
            if (selected) {
              selectNode(selected.id)
            }
          }}
        >
          Focus selected
        </button>
      </div>

      <ForceGraph3D<GraphNodeRecord, GraphLinkRecord>
        ref={graphRef}
        width={width}
        height={height}
        graphData={{ nodes: filtered.nodes, links: filtered.links }}
        backgroundColor="#040913"
        showNavInfo={false}
        nodeResolution={performanceConfig.graph.nodeResolution}
        warmupTicks={performanceConfig.graph.warmupTicks}
        cooldownTicks={performanceConfig.graph.cooldownTicks}
        linkOpacity={graphBehaviorManifest.linkOpacity}
        nodeRelSize={4}
        enableNodeDrag
        enableNavigationControls
        nodeLabel={(node: GraphNodeRecord) => `${node.title}\n${node.summary}`}
        linkLabel={(link: GraphLinkRecord) => `${link.relation}`}
        nodeThreeObject={(node) =>
          createNodeObject({
            node,
            selectedNodeId: ui.selectedNodeId,
            neighborIds: filtered.directNeighbors,
            showLabels: ui.showLabels,
          })
        }
        linkWidth={(link) => (activeLinkIds.has(link.id) ? 2.6 : 0.8)}
        linkColor={(link) => (activeLinkIds.has(link.id) ? '#9cd5ff' : '#355268')}
        onNodeClick={(node: GraphNodeRecord) => selectNode(node.id)}
        onBackgroundClick={() => selectNode(undefined)}
        onNodeDragEnd={(node: GraphNodeRecord) =>
          updateGraphNodePosition(node.id, {
            x: node.x,
            y: node.y,
            z: node.z,
          })
        }
      />
    </section>
  )
}
