import { AdaptiveDpr } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useSite } from "@/app/SiteProvider";
import { performanceConfig } from "@/memory/performanceConfig";
import { siteManifest } from "@/memory/siteManifest";
import { StageLighting } from "@/components/canvas/StageLighting";
import { PostEffects } from "@/components/canvas/PostEffects";
import { MainExperience } from "@/scenes/MainExperience";

export function SiteCanvas() {
  const { qualityMode } = useSite();
  const preset = performanceConfig.presets[qualityMode];

  return (
    <Canvas
      className="site-canvas"
      shadows
      dpr={[1, preset.maxDpr]}
      camera={{ position: [0, 2.05, 20.8], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      eventPrefix="client"
    >
      <color attach="background" args={["#03060f"]} />
      <fog attach="fog" args={["#03060f", 10, 60]} />
      <AdaptiveDpr pixelated />
      {siteManifest.featureFlags.postProcessing ? <PostEffects /> : null}
      <StageLighting />
      <MainExperience />
    </Canvas>
  );
}
