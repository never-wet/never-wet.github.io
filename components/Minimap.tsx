"use client";

import { useEffect, useRef } from "react";
import { WORLD_LIMIT } from "../lib/navigationSystem";
import { useWorldStore } from "../store/useWorldStore";

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buildings = useWorldStore((state) => state.buildings);
  const playerPosition = useWorldStore((state) => state.playerPosition);
  const activeBuildingId = useWorldStore((state) => state.activeBuildingId);
  const nearbyBuildingId = useWorldStore((state) => state.nearbyBuildingId);
  const selectedBuildingId = useWorldStore((state) => state.selectedBuildingId);
  const minimapMode = useWorldStore((state) => state.minimapMode);
  const toggleMinimapMode = useWorldStore((state) => state.toggleMinimapMode);
  const selectBuilding = useWorldStore((state) => state.selectBuilding);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const scale = size / (WORLD_LIMIT * 2.55);
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(center, center);
      ctx.beginPath();
      ctx.arc(0, 0, center - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(5, 7, 9, 0.52)";
      ctx.fillRect(-center, -center, size, size);

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 5;
      buildings.forEach((building) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(building.position[0] * scale, building.position[2] * scale);
        ctx.stroke();
      });

      if (selectedBuildingId) {
        const selected = buildings.find((building) => building.id === selectedBuildingId);
        if (selected) {
          ctx.strokeStyle = selected.color;
          ctx.lineWidth = 2.4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(playerPosition[0] * scale, playerPosition[2] * scale);
          ctx.lineTo(selected.position[0] * scale, selected.position[2] * scale);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      buildings.forEach((building) => {
        const active = building.id === activeBuildingId || building.id === selectedBuildingId;
        const near = building.id === nearbyBuildingId;
        const pulse = near ? 1 + Math.sin(performance.now() * 0.008) * 0.22 : 1;
        ctx.beginPath();
        ctx.fillStyle = building.color;
        ctx.shadowColor = building.color;
        ctx.shadowBlur = active || near ? 16 : 6;
        ctx.arc(building.position[0] * scale, building.position[2] * scale, (active ? 6.2 : 4.7) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.stroke();
      });

      ctx.translate(playerPosition[0] * scale, playerPosition[2] * scale);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [activeBuildingId, buildings, minimapMode, nearbyBuildingId, playerPosition, selectedBuildingId]);

  return (
    <div className="mini-map" aria-label="World minimap">
      <canvas
        ref={canvasRef}
        id="miniMapCanvas"
        width={328}
        height={328}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const size = event.currentTarget.width;
          const scale = size / (WORLD_LIMIT * 2.55);
          const worldX = (((event.clientX - rect.left) / rect.width) * size - size / 2) / scale;
          const worldZ = (((event.clientY - rect.top) / rect.height) * size - size / 2) / scale;
          const nearest = buildings.reduce((best, building) => {
            const distance = Math.hypot(building.position[0] - worldX, building.position[2] - worldZ);
            return distance < best.distance ? { id: building.id, distance } : best;
          }, { id: null as string | null, distance: Infinity });
          if (nearest.id && nearest.distance < 3.4) selectBuilding(nearest.id);
        }}
      />
      <button className="minimap-mode" type="button" onClick={toggleMinimapMode}>
        {minimapMode === "north-up" ? "North" : "Rotate"}
      </button>
    </div>
  );
}
