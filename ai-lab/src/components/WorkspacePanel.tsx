import { Database, Download, FileUp, FolderSync, RefreshCcw } from 'lucide-react'

import { PanelFrame } from './PanelFrame'
import { contentRegistry } from '../memory/contentRegistry'
import { storageKeys } from '../memory/storageKeys'
import { TagPill } from './TagPill'

interface WorkspacePanelProps {
  onExport: () => void
  onImport: () => void
  onReset: () => void
  onLoadSample: (presetId: 'xor-lab' | 'spiral-lab' | 'sine-lab') => void
}

export const WorkspacePanel = ({
  onExport,
  onImport,
  onReset,
  onLoadSample,
}: WorkspacePanelProps) => (
  <PanelFrame
    eyebrow="Storage"
    title="Persistence, export, and sample launches"
    subtitle="The lab stays local-first, and this panel is the recovery and setup surface for imports, backups, resets, and starter recipes."
  >
    <div className="workspace-panel">
      <div className="chart-card">
        <div className="chart-card__header">
          <div>
            <p className="section-kicker">Quick start</p>
            <h3>Load a guided sample flow</h3>
          </div>
        </div>
        <p className="muted-copy">
          Sample launches swap the trainer recipe and builder flow together so new users can start from a known-good setup quickly.
        </p>
        <div className="workspace-actions">
          <button type="button" className="secondary-button" onClick={() => onLoadSample('xor-lab')}>
            XOR starter
          </button>
          <button type="button" className="secondary-button" onClick={() => onLoadSample('spiral-lab')}>
            Spiral starter
          </button>
          <button type="button" className="secondary-button" onClick={() => onLoadSample('sine-lab')}>
            Sine starter
          </button>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card__header">
          <div>
            <p className="section-kicker">Persistence</p>
            <h3>Save strategy</h3>
          </div>
        </div>
        <div className="workspace-persistence">
          <div className="workspace-persistence__item">
            <Database size={15} />
            <div>
              <strong>{storageKeys.workspace}</strong>
              <small>Zustand + localStorage for the main workspace state.</small>
            </div>
          </div>
          <div className="workspace-persistence__item">
            <FolderSync size={15} />
            <div>
              <strong>{storageKeys.workspaceSnapshot}</strong>
              <small>IndexedDB snapshot backup for larger workspace payloads.</small>
            </div>
          </div>
          <div className="workspace-persistence__item">
            <Database size={15} />
            <div>
              <strong>{storageKeys.modelPrefix}*</strong>
              <small>TensorFlow.js model saves live in IndexedDB after completed runs.</small>
            </div>
          </div>
        </div>
        <div className="workspace-actions">
          <button type="button" className="primary-button" onClick={onExport}>
            <Download size={16} />
            Export JSON
          </button>
          <button type="button" className="secondary-button" onClick={onImport}>
            <FileUp size={16} />
            Import JSON
          </button>
          <button type="button" className="secondary-button secondary-button--danger" onClick={onReset}>
            <RefreshCcw size={16} />
            Reset demo
          </button>
        </div>
        <p className="muted-copy">
          Exports capture the full workspace JSON, while completed browser models stay stored locally in IndexedDB until you reset or clear browser storage.
        </p>
      </div>

      <div className="chart-card">
        <div className="chart-card__header">
          <div>
            <p className="section-kicker">Memory files</p>
            <h3>Readable product map</h3>
          </div>
        </div>
        <div className="workspace-memory-grid">
          {[
            'appManifest.ts',
            'graphIndex.ts',
            'nodeTypeIndex.ts',
            'modelBlockIndex.ts',
            'trainingManifest.ts',
            'uiManifest.ts',
            'defaultState.ts',
            'saveSchema.ts',
          ].map((file) => (
            <TagPill key={file} label={file} muted />
          ))}
        </div>
        <div className="tag-row">
          <TagPill label={`${contentRegistry.graph.categories.length} graph categories`} />
          <TagPill label={`${contentRegistry.builder.blocks.length} builder blocks`} />
          <TagPill label={`${contentRegistry.training.presets.length} demo presets`} />
        </div>
      </div>
    </div>
  </PanelFrame>
)
