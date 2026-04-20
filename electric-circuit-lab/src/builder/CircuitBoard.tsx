import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from 'react'
import { componentRegistry } from '../memory/contentRegistry'
import { performanceConfig } from '../memory/performanceConfig'
import type { Point } from '../memory/types'
import { useCircuitLab } from '../state/CircuitLabContext'
import { getEndpointWorldPosition, getWirePath, screenToWorld } from './geometry'
import { ComponentSymbol } from './ComponentSymbol'

type BoardInteraction =
  | {
      kind: 'pan'
      startScreen: Point
      startPan: Point
    }
  | {
      kind: 'drag'
      startScreen: Point
      startPositions: Record<string, Point>
      componentIds: string[]
    }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const atomPalette = ['atom-particle is-primary', 'atom-particle is-secondary', 'atom-particle is-tertiary'] as const

export const CircuitBoard = () => {
  const {
    state,
    addComponent,
    clearSelection,
    selectComponent,
    selectWire,
    moveComponents,
    startWire,
    finishWire,
    updateDraftPointer,
    setBoardViewport,
  } = useCircuitLab()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [interaction, setInteraction] = useState<BoardInteraction | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const handleNativeWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault()

      const local = getLocalPoint(event.clientX, event.clientY)
      if (!local) {
        return
      }

      const worldBefore = screenToWorld(local, state.currentCircuit.board.pan, state.currentCircuit.board.zoom)
      const direction = event.deltaY < 0 ? 1 : -1
      const nextZoom = clamp(
        state.currentCircuit.board.zoom + direction * performanceConfig.zoomStep,
        performanceConfig.minZoom,
        performanceConfig.maxZoom,
      )
      const nextPan = {
        x: local.x - worldBefore.x * nextZoom,
        y: local.y - worldBefore.y * nextZoom,
      }

      setBoardViewport(nextPan, nextZoom)
    }

    container.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleNativeWheel)
  }, [setBoardViewport, state.currentCircuit.board.pan, state.currentCircuit.board.zoom])

  const getLocalPoint = (clientX: number, clientY: number): Point | null => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) {
      return null
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const getWorldPoint = (clientX: number, clientY: number): Point | null => {
    const local = getLocalPoint(clientX, clientY)
    if (!local) {
      return null
    }

    return screenToWorld(local, state.currentCircuit.board.pan, state.currentCircuit.board.zoom)
  }

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const local = getLocalPoint(event.clientX, event.clientY)
      const world = getWorldPoint(event.clientX, event.clientY)

      if (state.draftWire && world) {
        updateDraftPointer(world)
      }

      if (!interaction || !local) {
        return
      }

      if (interaction.kind === 'pan') {
        setBoardViewport(
          {
            x: interaction.startPan.x + (local.x - interaction.startScreen.x),
            y: interaction.startPan.y + (local.y - interaction.startScreen.y),
          },
          state.currentCircuit.board.zoom,
        )
      }

      if (interaction.kind === 'drag') {
        const deltaWorld = {
          x: (local.x - interaction.startScreen.x) / state.currentCircuit.board.zoom,
          y: (local.y - interaction.startScreen.y) / state.currentCircuit.board.zoom,
        }

        moveComponents(
          interaction.componentIds.map((id) => ({
            id,
            position: {
              x: interaction.startPositions[id].x + deltaWorld.x,
              y: interaction.startPositions[id].y + deltaWorld.y,
            },
          })),
        )
      }
    }

    const handlePointerUp = () => {
      setInteraction(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [
    interaction,
    moveComponents,
    setBoardViewport,
    state.currentCircuit.board.pan,
    state.currentCircuit.board.zoom,
    state.draftWire,
    updateDraftPointer,
  ])

  const handleComponentPointerDown = (componentId: string, event: PointerEvent<SVGGElement>) => {
    event.stopPropagation()

    if (event.shiftKey) {
      selectComponent(componentId, true)
      return
    }

    const local = getLocalPoint(event.clientX, event.clientY)
    if (!local) {
      return
    }

    const isSelected = state.selection.componentIds.includes(componentId)
    const componentIds = isSelected ? state.selection.componentIds : [componentId]
    const startPositions = Object.fromEntries(
      state.currentCircuit.components
        .filter((component) => componentIds.includes(component.id))
        .map((component) => [component.id, component.position]),
    )

    if (!isSelected) {
      selectComponent(componentId, false)
    }

    setInteraction({
      kind: 'drag',
      startScreen: local,
      startPositions,
      componentIds,
    })
  }

  const handleBackgroundPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return
    }

    const local = getLocalPoint(event.clientX, event.clientY)
    if (!local) {
      return
    }

    clearSelection()
    setInteraction({
      kind: 'pan',
      startScreen: local,
      startPan: state.currentCircuit.board.pan,
    })
  }

  const addAtDropPoint = (typeId: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const point = getWorldPoint(event.clientX, event.clientY)
    if (point) {
      addComponent(typeId, point)
    }
  }

  const activeComponents = new Set(state.simulationResult?.activePathComponentIds ?? [])
  const minorGridSize = performanceConfig.gridSize * state.currentCircuit.board.zoom
  const majorGridSize = minorGridSize * 4
  const wireVisuals = state.currentCircuit.wires
    .map((wire) => {
      const from = getEndpointWorldPosition(wire.from, state.currentCircuit.components)
      const to = getEndpointWorldPosition(wire.to, state.currentCircuit.components)

      if (!from || !to) {
        return null
      }

      return {
        wire,
        from,
        to,
        path: getWirePath(from, to),
        isActive: activeComponents.has(wire.from.componentId) && activeComponents.has(wire.to.componentId),
        isSelected: state.selection.wireIds.includes(wire.id),
      }
    })
    .filter((visual): visual is NonNullable<typeof visual> => Boolean(visual))

  const atomMotionEnabled = state.simulationPreferences.highlightCurrent
  const estimatedCurrent = Math.max(0, state.simulationResult?.estimatedCurrent ?? 0)
  const atomParticleCount = estimatedCurrent > 0 ? Math.min(8, Math.max(3, Math.round(estimatedCurrent * 80) + 2)) : 4
  const atomTravelDuration = Math.max(0.9, 2.8 - Math.min(1.6, estimatedCurrent * 18))

  return (
    <div
      className="board-surface"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const typeId = event.dataTransfer.getData('text/circuit-component')
        if (typeId) {
          addAtDropPoint(typeId, event)
        }
      }}
      ref={containerRef}
      style={{
        backgroundImage: state.currentCircuit.board.showGrid
          ? [
              'linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px)',
              'linear-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(255, 255, 255, 0.09) 1px, transparent 1px)',
            ].join(', ')
          : 'none',
        backgroundSize: `${minorGridSize}px ${minorGridSize}px, ${minorGridSize}px ${minorGridSize}px, ${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px`,
        backgroundPosition: `${state.currentCircuit.board.pan.x}px ${state.currentCircuit.board.pan.y}px, ${state.currentCircuit.board.pan.x}px ${state.currentCircuit.board.pan.y}px, ${state.currentCircuit.board.pan.x}px ${state.currentCircuit.board.pan.y}px, ${state.currentCircuit.board.pan.x}px ${state.currentCircuit.board.pan.y}px`,
      }}
    >
      <svg className="board-svg" onPointerDown={handleBackgroundPointerDown}>
        <g
          transform={`translate(${state.currentCircuit.board.pan.x} ${state.currentCircuit.board.pan.y}) scale(${state.currentCircuit.board.zoom})`}
        >
          {wireVisuals.map(({ wire, path, isActive, isSelected }) => (
            <path
              key={wire.id}
              className={isActive ? 'wire-path is-active' : isSelected ? 'wire-path is-selected' : 'wire-path'}
              d={path}
              onPointerDown={(event) => {
                event.stopPropagation()
                selectWire(wire.id, event.shiftKey)
              }}
            />
          ))}

          {atomMotionEnabled &&
            wireVisuals
              .filter((visual) => visual.isActive)
              .map(({ wire, path }) => (
                <g className="atom-flow-group" key={`atoms-${wire.id}`}>
                  {Array.from({ length: atomParticleCount }).map((_, index) => {
                    const beginOffset = (atomTravelDuration / atomParticleCount) * index
                    const atomClass = atomPalette[index % atomPalette.length]
                    const atomRadius = index % 3 === 1 ? 2.1 : index % 3 === 2 ? 1.7 : 2.7

                    return (
                      <circle className={atomClass} key={`${wire.id}-atom-${index}`} r={atomRadius}>
                        <animateMotion
                          begin={`${beginOffset}s`}
                          dur={`${atomTravelDuration}s`}
                          path={path}
                          repeatCount="indefinite"
                          rotate="auto"
                        />
                        <animate
                          attributeName="opacity"
                          begin={`${beginOffset}s`}
                          dur={`${atomTravelDuration}s`}
                          repeatCount="indefinite"
                          values="0;1;1;0"
                        />
                      </circle>
                    )
                  })}
                </g>
              ))}

          {state.draftWire && (() => {
            const from = getEndpointWorldPosition(state.draftWire.start, state.currentCircuit.components)
            const to = state.draftWire.pointer

            if (!from || !to) {
              return null
            }

            return <path className="wire-path is-draft" d={getWirePath(from, to)} />
          })()}

          {state.currentCircuit.components.map((component) => {
            const definition = componentRegistry[component.typeId]
            const isSelected = state.selection.componentIds.includes(component.id)
            const simulationState = state.simulationResult?.componentStates[component.id]

            return (
              <g
                key={component.id}
                transform={`translate(${component.position.x} ${component.position.y}) rotate(${component.rotation}) scale(${component.flipX ? -1 : 1} 1)`}
              >
                {atomMotionEnabled && simulationState?.status === 'powered' && (
                  <g className="atom-orbit" pointerEvents="none">
                    <animateTransform
                      additive="sum"
                      attributeName="transform"
                      dur={`${Math.max(1.6, atomTravelDuration + 0.5)}s`}
                      from="0 0 0"
                      repeatCount="indefinite"
                      to="360 0 0"
                      type="rotate"
                    />
                    <circle className="atom-orbit-dot is-primary" cx="0" cy={-Math.max(20, definition.defaultSize.height * 0.42)} r="2.4" />
                    <circle className="atom-orbit-dot is-secondary" cx={Math.max(18, definition.defaultSize.width * 0.38)} cy="0" r="1.8" />
                    <circle className="atom-orbit-dot is-tertiary" cx="0" cy={Math.max(20, definition.defaultSize.height * 0.42)} r="1.6" />
                  </g>
                )}

                <g onPointerDown={(event) => handleComponentPointerDown(component.id, event)}>
                  <ComponentSymbol
                    component={component}
                    selected={isSelected}
                    simulationState={simulationState}
                  />
                </g>

                {definition.terminals.map((terminal) => (
                  <circle
                    className={activeComponents.has(component.id) || isSelected ? 'terminal-point is-active' : 'terminal-point'}
                    cx={terminal.x}
                    cy={terminal.y}
                    key={terminal.id}
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      if (state.draftWire) {
                        finishWire({ componentId: component.id, terminalId: terminal.id })
                      } else {
                        startWire({ componentId: component.id, terminalId: terminal.id })
                      }
                    }}
                    r={7}
                  />
                ))}
              </g>
            )
          })}
        </g>
      </svg>

      <div className="board-overlay">
        <div className="overlay-pill">Drag parts here | Click terminals to wire | Drag empty space to pan</div>
        <div className="overlay-pill">
          Zoom {Math.round(state.currentCircuit.board.zoom * 100)}% | {state.currentCircuit.components.length} parts |{' '}
          {state.currentCircuit.wires.length} wires
        </div>
      </div>
    </div>
  )
}
