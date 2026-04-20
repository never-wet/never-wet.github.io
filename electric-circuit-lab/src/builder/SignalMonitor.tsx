import { componentRegistry } from '../memory/contentRegistry'
import type { CircuitDocument, SimulationResult } from '../memory/types'
import { formatNumber } from '../utils/format'

interface SignalMonitorProps {
  circuit: CircuitDocument
  simulationResult: SimulationResult | null
}

interface MonitorChannel {
  id: string
  title: string
  detail: string
  maxLabel: string
  primaryPath: string
  secondaryPath: string
  animationDuration: number
}

const sampleCount = 96
const panelWidth = 168
const panelHeight = 54

const buildWavePath = (
  amplitude: number,
  frequency: number,
  offset: number,
  phase: number,
  width: number,
  height: number,
): string => {
  const fullWidth = width * 2
  const midY = height * 0.54 + offset
  const points: string[] = []

  for (let index = 0; index < sampleCount; index += 1) {
    const ratio = index / (sampleCount - 1)
    const x = ratio * fullWidth
    const angle = ratio * Math.PI * 2 * frequency + phase
    const y = midY - Math.sin(angle) * amplitude

    points.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  return points.join(' ')
}

const createChannel = (
  title: string,
  detail: string,
  maxLabel: string,
  amplitudeSeed: number,
  frequencySeed: number,
  phaseSeed: number,
): MonitorChannel => {
  const amplitude = 6 + Math.min(11, amplitudeSeed * 0.55)
  const secondaryAmplitude = Math.max(3.5, amplitude - 2.8)
  const frequency = Math.max(1, Math.round(1.2 + frequencySeed * 0.35))
  const secondaryFrequency = Math.max(1, frequency - 1)
  const animationDuration = Math.max(2.4, 6.2 - Math.min(3.4, frequencySeed * 0.28 + amplitudeSeed * 0.02))

  return {
    id: `${title}-${detail}`,
    title,
    detail,
    maxLabel,
    primaryPath: buildWavePath(amplitude, frequency, -2, phaseSeed, panelWidth, panelHeight),
    secondaryPath: buildWavePath(secondaryAmplitude, secondaryFrequency, 4, phaseSeed + 0.9, panelWidth, panelHeight),
    animationDuration,
  }
}

const buildChannels = (circuit: CircuitDocument, simulationResult: SimulationResult | null): MonitorChannel[] => {
  const candidateIds = simulationResult?.activePathComponentIds.length
    ? simulationResult.activePathComponentIds
    : circuit.components.map((component) => component.id)

  const channels: MonitorChannel[] = []

  for (const componentId of candidateIds) {
    const component = circuit.components.find((entry) => entry.id === componentId)
    if (!component) {
      continue
    }

    const definition = componentRegistry[component.typeId]
    const state = simulationResult?.componentStates[component.id]
    const voltageDrop = state?.voltageDrop ?? (component.typeId === 'battery' ? Number(component.params.voltage ?? 0) : 0)
    const current = state?.current ?? simulationResult?.estimatedCurrent ?? 0
    const amplitudeSeed = Math.max(4, Math.abs(voltageDrop) * 6 + current * 120)
    const frequencySeed = Math.max(1, current * 90 + (component.rotation / 90) * 0.2)
    const maxLabel =
      voltageDrop >= 1
        ? `Max=${formatNumber(voltageDrop, 3)} V`
        : `Max=${formatNumber(voltageDrop * 1000, 2)} mV`

    channels.push(
      createChannel(
        definition.name.toLowerCase(),
        (() => {
          if (component.typeId === 'resistor') {
            return `${formatNumber(Number(component.params.resistance ?? 0), 0)} ohm`
          }

          if (component.typeId === 'capacitor') {
            return `${formatNumber(Number(component.params.capacitance ?? 0), 0)} uF`
          }

          if (component.typeId === 'inductor') {
            return `${formatNumber(Number(component.params.inductance ?? 0), 0)} mH`
          }

          if (component.typeId === 'battery' || component.typeId === 'voltage-source') {
            return `${formatNumber(Number(component.params.voltage ?? 0), 1)} V`
          }

          return `${definition.shortName}`
        })(),
        maxLabel,
        amplitudeSeed,
        frequencySeed,
        current * 10 + voltageDrop * 0.15,
      ),
    )

    if (channels.length === 3) {
      break
    }
  }

  if (channels.length === 0) {
    channels.push(
      createChannel('signal preview', 'run simulation', 'Max=0 V', 8, 1, 0.3),
      createChannel('response trace', 'waiting', 'Max=0 V', 10, 1.4, 1.2),
      createChannel('reference', 'inactive', 'Max=0 V', 7, 0.9, 2.1),
    )
  }

  while (channels.length < 3) {
    const seed = channels.length + 1
    channels.push(createChannel(`channel ${seed}`, 'preview', 'Max=0 V', 8 + seed * 2, 1 + seed * 0.35, seed))
  }

  return channels
}

export const SignalMonitor = ({ circuit, simulationResult }: SignalMonitorProps) => {
  const channels = buildChannels(circuit, simulationResult)
  const timeMs = simulationResult
    ? Math.max(48, simulationResult.estimatedCurrent * 1000 + simulationResult.nodeStates.length * 16)
    : 96
  const timeStepUs = simulationResult
    ? Math.max(5, Math.round(250 / Math.max(1, simulationResult.nodeStates.length)))
    : 10
  const referenceFrequency = simulationResult
    ? Math.max(8, simulationResult.estimatedCurrent * 320 + 8)
    : 12

  return (
    <article className="signal-monitor-card">
      <div className="signal-monitor-title">
        <strong>Live scope</strong>
        <span>{simulationResult ? 'waveform preview from the active simulation state' : 'preview mode'}</span>
      </div>

      <div className="signal-monitor-strip">
        {channels.map((channel, index) => {
          const clipId = `scope-clip-${index}`

          return (
            <section className="signal-monitor-panel" key={channel.id}>
              <div className="signal-panel-label">
                <strong>{channel.maxLabel}</strong>
                <span>{channel.title}</span>
                <span>{channel.detail}</span>
              </div>
              <svg className="signal-panel-svg" viewBox={`0 0 ${panelWidth} ${panelHeight}`} preserveAspectRatio="none">
                <defs>
                  <clipPath id={clipId}>
                    <rect height={panelHeight} width={panelWidth} x="0" y="0" />
                  </clipPath>
                </defs>
                {Array.from({ length: 6 }).map((_, gridIndex) => (
                  <line
                    className="signal-grid-line"
                    key={`h-${gridIndex}`}
                    x1="0"
                    x2={panelWidth}
                    y1={(panelHeight / 5) * gridIndex}
                    y2={(panelHeight / 5) * gridIndex}
                  />
                ))}
                {Array.from({ length: 7 }).map((_, gridIndex) => (
                  <line
                    className="signal-grid-line"
                    key={`v-${gridIndex}`}
                    x1={(panelWidth / 6) * gridIndex}
                    x2={(panelWidth / 6) * gridIndex}
                    y1="0"
                    y2={panelHeight}
                  />
                ))}

                <g clipPath={`url(#${clipId})`}>
                  <g className="signal-wave-track">
                    <path className="signal-trace signal-trace-secondary" d={channel.secondaryPath} />
                    <path className="signal-trace signal-trace-primary" d={channel.primaryPath} />
                    <animateTransform
                      attributeName="transform"
                      dur={`${channel.animationDuration}s`}
                      from="0 0"
                      repeatCount="indefinite"
                      to={`-${panelWidth} 0`}
                      type="translate"
                    />
                  </g>
                </g>
              </svg>
            </section>
          )
        })}

        <section className="signal-monitor-meta">
          <strong>t = {formatNumber(timeMs, 3)} ms</strong>
          <span>time step = {timeStepUs} us</span>
          <span>ref f = {formatNumber(referenceFrequency, 2)} Hz</span>
          <span>{simulationResult ? 'simulation live' : 'preview mode'}</span>
        </section>
      </div>
    </article>
  )
}
