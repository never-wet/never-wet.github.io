import type { ComponentDefinition } from '../memory/types'

interface ComponentGlyphProps {
  component: ComponentDefinition
  className?: string
}

const renderSwitch = (typeId: string) => {
  if (typeId === 'push-button') {
    return (
      <>
        <line x1="-22" y1="9" x2="-8" y2="9" />
        <line x1="8" y1="9" x2="22" y2="9" />
        <line x1="-8" y1="9" x2="10" y2="-2" />
        <rect x="-7" y="-11" width="14" height="8" rx="3" />
      </>
    )
  }

  return (
    <>
      <line x1="-22" y1="8" x2="-10" y2="8" />
      <line x1="-10" y1="8" x2="10" y2="-6" />
      <line x1="10" y1="8" x2="22" y2="8" />
    </>
  )
}

const renderGateBody = (label: string, bubble = false, xor = false) => (
  <>
    {xor && <path d="M -22 -16 C -17 -10 -17 10 -22 16" />}
    <path d="M -20 -16 H -2 C 9 -16 18 -8 18 0 C 18 8 9 16 -2 16 H -20 Z" />
    {bubble && <circle cx="21" cy="0" r="2.5" fill="currentColor" stroke="none" />}
    <text x="-2" y="4" textAnchor="middle" fontSize="6.2" fontWeight="800" fill="currentColor" stroke="none">
      {label}
    </text>
  </>
)

export const ComponentGlyph = ({ component, className }: ComponentGlyphProps) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="-28 -28 56 56"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    >
      {(component.id === 'battery' || component.id === 'voltage-source') && (
        <>
          {component.id === 'battery' ? (
            <>
              <line x1="-9" y1="-12" x2="-9" y2="12" />
              <line x1="7" y1="-18" x2="7" y2="18" />
            </>
          ) : (
            <>
              <circle cx="0" cy="0" r="12" />
              <path d="M -5 0 H 5 M 0 -5 V 5" />
            </>
          )}
        </>
      )}

      {component.id === 'ground' && (
        <>
          <line x1="0" y1="-16" x2="0" y2="-4" />
          <line x1="-12" y1="-4" x2="12" y2="-4" />
          <line x1="-8" y1="3" x2="8" y2="3" />
          <line x1="-4" y1="10" x2="4" y2="10" />
        </>
      )}

      {component.id === 'resistor' && <polyline points="-18,0 -12,-8 -6,8 0,-8 6,8 12,-8 18,0" />}

      {component.id === 'capacitor' && (
        <>
          <line x1="-5" y1="-16" x2="-5" y2="16" />
          <line x1="5" y1="-16" x2="5" y2="16" />
        </>
      )}

      {component.id === 'inductor' && <path d="M -18 0 C -14 -10 -8 -10 -4 0 C 0 10 6 10 10 0 C 14 -10 20 -10 24 0" />}

      {(component.id === 'led' || component.id === 'diode') && (
        <>
          <path d="M -14 -10 L 4 0 L -14 10 Z" />
          <line x1="8" y1="-11" x2="8" y2="11" />
          {component.id === 'led' && (
            <>
              <line x1="12" y1="-16" x2="21" y2="-23" />
              <line x1="16" y1="-13" x2="21" y2="-23" />
              <line x1="12" y1="-1" x2="21" y2="-8" />
              <line x1="16" y1="2" x2="21" y2="-8" />
            </>
          )}
        </>
      )}

      {component.id === 'lamp' && (
        <>
          <circle cx="0" cy="0" r="14" />
          <line x1="-7" y1="-7" x2="7" y2="7" />
          <line x1="-7" y1="7" x2="7" y2="-7" />
        </>
      )}

      {component.id === 'output-indicator' && (
        <>
          <circle cx="0" cy="0" r="13" />
          <circle cx="0" cy="0" r="5.5" />
        </>
      )}

      {(component.id === 'switch' || component.id === 'push-button') && renderSwitch(component.id)}

      {component.id === 'transistor' && (
        <>
          <circle cx="0" cy="0" r="16" />
          <line x1="-17" y1="7" x2="-3" y2="1" />
          <line x1="0" y1="-16" x2="0" y2="-2" />
          <line x1="9" y1="11" x2="2" y2="2" />
          <line x1="5" y1="11" x2="12" y2="11" />
        </>
      )}

      {component.id === 'and-gate' && renderGateBody('AND')}
      {component.id === 'or-gate' && renderGateBody('OR')}
      {component.id === 'not-gate' && renderGateBody('NOT', true)}
      {component.id === 'nand-gate' && renderGateBody('NAND', true)}
      {component.id === 'nor-gate' && renderGateBody('NOR', true)}
      {component.id === 'xor-gate' && renderGateBody('XOR', false, true)}

      {(component.id === 'light-sensor' ||
        component.id === 'temperature-sensor' ||
        component.id === 'proximity-sensor') && (
        <>
          <rect x="-16" y="-11" width="32" height="22" rx="7" />
          <path d="M -8 0 C -4 -6 4 -6 8 0 C 4 6 -4 6 -8 0" />
        </>
      )}
    </svg>
  )
}
