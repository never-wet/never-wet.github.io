"use client";

import { type MutableRefObject, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { VaultWorld } from "./scene/VaultWorld";

type QualityTier = "high" | "low";

type StoryState = {
  chapter: number;
  drift: number;
};

type VaultCanvasProps = {
  storyRef: MutableRefObject<StoryState>;
  reducedMotion: boolean;
  qualityTier: QualityTier;
};

export function VaultCanvas({
  storyRef,
  qualityTier,
  reducedMotion,
}: VaultCanvasProps) {
  const highQuality = qualityTier === "high";
  const composerEffects = reducedMotion
    ? [
        <Bloom
          intensity={highQuality ? 0.5 : 0.3}
          key="bloom"
          luminanceThreshold={0.2}
          luminanceSmoothing={0.92}
          mipmapBlur
        />,
        <Noise key="noise" opacity={highQuality ? 0.04 : 0.025} premultiply />,
        <Vignette darkness={0.68} key="vignette" offset={0.24} />,
      ]
    : [
        <Bloom
          intensity={highQuality ? 0.54 : 0.32}
          key="bloom"
          luminanceThreshold={0.2}
          luminanceSmoothing={0.92}
          mipmapBlur
        />,
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          key="chromatic"
          modulationOffset={0.2}
          offset={highQuality ? [0.00024, 0.00045] : [0.00012, 0.00018]}
          radialModulation
        />,
        <Noise key="noise" opacity={highQuality ? 0.04 : 0.025} premultiply />,
        <Vignette darkness={0.68} key="vignette" offset={0.24} />,
      ];

  return (
    <div className="canvas-shell" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.3, 8.8], fov: 34, near: 0.1, far: 90 }}
        dpr={highQuality ? [1, 1.65] : [1, 1.2]}
        gl={{
          antialias: highQuality,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <VaultWorld qualityTier={qualityTier} reducedMotion={reducedMotion} storyRef={storyRef} />

          <EffectComposer multisampling={highQuality && !reducedMotion ? 4 : 0}>
            {composerEffects}
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
