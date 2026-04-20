import { componentRegistry, sampleCircuitRegistry } from '../memory/contentRegistry'
import { performanceConfig } from '../memory/performanceConfig'
import type {
  BoardPlacementMode,
  CircuitDocument,
  ComponentDefinition,
  ComponentInstance,
  Point,
  PrimitiveValue,
  SampleCircuitDefinition,
  SelectionState,
  Wire,
  WireEndpoint,
} from '../memory/types'
import { createId } from './ids'

export const nowIso = (): string => new Date().toISOString()

export const cloneCircuit = (circuit: CircuitDocument): CircuitDocument => structuredClone(circuit)

export const createComponentInstance = (typeId: string, position: Point): ComponentInstance => {
  const definition = componentRegistry[typeId]

  const params = Object.fromEntries(
    definition.parameters.map((parameter) => [parameter.id, parameter.defaultValue]),
  ) as Record<string, PrimitiveValue>

  return {
    id: createId(typeId),
    typeId,
    position,
    rotation: 0,
    flipX: false,
    params,
  }
}

export const createBlankCircuit = (
  name = 'New Sandbox Circuit',
  placementMode: BoardPlacementMode = 'grid',
): CircuitDocument => {
  const createdAt = nowIso()

  return {
    id: createId('circuit'),
    name,
    description: 'A blank freeform circuit board.',
    mode: 'sandbox',
    components: [],
    wires: [],
    board: {
      placementMode,
      zoom: performanceConfig.defaultBoardZoom,
      pan: performanceConfig.defaultBoardPan,
      showGrid: true,
    },
    createdAt,
    updatedAt: createdAt,
    tags: ['sandbox'],
  }
}

export const loadSampleCircuit = (sampleId: string): SampleCircuitDefinition | undefined =>
  sampleCircuitRegistry[sampleId]

export const stampCircuit = (circuit: CircuitDocument, overrides: Partial<CircuitDocument> = {}): CircuitDocument => ({
  ...cloneCircuit(circuit),
  ...overrides,
  updatedAt: nowIso(),
})

export const getComponentDefinition = (component: ComponentInstance): ComponentDefinition =>
  componentRegistry[component.typeId]

export const getTerminalKey = (endpoint: WireEndpoint): string => `${endpoint.componentId}:${endpoint.terminalId}`

export const getWireKey = (wire: Wire): string => {
  const a = getTerminalKey(wire.from)
  const b = getTerminalKey(wire.to)
  return [a, b].sort().join('|')
}

export const mergeRecentIds = (incomingId: string, existingIds: string[], limit = 6): string[] => {
  const next = [incomingId, ...existingIds.filter((id) => id !== incomingId)]
  return next.slice(0, limit)
}

export const removeComponentsFromCircuit = (
  circuit: CircuitDocument,
  selection: SelectionState,
): CircuitDocument => {
  const selectedIds = new Set(selection.componentIds)
  const selectedWireIds = new Set(selection.wireIds)

  return stampCircuit({
    ...circuit,
    components: circuit.components.filter((component) => !selectedIds.has(component.id)),
    wires: circuit.wires.filter(
      (wire) =>
        !selectedWireIds.has(wire.id) &&
        !selectedIds.has(wire.from.componentId) &&
        !selectedIds.has(wire.to.componentId),
    ),
  })
}

export const updateComponentInCircuit = (
  circuit: CircuitDocument,
  componentId: string,
  recipe: (component: ComponentInstance) => ComponentInstance,
): CircuitDocument =>
  stampCircuit({
    ...circuit,
    components: circuit.components.map((component) =>
      component.id === componentId ? recipe(component) : component,
    ),
  })
