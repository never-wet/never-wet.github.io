import { appManifest } from './appManifest'
import { componentIndex } from './componentIndex'
import { lessonIndex } from './lessonIndex'
import { performanceConfig } from './performanceConfig'
import { quizIndex } from './quizIndex'
import { simulationManifest } from './simulationManifest'
import { uiManifest } from './uiManifest'
import type { SampleCircuitDefinition } from './types'

const createdAt = '2026-04-19T00:00:00.000Z'

export const sampleCircuitIndex: SampleCircuitDefinition[] = [
  {
    id: 'starter-led',
    title: 'Starter LED Loop',
    summary: 'A beginner-safe LED loop with a switch, resistor, battery, and grounded return.',
    learningFocus: ['closed loop', 'resistor current limiting', 'switch behavior'],
    circuit: {
      id: 'sample-starter-led',
      name: 'Starter LED Loop',
      description: 'A clean beginner circuit that shows the difference between open and closed loops.',
      mode: 'guided',
      createdAt,
      updatedAt: createdAt,
      linkedLessonId: 'current-voltage-basics',
      tags: ['starter', 'led', 'guided'],
      board: {
        placementMode: 'grid',
        zoom: performanceConfig.defaultBoardZoom,
        pan: performanceConfig.defaultBoardPan,
        showGrid: true,
      },
      components: [
        {
          id: 'bat-1',
          typeId: 'battery',
          position: { x: -250, y: 10 },
          rotation: 0,
          flipX: false,
          params: { voltage: 9, internalResistance: 0.3 },
        },
        {
          id: 'sw-1',
          typeId: 'switch',
          position: { x: -70, y: 10 },
          rotation: 0,
          flipX: false,
          params: { closed: true },
        },
        {
          id: 'r-1',
          typeId: 'resistor',
          position: { x: 110, y: 10 },
          rotation: 0,
          flipX: false,
          params: { resistance: 220 },
        },
        {
          id: 'led-1',
          typeId: 'led',
          position: { x: 300, y: 10 },
          rotation: 0,
          flipX: false,
          params: { forwardVoltage: 2, resistance: 180, color: 'emerald' },
        },
        {
          id: 'gnd-1',
          typeId: 'ground',
          position: { x: 110, y: 130 },
          rotation: 0,
          flipX: false,
          params: {},
        },
      ],
      wires: [
        {
          id: 'wire-1',
          from: { componentId: 'bat-1', terminalId: 'positive' },
          to: { componentId: 'sw-1', terminalId: 'a' },
        },
        {
          id: 'wire-2',
          from: { componentId: 'sw-1', terminalId: 'b' },
          to: { componentId: 'r-1', terminalId: 'a' },
        },
        {
          id: 'wire-3',
          from: { componentId: 'r-1', terminalId: 'b' },
          to: { componentId: 'led-1', terminalId: 'anode' },
        },
        {
          id: 'wire-4',
          from: { componentId: 'led-1', terminalId: 'cathode' },
          to: { componentId: 'gnd-1', terminalId: 'pin' },
        },
        {
          id: 'wire-5',
          from: { componentId: 'bat-1', terminalId: 'negative' },
          to: { componentId: 'gnd-1', terminalId: 'pin' },
        },
      ],
    },
  },
  {
    id: 'parallel-lamps',
    title: 'Parallel Lamp Branches',
    summary: 'Two lamp branches in parallel to show how current can split across paths.',
    learningFocus: ['parallel branches', 'equivalent resistance', 'branch debugging'],
    circuit: {
      id: 'sample-parallel-lamps',
      name: 'Parallel Lamp Branches',
      description: 'A simple branch circuit used for parallel reasoning and troubleshooting.',
      mode: 'guided',
      createdAt,
      updatedAt: createdAt,
      linkedLessonId: 'series-parallel',
      tags: ['parallel', 'lamps', 'guided'],
      board: {
        placementMode: 'grid',
        zoom: performanceConfig.defaultBoardZoom,
        pan: { x: 420, y: 240 },
        showGrid: true,
      },
      components: [
        {
          id: 'bat-2',
          typeId: 'battery',
          position: { x: -260, y: 20 },
          rotation: 0,
          flipX: false,
          params: { voltage: 9, internalResistance: 0.3 },
        },
        {
          id: 'sw-2',
          typeId: 'switch',
          position: { x: -100, y: 20 },
          rotation: 0,
          flipX: false,
          params: { closed: true },
        },
        {
          id: 'lamp-1',
          typeId: 'lamp',
          position: { x: 120, y: -60 },
          rotation: 0,
          flipX: false,
          params: { resistance: 70 },
        },
        {
          id: 'lamp-2',
          typeId: 'lamp',
          position: { x: 120, y: 100 },
          rotation: 0,
          flipX: false,
          params: { resistance: 70 },
        },
        {
          id: 'gnd-2',
          typeId: 'ground',
          position: { x: -20, y: 180 },
          rotation: 0,
          flipX: false,
          params: {},
        },
      ],
      wires: [
        {
          id: 'wire-p1',
          from: { componentId: 'bat-2', terminalId: 'positive' },
          to: { componentId: 'sw-2', terminalId: 'a' },
        },
        {
          id: 'wire-p2',
          from: { componentId: 'sw-2', terminalId: 'b' },
          to: { componentId: 'lamp-1', terminalId: 'a' },
        },
        {
          id: 'wire-p3',
          from: { componentId: 'sw-2', terminalId: 'b' },
          to: { componentId: 'lamp-2', terminalId: 'a' },
        },
        {
          id: 'wire-p4',
          from: { componentId: 'lamp-1', terminalId: 'b' },
          to: { componentId: 'gnd-2', terminalId: 'pin' },
        },
        {
          id: 'wire-p5',
          from: { componentId: 'lamp-2', terminalId: 'b' },
          to: { componentId: 'gnd-2', terminalId: 'pin' },
        },
        {
          id: 'wire-p6',
          from: { componentId: 'bat-2', terminalId: 'negative' },
          to: { componentId: 'gnd-2', terminalId: 'pin' },
        },
      ],
    },
  },
  {
    id: 'logic-and-demo',
    title: 'Two-Switch AND Gate',
    summary: 'A digital logic practice circuit that lights the indicator only when both switches are on.',
    learningFocus: ['logic gates', 'high and low', 'input combinations'],
    circuit: {
      id: 'sample-logic-and',
      name: 'Two-Switch AND Gate',
      description: 'A logic demo linking two manual inputs to an AND gate and output indicator.',
      mode: 'guided',
      createdAt,
      updatedAt: createdAt,
      linkedLessonId: 'logic-intro',
      tags: ['logic', 'and', 'guided'],
      board: {
        placementMode: 'grid',
        zoom: performanceConfig.defaultBoardZoom,
        pan: { x: 410, y: 240 },
        showGrid: true,
      },
      components: [
        {
          id: 'src-logic',
          typeId: 'voltage-source',
          position: { x: -280, y: 10 },
          rotation: 0,
          flipX: false,
          params: { voltage: 5 },
        },
        {
          id: 'sw-a',
          typeId: 'switch',
          position: { x: -90, y: -70 },
          rotation: 0,
          flipX: false,
          params: { closed: true },
        },
        {
          id: 'sw-b',
          typeId: 'switch',
          position: { x: -90, y: 90 },
          rotation: 0,
          flipX: false,
          params: { closed: false },
        },
        {
          id: 'gate-and',
          typeId: 'and-gate',
          position: { x: 110, y: 10 },
          rotation: 0,
          flipX: false,
          params: {},
        },
        {
          id: 'indicator-1',
          typeId: 'output-indicator',
          position: { x: 330, y: 10 },
          rotation: 0,
          flipX: false,
          params: { threshold: 2.5 },
        },
        {
          id: 'gnd-logic',
          typeId: 'ground',
          position: { x: 60, y: 170 },
          rotation: 0,
          flipX: false,
          params: {},
        },
      ],
      wires: [
        {
          id: 'wire-l1',
          from: { componentId: 'src-logic', terminalId: 'positive' },
          to: { componentId: 'sw-a', terminalId: 'a' },
        },
        {
          id: 'wire-l2',
          from: { componentId: 'src-logic', terminalId: 'positive' },
          to: { componentId: 'sw-b', terminalId: 'a' },
        },
        {
          id: 'wire-l3',
          from: { componentId: 'sw-a', terminalId: 'b' },
          to: { componentId: 'gate-and', terminalId: 'a' },
        },
        {
          id: 'wire-l4',
          from: { componentId: 'sw-b', terminalId: 'b' },
          to: { componentId: 'gate-and', terminalId: 'b' },
        },
        {
          id: 'wire-l5',
          from: { componentId: 'gate-and', terminalId: 'out' },
          to: { componentId: 'indicator-1', terminalId: 'input' },
        },
        {
          id: 'wire-l6',
          from: { componentId: 'indicator-1', terminalId: 'return' },
          to: { componentId: 'gnd-logic', terminalId: 'pin' },
        },
        {
          id: 'wire-l7',
          from: { componentId: 'src-logic', terminalId: 'negative' },
          to: { componentId: 'gnd-logic', terminalId: 'pin' },
        },
      ],
    },
  },
  {
    id: 'blank-sandbox',
    title: 'Blank Sandbox Board',
    summary: 'An empty board for free experimentation.',
    learningFocus: ['freeform experimentation', 'builder practice', 'playground'],
    circuit: {
      id: 'sample-blank-sandbox',
      name: 'Blank Sandbox Board',
      description: 'A ready-to-build blank workspace.',
      mode: 'sandbox',
      createdAt,
      updatedAt: createdAt,
      tags: ['sandbox'],
      board: {
        placementMode: 'grid',
        zoom: performanceConfig.defaultBoardZoom,
        pan: performanceConfig.defaultBoardPan,
        showGrid: true,
      },
      components: [],
      wires: [],
    },
  },
]

export const componentRegistry = Object.fromEntries(componentIndex.map((component) => [component.id, component]))
export const lessonRegistry = Object.fromEntries(lessonIndex.map((lesson) => [lesson.id, lesson]))
export const quizRegistry = Object.fromEntries(quizIndex.map((quiz) => [quiz.id, quiz]))
export const sampleCircuitRegistry = Object.fromEntries(
  sampleCircuitIndex.map((sample) => [sample.id, sample]),
)

export const contentRegistry = {
  appManifest,
  uiManifest,
  simulationManifest,
  performanceConfig,
  components: componentIndex,
  lessons: lessonIndex,
  quizzes: quizIndex,
  sampleCircuits: sampleCircuitIndex,
}
