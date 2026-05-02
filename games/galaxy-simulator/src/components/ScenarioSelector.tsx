import { SCENARIO_OPTIONS, ScenarioId } from "../lib/scenarios/SolarSystem";

type ScenarioSelectorProps = {
  value: ScenarioId;
  onChange: (id: ScenarioId) => void;
};

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <label className="hud-field scenario-selector">
      <span>Scenario</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ScenarioId)}>
        {SCENARIO_OPTIONS.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.name}
          </option>
        ))}
      </select>
    </label>
  );
}
