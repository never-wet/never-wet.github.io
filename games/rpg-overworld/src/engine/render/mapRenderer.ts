import { contentRegistry } from "../../memory/contentRegistry";
import type {
  Direction,
  GameState,
  OverworldEnvironment,
  OverworldInteraction,
  OverworldTileType,
} from "../../memory/types";
import { getAvailableInteractions, getCurrentOverworldMap, getTileChar, tileCharToType } from "../../lib/game/overworld";
import { buildCamera, type CameraState, worldToScreen } from "../camera";
import { drawInteractionSprite, drawPlayerSprite } from "./spriteRenderer";

interface RenderWorldSceneOptions {
  state: GameState;
  widthPx: number;
  heightPx: number;
  now: number;
  playerPosition: { x: number; y: number; facing: Direction };
  highlightInteractionId?: string | null;
  nearbyInteraction?: OverworldInteraction;
}

const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

const environmentColors: Record<
  OverworldEnvironment,
  {
    backdropTop: string;
    backdropBottom: string;
    floor: string;
    floorDetail: string;
    road: string;
    wall: string;
    water: string;
    wild: string;
    bridge: string;
    ruin: string;
    accent: string;
  }
> = {
  town: {
    backdropTop: "#1f3042",
    backdropBottom: "#0d1119",
    floor: "#2e3645",
    floorDetail: "#46526a",
    road: "#655847",
    wall: "#3f2d2b",
    water: "#193a58",
    wild: "#365c3b",
    bridge: "#7e6246",
    ruin: "#455168",
    accent: "#f0c26f",
  },
  interior: {
    backdropTop: "#271f18",
    backdropBottom: "#120d0b",
    floor: "#5a4633",
    floorDetail: "#7f6445",
    road: "#806145",
    wall: "#2d231d",
    water: "#244054",
    wild: "#415334",
    bridge: "#8f6d4a",
    ruin: "#62523f",
    accent: "#ffcf81",
  },
  forest: {
    backdropTop: "#0f2019",
    backdropBottom: "#07100c",
    floor: "#263226",
    floorDetail: "#3d4f3e",
    road: "#5d5340",
    wall: "#1b251c",
    water: "#183a3b",
    wild: "#355b37",
    bridge: "#74593d",
    ruin: "#4a5046",
    accent: "#a8e48a",
  },
  marsh: {
    backdropTop: "#18262d",
    backdropBottom: "#0a1012",
    floor: "#384641",
    floorDetail: "#51655e",
    road: "#706247",
    wall: "#1f2a2b",
    water: "#173845",
    wild: "#4c6848",
    bridge: "#7e6845",
    ruin: "#55615d",
    accent: "#9be0b4",
  },
  abbey: {
    backdropTop: "#1a202a",
    backdropBottom: "#090c11",
    floor: "#3a404c",
    floorDetail: "#5d6678",
    road: "#6c6658",
    wall: "#232933",
    water: "#214154",
    wild: "#405446",
    bridge: "#826d56",
    ruin: "#56637a",
    accent: "#d9c48f",
  },
  spire: {
    backdropTop: "#171b35",
    backdropBottom: "#090b16",
    floor: "#2c3350",
    floorDetail: "#46567f",
    road: "#615f6d",
    wall: "#1b2236",
    water: "#28486d",
    wild: "#42504d",
    bridge: "#7c6c57",
    ruin: "#627198",
    accent: "#9ee2ff",
  },
};

const drawTile = (
  ctx: CanvasRenderingContext2D,
  tileType: OverworldTileType,
  environment: OverworldEnvironment,
  x: number,
  y: number,
  size: number,
  now: number,
  variance: number,
) => {
  const palette = environmentColors[environment];
  const stroke = "rgba(255,255,255,0.04)";
  const fillMap: Record<OverworldTileType, string> = {
    floor: palette.floor,
    road: palette.road,
    wall: palette.wall,
    water: palette.water,
    wild: palette.wild,
    bridge: palette.bridge,
    ruin: palette.ruin,
  };

  ctx.fillStyle = fillMap[tileType];
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  if (tileType === "floor") {
    ctx.fillStyle = palette.floorDetail;
    ctx.fillRect(x + size * (0.12 + variance * 0.18), y + size * (0.18 + variance * 0.1), size * 0.14, size * 0.14);
    ctx.fillRect(x + size * 0.6, y + size * (0.56 - variance * 0.12), size * 0.12, size * 0.12);
  }

  if (tileType === "road" || tileType === "bridge") {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + size * 0.12, y + size * 0.28, size * 0.76, size * 0.12);
    ctx.fillRect(x + size * 0.12, y + size * 0.6, size * 0.76, size * 0.08);
  }

  if (tileType === "wall") {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x + size * 0.12, y + size * 0.16, size * 0.76, size * 0.12);
    ctx.fillRect(x + size * 0.12, y + size * 0.48, size * 0.76, size * 0.08);
  }

  if (tileType === "water") {
    ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.sin((now / 180) + variance * 6) * 0.02})`;
    ctx.fillRect(x + size * 0.08, y + size * 0.3, size * 0.84, size * 0.08);
    ctx.fillRect(x + size * 0.18, y + size * 0.58, size * 0.54, size * 0.08);
  }

  if (tileType === "wild") {
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(x + size * 0.2, y + size * 0.22, size * 0.08, size * 0.4);
    ctx.fillRect(x + size * 0.5, y + size * 0.16, size * 0.08, size * 0.44);
    ctx.fillRect(x + size * 0.72, y + size * 0.26, size * 0.08, size * 0.36);
  }

  if (tileType === "ruin") {
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y + size * 0.18);
    ctx.lineTo(x + size * 0.74, y + size * 0.7);
    ctx.moveTo(x + size * 0.7, y + size * 0.22);
    ctx.lineTo(x + size * 0.26, y + size * 0.7);
    ctx.stroke();
  }
};

const drawWeather = (
  ctx: CanvasRenderingContext2D,
  environment: OverworldEnvironment,
  widthPx: number,
  heightPx: number,
  now: number,
) => {
  if (environment === "town" || environment === "marsh") {
    ctx.strokeStyle = "rgba(180, 220, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let index = 0; index < 24; index += 1) {
      const seed = index * 37;
      const x = (seed * 73 + now * 0.12) % (widthPx + 40) - 20;
      const y = (seed * 41 + now * 0.18) % (heightPx + 40) - 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y + 16);
      ctx.stroke();
    }
  }

  if (environment === "forest") {
    ctx.fillStyle = "rgba(212, 255, 220, 0.08)";
    for (let index = 0; index < 22; index += 1) {
      const x = ((index * 97) + now * 0.02) % widthPx;
      const y = ((index * 61) + now * 0.03) % heightPx;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (environment === "spire") {
    ctx.strokeStyle = "rgba(180, 230, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let index = 0; index < 12; index += 1) {
      const y = ((index * 59) + now * 0.03) % heightPx;
      ctx.beginPath();
      ctx.moveTo(widthPx * 0.58, y);
      ctx.lineTo(widthPx, y - 80);
      ctx.stroke();
    }
  }
};

const drawBackdrop = (ctx: CanvasRenderingContext2D, environment: OverworldEnvironment, widthPx: number, heightPx: number) => {
  const palette = environmentColors[environment];
  const gradient = ctx.createLinearGradient(0, 0, 0, heightPx);
  gradient.addColorStop(0, palette.backdropTop);
  gradient.addColorStop(1, palette.backdropBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, widthPx, heightPx);
};

const sortInteractions = (interactions: OverworldInteraction[]) => [...interactions].sort((a, b) => a.y - b.y || a.x - b.x);

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (words.length && lines.length === maxLines) {
    const consumedWords = lines.join(" ").split(/\s+/).length;
    if (consumedWords < words.length) {
      let lastLine = lines[lines.length - 1];
      while (lastLine.length > 3 && ctx.measureText(`${lastLine}...`).width > maxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
      lines[lines.length - 1] = `${lastLine.trimEnd()}...`;
    }
  }

  return lines;
};

const drawPanel = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  ctx.fillStyle = "rgba(5, 8, 14, 0.68)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
};

export const renderWorldScene = (ctx: CanvasRenderingContext2D, options: RenderWorldSceneOptions): CameraState => {
  const map = getCurrentOverworldMap(options.state);
  const camera = buildCamera(map, options.playerPosition, options.widthPx, options.heightPx);
  const interactions = sortInteractions(getAvailableInteractions(options.state));
  const compactBanner = options.widthPx < 720 || options.heightPx < 520;

  drawBackdrop(ctx, map.environment, options.widthPx, options.heightPx);

  const startX = Math.max(0, Math.floor(camera.left) - 1);
  const endX = Math.min(map.width - 1, Math.ceil(camera.left + camera.viewTilesX) + 1);
  const startY = Math.max(0, Math.floor(camera.top) - 1);
  const endY = Math.min(map.height - 1, Math.ceil(camera.top + camera.viewTilesY) + 1);

  for (let tileY = startY; tileY <= endY; tileY += 1) {
    for (let tileX = startX; tileX <= endX; tileX += 1) {
      const tileType = tileCharToType(getTileChar(map, tileX, tileY));
      const screen = worldToScreen(camera, tileX, tileY);
      drawTile(ctx, tileType, map.environment, screen.x, screen.y, camera.tileSize, options.now, hash(tileX, tileY));
    }
  }

  drawWeather(ctx, map.environment, options.widthPx, options.heightPx, options.now);

  interactions.forEach((interaction) => {
    const screen = worldToScreen(camera, interaction.x, interaction.y);
    if (
      screen.x < -camera.tileSize ||
      screen.y < -camera.tileSize ||
      screen.x > options.widthPx + camera.tileSize ||
      screen.y > options.heightPx + camera.tileSize
    ) {
      return;
    }
    drawInteractionSprite(
      ctx,
      interaction,
      screen.x,
      screen.y,
      camera.tileSize,
      interaction.x >= options.playerPosition.x ? "left" : "right",
      options.now,
      interaction.id === options.highlightInteractionId,
    );
  });

  const playerScreen = worldToScreen(camera, options.playerPosition.x, options.playerPosition.y);
  drawPlayerSprite(ctx, playerScreen.x, playerScreen.y, camera.tileSize, options.playerPosition.facing, options.now);

  const location = contentRegistry.locationsById[options.state.currentLocationId];
  const activeQuest = contentRegistry.quests.find((quest) => options.state.quests[quest.id]?.status === "active");
  const objective = activeQuest ? activeQuest.objectives[options.state.quests[activeQuest.id].currentObjectiveIndex] : null;
  const topPanelWidth = compactBanner
    ? Math.min(options.widthPx - 132, 240)
    : Math.min(options.widthPx * 0.42, 320);
  const topPanelHeight = compactBanner ? 56 : 74;
  const topPanelX = Math.max(12, (options.widthPx - topPanelWidth) / 2);
  const topPanelY = 12;

  drawPanel(ctx, topPanelX, topPanelY, topPanelWidth, topPanelHeight);
  ctx.fillStyle = environmentColors[map.environment].accent;
  ctx.textAlign = "center";
  ctx.font = "bold 13px 'Trebuchet MS', sans-serif";
  ctx.fillText(location.name, topPanelX + topPanelWidth / 2, topPanelY + 18);
  ctx.fillStyle = "rgba(240, 246, 255, 0.9)";
  ctx.font = compactBanner ? "bold 18px 'Trebuchet MS', sans-serif" : "bold 20px 'Trebuchet MS', sans-serif";
  ctx.fillText(map.title, topPanelX + topPanelWidth / 2, topPanelY + (compactBanner ? 36 : 44));
  ctx.fillStyle = "rgba(207, 219, 236, 0.84)";
  ctx.font = "12px 'Trebuchet MS', sans-serif";
  const statsText = compactBanner
    ? `Lv ${options.state.player.level}  HP ${options.state.player.currentHp}/${options.state.player.baseStats.maxHp}  ${options.state.player.silver}s`
    : `Lv ${options.state.player.level}   HP ${options.state.player.currentHp}/${options.state.player.baseStats.maxHp}   MP ${options.state.player.currentMp}/${options.state.player.baseStats.maxMp}   ${options.state.player.silver} silver`;
  if (!compactBanner) {
    ctx.fillText(statsText, topPanelX + topPanelWidth / 2, topPanelY + 60);
  }
  ctx.textAlign = "left";

  const bottomPanelWidth = Math.min(options.widthPx - 24, 420);
  const bottomPanelHeight = 64;
  const bottomPanelX = Math.max(12, (options.widthPx - bottomPanelWidth) / 2);
  const bottomPanelY = options.heightPx - bottomPanelHeight - 14;

  drawPanel(ctx, bottomPanelX, bottomPanelY, bottomPanelWidth, bottomPanelHeight);
  ctx.fillStyle = environmentColors[map.environment].accent;
  ctx.font = "bold 14px 'Trebuchet MS', sans-serif";
  ctx.fillText(options.nearbyInteraction?.label ?? activeQuest?.title ?? "Explore Hollowmere", bottomPanelX + 14, bottomPanelY + 22);

  ctx.fillStyle = "rgba(240, 246, 255, 0.86)";
  ctx.font = "12px 'Trebuchet MS', sans-serif";
  const promptText =
    options.nearbyInteraction?.description ??
    objective?.text ??
    "Move with WASD or arrow keys. Press E or tap Interact when you reach something important.";
  const promptLines = wrapText(ctx, promptText, bottomPanelWidth - 28, 2);
  promptLines.forEach((line, index) => {
    ctx.fillText(line, bottomPanelX + 14, bottomPanelY + 40 + index * 14);
  });

  return camera;
};
