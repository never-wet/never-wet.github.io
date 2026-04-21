"use client";

import { MutableRefObject, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { SignalWorld } from "./scene/SignalWorld";

type QualityTier = "high" | "low";

type SignalCanvasProps = {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
  qualityTier: QualityTier;
};

export function SignalCanvas({
  progressRef,
  qualityTier,
  reducedMotion,
}: SignalCanvasProps) {
  const highQuality = qualityTier === "high";
  const composerEffects = reducedMotion
    ? [
        <Bloom
          intensity={highQuality ? 0.58 : 0.34}
          key="bloom"
          luminanceThreshold={0.18}
          luminanceSmoothing={0.9}
          mipmapBlur
        />,
        <Noise key="noise" opacity={highQuality ? 0.05 : 0.03} premultiply />,
        <Vignette darkness={0.62} key="vignette" offset={0.28} />,
      ]
    : [
        <Bloom
          intensity={highQuality ? 0.58 : 0.34}
          key="bloom"
          luminanceThreshold={0.18}
          luminanceSmoothing={0.9}
          mipmapBlur
        />,
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          key="chromatic"
          modulationOffset={0.22}
          offset={highQuality ? [0.0003, 0.0005] : [0.00015, 0.0002]}
          radialModulation
        />,
        <Noise key="noise" opacity={highQuality ? 0.05 : 0.03} premultiply />,
        <Vignette darkness={0.62} key="vignette" offset={0.28} />,
      ];

  return (
    <div className="canvas-shell" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.4, 8.5], fov: 34, near: 0.1, far: 80 }}
        dpr={highQuality ? [1, 1.65] : [1, 1.2]}
        gl={{
          antialias: highQuality,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <SignalWorld
            progressRef={progressRef}
            qualityTier={qualityTier}
            reducedMotion={reducedMotion}
          />

          <EffectComposer multisampling={highQuality && !reducedMotion ? 4 : 0}>
            {composerEffects}
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
