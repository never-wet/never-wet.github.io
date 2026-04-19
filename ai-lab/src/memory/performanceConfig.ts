export const performanceConfig = {
  graph: {
    nodeResolution: 10,
    linkDirectionalParticles: 0,
    warmupTicks: 20,
    cooldownTicks: 120,
    minZoomDistance: 36,
    maxZoomDistance: 640,
  },
  charts: {
    animationDuration: 280,
    maxMetricPoints: 400,
  },
  builder: {
    snapGrid: [20, 20] as [number, number],
    defaultZoom: 0.9,
  },
} as const
