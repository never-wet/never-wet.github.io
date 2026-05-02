import { Bomb, CirclePlus, Disc, Orbit, PanelLeftClose, PanelLeftOpen, RadioTower } from "lucide-react";
import { useState } from "react";
import { BodyType, vec } from "../lib/physics/NBodyEngine";
import { BodyDraft, useSimulationStore } from "../store/useSimulationStore";
import { VisualizationToggles } from "./VisualizationToggles";

const TYPE_OPTIONS: BodyType[] = ["star", "planet", "moon", "asteroid", "black-hole", "neutron-star"];

const DEFAULTS: Record<BodyType, Omit<BodyDraft, "name" | "type" | "position" | "velocity">> = {
  star: { massEarth: 333000, radiusEarth: 109, temperatureK: 5778, color: "#fff1a8" },
  planet: { massEarth: 1, radiusEarth: 1, temperatureK: 288, color: "#61a9ff" },
  moon: { massEarth: 0.012, radiusEarth: 0.27, temperatureK: 220, color: "#dce5f2" },
  asteroid: { massEarth: 0.00001, radiusEarth: 0.02, temperatureK: 150, color: "#a99078" },
  "black-hole": { massEarth: 3330000, radiusEarth: 0.002, temperatureK: 0, color: "#02030a" },
  "neutron-star": { massEarth: 466000, radiusEarth: 0.0022, temperatureK: 900000, color: "#9ffcff" },
  dust: { massEarth: 0.000001, radiusEarth: 0.001, temperatureK: 90, color: "#8d8274" },
};

export function ObjectCreator({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const bodyCount = useSimulationStore((state) => state.bodies.length);
  const maxBodies = useSimulationStore((state) => state.physics.maxBodies);
  const selected = useSimulationStore((state) =>
    state.bodies.find((body) => body.id === state.selectedId),
  );
  const createBody = useSimulationStore((state) => state.createBody);
  const triggerSupernova = useSimulationStore((state) => state.triggerSupernova);
  const convertSelectedToBlackHole = useSimulationStore((state) => state.convertSelectedToBlackHole);
  const seedDustDisk = useSimulationStore((state) => state.seedDustDisk);
  const [type, setType] = useState<BodyType>("planet");
  const [draft, setDraft] = useState<BodyDraft>({
    name: "Research Body",
    type: "planet",
    ...DEFAULTS.planet,
    position: vec(1.5, 0, 0),
    velocity: vec(0, 0, 0.014),
  });

  function setTypeAndDefaults(nextType: BodyType) {
    setType(nextType);
    setDraft((current) => ({
      ...current,
      type: nextType,
      name: labelForType(nextType),
      ...DEFAULTS[nextType],
    }));
  }

  if (!isOpen) {
    return (
      <button
        className="drawer-handle left-drawer-handle"
        type="button"
        onClick={onToggle}
        aria-label="Open tools panel"
        aria-expanded={false}
      >
        <PanelLeftOpen size={16} />
        <span>Tools</span>
      </button>
    );
  }

  return (
    <aside className="mission-panel left-mission-panel drawer-open" aria-label="Object creation and events">
      <button
        className="panel-drawer-control"
        type="button"
        onClick={onToggle}
        aria-label="Hide tools panel"
        aria-expanded={true}
      >
        <PanelLeftClose size={15} />
        <span>Hide Tools</span>
      </button>
      <section className="panel-block">
        <div className="panel-heading">
          <span>Object Factory</span>
          <strong>{bodyCount}/{maxBodies}</strong>
        </div>
        <label className="field">
          <span>Class</span>
          <select value={type} onChange={(event) => setTypeAndDefaults(event.target.value as BodyType)}>
            {TYPE_OPTIONS.map((bodyType) => (
              <option key={bodyType} value={bodyType}>
                {labelForType(bodyType)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Name</span>
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <div className="field-grid">
          <NumberField label="Mass (Mearth)" value={draft.massEarth} onChange={(massEarth) => setDraft({ ...draft, massEarth })} />
          <NumberField label="Radius (Rearth)" value={draft.radiusEarth} onChange={(radiusEarth) => setDraft({ ...draft, radiusEarth })} />
          <NumberField label="Temp (K)" value={draft.temperatureK} onChange={(temperatureK) => setDraft({ ...draft, temperatureK })} />
          <label className="field">
            <span>Color</span>
            <input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
          </label>
        </div>
        <VectorEditor
          label="Position offset (AU)"
          value={draft.position}
          step={0.05}
          onChange={(position) => setDraft({ ...draft, position })}
        />
        <VectorEditor
          label="Velocity (AU/day)"
          value={draft.velocity}
          step={0.001}
          onChange={(velocity) => setDraft({ ...draft, velocity })}
        />
        <div className="button-grid">
          <button className="mission-button primary" type="button" onClick={() => createBody(draft, false)}>
            <CirclePlus size={16} />
            Create Body
          </button>
          <button className="mission-button" type="button" disabled={!selected} onClick={() => createBody(draft, true)}>
            <Orbit size={16} />
            Orbit Selected
          </button>
        </div>
        <p className="panel-note">{selected ? `Orbit reference: ${selected.name}` : "Select a body to seed orbital creation."}</p>
      </section>

      <section className="panel-block">
        <div className="panel-heading">
          <span>Event Tools</span>
          <strong>Model</strong>
        </div>
        <button className="event-command danger" type="button" onClick={triggerSupernova}>
          <Bomb size={16} />
          Trigger Supernova
        </button>
        <button className="event-command" type="button" onClick={convertSelectedToBlackHole}>
          <RadioTower size={16} />
          Convert to Black Hole
        </button>
        <button className="event-command" type="button" onClick={seedDustDisk}>
          <Disc size={16} />
          Seed Dust Disk
        </button>
      </section>

      <VisualizationToggles />
    </aside>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step="any" min={0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function VectorEditor({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: ReturnType<typeof vec>;
  step: number;
  onChange: (value: ReturnType<typeof vec>) => void;
}) {
  return (
    <div className="vector-editor">
      <span>{label}</span>
      <div>
        {(["x", "y", "z"] as const).map((axis) => (
          <label key={axis}>
            <span>{axis}</span>
            <input
              type="number"
              value={value[axis]}
              step={step}
              onChange={(event) => onChange({ ...value, [axis]: Number(event.target.value) })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function labelForType(type: BodyType): string {
  if (type === "black-hole") return "Black Hole";
  if (type === "neutron-star") return "Neutron Star";
  return type[0].toUpperCase() + type.slice(1);
}
