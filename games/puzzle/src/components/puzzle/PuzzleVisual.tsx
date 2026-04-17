import { useId } from "react";
import type { PuzzleVisual as PuzzleVisualData, VisualGlyph } from "../../memory/types";

function fontFamilyForGlyph(glyph: VisualGlyph) {
  return glyph.kind === "text" && (glyph.fontSize ?? 0) >= 12 ? "Space Grotesk, sans-serif" : "Inter, sans-serif";
}

function renderGlyph(glyph: VisualGlyph, index: number) {
  const key = `${glyph.kind}-${index}-${glyph.x}-${glyph.y}`;
  const transform = glyph.rotation ? `rotate(${glyph.rotation} ${glyph.x} ${glyph.y})` : undefined;
  const fill = glyph.fill ?? "none";
  const stroke = glyph.stroke ?? "none";
  const strokeWidth = glyph.strokeWidth ?? 2;
  const opacity = glyph.opacity ?? 1;

  switch (glyph.kind) {
    case "rect":
      return (
        <rect
          key={key}
          x={glyph.x}
          y={glyph.y}
          width={glyph.width ?? 0}
          height={glyph.height ?? 0}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );
    case "circle":
      return (
        <circle
          key={key}
          cx={glyph.x}
          cy={glyph.y}
          r={glyph.size ?? 6}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );
    case "ring":
      return (
        <circle
          key={key}
          cx={glyph.x}
          cy={glyph.y}
          r={glyph.size ?? 8}
          fill="none"
          stroke={glyph.stroke ?? glyph.fill ?? "#00fbfb"}
          strokeWidth={glyph.strokeWidth ?? 4}
          opacity={opacity}
          transform={transform}
        />
      );
    case "diamond": {
      const size = glyph.size ?? Math.max(glyph.width ?? 0, glyph.height ?? 0, 12);
      const points = [
        `${glyph.x},${glyph.y - size / 2}`,
        `${glyph.x + size / 2},${glyph.y}`,
        `${glyph.x},${glyph.y + size / 2}`,
        `${glyph.x - size / 2},${glyph.y}`,
      ].join(" ");

      return (
        <polygon
          key={key}
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );
    }
    case "line":
      return (
        <line
          key={key}
          x1={glyph.x}
          y1={glyph.y}
          x2={glyph.x + (glyph.width ?? 0)}
          y2={glyph.y + (glyph.height ?? 0)}
          stroke={glyph.stroke ?? glyph.fill ?? "#e5e2e1"}
          strokeWidth={glyph.strokeWidth ?? 4}
          opacity={opacity}
          transform={transform}
          strokeLinecap="square"
        />
      );
    case "triangle": {
      const width = glyph.width ?? glyph.size ?? 18;
      const height = glyph.height ?? glyph.size ?? 18;
      const points = [
        `${glyph.x},${glyph.y - height / 2}`,
        `${glyph.x + width / 2},${glyph.y + height / 2}`,
        `${glyph.x - width / 2},${glyph.y + height / 2}`,
      ].join(" ");

      return (
        <polygon
          key={key}
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={transform}
        />
      );
    }
    case "text":
      return (
        <text
          key={key}
          x={glyph.x}
          y={glyph.y}
          fill={glyph.fill ?? "#e5e2e1"}
          opacity={opacity}
          transform={transform}
          fontFamily={fontFamilyForGlyph(glyph)}
          fontSize={glyph.fontSize ?? 8}
          letterSpacing={glyph.letterSpacing ?? 0.8}
          textAnchor={glyph.align ?? "middle"}
          dominantBaseline="middle"
        >
          {glyph.text}
        </text>
      );
    default:
      return null;
  }
}

export function PuzzleVisual({
  visual,
  compact = false,
}: {
  visual: PuzzleVisualData;
  compact?: boolean;
}) {
  const gridId = useId().replace(/:/g, "");
  const aspectRatio = visual.aspectRatio === "wide" ? "16 / 9" : "1 / 1";

  return (
    <figure className={`puzzle-visual ${compact ? "puzzle-visual--compact" : ""}`}>
      <div
        className={`puzzle-visual__frame puzzle-visual__frame--${visual.variant ?? "tile"}`}
        style={{
          background:
            visual.background ??
            "linear-gradient(180deg, rgba(14, 14, 14, 0.98), rgba(32, 31, 31, 0.95))",
          aspectRatio,
          ["--visual-accent" as string]: visual.accent ?? "#00fbfb",
        }}
      >
        {visual.frameLabel ? <span className="puzzle-visual__label">{visual.frameLabel}</span> : null}
        <svg viewBox="0 0 100 100" className={`puzzle-visual__svg ${visual.grid ? "puzzle-visual__svg--grid" : ""}`}>
          <defs>
            <pattern id={gridId} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
            </pattern>
          </defs>
          {visual.grid ? <rect x="0" y="0" width="100" height="100" fill={`url(#${gridId})`} /> : null}
          {visual.glyphs.map(renderGlyph)}
        </svg>
      </div>
      {visual.caption ? <figcaption className="puzzle-visual__caption">{visual.caption}</figcaption> : null}
    </figure>
  );
}
