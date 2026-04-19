import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useSite } from "@/app/SiteProvider";
import { performanceConfig } from "@/memory/performanceConfig";

export function PostEffects() {
  const { qualityMode } = useSite();
  const preset = performanceConfig.presets[qualityMode];

  if (!preset.enableBloom) {
    return (
      <EffectComposer multisampling={0}>
        <Noise opacity={0.024} premultiply />
        <Vignette eskil={false} offset={0.19} darkness={0.82} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={preset.bloomIntensity + 0.14}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.72}
        radius={0.82}
      />
      <Noise opacity={0.024} premultiply />
      <Vignette eskil={false} offset={0.19} darkness={0.82} />
    </EffectComposer>
  );
}
