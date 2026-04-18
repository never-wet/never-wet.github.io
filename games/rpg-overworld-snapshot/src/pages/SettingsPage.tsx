import { useGame } from "../hooks/useGame";
import { Panel } from "../components/common/Panel";
import { manualSlotIds } from "../memory/saveSchema";

export const SettingsPage = () => {
  const { state, dispatch, saveToSlot, resetToTitle, startNewGame } = useGame();

  return (
    <div className="page-grid">
      <Panel eyebrow="Audio" title="Sound & Accessibility">
        <div className="stack-actions">
          {([
            ["masterVolume", "Master"],
            ["musicVolume", "Music"],
            ["ambienceVolume", "Ambience"],
            ["sfxVolume", "SFX"],
          ] as const).map(([key, label]) => (
            <label key={key} className="field slider-field">
              <span>{label}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.settings[key]}
                onChange={(event) => dispatch({ type: "SET_SETTINGS", settings: { [key]: Number(event.target.value) } })}
              />
            </label>
          ))}
          <label className="field">
            <span>Text Speed</span>
            <select value={state.settings.textSpeed} onChange={(event) => dispatch({ type: "SET_SETTINGS", settings: { textSpeed: event.target.value as "calm" | "standard" | "swift" } })}>
              <option value="calm">Calm</option>
              <option value="standard">Standard</option>
              <option value="swift">Swift</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel eyebrow="Save Tools" title="Manual Save">
        <div className="card-grid three-up">
          {manualSlotIds.map((slotId) => (
            <article key={slotId} className="feature-card">
              <h3>{slotId.replace("slot-", "Slot ")}</h3>
              <button className="secondary-button" onClick={() => saveToSlot(slotId)} type="button">
                Save Current Journey
              </button>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Reset" title="Journey Controls">
        <div className="stack-actions">
          <button className="secondary-button" onClick={() => resetToTitle()} type="button">
            Return to Title
          </button>
          <button
            className="ghost-button"
            onClick={() => {
              if (window.confirm("Start a fresh journey? Your autosave will update when you play.")) {
                startNewGame(state.player.name);
              }
            }}
            type="button"
          >
            Reset Current Game
          </button>
        </div>
      </Panel>
    </div>
  );
};
