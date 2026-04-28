"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Download, FileJson, FileType, ImageDown, Play, Save, Trash2 } from "lucide-react";
import { exportGLTF, exportHeightmapPNG, exportOBJ, exportParametersJSON } from "@/lib/exporters";
import { resolutionOptions, terrainTypeLabels } from "@/lib/presets";
import { useTerrainStore } from "@/store/useTerrainStore";
import type { BrushMode, MaterialPreset, NoiseAlgorithm, RenderQuality, TerrainType } from "@/types/terrain";

function formatNumber(value: number, digits = 2) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  digits?: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, unit = "", digits = 2, onChange }: SliderProps) {
  return (
    <label className="slider-field">
      <span className="slider-meta">
        <span className="control-label">{label}</span>
        <span className="slider-value">
          {formatNumber(value, digits)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-field">
      <span className="control-label">{label}</span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span />
      </span>
    </label>
  );
}

interface SelectMenuOption<T extends number | string> {
  value: T;
  label: string;
  meta?: string;
}

interface SelectMenuProps<T extends number | string> {
  label: string;
  value: T;
  options: SelectMenuOption<T>[];
  onChange: (value: T) => void;
}

function SelectMenu<T extends number | string>({ label, value, options, onChange }: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => Object.is(option.value, value)) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`select-field select-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <span className="select-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        className="select-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="select-value">{selected?.label}</span>
        <span className="select-indicator">
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </button>
      {open ? (
        <div className="select-popover" id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`}>
          {options.map((option) => (
            <button
              className={`select-option${Object.is(option.value, value) ? " is-selected" : ""}`}
              key={String(option.value)}
              role="option"
              aria-selected={Object.is(option.value, value)}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="select-option-label">{option.label}</span>
              {option.meta ? <span className="select-option-meta">{option.meta}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface AdvancedDetailsProps {
  title: string;
  meta: string;
  children: React.ReactNode;
}

function AdvancedDetails({ title, meta, children }: AdvancedDetailsProps) {
  return (
    <details className="advanced">
      <summary>
        <span className="advanced-summary-main">
          <span className="advanced-title">{title}</span>
          <span className="advanced-meta">{meta}</span>
        </span>
        <ChevronDown className="advanced-chevron" size={16} aria-hidden="true" />
      </summary>
      <div className="advanced-body">{children}</div>
    </details>
  );
}

export function ControlPanel() {
  const parameters = useTerrainStore((state) => state.parameters);
  const terrain = useTerrainStore((state) => state.terrain);
  const brush = useTerrainStore((state) => state.brush);
  const presets = useTerrainStore((state) => state.presets);
  const setParameter = useTerrainStore((state) => state.setParameter);
  const updateParameters = useTerrainStore((state) => state.updateParameters);
  const applyTerrainPreset = useTerrainStore((state) => state.applyTerrainPreset);
  const requestErosion = useTerrainStore((state) => state.requestErosion);
  const setBrush = useTerrainStore((state) => state.setBrush);
  const savePreset = useTerrainStore((state) => state.savePreset);
  const loadPreset = useTerrainStore((state) => state.loadPreset);
  const deletePreset = useTerrainStore((state) => state.deletePreset);
  const terrainTypeOptions = Object.entries(terrainTypeLabels).map(([value, label]) => ({
    value: value as TerrainType,
    label,
    meta: value === "plateau" ? "Stepped" : value
  }));
  const noiseOptions: SelectMenuOption<NoiseAlgorithm>[] = [
    { value: "perlin", label: "Perlin", meta: "Smooth" },
    { value: "simplex", label: "Simplex", meta: "Fast" },
    { value: "fbm", label: "fBM", meta: "Layered" },
    { value: "ridged", label: "Ridged", meta: "Sharp" }
  ];
  const resolutionSelectOptions = resolutionOptions.map((resolution) => ({
    value: resolution,
    label: `${resolution} x ${resolution}`,
    meta: "Grid"
  }));
  const materialOptions: SelectMenuOption<MaterialPreset>[] = [
    { value: "alpine", label: "Alpine", meta: "Snow" },
    { value: "temperate", label: "Temperate", meta: "Green" },
    { value: "arid", label: "Arid", meta: "Dunes" },
    { value: "volcanic", label: "Volcanic", meta: "Rock" }
  ];
  const renderQualityOptions: SelectMenuOption<RenderQuality>[] = [
    { value: "performance", label: "Performance", meta: "Fast" },
    { value: "balanced", label: "Balanced", meta: "Default" },
    { value: "quality", label: "Quality", meta: "Detailed" }
  ];

  return (
    <aside className="control-panel" aria-label="Terrain controls">
      <div className="panel-stack">
        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Terrain Type</h2>
          </div>
          <SelectMenu
            label="Preset"
            value={parameters.terrainType}
            options={terrainTypeOptions}
            onChange={applyTerrainPreset}
          />
          <label className="input-field">
            <span className="control-label">Seed</span>
            <input
              value={parameters.seed}
              spellCheck={false}
              onChange={(event) => setParameter("seed", event.target.value)}
            />
          </label>
          <Slider
            label="Height"
            min={4}
            max={42}
            step={0.5}
            value={parameters.heightMultiplier}
            unit="m"
            digits={1}
            onChange={(value) => setParameter("heightMultiplier", value)}
          />
        </section>

        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Noise Settings</h2>
          </div>
          <SelectMenu
            label="Algorithm"
            value={parameters.noiseAlgorithm}
            options={noiseOptions}
            onChange={(nextValue) => setParameter("noiseAlgorithm", nextValue)}
          />
          <Slider
            label="Scale"
            min={0.6}
            max={8}
            step={0.05}
            value={parameters.scale}
            onChange={(value) => setParameter("scale", value)}
          />
          <AdvancedDetails title="Advanced noise" meta="Octaves, grid, size">
            <Slider
              label="Octaves"
              min={1}
              max={8}
              step={1}
              value={parameters.octaves}
              digits={0}
              onChange={(value) => setParameter("octaves", value)}
            />
            <Slider
              label="Persistence"
              min={0.25}
              max={0.85}
              step={0.01}
              value={parameters.persistence}
              onChange={(value) => setParameter("persistence", value)}
            />
            <Slider
              label="Lacunarity"
              min={1.5}
              max={3.4}
              step={0.01}
              value={parameters.lacunarity}
              onChange={(value) => setParameter("lacunarity", value)}
            />
            <SelectMenu
              label="Resolution"
              value={parameters.resolution}
              options={resolutionSelectOptions}
              onChange={(nextValue) => setParameter("resolution", nextValue)}
            />
            <Slider
              label="World Size"
              min={64}
              max={220}
              step={4}
              value={parameters.size}
              unit="m"
              digits={0}
              onChange={(value) => setParameter("size", value)}
            />
          </AdvancedDetails>
        </section>

        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Erosion</h2>
            <button className="icon-button primary" type="button" title="Apply erosion" onClick={requestErosion}>
              <Play size={16} />
            </button>
          </div>
          <Slider
            label="Strength"
            min={0}
            max={1}
            step={0.01}
            value={parameters.erosionStrength}
            onChange={(value) => setParameter("erosionStrength", value)}
          />
          <Slider
            label="Iterations"
            min={1}
            max={80}
            step={1}
            value={parameters.erosionIterations}
            digits={0}
            onChange={(value) => setParameter("erosionIterations", value)}
          />
          <Toggle
            label="Hydraulic"
            checked={parameters.hydraulicErosion}
            onChange={(checked) => setParameter("hydraulicErosion", checked)}
          />
          <Toggle
            label="Thermal"
            checked={parameters.thermalErosion}
            onChange={(checked) => setParameter("thermalErosion", checked)}
          />
        </section>

        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Brush</h2>
            <Toggle label="Enabled" checked={brush.enabled} onChange={(checked) => setBrush({ enabled: checked })} />
          </div>
          <div className="segmented">
            {(["raise", "lower", "smooth", "flatten"] as BrushMode[]).map((mode) => (
              <button
                className={`segment${brush.mode === mode ? " active" : ""}`}
                key={mode}
                type="button"
                onClick={() => setBrush({ mode })}
              >
                {mode}
              </button>
            ))}
          </div>
          <Slider
            label="Radius"
            min={1}
            max={16}
            step={0.5}
            value={brush.radius}
            unit="m"
            digits={1}
            onChange={(value) => setBrush({ radius: value })}
          />
          <Slider
            label="Intensity"
            min={0.02}
            max={0.6}
            step={0.01}
            value={brush.intensity}
            onChange={(value) => setBrush({ intensity: value })}
          />
        </section>

        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Materials</h2>
          </div>
          <SelectMenu
            label="Palette"
            value={parameters.materialPreset}
            options={materialOptions}
            onChange={(nextValue) => setParameter("materialPreset", nextValue)}
          />
          <Toggle label="Water Layer" checked={parameters.waterEnabled} onChange={(checked) => setParameter("waterEnabled", checked)} />
          <Toggle label="Fog" checked={parameters.fogEnabled} onChange={(checked) => setParameter("fogEnabled", checked)} />
          <Toggle label="Shadows" checked={parameters.shadowsEnabled} onChange={(checked) => setParameter("shadowsEnabled", checked)} />
          <AdvancedDetails title="Render quality" meta="LOD mode">
            <SelectMenu
              label="LOD"
              value={parameters.renderQuality}
              options={renderQualityOptions}
              onChange={(nextValue) => setParameter("renderQuality", nextValue)}
            />
          </AdvancedDetails>
        </section>

        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Presets</h2>
            <button className="icon-button" type="button" title="Save preset" onClick={savePreset}>
              <Save size={16} />
            </button>
          </div>
          <div className="preset-grid">
            {presets.length === 0 ? <p className="hint">Saved parameter sets appear here.</p> : null}
            {presets.map((preset) => (
              <div className="preset-row" key={preset.id}>
                <strong>{preset.name}</strong>
                <span className="preset-actions">
                  <button className="icon-button" type="button" title="Load preset" onClick={() => loadPreset(preset.id)}>
                    <Download size={15} />
                  </button>
                  <button className="icon-button" type="button" title="Delete preset" onClick={() => deletePreset(preset.id)}>
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <div className="section-head">
            <h2 className="section-title">Export</h2>
          </div>
          <div className="button-row">
            <button className="text-button" type="button" disabled={!terrain} onClick={() => terrain && exportHeightmapPNG(terrain)}>
              <ImageDown size={15} /> PNG
            </button>
            <button className="text-button" type="button" disabled={!terrain} onClick={() => terrain && exportOBJ(terrain)}>
              <FileType size={15} /> OBJ
            </button>
            <button className="text-button" type="button" disabled={!terrain} onClick={() => terrain && exportGLTF(terrain)}>
              <Download size={15} /> GLTF
            </button>
            <button className="text-button" type="button" onClick={() => exportParametersJSON(parameters, terrain)}>
              <FileJson size={15} /> JSON
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
