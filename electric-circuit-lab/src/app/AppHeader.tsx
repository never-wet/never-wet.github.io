import { appManifest } from '../memory/appManifest'
import { useCircuitLab } from '../state/CircuitLabContext'

export const AppHeader = () => {
  const { state, setActiveSection, setWorkspace, runSimulation, openBlankSandbox } = useCircuitLab()
  const primarySections = appManifest.sections.filter(
    (section) => !['simulation', 'sandbox'].includes(section.id),
  )

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-badge">CL</div>
        <nav className="topbar-iconnav" aria-label="Primary sections">
          {primarySections.map((section) => (
            <button
              key={section.id}
              className={state.ui.activeSection === section.id ? 'icon-nav-button is-active' : 'icon-nav-button'}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-center">
        <span>{state.currentCircuit.name}</span>
        <p>Learn, wire, simulate, and iterate in one browser-based circuit studio.</p>
      </div>

      <div className="topbar-actions">
        <button className="ghost-button" onClick={openBlankSandbox} type="button">
          New circuit
        </button>
        <button className="ghost-button" onClick={() => setActiveSection('library')} type="button">
          Search
        </button>
        <button className="ghost-button" onClick={() => setWorkspace('sandbox')} type="button">
          Sandbox
        </button>
        <button className="primary-button" onClick={runSimulation} type="button">
          Run
        </button>
      </div>
    </header>
  )
}
