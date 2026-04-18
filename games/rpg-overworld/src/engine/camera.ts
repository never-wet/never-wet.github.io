import type { OverworldMapDefinition } from "../memory/types";

export interface CameraState {
  left: number;
  top: number;
  tileSize: number;
  viewTilesX: number;
  viewTilesY: number;
  widthPx: number;
  heightPx: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const buildCamera = (
  map: OverworldMapDefinition,
  focus: { x: number; y: number },
  widthPx: number,
  heightPx: number,
): CameraState => {
  const preferredTilesX = widthPx < 680 ? 12 : widthPx < 960 ? 11 : 14;
  const preferredTilesY = widthPx < 680 ? 10 : widthPx < 960 ? 9 : 10;
  const tileSize = Math.max(24, Math.floor(Math.min(widthPx / preferredTilesX, heightPx / preferredTilesY)));
  const viewTilesX = Math.max(8, Math.min(map.width, Math.floor(widthPx / tileSize)));
  const viewTilesY = Math.max(7, Math.min(map.height, Math.floor(heightPx / tileSize)));
  const maxLeft = Math.max(0, map.width - viewTilesX);
  const maxTop = Math.max(0, map.height - viewTilesY);

  return {
    left: clamp(focus.x - viewTilesX / 2 + 0.5, 0, maxLeft),
    top: clamp(focus.y - viewTilesY / 2 + 0.5, 0, maxTop),
    tileSize,
    viewTilesX,
    viewTilesY,
    widthPx,
    heightPx,
  };
};

export const worldToScreen = (camera: CameraState, tileX: number, tileY: number) => ({
  x: (tileX - camera.left) * camera.tileSize,
  y: (tileY - camera.top) * camera.tileSize,
});
