import { AlertTriangle, Crosshair, PanelRightClose, PanelRightOpen, Trash2 } from "lucide-react";
import { EARTH_MASS_KG, EARTH_RADIUS_KM } from "../lib/physics/NBodyEngine";
import {
  computeOrbitalElements,
  formatDistanceAU,
  formatDurationDays,
  formatMass,
  formatRadius,
  formatSpeedKmS,
  vectorToString,
} from "../lib/physics/OrbitalMath";
import { useSimulationStore } from "../store/useSimulationStore";

export function ObjectInspector({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const bodies = useSimulationStore((state) => state.bodies);
  const selectedId = useSimulationStore((state) => state.selectedId);
  const prediction = useSimulationStore((state) => state.prediction);
  const eventLog = useSimulationStore((state) => state.eventLog);
  const physics = useSimulationStore((state) => state.physics);
  const updateBody = useSimulationStore((state) => state.updateBody);
  const deleteBody = useSimulationStore((state) => state.deleteBody);
  const selected = bodies.find((body) => body.id === selectedId);
  const orbit = selected ? computeOrbitalElements(selected, bodies, physics.gravitationalConstant) : null;

  if (!isOpen) {
    return (
      <button
        className="drawer-handle right-drawer-handle"
        type="button"
        onClick={onToggle}
        aria-label="Open data panel"
        aria-expanded={false}
      >
        <PanelRightOpen size={16} />
        <span>Data</span>
      </button>
    );
  }

  return (
    <aside className="mission-panel right-mission-panel drawer-open" aria-label="Scientific object inspector">
      <button
        className="panel-drawer-control right-control"
        type="button"
        onClick={onToggle}
        aria-label="Hide data panel"
        aria-expanded={true}
      >
        <span>Hide Data</span>
        <PanelRightClose size={15} />
      </button>
      <section className="panel-block">
        <div className="panel-heading">
          <span>Object Inspector</span>
          <Crosshair size={15} />
        </div>
        {selected ? (
          <>
            <div className="object-title">
              <span className="object-color" style={{ background: selected.color }} />
              <div>
                <strong>{selected.name}</strong>
                <span>{selected.type}</span>
              </div>
            </div>
            <div className="science-grid">
              <Readout label="Mass" value={formatMass(selected.massKg)} />
              <Readout label="Radius" value={formatRadius(selected.radiusKm)} />
              <Readout label="Density" value={`${selected.densityKgM3.toExponential(2)} kg/m3`} />
              <Readout label="Temp" value={`${Math.round(selected.temperatureK).toLocaleString()} K`} />
              <Readout label="Luminosity" value={`${selected.luminositySolar.toExponential(2)} Lsol`} />
              <Readout label="Velocity" value={formatSpeedKmS(orbit?.relativeSpeedKmS ?? 0)} />
              <Readout label="Distance" value={formatDistanceAU(orbit?.distanceAU)} />
              <Readout label="Primary" value={orbit?.primary?.name ?? "none"} />
              <Readout label="Periapsis" value={formatDistanceAU(orbit?.periapsisAU)} />
              <Readout label="Apoapsis" value={formatDistanceAU(orbit?.apoapsisAU)} />
              <Readout label="Eccentricity" value={orbit?.eccentricity == null ? "unknown" : orbit.eccentricity.toFixed(3)} />
              <Readout label="Period" value={formatDurationDays(orbit?.orbitalPeriodDays)} />
            </div>
            <div className="edit-grid">
              <label className="field">
                <span>Mass (Mearth)</span>
                <input
                  type="number"
                  step="any"
                  value={selected.massKg / EARTH_MASS_KG}
                  onChange={(event) => updateBody(selected.id, { massKg: Number(event.target.value) * EARTH_MASS_KG })}
                />
              </label>
              <label className="field">
                <span>Radius (Rearth)</span>
                <input
                  type="number"
                  step="any"
                  value={selected.radiusKm / EARTH_RADIUS_KM}
                  onChange={(event) => updateBody(selected.id, { radiusKm: Number(event.target.value) * EARTH_RADIUS_KM })}
                />
              </label>
            </div>
            <Readout label="Position" value={vectorToString(selected.position)} wide />
            <VectorVelocityEditor />
            <button className="mission-button danger" type="button" onClick={() => deleteBody(selected.id)}>
              <Trash2 size={16} />
              Delete Object
            </button>
          </>
        ) : (
          <div className="empty-inspector">
            <Crosshair size={28} />
            <p>Select a rendered body to inspect live orbital data.</p>
          </div>
        )}
      </section>

      <section className="panel-block">
        <div className="panel-heading">
          <span>Prediction</span>
          <strong>{prediction?.status ?? "idle"}</strong>
        </div>
        {prediction ? (
          <div className={`prediction-report ${prediction.status}`}>
            <strong>{prediction.summary}</strong>
            <div className="risk-meter">
              <span style={{ width: `${Math.round(prediction.collisionProbability * 100)}%` }} />
            </div>
            <div className="science-grid">
              <Readout label="Collision risk" value={`${Math.round(prediction.collisionProbability * 100)}%`} />
              <Readout label="Closest approach" value={formatDistanceAU(prediction.closestApproachAU)} />
              <Readout label="Time to event" value={formatDurationDays(prediction.estimatedTimeToEventDays)} />
              <Readout label="Path samples" value={String(prediction.trajectory.length)} />
            </div>
            {prediction.warnings.length ? (
              <div className="warning-stack">
                {prediction.warnings.map((warning) => (
                  <span key={warning}>
                    <AlertTriangle size={13} />
                    {warning}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="panel-note">Enable prediction paths and select an object to run future-state analysis.</p>
        )}
      </section>

      <section className="panel-block log-panel">
        <div className="panel-heading">
          <span>Mission Log</span>
          <strong>{eventLog.length}</strong>
        </div>
        {eventLog.map((entry, index) => (
          <p key={`${entry}-${index}`}>{entry}</p>
        ))}
      </section>
    </aside>
  );
}

function VectorVelocityEditor() {
  const selected = useSimulationStore((state) =>
    state.bodies.find((body) => body.id === state.selectedId),
  );
  const updateBody = useSimulationStore((state) => state.updateBody);

  if (!selected) return null;

  return (
    <div className="vector-editor compact-vector">
      <span>Velocity (AU/day)</span>
      <div>
        {(["x", "y", "z"] as const).map((axis) => (
          <label key={axis}>
            <span>{axis}</span>
            <input
              type="number"
              step={0.0005}
              value={selected.velocity[axis].toFixed(5)}
              onChange={(event) =>
                updateBody(selected.id, {
                  velocity: { ...selected.velocity, [axis]: Number(event.target.value) },
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function Readout({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "science-readout wide" : "science-readout"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
