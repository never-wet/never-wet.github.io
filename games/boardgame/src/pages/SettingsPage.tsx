import { useAppContext } from "../context/AppContext";

export function SettingsPage() {
  const { appState, updateSettings, resetAllStats } = useAppContext();
  const { settings } = appState;

  return (
    <div className="page-stack narrow-stack">
      <section className="section-heading surface-card">
        <p className="eyebrow">Settings</p>
        <h1>Preference controls</h1>
        <p>These options are stored locally so the hub remembers how you like to play.</p>
      </section>

      <section className="settings-grid">
        <article className="surface-card setting-card">
          <h3>Theme</h3>
          <div className="toggle-row">
            {(["midnight", "paper"] as const).map((theme) => (
              <button
                className={`pill-button${settings.theme === theme ? " is-active" : ""}`}
                key={theme}
                onClick={() => updateSettings({ theme })}
                type="button"
              >
                {theme}
              </button>
            ))}
          </div>
        </article>

        <article className="surface-card setting-card">
          <h3>Board labels</h3>
          <button
            className={`pill-button${settings.coordinateLabels ? " is-active" : ""}`}
            onClick={() => updateSettings({ coordinateLabels: !settings.coordinateLabels })}
            type="button"
          >
            {settings.coordinateLabels ? "Shown" : "Hidden"}
          </button>
        </article>

        <article className="surface-card setting-card">
          <h3>Animations</h3>
          <button
            className={`pill-button${settings.animations ? " is-active" : ""}`}
            onClick={() => updateSettings({ animations: !settings.animations })}
            type="button"
          >
            {settings.animations ? "Enabled" : "Reduced"}
          </button>
        </article>

        <article className="surface-card setting-card">
          <h3>Sound preference</h3>
          <button
            className={`pill-button${settings.sound ? " is-active" : ""}`}
            onClick={() => updateSettings({ sound: !settings.sound })}
            type="button"
          >
            {settings.sound ? "On" : "Off"}
          </button>
        </article>

        <article className="surface-card setting-card danger-card">
          <h3>Reset local progress</h3>
          <p>Clears stats, saves, dashboard history, and UI preferences for this hub.</p>
          <button className="danger-button" onClick={resetAllStats} type="button">
            Reset all data
          </button>
        </article>
      </section>
    </div>
  );
}
