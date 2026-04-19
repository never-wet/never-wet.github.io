import type { PerformanceConfig, QualityMode } from "@/memory/types";

export const performanceConfig: PerformanceConfig = {
  presets: {
    high: {
      id: "high",
      label: "High",
      maxDpr: 2,
      particleCount: 2200,
      sparklesCount: 90,
      enableBloom: true,
      bloomIntensity: 1.05,
      floatIntensity: 1,
    },
    balanced: {
      id: "balanced",
      label: "Balanced",
      maxDpr: 1.6,
      particleCount: 1500,
      sparklesCount: 66,
      enableBloom: true,
      bloomIntensity: 0.82,
      floatIntensity: 0.82,
    },
    low: {
      id: "low",
      label: "Low",
      maxDpr: 1.2,
      particleCount: 700,
      sparklesCount: 28,
      enableBloom: false,
      bloomIntensity: 0,
      floatIntensity: 0.55,
    },
  },
};

export function resolveQualityMode(options: {
  width: number;
  reducedMotion: boolean;
  devicePixelRatio: number;
}): QualityMode {
  const { width, reducedMotion, devicePixelRatio } = options;

  if (reducedMotion || width < 820 || devicePixelRatio > 2.3) {
    return "low";
  }

  if (width > 1440 && devicePixelRatio <= 2) {
    return "high";
  }

  return "balanced";
}
