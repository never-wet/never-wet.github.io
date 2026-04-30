"use client";

import { Dices, Palette, Plus, Shuffle, Trash2 } from "lucide-react";
import type { WheelOption } from "./Wheel";

type Preset = {
  name: string;
  items: string[];
};

const PRESETS: Preset[] = [
  {
    name: "Team Night",
    items: ["Pizza", "Tacos", "Sushi", "Burgers", "Ramen", "Pasta", "Curry", "Salad"],
  },
  {
    name: "Classroom",
    items: ["Group A", "Group B", "Group C", "Group D", "Group E", "Group F"],
  },
  {
    name: "Brainstorm",
    items: ["Prototype", "Research", "Sketch", "Ship", "Refine", "Test", "Pitch"],
  },
];

type InputPanelProps = {
  options: WheelOption[];
  isSpinning: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<WheelOption>) => void;
  onRandomize: () => void;
  onLoadPreset: (items: string[]) => void;
};

export function InputPanel({
  options,
  isSpinning,
  onAdd,
  onRemove,
  onChange,
  onRandomize,
  onLoadPreset,
}: InputPanelProps) {
  return (
    <aside className="input-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Options</span>
          <h2>Wheel list</h2>
        </div>
        <button className="icon-button" type="button" onClick={onAdd} disabled={isSpinning} aria-label="Add option">
          <Plus size={18} />
        </button>
      </div>

      <div className="preset-row" aria-label="Preset lists">
        {PRESETS.map((preset) => (
          <button
            className="preset-button"
            type="button"
            key={preset.name}
            onClick={() => onLoadPreset(preset.items)}
            disabled={isSpinning}
          >
            <Dices size={16} />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      <div className="option-list">
        {options.map((option, index) => (
          <div className="option-row" key={option.id}>
            <span className="option-row__index">{index + 1}</span>
            <label className="color-field" aria-label={`Color for ${option.label || `option ${index + 1}`}`}>
              <Palette size={15} />
              <input
                type="color"
                value={option.color}
                onChange={(event) => onChange(option.id, { color: event.target.value })}
                disabled={isSpinning}
              />
            </label>
            <input
              type="text"
              value={option.label}
              onChange={(event) => onChange(option.id, { label: event.target.value })}
              disabled={isSpinning}
              aria-label={`Option ${index + 1}`}
            />
            <button
              className="icon-button icon-button--ghost"
              type="button"
              onClick={() => onRemove(option.id)}
              disabled={isSpinning || options.length <= 2}
              aria-label={`Remove ${option.label || `option ${index + 1}`}`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      <div className="panel-actions">
        <button className="secondary-button" type="button" onClick={onRandomize} disabled={isSpinning}>
          <Shuffle size={17} />
          <span>Randomize</span>
        </button>
        <button className="secondary-button" type="button" onClick={onAdd} disabled={isSpinning}>
          <Plus size={17} />
          <span>Add item</span>
        </button>
      </div>
    </aside>
  );
}
