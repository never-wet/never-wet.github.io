import { PointMaterial, Points, Sparkles } from "@react-three/drei";
import { useMemo } from "react";
import { useSite } from "@/app/SiteProvider";
import { performanceConfig } from "@/memory/performanceConfig";

export function Starfield() {
  const { qualityMode } = useSite();
  const preset = performanceConfig.presets[qualityMode];

  const stars = useMemo(() => {
    const positions = new Float32Array(preset.particleCount * 3);
    for (let index = 0; index < preset.particleCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 46;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 58;
    }
    return positions;
  }, [preset.particleCount]);

  return (
    <>
      <Points positions={stars} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#92baf9"
          size={0.042}
          sizeAttenuation
          depthWrite={false}
          opacity={0.9}
        />
      </Points>
      <Sparkles
        count={preset.sparklesCount}
        scale={[24, 11, 34]}
        size={2.1}
        speed={0.25}
        opacity={0.22}
        color="#8db7ff"
        position={[0, 2, -6]}
      />
    </>
  );
}
