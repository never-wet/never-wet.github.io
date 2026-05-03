"use client";

import { useEffect, useRef } from "react";
import { HUD } from "./HUD";

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let game: { destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null = null;
    let cancelled = false;

    async function boot() {
      const Phaser = await import("phaser");
      const { MainWorldScene } = await import("../game/scenes/MainWorldScene");

      if (!containerRef.current || cancelled) {
        return;
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        backgroundColor: "#10151c",
        pixelArt: false,
        antialias: true,
        roundPixels: false,
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: window.innerWidth,
          height: window.innerHeight
        },
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
            gravity: { x: 0, y: 0 }
          }
        },
        scene: [MainWorldScene]
      });
    }

    void boot();

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="game-shell">
      <div ref={containerRef} className="game-canvas-host" />
      <HUD />
    </main>
  );
}
