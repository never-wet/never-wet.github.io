"use client";

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
};

export function SliderControl({ label, value, min, max, step, unit = "", onChange }: SliderControlProps) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-slate-100">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
          {unit}
        </span>
      </span>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-teal-300 outline-none"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
