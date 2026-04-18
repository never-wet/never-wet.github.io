import { getOverworldViewModel } from "../../lib/game/selectors";
import { tileCharToType } from "../../lib/game/overworld";
import type { Direction, GameState } from "../../memory/types";

const iconForInteraction = (kind: string) => {
  switch (kind) {
    case "npc":
      return "N";
    case "travel":
      return ">";
    case "shop":
      return "$";
    case "message":
      return "?";
    default:
      return "!";
  }
};

interface OverworldMapProps {
  state: GameState;
  onMove: (direction: Direction) => void;
  onInteract: () => void;
  showControls?: boolean;
  showLegend?: boolean;
}

export const OverworldMap = ({ state, onMove, onInteract, showControls = true, showLegend = true }: OverworldMapProps) => {
  const { map, position, interactions } = getOverworldViewModel(state);

  return (
    <div className="overworld-shell">
      {showLegend ? (
        <div className="overworld-topbar">
          <div>
            <p className="eyebrow">Live Map</p>
            <h3>{map.subtitle}</h3>
          </div>
          <div className="overworld-legend">
            <span className="legend-chip">
              <span className="legend-swatch legend-road" />
              Road
            </span>
            <span className="legend-chip">
              <span className="legend-swatch legend-wild" />
              Wild
            </span>
            <span className="legend-chip">
              <span className="legend-swatch legend-npc" />
              NPC
            </span>
            <span className="legend-chip">
              <span className="legend-swatch legend-action" />
              Event
            </span>
            <span className="legend-chip">
              <span className="legend-swatch legend-travel" />
              Exit
            </span>
          </div>
        </div>
      ) : null}

      <div
        className={`overworld-map ${showControls ? "game-mode" : "preview-mode"}`}
        style={{ gridTemplateColumns: `repeat(${map.width}, 1fr)` }}
      >
        {map.tiles.flatMap((row, y) =>
          row.split("").map((char, x) => {
            const tileType = tileCharToType(char);
            const interaction = interactions.find((entry) => entry.x === x && entry.y === y);
            const isPlayer = position.x === x && position.y === y;

            return (
              <div
                key={`${x}-${y}`}
                className={`ow-tile ow-${tileType} ${interaction ? `has-${interaction.kind}` : ""} ${isPlayer ? "player-here" : ""}`}
                title={interaction?.label ?? map.title}
              >
                {interaction ? <span className={`poi poi-${interaction.kind}`}>{iconForInteraction(interaction.kind)}</span> : null}
                {isPlayer ? <span className="player-token">R</span> : null}
              </div>
            );
          }),
        )}
      </div>

      {showControls ? (
        <div className="overworld-controls">
          <div className="dpad">
            <button className="secondary-button control-button" onClick={() => onMove("up")} type="button">
              Up
            </button>
            <div className="dpad-row">
              <button className="secondary-button control-button" onClick={() => onMove("left")} type="button">
                Left
              </button>
              <button className="primary-button control-button" onClick={onInteract} type="button">
                Interact
              </button>
              <button className="secondary-button control-button" onClick={() => onMove("right")} type="button">
                Right
              </button>
            </div>
            <button className="secondary-button control-button" onClick={() => onMove("down")} type="button">
              Down
            </button>
          </div>
          <p className="support-copy">Use `WASD` or arrow keys to move. Use `E` or `Enter` to interact.</p>
        </div>
      ) : null}
    </div>
  );
};
