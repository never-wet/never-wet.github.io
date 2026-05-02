import {
  Activity,
  Disc3,
  Eye,
  Gauge,
  Grid3X3,
  Orbit,
  Radar,
  Route,
  Tags,
  ThermometerSun,
} from "lucide-react";
import { VisualizationToggles as ToggleState, useSimulationStore } from "../store/useSimulationStore";

const TOGGLES: Array<{
  key: keyof ToggleState;
  label: string;
  icon: typeof Orbit;
}> = [
  { key: "orbitTrails", label: "Orbit Trails", icon: Orbit },
  { key: "predictionPaths", label: "Prediction Paths", icon: Route },
  { key: "gravityField", label: "Gravity Field", icon: Activity },
  { key: "velocityVectors", label: "Velocity Vectors", icon: Gauge },
  { key: "collisionRisk", label: "Collision Risk", icon: Radar },
  { key: "objectLabels", label: "Object Labels", icon: Tags },
  { key: "habitableZone", label: "Habitable Zone", icon: ThermometerSun },
  { key: "accretionDisk", label: "Accretion Disk", icon: Disc3 },
  { key: "eventHorizon", label: "Event Horizon", icon: Eye },
  { key: "simulationGrid", label: "Show Simulation Grid", icon: Grid3X3 },
];

export function VisualizationToggles() {
  const visualization = useSimulationStore((state) => state.visualization);
  const toggleVisualization = useSimulationStore((state) => state.toggleVisualization);

  return (
    <section className="panel-block">
      <div className="panel-heading">
        <span>Visualization</span>
        <strong>Modes</strong>
      </div>
      <div className="toggle-grid">
        {TOGGLES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={visualization[key] ? "toggle-chip active" : "toggle-chip"}
            type="button"
            onClick={() => toggleVisualization(key)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
