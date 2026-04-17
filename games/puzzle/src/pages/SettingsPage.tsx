import { SelectMenu } from "../components/common/SelectMenu";
import { PageHero } from "../components/layout/PageHero";
import { useGame } from "../hooks/useGame";

export function SettingsPage() {
  const { state, updateSettings, clearProgress } = useGame();

  return (
    <div className="page page--stack">
      <PageHero
        eyebrow="Settings"
        title="Local Experience Controls"
        description="Everything in Puzzle Escape Lab runs locally. Adjust the presentation and persistence behavior here."
      />

      <section className="settings-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>Gameplay</h2>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.settings.timerEnabled}
              onChange={(event) => updateSettings({ timerEnabled: event.target.checked })}
            />
            <span>Enable puzzle timer</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.settings.hintsEnabled}
              onChange={(event) => updateSettings({ hintsEnabled: event.target.checked })}
            />
            <span>Allow hints</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.settings.soundEnabled}
              onChange={(event) => updateSettings({ soundEnabled: event.target.checked })}
            />
            <span>Enable optional sound cues</span>
          </label>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Accessibility</h2>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.settings.highContrast}
              onChange={(event) => updateSettings({ highContrast: event.target.checked })}
            />
            <span>High contrast mode</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.settings.reducedMotion}
              onChange={(event) => updateSettings({ reducedMotion: event.target.checked })}
            />
            <span>Reduced motion</span>
          </label>
          <div className="field">
            <span>Default view mode</span>
            <SelectMenu
              ariaLabel="Choose the default view mode"
              value={state.settings.defaultViewMode}
              onChange={(value) =>
                updateSettings({
                  defaultViewMode: value as "immersive" | "compact",
                })
              }
              options={[
                { value: "immersive", label: "Immersive", description: "Large panels and cinematic spacing." },
                { value: "compact", label: "Compact", description: "Tighter information density." },
              ]}
            />
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Reset</h2>
          </div>
          <p className="muted">
            Local progress includes puzzle timestamps, room states, inventory, settings, and recent activity.
          </p>
          <button
            type="button"
            className="button button--danger"
            onClick={() => {
              if (window.confirm("Clear all local Puzzle Escape Lab progress?")) {
                clearProgress();
              }
            }}
          >
            Clear Local Progress
          </button>
        </article>
      </section>
    </div>
  );
}
