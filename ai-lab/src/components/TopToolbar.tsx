import { startTransition } from 'react'
import { Download, FileUp, Search, Sparkles, Workflow, RotateCcw } from 'lucide-react'

import { appManifest } from '../memory/appManifest'
import type { LabMode } from '../memory/types'
import { formatTimestamp } from '../utils/format'

interface TopToolbarProps {
  mode: LabMode
  searchQuery: string
  showOnlyConnected: boolean
  showLabels: boolean
  lastSavedAt: string
  onModeChange: (mode: LabMode) => void
  onSearchChange: (query: string) => void
  onExport: () => void
  onImport: () => void
  onReset: () => void
  onToggleConnected: (enabled: boolean) => void
  onToggleLabels: (enabled: boolean) => void
}

export const TopToolbar = ({
  mode,
  searchQuery,
  showOnlyConnected,
  showLabels,
  lastSavedAt,
  onModeChange,
  onSearchChange,
  onExport,
  onImport,
  onReset,
  onToggleConnected,
  onToggleLabels,
}: TopToolbarProps) => (
  <header className="top-toolbar">
    <div className="top-toolbar__brand">
      <div className="brand-mark">
        <Sparkles size={18} />
      </div>
      <div>
        <p className="top-toolbar__kicker">Browser AI Lab</p>
        <h1>{appManifest.title}</h1>
        <p className="top-toolbar__subtitle">{appManifest.subtitle}</p>
      </div>
    </div>

    <div className="top-toolbar__controls">
      <div className="toolbar-chip toolbar-chip--search">
        <Search size={16} />
        <input
          aria-label="Search graph"
          placeholder="Search notes, datasets, models, tags..."
          value={searchQuery}
          onChange={(event) => {
            const nextValue = event.target.value
            startTransition(() => onSearchChange(nextValue))
          }}
        />
      </div>

      <div className="toolbar-segment">
        {appManifest.modes.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === mode ? 'is-active' : ''}
            onClick={() => onModeChange(entry.id as LabMode)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <label className="toolbar-toggle">
        <input
          type="checkbox"
          checked={showOnlyConnected}
          onChange={(event) => onToggleConnected(event.target.checked)}
        />
        Focus neighbors
      </label>

      <label className="toolbar-toggle">
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(event) => onToggleLabels(event.target.checked)}
        />
        Labels
      </label>

      <button type="button" className="toolbar-button" onClick={onExport}>
        <Download size={16} />
        Export
      </button>

      <button type="button" className="toolbar-button" onClick={onImport}>
        <FileUp size={16} />
        Import
      </button>

      <button type="button" className="toolbar-button toolbar-button--warn" onClick={onReset}>
        <RotateCcw size={16} />
        Reset Demo
      </button>
    </div>

    <div className="top-toolbar__status">
      <span className="status-pill">
        <Workflow size={14} />
        Autosave active
      </span>
      <span className="status-note">Last sync {formatTimestamp(lastSavedAt)}</span>
    </div>
  </header>
)
