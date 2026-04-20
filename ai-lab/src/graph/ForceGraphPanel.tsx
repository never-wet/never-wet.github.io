import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { useShallow } from 'zustand/react/shallow'

import { graphBehaviorManifest, graphClusters, nodeCategoryVisuals } from '../memory/graphIndex'
import type { GraphLinkRecord, GraphNodeRecord } from '../memory/types'
import { useLabStore } from '../state/useLabStore'
import { filterGraph } from '../utils/graph'
import { useElementSize } from '../utils/useElementSize'

interface NodeRuntime {
  data: GraphNodeRecord
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>
  halo: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  label: CSS2DObject
  position: THREE.Vector3
  velocity: THREE.Vector3
}

interface LinkRuntime {
  data: GraphLinkRecord
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>
}

const jitterFromId = (id: string) => {
  let hash = 0
  for (const character of id) {
    hash = (hash << 5) - hash + character.charCodeAt(0)
  }

  const x = ((hash & 255) - 128) * 0.35
  const y = (((hash >> 8) & 255) - 128) * 0.28
  const z = (((hash >> 16) & 255) - 128) * 0.35

  return new THREE.Vector3(x, y, z)
}

const createInitialPosition = (node: GraphNodeRecord) => {
  if (
    typeof node.x === 'number' &&
    typeof node.y === 'number' &&
    typeof node.z === 'number'
  ) {
    return new THREE.Vector3(node.x, node.y, node.z)
  }

  const clusterOrigin = graphClusters[node.cluster]?.origin ?? { x: 0, y: 0, z: 0 }
  return new THREE.Vector3(clusterOrigin.x, clusterOrigin.y, clusterOrigin.z).add(
    jitterFromId(node.id),
  )
}

const updateNodeVisual = ({
  runtime,
  selectedNodeId,
  hoveredNodeId,
  directNeighbors,
}: {
  runtime: NodeRuntime
  selectedNodeId?: string
  hoveredNodeId?: string
  directNeighbors: Set<string>
}) => {
  const visual = nodeCategoryVisuals[runtime.data.category]
  const isSelected = runtime.data.id === selectedNodeId
  const isHovered = runtime.data.id === hoveredNodeId
  const isNeighbor = directNeighbors.has(runtime.data.id)

  runtime.mesh.material.color.set(isSelected ? visual.accent : visual.color)
  runtime.mesh.material.emissive.set(isHovered || isNeighbor ? visual.accent : visual.color)
  runtime.mesh.material.emissiveIntensity = isSelected ? 0.9 : isHovered ? 0.48 : isNeighbor ? 0.32 : 0.2
  runtime.mesh.material.roughness = 0.22
  runtime.mesh.material.metalness = 0.58

  runtime.halo.material.color.set(visual.accent)
  runtime.halo.material.opacity = isSelected ? 0.24 : isHovered ? 0.16 : isNeighbor ? 0.1 : 0.05

  const scale = isSelected ? 1.28 : isHovered ? 1.16 : 1
  runtime.mesh.scale.setScalar(scale)
  runtime.halo.scale.setScalar(scale)
}

const updateNodeLabel = ({
  runtime,
  showLabels,
  selectedNodeId,
  hoveredNodeId,
  directNeighbors,
}: {
  runtime: NodeRuntime
  showLabels: boolean
  selectedNodeId?: string
  hoveredNodeId?: string
  directNeighbors: Set<string>
}) => {
  const labelElement = runtime.label.element as HTMLDivElement
  const visual = nodeCategoryVisuals[runtime.data.category]
  const isSelected = runtime.data.id === selectedNodeId
  const isHovered = runtime.data.id === hoveredNodeId
  const isNeighbor = directNeighbors.has(runtime.data.id)

  labelElement.textContent = runtime.data.title
  labelElement.classList.toggle('is-visible', showLabels)
  labelElement.classList.toggle('is-active', isSelected || isHovered || isNeighbor)
  runtime.label.visible = showLabels
  runtime.label.position.set(0, visual.size + 10, 0)
}

const updateLinkVisual = ({
  runtime,
  selectedNodeId,
}: {
  runtime: LinkRuntime
  selectedNodeId?: string
}) => {
  const isActive =
    selectedNodeId !== undefined &&
    (runtime.data.source === selectedNodeId || runtime.data.target === selectedNodeId)

  runtime.line.material.color.set(isActive ? '#9cd5ff' : '#355268')
  runtime.line.material.opacity = isActive ? 0.95 : graphBehaviorManifest.linkOpacity
}

const updateLinkGeometry = (
  runtime: LinkRuntime,
  nodeRuntimes: Map<string, NodeRuntime>,
) => {
  const source = nodeRuntimes.get(runtime.data.source)
  const target = nodeRuntimes.get(runtime.data.target)

  if (!source || !target) {
    runtime.line.visible = false
    return
  }

  runtime.line.visible = true
  runtime.line.geometry.setFromPoints([source.position, target.position])
}

const focusPositions = (
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  positions: THREE.Vector3[],
  distanceMultiplier = 1,
) => {
  if (positions.length === 0) {
    return
  }

  const box = new THREE.Box3()
  for (const position of positions) {
    box.expandByPoint(position)
  }

  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  const maxDimension = Math.max(size.x, size.y, size.z, 48) * distanceMultiplier
  const fov = (camera.fov * Math.PI) / 180
  const distance = maxDimension / (2 * Math.tan(fov / 2)) + 48
  const direction = new THREE.Vector3(0.72, 0.45, 1).normalize()

  camera.position.copy(center.clone().add(direction.multiplyScalar(distance)))
  controls.target.copy(center)
  controls.update()
}

export const ForceGraphPanel = () => {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const labelRendererRef = useRef<CSS2DRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const nodeRuntimesRef = useRef(new Map<string, NodeRuntime>())
  const linkRuntimesRef = useRef(new Map<string, LinkRuntime>())
  const autoFramedRef = useRef(false)
  const hoverNodeIdRef = useRef<string | undefined>(undefined)
  const dragNodeIdRef = useRef<string | undefined>(undefined)
  const dragPlaneRef = useRef(new THREE.Plane())
  const pointerRef = useRef(new THREE.Vector2())
  const raycasterRef = useRef(new THREE.Raycaster())
  const {
    width,
    height,
  } = useElementSize(stageRef)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>(undefined)

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

  useEffect(() => {
    hoverNodeIdRef.current = hoveredNodeId
  }, [hoveredNodeId])

  useEffect(() => {
    const stageElement = stageRef.current

    if (!stageElement || rendererRef.current) {
      return
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor('#040913')

    const labelRenderer = new CSS2DRenderer()
    labelRenderer.domElement.className = 'graph-label-layer'
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.inset = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    labelRenderer.domElement.style.overflow = 'hidden'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1800)
    camera.position.set(0, 20, graphBehaviorManifest.defaultCameraDistance)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 52
    controls.maxDistance = 760

    const ambient = new THREE.AmbientLight('#9ed6ff', 1.3)
    const keyLight = new THREE.PointLight('#7fdfff', 1.45)
    keyLight.position.set(140, 180, 120)

    const rimLight = new THREE.PointLight('#ffd087', 0.72)
    rimLight.position.set(-160, -100, -110)

    const grid = new THREE.GridHelper(520, 28, '#2c4962', '#0f2130')
    grid.position.y = -132
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.18

    scene.add(ambient)
    scene.add(keyLight)
    scene.add(rimLight)
    scene.add(grid)

    rendererRef.current = renderer
    labelRendererRef.current = labelRenderer
    cameraRef.current = camera
    sceneRef.current = scene
    controlsRef.current = controls
    stageElement.replaceChildren(renderer.domElement, labelRenderer.domElement)
    const nodeRuntimes = nodeRuntimesRef.current
    const linkRuntimes = linkRuntimesRef.current

    const handlePointerMove = (event: PointerEvent) => {
      const rendererElement = renderer.domElement
      const rect = rendererElement.getBoundingClientRect()

      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera(pointerRef.current, camera)

      const draggedNodeId = dragNodeIdRef.current
      if (draggedNodeId) {
        const runtime = nodeRuntimesRef.current.get(draggedNodeId)
        if (!runtime) {
          return
        }

        const nextPoint = new THREE.Vector3()
        if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, nextPoint)) {
          runtime.position.copy(nextPoint)
          runtime.velocity.set(0, 0, 0)
          runtime.mesh.position.copy(nextPoint)
          runtime.halo.position.copy(nextPoint)
        }
        return
      }

      const intersections = raycasterRef.current.intersectObjects(
        [...nodeRuntimesRef.current.values()].map((entry) => entry.mesh),
        false,
      )
      const nextHoveredId = intersections[0]?.object.userData.nodeId as string | undefined
      if (hoverNodeIdRef.current !== nextHoveredId) {
        setHoveredNodeId(nextHoveredId)
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const rendererElement = renderer.domElement
      const rect = rendererElement.getBoundingClientRect()

      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera(pointerRef.current, camera)

      const intersections = raycasterRef.current.intersectObjects(
        [...nodeRuntimesRef.current.values()].map((entry) => entry.mesh),
        false,
      )
      const hitNodeId = intersections[0]?.object.userData.nodeId as string | undefined

      if (!hitNodeId) {
        selectNode(undefined)
        return
      }

      const runtime = nodeRuntimesRef.current.get(hitNodeId)
      if (!runtime) {
        return
      }

      selectNode(hitNodeId)
      dragNodeIdRef.current = hitNodeId
      controls.enabled = false

      const planeNormal = new THREE.Vector3()
      camera.getWorldDirection(planeNormal)
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(
        planeNormal,
        runtime.position.clone(),
      )
    }

    const handlePointerUp = () => {
      const draggedNodeId = dragNodeIdRef.current
      dragNodeIdRef.current = undefined
      controls.enabled = true

      if (!draggedNodeId) {
        return
      }

      const runtime = nodeRuntimesRef.current.get(draggedNodeId)
      if (!runtime) {
        return
      }

      updateGraphNodePosition(draggedNodeId, {
        x: Number(runtime.position.x.toFixed(2)),
        y: Number(runtime.position.y.toFixed(2)),
        z: Number(runtime.position.z.toFixed(2)),
      })
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)

    const animate = () => {
      const currentNodes = [...nodeRuntimesRef.current.values()]
      const currentLinks = [...linkRuntimesRef.current.values()]

      if (currentNodes.length > 0) {
        for (let index = 0; index < currentNodes.length; index += 1) {
          const node = currentNodes[index]

          if (dragNodeIdRef.current === node.data.id) {
            continue
          }

          const clusterOrigin = graphClusters[node.data.cluster]?.origin ?? { x: 0, y: 0, z: 0 }
          node.velocity.add(
            new THREE.Vector3(clusterOrigin.x, clusterOrigin.y, clusterOrigin.z)
              .sub(node.position)
              .multiplyScalar(0.0012),
          )

          for (let otherIndex = index + 1; otherIndex < currentNodes.length; otherIndex += 1) {
            const other = currentNodes[otherIndex]
            const direction = node.position.clone().sub(other.position)
            const distance = Math.max(direction.length(), 16)
            const repulsion = 920 / (distance * distance)
            direction.normalize().multiplyScalar(repulsion)

            if (dragNodeIdRef.current !== node.data.id) {
              node.velocity.add(direction)
            }

            if (dragNodeIdRef.current !== other.data.id) {
              other.velocity.sub(direction)
            }
          }
        }

        for (const link of currentLinks) {
          const source = nodeRuntimesRef.current.get(link.data.source)
          const target = nodeRuntimesRef.current.get(link.data.target)
          if (!source || !target) {
            continue
          }

          const direction = target.position.clone().sub(source.position)
          const distance = Math.max(direction.length(), 1)
          const idealDistance = graphBehaviorManifest.linkDistance + 24
          const stretch = distance - idealDistance
          const spring = direction.normalize().multiplyScalar(stretch * 0.0036)

          if (dragNodeIdRef.current !== source.data.id) {
            source.velocity.add(spring)
          }

          if (dragNodeIdRef.current !== target.data.id) {
            target.velocity.sub(spring)
          }
        }

        for (const node of currentNodes) {
          if (dragNodeIdRef.current !== node.data.id) {
            node.velocity.multiplyScalar(0.9)
            node.velocity.clampLength(0, 2.8)
            node.position.add(node.velocity)
          }

          node.mesh.position.copy(node.position)
          node.halo.position.copy(node.position)
        }

        for (const link of currentLinks) {
          updateLinkGeometry(link, nodeRuntimesRef.current)
        }
      }

      controls.update()
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
      animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }

      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)

      controls.dispose()
      renderer.dispose()
      if (stageElement.contains(labelRenderer.domElement)) {
        stageElement.removeChild(labelRenderer.domElement)
      }
      if (stageElement.contains(renderer.domElement)) {
        stageElement.removeChild(renderer.domElement)
      }

      rendererRef.current = null
      labelRendererRef.current = null
      cameraRef.current = null
      sceneRef.current = null
      controlsRef.current = null
      nodeRuntimes.clear()
      linkRuntimes.clear()
    }
  }, [selectNode, updateGraphNodePosition])

  useEffect(() => {
    const renderer = rendererRef.current
    const labelRenderer = labelRendererRef.current
    const camera = cameraRef.current
    if (!renderer || !labelRenderer || !camera || width <= 0 || height <= 0) {
      return
    }

    renderer.setSize(width, height)
    labelRenderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }, [width, height])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) {
      return
    }

    const nodeRuntimes = nodeRuntimesRef.current
    const nextNodeIds = new Set(filtered.nodes.map((node) => node.id))

    for (const [nodeId, runtime] of nodeRuntimes) {
      if (nextNodeIds.has(nodeId)) {
        continue
      }

      scene.remove(runtime.mesh)
      scene.remove(runtime.halo)
      runtime.mesh.remove(runtime.label)
      runtime.mesh.geometry.dispose()
      runtime.mesh.material.dispose()
      runtime.halo.geometry.dispose()
      runtime.halo.material.dispose()
      nodeRuntimes.delete(nodeId)
    }

    for (const node of filtered.nodes) {
      const visual = nodeCategoryVisuals[node.category]
      let runtime = nodeRuntimes.get(node.id)

      if (!runtime) {
        const geometry = new THREE.SphereGeometry(visual.size, 20, 20)
        const material = new THREE.MeshStandardMaterial({
          color: visual.color,
        })
        const haloGeometry = new THREE.SphereGeometry(visual.size * 1.4, 18, 18)
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: visual.accent,
          transparent: true,
          opacity: 0.08,
          side: THREE.BackSide,
        })

        const mesh = new THREE.Mesh(geometry, material)
        const halo = new THREE.Mesh(haloGeometry, haloMaterial)
        const labelElement = document.createElement('div')
        labelElement.className = 'graph-node-label'
        labelElement.textContent = node.title
        const label = new CSS2DObject(labelElement)
        const position = createInitialPosition(node)

        mesh.userData.nodeId = node.id
        mesh.position.copy(position)
        halo.position.copy(position)
        label.position.set(0, visual.size + 10, 0)
        mesh.add(label)

        runtime = {
          data: node,
          mesh,
          halo,
          label,
          position,
          velocity: new THREE.Vector3(),
        }

        nodeRuntimes.set(node.id, runtime)
        scene.add(mesh)
        scene.add(halo)
      } else {
        runtime.data = node
      }

      updateNodeVisual({
        runtime,
        selectedNodeId: ui.selectedNodeId,
        hoveredNodeId,
        directNeighbors: filtered.directNeighbors,
      })
      updateNodeLabel({
        runtime,
        showLabels: ui.showLabels,
        selectedNodeId: ui.selectedNodeId,
        hoveredNodeId,
        directNeighbors: filtered.directNeighbors,
      })
    }

    const linkRuntimes = linkRuntimesRef.current
    const nextLinkIds = new Set(filtered.links.map((link) => link.id))

    for (const [linkId, runtime] of linkRuntimes) {
      if (nextLinkIds.has(linkId)) {
        continue
      }

      scene.remove(runtime.line)
      runtime.line.geometry.dispose()
      runtime.line.material.dispose()
      linkRuntimes.delete(linkId)
    }

    for (const link of filtered.links) {
      let runtime = linkRuntimes.get(link.id)

      if (!runtime) {
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.LineBasicMaterial({
          color: '#355268',
          transparent: true,
          opacity: graphBehaviorManifest.linkOpacity,
        })
        const line = new THREE.Line(geometry, material)

        runtime = {
          data: link,
          line,
        }

        linkRuntimes.set(link.id, runtime)
        scene.add(line)
      } else {
        runtime.data = link
      }

      updateLinkVisual({
        runtime,
        selectedNodeId: ui.selectedNodeId,
      })
      updateLinkGeometry(runtime, nodeRuntimes)
    }
  }, [filtered.directNeighbors, filtered.links, filtered.nodes, hoveredNodeId, ui.selectedNodeId, ui.showLabels])

  useEffect(() => {
    if (autoFramedRef.current || filtered.nodes.length === 0) {
      return
    }

    const timer = window.setTimeout(() => {
      const camera = cameraRef.current
      const controls = controlsRef.current
      if (!camera || !controls) {
        return
      }

      focusPositions(
        camera,
        controls,
        [...nodeRuntimesRef.current.values()].map((runtime) => runtime.position),
        1.18,
      )
      autoFramedRef.current = true
    }, 420)

    return () => window.clearTimeout(timer)
  }, [filtered.nodes.length])

  const handleZoomToFit = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) {
      return
    }

    focusPositions(
      camera,
      controls,
      [...nodeRuntimesRef.current.values()].map((runtime) => runtime.position),
      1.2,
    )
  }

  const handleFocusSelected = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    const selectedNodeId = ui.selectedNodeId
    if (!camera || !controls || !selectedNodeId) {
      return
    }

    const runtime = nodeRuntimesRef.current.get(selectedNodeId)
    if (!runtime) {
      handleZoomToFit()
      return
    }

    focusPositions(camera, controls, [runtime.position], 1.55)
    selectNode(selectedNodeId)
  }

  return (
    <section className="graph-panel">
      <div className="graph-overlay graph-overlay--left">
        <div>
          <p className="graph-overlay__eyebrow">3D workspace</p>
          <strong>Floating knowledge graph</strong>
          <p>Rotate, zoom, and drag nodes to reorganize the AI lab spatially.</p>
          <p>{filtered.nodes.length} visible nodes</p>
          {ui.selectedNodeId ? (
            <p>
              Selected:{' '}
              {filtered.nodes.find((node) => node.id === ui.selectedNodeId)?.title ?? ui.selectedNodeId}
            </p>
          ) : null}
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
        <button type="button" onClick={handleZoomToFit}>
          Zoom to fit
        </button>
        <button type="button" onClick={handleFocusSelected}>
          Focus selected
        </button>
      </div>

      <div className="graph-stage" ref={stageRef} />
    </section>
  )
}
