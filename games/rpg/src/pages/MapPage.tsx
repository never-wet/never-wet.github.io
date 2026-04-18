import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { getMapNodeState } from "../lib/game/selectors";
import { contentRegistry } from "../memory/contentRegistry";

export const MapPage = () => {
  const { state, dispatch } = useGame();

  return (
    <div className="page-grid">
      <Panel eyebrow="World Map" title="Hollowmere Regions">
        <div className="map-board">
          {contentRegistry.locations.map((location) => {
            const node = getMapNodeState(state, location.id);
            return (
              <button
                key={location.id}
                className={`map-node ${node.current ? "current" : ""} ${node.unlocked ? "unlocked" : "locked"}`}
                style={{ left: `${location.mapX}%`, top: `${location.mapY}%` }}
                disabled={!node.unlocked}
                onClick={() => dispatch({ type: "TRAVEL", locationId: location.id })}
                type="button"
              >
                <span>{location.name}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel eyebrow="Routes" title="Travel Targets">
        <div className="card-grid">
          {contentRegistry.locations.map((location) => {
            const node = getMapNodeState(state, location.id);
            return (
              <article key={location.id} className="feature-card">
                <h3>{location.name}</h3>
                <p>{location.subtitle}</p>
                <small>{node.unlocked ? (node.discovered ? "Discovered" : "Unlocked") : "Locked"}</small>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};
