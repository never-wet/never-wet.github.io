import type { PuzzleVisual, VisualGlyph } from "../../memory/types";

const cyan = "#00fbfb";
const cyanDim = "#00dddd";
const violet = "#dab9ff";
const white = "#e5e2e1";
const slate = "#839493";
const dark = "#0e0e0e";

function line(x: number, y: number, width: number, height: number, stroke = white, strokeWidth = 4): VisualGlyph {
  return { kind: "line", x, y, width, height, stroke, strokeWidth };
}

function circle(x: number, y: number, size: number, fill = cyan, opacity = 1): VisualGlyph {
  return { kind: "circle", x, y, size, fill, opacity };
}

function ring(x: number, y: number, size: number, stroke = cyan, strokeWidth = 4): VisualGlyph {
  return { kind: "ring", x, y, size, stroke, strokeWidth };
}

function rect(x: number, y: number, width: number, height: number, fill: string, stroke?: string): VisualGlyph {
  return { kind: "rect", x, y, width, height, fill, stroke };
}

function diamond(x: number, y: number, size: number, fill: string, stroke?: string): VisualGlyph {
  return { kind: "diamond", x, y, size, fill, stroke };
}

function triangle(x: number, y: number, size: number, fill: string, stroke?: string, rotation?: number): VisualGlyph {
  return { kind: "triangle", x, y, size, fill, stroke, rotation };
}

function label(text: string, x: number, y: number, fontSize = 7, fill = white, align: VisualGlyph["align"] = "middle"): VisualGlyph {
  return {
    kind: "text",
    x,
    y,
    text,
    fontSize,
    fill,
    align,
    letterSpacing: fontSize >= 10 ? 0.3 : 1.2,
  };
}

export function lanternTile(direction: "north" | "east" | "south" | "west", sparks: number): PuzzleVisual {
  const armMap = {
    north: line(50, 50, 0, -22, cyan, 5),
    east: line(50, 50, 22, 0, cyan, 5),
    south: line(50, 50, 0, 22, cyan, 5),
    west: line(50, 50, -22, 0, cyan, 5),
  };
  const sparkMap = [
    circle(28, 28, 4, violet),
    circle(72, 28, 4, cyan),
    circle(72, 72, 4, violet),
    circle(28, 72, 4, cyan),
  ];

  return {
    variant: "tile",
    aspectRatio: "square",
    frameLabel: "MATRIX_TILE",
    grid: true,
    background: "linear-gradient(180deg, rgba(14,14,14,0.95), rgba(28,27,27,0.96))",
    glyphs: [
      ring(50, 50, 28, slate, 2),
      rect(22, 22, 56, 56, "none", "rgba(255,255,255,0.08)"),
      armMap[direction],
      ...sparkMap.slice(0, sparks),
    ],
  };
}

export function analogyCard(kind: "diamond-bar" | "hex-bars" | "square-double" | "circle-notch"): PuzzleVisual {
  const common = {
    variant: "tile" as const,
    aspectRatio: "square" as const,
    background: "linear-gradient(180deg, rgba(14,14,14,0.96), rgba(32,31,31,0.96))",
    grid: true,
  };

  switch (kind) {
    case "diamond-bar":
      return {
        ...common,
        frameLabel: "OPTION_A",
        glyphs: [diamond(50, 50, 42, "none", cyan), line(35, 50, 30, 0, white, 4)],
      };
    case "hex-bars":
      return {
        ...common,
        frameLabel: "OPTION_B",
        glyphs: [
          rect(28, 28, 44, 44, "none", violet),
          triangle(28, 50, 24, "none", violet, 90),
          triangle(72, 50, 24, "none", violet, -90),
          line(36, 44, 28, 0, white, 4),
          line(36, 56, 28, 0, white, 4),
        ],
      };
    case "square-double":
      return {
        ...common,
        frameLabel: "OPTION_C",
        glyphs: [
          rect(28, 28, 44, 44, "none", cyan),
          line(24, 50, 8, 0, cyan, 4),
          line(38, 42, 24, 0, white, 4),
          line(38, 58, 24, 0, white, 4),
        ],
      };
    case "circle-notch":
      return {
        ...common,
        frameLabel: "OPTION_D",
        glyphs: [ring(50, 50, 24, violet, 4), line(66, 38, 10, -10, violet, 4), circle(73, 31, 2.5, violet)],
      };
  }
}

export function glyphCard(kind: "arches" | "fork-hook" | "pillars" | "hourglass"): PuzzleVisual {
  const base = {
    variant: "tile" as const,
    aspectRatio: "square" as const,
    grid: true,
    background: "linear-gradient(180deg, rgba(14,14,14,0.96), rgba(28,27,27,0.96))",
  };

  switch (kind) {
    case "arches":
      return {
        ...base,
        glyphs: [line(32, 72, 0, -34, cyan, 5), line(68, 72, 0, -34, cyan, 5), line(32, 38, 36, 0, cyan, 5), circle(50, 58, 4, violet)],
      };
    case "fork-hook":
      return {
        ...base,
        glyphs: [line(50, 74, 0, -44, violet, 5), line(50, 34, -18, -12, violet, 5), line(50, 34, 18, -12, violet, 5), line(34, 26, -10, 10, violet, 5)],
      };
    case "pillars":
      return {
        ...base,
        glyphs: [line(38, 72, 0, -38, cyan, 5), line(62, 72, 0, -38, cyan, 5), line(28, 34, 44, 0, cyan, 5), line(38, 54, 24, 0, white, 4)],
      };
    case "hourglass":
      return {
        ...base,
        glyphs: [
          triangle(50, 36, 34, "none", cyan),
          triangle(50, 64, 34, "none", cyan, 180),
          line(50, 46, 0, 8, violet, 4),
        ],
      };
  }
}

export function ringSequence(open: "north" | "east" | "south" | "west", rays: number): PuzzleVisual {
  const rayMap: Record<typeof open, VisualGlyph[]> = {
    north: [line(34, 50, -12, 0, cyanDim, 4), line(66, 50, 12, 0, cyanDim, 4), line(50, 66, 0, 12, cyanDim, 4)],
    east: [line(50, 34, 0, -12, cyanDim, 4), line(50, 66, 0, 12, cyanDim, 4), line(34, 50, -12, 0, cyanDim, 4)],
    south: [line(34, 50, -12, 0, cyanDim, 4), line(66, 50, 12, 0, cyanDim, 4), line(50, 34, 0, -12, cyanDim, 4)],
    west: [line(50, 34, 0, -12, cyanDim, 4), line(50, 66, 0, 12, cyanDim, 4), line(66, 50, 12, 0, cyanDim, 4)],
  };
  const openCover = {
    north: rect(38, 8, 24, 18, dark),
    east: rect(74, 38, 18, 24, dark),
    south: rect(38, 74, 24, 18, dark),
    west: rect(8, 38, 18, 24, dark),
  };
  const allRays = {
    north: [line(50, 34, 0, -12, cyanDim, 4), ...rayMap.north],
    east: [line(66, 50, 12, 0, cyanDim, 4), ...rayMap.east],
    south: [line(50, 66, 0, 12, cyanDim, 4), ...rayMap.south],
    west: [line(34, 50, -12, 0, cyanDim, 4), ...rayMap.west],
  };

  return {
    variant: "tile",
    aspectRatio: "square",
    grid: true,
    frameLabel: "OBS_RING",
    background: "linear-gradient(180deg, rgba(14,14,14,0.96), rgba(32,31,31,0.95))",
    glyphs: [ring(50, 50, 28, violet, 4), ...allRays[open].slice(0, rays), openCover[open]],
  };
}

export function codeNote(title: string, lines: string[], accent = cyan): PuzzleVisual {
  return {
    variant: "paper",
    aspectRatio: "wide",
    frameLabel: title,
    background: "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(28,27,27,0.95))",
    glyphs: [
      rect(10, 14, 80, 72, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)"),
      ...lines.flatMap((entry, index) => [
        label(entry, 18, 30 + index * 16, 8, index === 0 ? accent : white, "start"),
        line(18, 36 + index * 16, 62, 0, "rgba(255,255,255,0.08)", 1),
      ]),
    ],
  };
}

export function morseCard(groups: string): PuzzleVisual {
  const items = groups.split(" ");
  const glyphs: VisualGlyph[] = [rect(10, 18, 80, 64, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)")];

  items.forEach((group, row) => {
    const startX = 22;
    const y = 32 + row * 18;
    [...group].forEach((symbol, index) => {
      if (symbol === ".") {
        glyphs.push(circle(startX + index * 12, y, 3.5, cyan));
      } else {
        glyphs.push(rect(startX + index * 12 - 4, y - 3, 10, 6, violet));
      }
    });
  });

  return {
    variant: "code",
    aspectRatio: "wide",
    frameLabel: "MORSE_FEED",
    background: "linear-gradient(180deg, rgba(14,14,14,0.98), rgba(24,24,24,0.96))",
    glyphs,
  };
}

export function binaryCard(blocks: string[]): PuzzleVisual {
  const glyphs: VisualGlyph[] = [rect(8, 16, 84, 68, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)")];

  blocks.forEach((block, row) => {
    [...block].forEach((digit, column) => {
      glyphs.push(
        rect(
          18 + column * 12,
          26 + row * 12,
          9,
          8,
          digit === "1" ? cyan : "rgba(255,255,255,0.08)",
          digit === "1" ? cyanDim : "rgba(255,255,255,0.08)",
        ),
      );
    });
  });

  return {
    variant: "code",
    aspectRatio: "wide",
    frameLabel: "LANTERN_BINARY",
    background: "linear-gradient(180deg, rgba(14,14,14,0.98), rgba(28,27,27,0.96))",
    glyphs,
  };
}

export function substitutionLegend(entries: Array<[string, string]>): PuzzleVisual {
  return {
    variant: "diagram",
    aspectRatio: "wide",
    frameLabel: "LEGEND",
    background: "linear-gradient(180deg, rgba(14,14,14,0.98), rgba(32,31,31,0.96))",
    glyphs: [
      rect(8, 12, 84, 76, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)"),
      ...entries.flatMap(([symbol, letter], index) => [
        label(symbol, 24, 26 + index * 14, 10, cyan),
        line(36, 26 + index * 14, 18, 0, "rgba(255,255,255,0.18)", 2),
        label(letter, 66, 26 + index * 14, 10, violet),
      ]),
    ],
  };
}

export function railFenceCard(top: string, bottom: string): PuzzleVisual {
  return {
    variant: "paper",
    aspectRatio: "wide",
    frameLabel: "RAIL_LAYOUT",
    background: "linear-gradient(180deg, rgba(14,14,14,0.98), rgba(28,27,27,0.96))",
    glyphs: [
      rect(8, 16, 84, 68, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)"),
      label("RAIL 1", 20, 32, 6, slate, "start"),
      label(top, 48, 32, 8, cyan),
      label("RAIL 2", 20, 58, 6, slate, "start"),
      label(bottom, 48, 58, 8, violet),
      line(16, 40, 68, 0, "rgba(255,255,255,0.1)", 2),
    ],
  };
}

export function questionTile(frameLabel = "MISSING"): PuzzleVisual {
  return {
    variant: "tile",
    aspectRatio: "square",
    frameLabel,
    background: "linear-gradient(180deg, rgba(14,14,14,0.98), rgba(28,27,27,0.96))",
    grid: true,
    glyphs: [label("?", 50, 50, 28, cyan), ring(50, 50, 30, "rgba(255,255,255,0.08)", 2)],
  };
}
