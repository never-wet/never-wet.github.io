import { componentRegistry } from '../memory/contentRegistry'
import type { CircuitDocument, SimulationWarning } from '../memory/types'
import { getWireKey } from '../utils/circuit'

export const validateCircuit = (circuit: CircuitDocument): SimulationWarning[] => {
  const warnings: SimulationWarning[] = []
  const wireKeys = new Set<string>()

  for (const wire of circuit.wires) {
    const fromComponent = circuit.components.find((component) => component.id === wire.from.componentId)
    const toComponent = circuit.components.find((component) => component.id === wire.to.componentId)

    if (!fromComponent || !toComponent) {
      warnings.push({
        id: `wire-missing-${wire.id}`,
        severity: 'error',
        message: 'A wire references a missing component.',
        relatedIds: [wire.id],
      })
      continue
    }

    if (wire.from.componentId === wire.to.componentId && wire.from.terminalId === wire.to.terminalId) {
      warnings.push({
        id: `wire-self-${wire.id}`,
        severity: 'warning',
        message: 'A wire starts and ends on the same terminal.',
        relatedIds: [wire.id],
      })
    }

    const key = getWireKey(wire)
    if (wireKeys.has(key)) {
      warnings.push({
        id: `wire-duplicate-${wire.id}`,
        severity: 'warning',
        message: 'Duplicate wires connect the same pair of terminals.',
        relatedIds: [wire.id],
      })
    }

    wireKeys.add(key)
  }

  for (const component of circuit.components) {
    const definition = componentRegistry[component.typeId]
    const connectedTerminals = new Set<string>()

    for (const wire of circuit.wires) {
      if (wire.from.componentId === component.id) {
        connectedTerminals.add(wire.from.terminalId)
      }
      if (wire.to.componentId === component.id) {
        connectedTerminals.add(wire.to.terminalId)
      }
    }

    if (connectedTerminals.size === 0) {
      warnings.push({
        id: `floating-${component.id}`,
        severity: 'info',
        message: `${definition.name} is floating and not connected yet.`,
        relatedIds: [component.id],
      })
      continue
    }

    if (definition.terminals.length > 1 && connectedTerminals.size < definition.terminals.length) {
      warnings.push({
        id: `partial-${component.id}`,
        severity: 'info',
        message: `${definition.name} has unconnected terminals.`,
        relatedIds: [component.id],
      })
    }
  }

  return warnings
}
