import type { CanvasColor, CanvasNodeType } from './types'

export const canvasColorPresets: Record<string, string> = {
  '1': '#b85b52',
  '2': '#bf8653',
  '3': '#b8a24d',
  '4': '#4d8c67',
  '5': '#4d87a8',
  '6': '#7a67b5',
}

export const canvasNodeManifest: Record<
  CanvasNodeType,
  {
    label: string
    defaultWidth: number
    defaultHeight: number
    defaultColor?: CanvasColor
  }
> = {
  text: {
    label: 'Text card',
    defaultWidth: 320,
    defaultHeight: 220,
    defaultColor: '#16212d',
  },
  file: {
    label: 'File card',
    defaultWidth: 330,
    defaultHeight: 220,
    defaultColor: '#101923',
  },
  link: {
    label: 'Web card',
    defaultWidth: 320,
    defaultHeight: 180,
    defaultColor: '#101923',
  },
  group: {
    label: 'Group',
    defaultWidth: 520,
    defaultHeight: 360,
    defaultColor: '5',
  },
}

export const canvasManifest = {
  title: 'Research Canvas',
  selectionPadding: 56,
  nodeCornerRadius: 18,
  zoom: {
    min: 0.2,
    max: 2.2,
  },
  edgeDefaults: {
    fromSide: 'right',
    toSide: 'left',
    toEnd: 'arrow',
  },
} as const
