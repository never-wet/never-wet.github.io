import { componentRegistry } from '../memory/contentRegistry'
import type { ComponentInstance, ComponentSimulationState } from '../memory/types'
import { formatNumber } from '../utils/format'

interface ComponentSymbolProps {
  component: ComponentInstance
  selected: boolean
  simulationState?: ComponentSimulationState
}

const internalLabelTypeIds = new Set([
  'and-gate',
  'or-gate',
  'not-gate',
  'nand-gate',
  'nor-gate',
  'xor-gate',
])

const paletteByCategory = {
  sources: { fill: 'rgba(15, 28, 35, 0.96)', stroke: '#5bc0ff', text: '#d8f3ff' },
  passive: { fill: 'rgba(36, 27, 13, 0.96)', stroke: '#f2bf58', text: '#ffe9bf' },
  outputs: { fill: 'rgba(44, 22, 18, 0.96)', stroke: '#ff9668', text: '#ffe0d0' },
  controls: { fill: 'rgba(21, 28, 50, 0.96)', stroke: '#88a6ff', text: '#e2e8ff' },
  logic: { fill: 'rgba(35, 22, 56, 0.96)', stroke: '#b7a4ff', text: '#f0ebff' },
  sensors: { fill: 'rgba(14, 39, 37, 0.96)', stroke: '#65d6cb', text: '#d3fbf7' },
  advanced: { fill: 'rgba(35, 39, 49, 0.96)', stroke: '#c6cfdb', text: '#eef3ff' },
}

const getCaption = (component: ComponentInstance): string => {
  switch (component.typeId) {
    case 'battery':
    case 'voltage-source':
      return `${formatNumber(Number(component.params.voltage ?? 0), 1)}V`
    case 'resistor':
      return `${formatNumber(Number(component.params.resistance ?? 0), 0)} ohm`
    case 'lamp':
      return `${formatNumber(Number(component.params.resistance ?? 0), 0)} ohm load`
    case 'led':
      return `${String(component.params.color ?? 'emerald')}`
    case 'switch':
      return component.params.closed ? 'closed' : 'open'
    case 'push-button':
      return component.params.pressed ? 'pressed' : 'released'
    case 'light-sensor':
      return `${formatNumber(Number(component.params.ambient ?? 0), 0)}%`
    case 'temperature-sensor':
      return `${formatNumber(Number(component.params.temperature ?? 0), 0)} C`
    case 'proximity-sensor':
      return `${formatNumber(Number(component.params.distance ?? 0), 0)}cm`
    default:
      return ''
  }
}

const renderSwitch = (closed: boolean) =>
  closed ? (
    <>
      <line x1="-34" y1="8" x2="34" y2="-12" />
      <line x1="-48" y1="8" x2="-34" y2="8" />
      <line x1="34" y1="-12" x2="48" y2="-12" />
    </>
  ) : (
    <>
      <line x1="-48" y1="8" x2="-18" y2="8" />
      <line x1="-18" y1="8" x2="24" y2="-18" />
      <line x1="24" y1="8" x2="48" y2="8" />
    </>
  )

const renderGateBody = (label: string, bubble = false) => (
  <>
    <path d="M -42 -28 H 2 C 26 -28 42 -12 42 0 C 42 12 26 28 2 28 H -42 Z" />
    {bubble && <circle cx="48" cy="0" r="5" fill="currentColor" />}
    <text x="-6" y="8" textAnchor="middle" className="board-shape-label">
      {label}
    </text>
  </>
)

const getChipText = (text: string): string => {
  if (text.length <= 14) {
    return text
  }

  return `${text.slice(0, 11)}...`
}

export const ComponentSymbol = ({ component, selected, simulationState }: ComponentSymbolProps) => {
  const definition = componentRegistry[component.typeId]
  const palette = paletteByCategory[definition.category]
  const width = definition.defaultSize.width
  const height = definition.defaultSize.height
  const caption = getCaption(component)
  const powered = simulationState?.status === 'powered'
  const stroke = powered ? '#74ff9a' : selected ? '#dce7ff' : palette.stroke
  const glowOpacity = powered ? 0.34 : selected ? 0.22 : 0.08
  const captionText =
    simulationState?.digitalHigh !== undefined
      ? simulationState.digitalHigh
        ? 'HIGH'
        : 'LOW'
      : simulationState?.current
        ? `${formatNumber(simulationState.current, 3)}A`
        : caption
  const showExternalLabel = component.typeId !== 'ground' && !internalLabelTypeIds.has(component.typeId)
  const chipCaption = captionText ? getChipText(captionText) : ''
  const labelText = getChipText(definition.shortName)

  const renderChip = (text: string, y: number, tone: 'caption' | 'label') => {
    const chipWidth = Math.max(40, Math.min(118, text.length * 6.8 + 18))
    const textColor = tone === 'caption' ? stroke : palette.text
    const chipStroke = tone === 'caption' ? stroke : palette.stroke

    return (
      <g transform={`translate(0 ${y})`}>
        <rect
          x={-chipWidth / 2}
          y={-10}
          width={chipWidth}
          height={20}
          rx={10}
          fill="rgba(10, 13, 18, 0.94)"
          stroke={chipStroke}
          strokeWidth={1.1}
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          className={tone === 'caption' ? 'board-chip-text is-caption' : 'board-chip-text'}
          fill={textColor}
        >
          {text}
        </text>
      </g>
    )
  }

  return (
    <>
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={22}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={selected ? 2.6 : 1.6}
      />
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={22}
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        opacity={glowOpacity}
      />

      <g
        fill="none"
        stroke={palette.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
        color={palette.text}
      >
        {component.typeId === 'battery' && (
          <>
            <line x1="-18" y1="-18" x2="-18" y2="18" />
            <line x1="6" y1="-28" x2="6" y2="28" />
          </>
        )}
        {component.typeId === 'voltage-source' && (
          <>
            <circle cx="0" cy="0" r="20" />
            <path d="M -8 0 H 8 M 0 -8 V 8" />
          </>
        )}
        {component.typeId === 'ground' && (
          <>
            <line x1="0" y1="-24" x2="0" y2="-6" />
            <line x1="-18" y1="-6" x2="18" y2="-6" />
            <line x1="-12" y1="4" x2="12" y2="4" />
            <line x1="-6" y1="14" x2="6" y2="14" />
          </>
        )}
        {component.typeId === 'resistor' && (
          <polyline points="-34,0 -22,-12 -10,12 2,-12 14,12 26,-12 34,0" />
        )}
        {component.typeId === 'led' && (
          <>
            <path d="M -24 -18 L 4 0 L -24 18 Z" />
            <line x1="10" y1="-20" x2="10" y2="20" />
            <line x1="14" y1="-30" x2="30" y2="-42" />
            <line x1="20" y1="-26" x2="30" y2="-42" />
            <line x1="14" y1="4" x2="30" y2="-8" />
            <line x1="20" y1="8" x2="30" y2="-8" />
          </>
        )}
        {component.typeId === 'lamp' && (
          <>
            <circle cx="0" cy="0" r="24" />
            <line x1="-12" y1="-12" x2="12" y2="12" />
            <line x1="-12" y1="12" x2="12" y2="-12" />
          </>
        )}
        {component.typeId === 'output-indicator' && (
          <>
            <circle cx="0" cy="0" r="22" />
            <circle cx="0" cy="0" r="10" />
          </>
        )}
        {component.typeId === 'switch' && renderSwitch(Boolean(component.params.closed))}
        {component.typeId === 'push-button' && (
          <>
            <line x1="-48" y1="10" x2="-18" y2="10" />
            <line x1="18" y1="10" x2="48" y2="10" />
            <line x1="-18" y1="10" x2="10" y2="-8" />
            <rect x="-12" y="-30" width="24" height="14" rx="6" />
          </>
        )}
        {component.typeId === 'capacitor' && (
          <>
            <line x1="-10" y1="-24" x2="-10" y2="24" />
            <line x1="10" y1="-24" x2="10" y2="24" />
          </>
        )}
        {component.typeId === 'inductor' && (
          <>
            <path d="M -32 0 C -24 -14 -14 -14 -8 0 C -2 14 8 14 14 0 C 20 -14 30 -14 38 0" />
          </>
        )}
        {component.typeId === 'diode' && (
          <>
            <path d="M -24 -18 L 8 0 L -24 18 Z" />
            <line x1="14" y1="-20" x2="14" y2="20" />
          </>
        )}
        {component.typeId === 'transistor' && (
          <>
            <circle cx="0" cy="0" r="26" />
            <line x1="-28" y1="14" x2="-4" y2="2" />
            <line x1="0" y1="-26" x2="0" y2="-6" />
            <line x1="16" y1="18" x2="6" y2="4" />
            <line x1="8" y1="18" x2="18" y2="18" />
          </>
        )}
        {component.typeId === 'and-gate' && renderGateBody('AND')}
        {component.typeId === 'or-gate' && renderGateBody('OR')}
        {component.typeId === 'not-gate' && renderGateBody('NOT', true)}
        {component.typeId === 'nand-gate' && renderGateBody('NAND', true)}
        {component.typeId === 'nor-gate' && renderGateBody('NOR', true)}
        {component.typeId === 'xor-gate' && (
          <>
            <path d="M -42 -28 H 2 C 26 -28 42 -12 42 0 C 42 12 26 28 2 28 H -42" />
            <path d="M -48 -28 C -38 -18 -38 18 -48 28" />
            <text x="-4" y="8" textAnchor="middle" className="board-shape-label">
              XOR
            </text>
          </>
        )}
        {(component.typeId === 'light-sensor' ||
          component.typeId === 'temperature-sensor' ||
          component.typeId === 'proximity-sensor') && (
          <>
            <rect x="-34" y="-22" width="68" height="44" rx="14" />
            <path d="M -16 0 C -8 -12 8 -12 16 0 C 8 12 -8 12 -16 0" />
          </>
        )}
      </g>

      {component.typeId !== 'ground' && (
        <>
          {chipCaption ? renderChip(chipCaption, -height / 2 - 12, 'caption') : null}
          {showExternalLabel ? renderChip(labelText, height / 2 + 12, 'label') : null}
        </>
      )}
    </>
  )
}
