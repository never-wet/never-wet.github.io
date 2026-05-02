import { Camera, Pause, Play, RotateCcw, Save, SkipForward, Upload } from "lucide-react";
import { formatSimDate } from "../lib/physics/OrbitalMath";
import { CameraMode, useSimulationStore } from "../store/useSimulationStore";
import { ScenarioSelector } from "./ScenarioSelector";

const SPEEDS = [0.1, 1, 10, 100, 1000];
const CAMERA_MODES: CameraMode[] = ["orbit", "follow", "cinematic", "top-down", "free"];

export function SimulationHUD() {
  const scenarioId = useSimulationStore((state) => state.scenarioId);
  const simTimeDays = useSimulationStore((state) => state.simTimeDays);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const timeSpeed = useSimulationStore((state) => state.timeSpeed);
  const cameraMode = useSimulationStore((state) => state.cameraMode);
  const physics = useSimulationStore((state) => state.physics);
  const togglePlay = useSimulationStore((state) => state.togglePlay);
  const stepForward = useSimulationStore((state) => state.stepForward);
  const setTimeSpeed = useSimulationStore((state) => state.setTimeSpeed);
  const setCameraMode = useSimulationStore((state) => state.setCameraMode);
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const resetScenario = useSimulationStore((state) => state.resetScenario);
  const setGravityMultiplier = useSimulationStore((state) => state.setGravityMultiplier);
  const saveScenario = useSimulationStore((state) => state.saveScenario);
  const loadSavedScenario = useSimulationStore((state) => state.loadSavedScenario);
  const gravityMultiplier = physics.gravitationalConstant / 0.0002959122082855911;

  return (
    <header className="simulation-hud" aria-label="Simulation controls">
      <a className="mission-mark" href="../" aria-label="Back to games">
        GS
      </a>
      <div className="mission-title">
        <span>Astrophysics Research Sandbox</span>
        <strong>Galaxy Simulator</strong>
      </div>

      <div className="mission-clock">
        <span>Simulation date</span>
        <strong>{formatSimDate(simTimeDays)}</strong>
      </div>

      <div className="hud-controls">
        <button className="hud-button primary" type="button" onClick={togglePlay}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isPlaying ? "Pause" : "Run"}</span>
        </button>
        <button className="hud-button" type="button" onClick={stepForward}>
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <label className="hud-field compact">
          <span>Speed</span>
          <select value={timeSpeed} onChange={(event) => setTimeSpeed(Number(event.target.value))}>
            {SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                x{speed}
              </option>
            ))}
          </select>
        </label>
        <label className="hud-field compact">
          <span>Gravity</span>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={gravityMultiplier}
            onChange={(event) => setGravityMultiplier(Number(event.target.value))}
          />
        </label>
        <label className="hud-field compact">
          <span>
            <Camera size={13} /> Camera
          </span>
          <select value={cameraMode} onChange={(event) => setCameraMode(event.target.value as CameraMode)}>
            {CAMERA_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <ScenarioSelector value={scenarioId} onChange={loadScenario} />
        <button className="hud-button" type="button" onClick={saveScenario}>
          <Save size={16} />
          <span>Save</span>
        </button>
        <button className="hud-button" type="button" onClick={loadSavedScenario}>
          <Upload size={16} />
          <span>Load</span>
        </button>
        <button className="hud-button" type="button" onClick={resetScenario}>
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}
