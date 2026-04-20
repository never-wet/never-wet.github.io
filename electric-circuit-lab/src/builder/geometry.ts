import { componentRegistry } from '../memory/contentRegistry'
import { performanceConfig } from '../memory/performanceConfig'
import type { ComponentInstance, Point, TerminalDefinition, WireEndpoint } from '../memory/types'

export const snapPoint = (point: Point, enabled: boolean): Point => {
  if (!enabled) {
    return point
  }

  const grid = performanceConfig.gridSize
  return {
    x: Math.round(point.x / grid) * grid,
    y: Math.round(point.y / grid) * grid,
  }
}

export const screenToWorld = (screen: Point, pan: Point, zoom: number): Point => ({
  x: (screen.x - pan.x) / zoom,
  y: (screen.y - pan.y) / zoom,
})

export const worldToScreen = (world: Point, pan: Point, zoom: number): Point => ({
  x: world.x * zoom + pan.x,
  y: world.y * zoom + pan.y,
})

const rotatePoint = (point: Point, rotation: ComponentInstance['rotation']): Point => {
  switch (rotation) {
    case 90:
      return { x: -point.y, y: point.x }
    case 180:
      return { x: -point.x, y: -point.y }
    case 270:
      return { x: point.y, y: -point.x }
    default:
      return point
  }
}

export const getTerminalWorldPosition = (
  component: ComponentInstance,
  terminal: TerminalDefinition,
): Point => {
  const mirrored = component.flipX ? { x: -terminal.x, y: terminal.y } : { x: terminal.x, y: terminal.y }
  const rotated = rotatePoint(mirrored, component.rotation)

  return {
    x: component.position.x + rotated.x,
    y: component.position.y + rotated.y,
  }
}

export const getEndpointWorldPosition = (
  endpoint: WireEndpoint,
  components: ComponentInstance[],
): Point | null => {
  const component = components.find((entry) => entry.id === endpoint.componentId)

  if (!component) {
    return null
  }

  const definition = componentRegistry[component.typeId]
  const terminal = definition.terminals.find((entry) => entry.id === endpoint.terminalId)

  if (!terminal) {
    return null
  }

  return getTerminalWorldPosition(component, terminal)
}

export const getWirePath = (from: Point, to: Point): string => {
  const deltaX = to.x - from.x
  const bend = from.x + deltaX * 0.5

  return `M ${from.x} ${from.y} H ${bend} V ${to.y} H ${to.x}`
}

export const getComponentFrame = (component: ComponentInstance) => {
  const definition = componentRegistry[component.typeId]

  return {
    width: definition.defaultSize.width,
    height: definition.defaultSize.height,
  }
}
