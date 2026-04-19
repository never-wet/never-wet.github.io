type PixelCommand = { x: number; y: number; w?: number; h?: number; color: string };

type HumanoidPalette = {
  hair: string;
  hairHi: string;
  skin: string;
  skinShadow: string;
  cloth: string;
  clothShadow: string;
  accent: string;
  accentDark: string;
  boots: string;
  eyes?: string;
};

function createCanvas(size = 16): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function rect(command: PixelCommand): Required<PixelCommand> {
  return { w: 1, h: 1, ...command };
}

function drawCommands(ctx: CanvasRenderingContext2D, commands: PixelCommand[]): void {
  commands.forEach((command) => {
    const pixel = rect(command);
    ctx.fillStyle = pixel.color;
    ctx.fillRect(pixel.x, pixel.y, pixel.w, pixel.h);
  });
}

function drawHumanoid(ctx: CanvasRenderingContext2D, palette: HumanoidPalette, frame = 0, cape = false): void {
  const legShift = frame % 2 === 0 ? 0 : 1;
  const armShift = frame % 2 === 0 ? 0 : 1;
  drawCommands(ctx, [
    { x: 4, y: 1, w: 8, h: 3, color: palette.hair },
    { x: 5, y: 1, w: 5, h: 1, color: palette.hairHi },
    { x: 4, y: 4, w: 8, h: 4, color: palette.skin },
    { x: 4, y: 7, w: 8, h: 1, color: palette.skinShadow },
    { x: 6, y: 5, w: 1, h: 1, color: palette.eyes ?? "#1b1b1b" },
    { x: 9, y: 5, w: 1, h: 1, color: palette.eyes ?? "#1b1b1b" },
    { x: 4, y: 8, w: 8, h: 4, color: palette.cloth },
    { x: 4, y: 11, w: 8, h: 2, color: palette.clothShadow },
    { x: 3, y: 8 + armShift, w: 1, h: 4, color: palette.skin },
    { x: 12, y: 9 - armShift, w: 1, h: 4, color: palette.skin },
    { x: 4, y: 12, w: 8, h: 1, color: palette.accent },
    { x: 5, y: 9, w: 6, h: 1, color: palette.accentDark },
    { x: 4 + legShift, y: 13, w: 2, h: 2, color: palette.clothShadow },
    { x: 9 - legShift, y: 13, w: 2, h: 2, color: palette.clothShadow },
    { x: 4 + legShift, y: 15, w: 2, h: 1, color: palette.boots },
    { x: 9 - legShift, y: 15, w: 2, h: 1, color: palette.boots },
  ]);

  if (cape) {
    drawCommands(ctx, [
      { x: 3, y: 8, w: 10, h: 5, color: palette.accentDark },
      { x: 4, y: 9, w: 8, h: 3, color: palette.accent },
    ]);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, frame = 0): void {
  drawCommands(ctx, [
    { x: 2, y: 10, w: 2, h: 3, color: "#f3d26a" },
    { x: 2, y: 13, w: 2, h: 2, color: "#31476e" },
    { x: 3, y: 11, w: 1, h: 1, color: "#fff3b5" },
    { x: 5, y: 0, w: 6, h: 2, color: "#f3d26a" },
    { x: 6, y: 2, w: 4, h: 1, color: "#fff3b5" },
  ]);
  drawHumanoid(
    ctx,
    {
      hair: "#7d4a3b",
      hairHi: "#a66b5b",
      skin: "#efc8a5",
      skinShadow: "#d3a987",
      cloth: "#4165b7",
      clothShadow: "#314e96",
      accent: "#f3d26a",
      accentDark: "#dbc05e",
      boots: "#20191b",
    },
    frame,
    true,
  );
  drawCommands(ctx, [
    { x: 7, y: 8, w: 2, h: 4, color: "#5f86d7" },
    { x: 6, y: 10, w: 4, h: 1, color: "#f7e2a0" },
  ]);
}

function drawNpc(ctx: CanvasRenderingContext2D, spriteId: string, frame = 0): void {
  const palettes: Record<string, HumanoidPalette> = {
    npc_mara: { hair: "#7a3c2d", hairHi: "#a95e4b", skin: "#efc8a5", skinShadow: "#d9aa87", cloth: "#b4533d", clothShadow: "#8c3b2f", accent: "#e7c86f", accentDark: "#c8aa58", boots: "#23191a" },
    npc_sable: { hair: "#1d2330", hairHi: "#495168", skin: "#d9b693", skinShadow: "#bb9577", cloth: "#6b7fa2", clothShadow: "#55657f", accent: "#d6dce7", accentDark: "#b1b8c6", boots: "#1c1e28" },
    npc_brann: { hair: "#5b2d16", hairHi: "#8a5836", skin: "#d39d72", skinShadow: "#b1805d", cloth: "#684831", clothShadow: "#503522", accent: "#e28a3b", accentDark: "#c26f28", boots: "#241712" },
    npc_nessa: { hair: "#3a4f2d", hairHi: "#5f7c4d", skin: "#f0c8a2", skinShadow: "#d5aa84", cloth: "#4a8b63", clothShadow: "#37674b", accent: "#d3e48b", accentDark: "#afc46f", boots: "#1d2619" },
    npc_hale: { hair: "#31353b", hairHi: "#5b6169", skin: "#ddbb93", skinShadow: "#c39f79", cloth: "#6c7c59", clothShadow: "#505d45", accent: "#c9b46d", accentDark: "#a18d4f", boots: "#212221" },
    npc_lyra: { hair: "#3c3155", hairHi: "#665388", skin: "#e9c8b3", skinShadow: "#cda894", cloth: "#835e9b", clothShadow: "#65497a", accent: "#d9d7f8", accentDark: "#b4b0dc", boots: "#241d2d" },
    npc_toma: { hair: "#5c4128", hairHi: "#876240", skin: "#efc8a5", skinShadow: "#d0aa87", cloth: "#8d5a38", clothShadow: "#6f4328", accent: "#f0c67b", accentDark: "#d3a85f", boots: "#251811" },
    npc_pell: { hair: "#6e5231", hairHi: "#997552", skin: "#e0b187", skinShadow: "#bf8f6a", cloth: "#74814c", clothShadow: "#59633a", accent: "#d1af5e", accentDark: "#b08f47", boots: "#241f16" },
    npc_orsa: { hair: "#524138", hairHi: "#7d665a", skin: "#bb8a6b", skinShadow: "#986a4f", cloth: "#4d5563", clothShadow: "#3a414c", accent: "#f2b559", accentDark: "#cf9241", boots: "#1f1b1c" },
    npc_guard: { hair: "#222735", hairHi: "#4b5672", skin: "#d7b292", skinShadow: "#b89174", cloth: "#5a6c88", clothShadow: "#435269", accent: "#e7cf7a", accentDark: "#c9ad5c", boots: "#1c1e28" },
    npc_townsfolk: { hair: "#5b4339", hairHi: "#866155", skin: "#e1bc99", skinShadow: "#c59f7e", cloth: "#7a5f84", clothShadow: "#5f4a66", accent: "#9db67b", accentDark: "#78925d", boots: "#241c1f" },
  };
  drawHumanoid(ctx, palettes[spriteId] ?? palettes.npc_townsfolk, frame, spriteId === "npc_mara" || spriteId === "npc_guard");
}

function drawEnemy(ctx: CanvasRenderingContext2D, spriteId: string, frame = 0): void {
  switch (spriteId) {
    case "enemy_mossling":
      drawCommands(ctx, [
        { x: 4, y: 3, w: 8, h: 8, color: "#567d44" },
        { x: 5, y: 2, w: 6, h: 2, color: "#8dbb67" },
        { x: 3, y: 7, w: 10, h: 5, color: "#3b5b33" },
        { x: 6, y: 5, w: 1, h: 1, color: "#f5f7d0" },
        { x: 9, y: 5, w: 1, h: 1, color: "#f5f7d0" },
        { x: 5 + (frame % 2), y: 12, w: 2, h: 3, color: "#8dbb67" },
        { x: 9 - (frame % 2), y: 12, w: 2, h: 3, color: "#8dbb67" },
      ]);
      break;
    case "enemy_bandit":
      drawHumanoid(ctx, { hair: "#2f1e1e", hairHi: "#5f4141", skin: "#d5ac87", skinShadow: "#b88c69", cloth: "#6e2f2a", clothShadow: "#521f1b", accent: "#c3b58c", accentDark: "#9c8c64", boots: "#1d1413" }, frame, true);
      drawCommands(ctx, [
        { x: 1, y: 9, w: 2, h: 4, color: "#8f8a71" },
        { x: 2, y: 10, w: 1, h: 2, color: "#d9d2bb" },
      ]);
      break;
    case "enemy_moth":
      drawCommands(ctx, [
        { x: 6, y: 5, w: 4, h: 6, color: "#957a67" },
        { x: 2, y: 4, w: 5, h: 5, color: frame % 2 === 0 ? "#baa17b" : "#d2bb97" },
        { x: 9, y: 4, w: 5, h: 5, color: frame % 2 === 0 ? "#baa17b" : "#d2bb97" },
        { x: 5, y: 11, w: 6, h: 2, color: "#5b4a44" },
        { x: 7, y: 6, w: 1, h: 1, color: "#eff5d8" },
        { x: 8, y: 6, w: 1, h: 1, color: "#eff5d8" },
      ]);
      break;
    case "enemy_beetle":
      drawCommands(ctx, [
        { x: 4, y: 3, w: 8, h: 9, color: "#4f77a8" },
        { x: 5, y: 2, w: 6, h: 2, color: "#79b3de" },
        { x: 3, y: 11, w: 10, h: 2, color: "#28354e" },
        { x: 2, y: 5, w: 2, h: 6, color: "#79b3de" },
        { x: 12, y: 5, w: 2, h: 6, color: "#79b3de" },
        { x: 6, y: 5, w: 1, h: 1, color: "#dff8ff" },
        { x: 9, y: 5, w: 1, h: 1, color: "#dff8ff" },
      ]);
      break;
    case "enemy_raider":
      drawHumanoid(ctx, { hair: "#4a3025", hairHi: "#75513f", skin: "#dcb189", skinShadow: "#bc8f6c", cloth: "#356b7b", clothShadow: "#284f5c", accent: "#d4d9dd", accentDark: "#a5acb2", boots: "#1a1a1c" }, frame, true);
      drawCommands(ctx, [{ x: 11, y: 8, w: 3, h: 5, color: "#b3d2e0" }]);
      break;
    case "enemy_wisp":
      drawCommands(ctx, [
        { x: 5, y: 4, w: 6, h: 6, color: "#87d8ff" },
        { x: 4, y: 7, w: 8, h: 5, color: "#56aef0" },
        { x: 6, y: 1 + (frame % 2), w: 4, h: 3, color: "#c4f0ff" },
        { x: 6, y: 6, w: 1, h: 1, color: "#ffffff" },
        { x: 9, y: 6, w: 1, h: 1, color: "#ffffff" },
      ]);
      break;
    case "boss_hollow_stag":
      drawCommands(ctx, [
        { x: 3, y: 4, w: 10, h: 8, color: "#d1e6f7" },
        { x: 1, y: 2, w: 3, h: 4, color: "#8fd0ff" },
        { x: 12, y: 2, w: 3, h: 4, color: "#8fd0ff" },
        { x: 4, y: 12, w: 2, h: 3, color: "#6f8da8" },
        { x: 10, y: 12, w: 2, h: 3, color: "#6f8da8" },
        { x: 6, y: 0, w: 1, h: 4, color: "#ffffff" },
        { x: 9, y: 0, w: 1, h: 4, color: "#ffffff" },
        { x: 6, y: 6, w: 1, h: 1, color: "#4a687f" },
        { x: 9, y: 6, w: 1, h: 1, color: "#4a687f" },
      ]);
      break;
    default:
      drawNpc(ctx, "npc_townsfolk", frame);
      break;
  }
}

function drawIcon(ctx: CanvasRenderingContext2D, iconId: string): void {
  switch (iconId) {
    case "icon_sword":
      drawCommands(ctx, [
        { x: 7, y: 1, w: 2, h: 9, color: "#dfe7ea" },
        { x: 5, y: 9, w: 6, h: 2, color: "#d2b46b" },
        { x: 7, y: 11, w: 2, h: 4, color: "#805936" },
        { x: 7, y: 2, w: 1, h: 6, color: "#ffffff" },
      ]);
      break;
    case "icon_spear":
      drawCommands(ctx, [
        { x: 7, y: 1, w: 2, h: 12, color: "#88613a" },
        { x: 6, y: 0, w: 4, h: 3, color: "#dfe7ea" },
        { x: 7, y: 1, w: 1, h: 2, color: "#ffffff" },
      ]);
      break;
    case "icon_bow":
      drawCommands(ctx, [
        { x: 4, y: 2, w: 2, h: 12, color: "#9c6d4d" },
        { x: 10, y: 2, w: 2, h: 12, color: "#9c6d4d" },
        { x: 8, y: 1, w: 1, h: 14, color: "#dfe7ea" },
        { x: 5, y: 3, w: 1, h: 2, color: "#d0a06f" },
      ]);
      break;
    case "icon_tome":
      drawCommands(ctx, [
        { x: 3, y: 2, w: 10, h: 11, color: "#70443e" },
        { x: 4, y: 3, w: 8, h: 9, color: "#b56f4f" },
        { x: 6, y: 5, w: 4, h: 4, color: "#f3d26a" },
        { x: 5, y: 4, w: 1, h: 7, color: "#d9bfb4" },
      ]);
      break;
    case "icon_tonic":
      drawCommands(ctx, [
        { x: 5, y: 2, w: 6, h: 2, color: "#d4c6a0" },
        { x: 4, y: 4, w: 8, h: 8, color: "#56b28c" },
        { x: 6, y: 6, w: 4, h: 3, color: "#bdf4de" },
        { x: 7, y: 3, w: 2, h: 1, color: "#fff6d4" },
      ]);
      break;
    case "icon_herb":
      drawCommands(ctx, [
        { x: 7, y: 2, w: 2, h: 12, color: "#3d7f47" },
        { x: 4, y: 4, w: 4, h: 4, color: "#7ccf6f" },
        { x: 8, y: 7, w: 4, h: 4, color: "#7ccf6f" },
        { x: 5, y: 5, w: 1, h: 1, color: "#d9ffb9" },
      ]);
      break;
    case "icon_fish":
      drawCommands(ctx, [
        { x: 3, y: 5, w: 9, h: 5, color: "#8bbdd8" },
        { x: 11, y: 4, w: 3, h: 7, color: "#5f94b0" },
        { x: 5, y: 6, w: 1, h: 1, color: "#22303d" },
        { x: 7, y: 7, w: 3, h: 1, color: "#d7eef7" },
      ]);
      break;
    case "icon_ore":
      drawCommands(ctx, [
        { x: 4, y: 3, w: 8, h: 9, color: "#6a8fb1" },
        { x: 5, y: 4, w: 4, h: 3, color: "#b7efff" },
        { x: 8, y: 7, w: 3, h: 3, color: "#9ad1ef" },
        { x: 7, y: 5, w: 1, h: 1, color: "#ffffff" },
      ]);
      break;
    case "icon_timber":
      drawCommands(ctx, [
        { x: 3, y: 5, w: 10, h: 3, color: "#8d603a" },
        { x: 3, y: 9, w: 10, h: 3, color: "#a97748" },
        { x: 5, y: 5, w: 1, h: 7, color: "#6a4528" },
      ]);
      break;
    case "icon_key":
      drawCommands(ctx, [
        { x: 4, y: 4, w: 6, h: 6, color: "#f3d26a" },
        { x: 10, y: 6, w: 3, h: 2, color: "#f3d26a" },
        { x: 12, y: 7, w: 2, h: 4, color: "#f3d26a" },
        { x: 5, y: 5, w: 4, h: 4, color: "#d6a743" },
      ]);
      break;
    case "icon_charm":
      drawCommands(ctx, [
        { x: 7, y: 1, w: 2, h: 2, color: "#f7e7a2" },
        { x: 5, y: 3, w: 6, h: 2, color: "#f3d26a" },
        { x: 4, y: 5, w: 8, h: 6, color: "#a8d7f7" },
        { x: 5, y: 6, w: 6, h: 4, color: "#dff4ff" },
        { x: 6, y: 11, w: 4, h: 2, color: "#6f8aa4" },
      ]);
      break;
    default:
      drawCommands(ctx, [{ x: 4, y: 4, w: 8, h: 8, color: "#ffffff" }]);
      break;
  }
}

function drawProp(ctx: CanvasRenderingContext2D, spriteId: string, frame = 0): void {
  switch (spriteId) {
    case "herb_node":
      drawIcon(ctx, "icon_herb");
      break;
    case "ore_node":
      drawIcon(ctx, "icon_ore");
      break;
    case "fish_node":
      drawIcon(ctx, "icon_fish");
      break;
    case "crate_node":
      drawCommands(ctx, [
        { x: 3, y: 5, w: 10, h: 8, color: "#8a5532" },
        { x: 4, y: 6, w: 8, h: 1, color: "#c48a54" },
        { x: 4, y: 9, w: 8, h: 1, color: "#c48a54" },
        { x: 5, y: 5, w: 1, h: 8, color: "#5d3921" },
        { x: 10, y: 5, w: 1, h: 8, color: "#5d3921" },
      ]);
      break;
    case "chest_node":
      drawCommands(ctx, [
        { x: 3, y: 6, w: 10, h: 6, color: "#8a5532" },
        { x: 4, y: 4, w: 8, h: 3, color: "#b57a45" },
        { x: 5, y: 5, w: 6, h: 1, color: "#d6a86a" },
        { x: 7, y: 7, w: 2, h: 3, color: "#f3d26a" },
      ]);
      break;
    case "sign_post":
      drawCommands(ctx, [
        { x: 6, y: 6, w: 4, h: 8, color: "#7b5534" },
        { x: 2, y: 3, w: 12, h: 5, color: "#b98a59" },
        { x: 3, y: 4, w: 10, h: 3, color: "#d9b47a" },
        { x: 4, y: 5, w: 8, h: 1, color: "#6a4528" },
      ]);
      break;
    case "lore_plaque":
      drawCommands(ctx, [
        { x: 4, y: 2, w: 8, h: 11, color: "#8c8a87" },
        { x: 5, y: 3, w: 6, h: 9, color: "#b9b6b2" },
        { x: 6, y: 5, w: 4, h: 1, color: "#66605a" },
        { x: 6, y: 8, w: 4, h: 1, color: "#66605a" },
      ]);
      break;
    case "bed_node":
      drawCommands(ctx, [
        { x: 2, y: 5, w: 12, h: 7, color: "#8e6540" },
        { x: 3, y: 6, w: 10, h: 5, color: "#d4b17a" },
        { x: 9, y: 6, w: 3, h: 3, color: "#f2eee5" },
        { x: 4, y: 7, w: 5, h: 3, color: "#7a5f84" },
      ]);
      break;
    case "quest_marker":
      drawCommands(ctx, [
        { x: 7, y: 0, w: 2, h: 9, color: "#fff7aa" },
        { x: 5, y: 9, w: 6, h: 2, color: "#fff7aa" },
        { x: 6, y: 12, w: 4, h: 3, color: "#fff7aa" },
      ]);
      break;
    case "turnin_marker":
      drawCommands(ctx, [
        { x: 4, y: 2, w: 8, h: 8, color: "#9df5a3" },
        { x: 6, y: 4, w: 4, h: 10, color: "#2a7032" },
      ]);
      break;
    case "job_marker":
      drawCommands(ctx, [
        { x: 4, y: 3, w: 8, h: 8, color: "#7ac3ff" },
        { x: 6, y: 1, w: 4, h: 4, color: "#dff4ff" },
        { x: 6, y: 6, w: 4, h: 6, color: "#2f5d8f" },
      ]);
      break;
    case "shop_marker":
      drawCommands(ctx, [
        { x: 3, y: 4, w: 10, h: 7, color: "#d18d48" },
        { x: 4, y: 5, w: 8, h: 5, color: "#f3d26a" },
        { x: 5, y: 2, w: 6, h: 3, color: "#9d5035" },
        { x: 6, y: 6, w: 2, h: 2, color: "#6c4025" },
      ]);
      break;
    case "ui_logo_emblem":
      drawCommands(ctx, [
        { x: 5, y: 1, w: 6, h: 4, color: "#f3d26a" },
        { x: 4, y: 5, w: 8, h: 9, color: "#31476e" },
        { x: 6, y: 7, w: 4, h: 5, color: "#fff2ba" },
      ]);
      break;
    default:
      drawNpc(ctx, "npc_townsfolk", frame);
      break;
  }
}

export class PixelFactory {
  private readonly cache = new Map<string, HTMLCanvasElement>();

  getSpriteCanvas(spriteId: string, frame = 0): HTMLCanvasElement {
    const key = `${spriteId}:${frame}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const canvas = createCanvas(16);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }

    ctx.clearRect(0, 0, 16, 16);

    if (spriteId === "player_riven") {
      drawPlayer(ctx, frame);
    } else if (spriteId.startsWith("npc_")) {
      drawNpc(ctx, spriteId, frame);
    } else if (spriteId.startsWith("enemy_") || spriteId.startsWith("boss_")) {
      drawEnemy(ctx, spriteId, frame);
    } else if (spriteId.startsWith("icon_")) {
      drawIcon(ctx, spriteId);
    } else {
      drawProp(ctx, spriteId, frame);
    }

    this.cache.set(key, canvas);
    return canvas;
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    spriteId: string,
    x: number,
    y: number,
    size = 16,
    frame = 0,
    flip = false,
  ): void {
    const canvas = this.getSpriteCanvas(spriteId, frame);
    ctx.save();
    if (flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, -x - size, y, size, size);
    } else {
      ctx.drawImage(canvas, x, y, size, size);
    }
    ctx.restore();
  }

  makeIconElement(iconId: string, size = 18): HTMLCanvasElement {
    const canvas = createCanvas(size);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.getSpriteCanvas(iconId, 0), 0, 0, size, size);
    return canvas;
  }
}
