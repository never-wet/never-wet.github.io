"use client";

import { useCallback, useMemo, useState } from "react";
import { Home } from "lucide-react";
import { InputPanel } from "@/components/InputPanel";
import { ResultDisplay } from "@/components/ResultDisplay";
import { Wheel, type WheelOption } from "@/components/Wheel";

const PALETTE = [
  "#ef476f",
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#f77f00",
  "#5e60ce",
  "#43aa8b",
  "#f94144",
  "#277da1",
  "#f9c74f",
];

const DEFAULT_OPTIONS = ["Studio", "Games", "Music", "Research", "Design", "Physics", "AI Lab", "Tools"];

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeOptions(labels: string[]): WheelOption[] {
  return labels.map((label, index) => ({
    id: createId(),
    label,
    color: PALETTE[index % PALETTE.length],
  }));
}

function shuffleOptions(options: WheelOption[]) {
  const next = [...options];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export default function HomePage() {
  const [options, setOptions] = useState<WheelOption[]>(() => makeOptions(DEFAULT_OPTIONS));
  const [rotation, setRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const result = useMemo(() => {
    if (selectedIndex === null) return null;
    return options[selectedIndex]?.label.trim() || `Option ${selectedIndex + 1}`;
  }, [options, selectedIndex]);

  const addOption = useCallback(() => {
    setOptions((current) => [
      ...current,
      {
        id: createId(),
        label: `Option ${current.length + 1}`,
        color: PALETTE[current.length % PALETTE.length],
      },
    ]);
    setSelectedIndex(null);
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions((current) => {
      if (current.length <= 2) return current;
      return current.filter((option) => option.id !== id);
    });
    setSelectedIndex(null);
  }, []);

  const updateOption = useCallback((id: string, patch: Partial<WheelOption>) => {
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, ...patch } : option)));
  }, []);

  const loadPreset = useCallback((items: string[]) => {
    setOptions(makeOptions(items));
    setSelectedIndex(null);
    setRotation(0);
  }, []);

  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setSelectedIndex(null);
  }, []);

  const handleSpinComplete = useCallback((index: number, finalRotation: number) => {
    setRotation(finalRotation);
    setSelectedIndex(index);
    setResultKey((current) => current + 1);
    setIsSpinning(false);
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="home-link" href="../" aria-label="Back to Never Wet homepage">
          <Home size={18} />
          <span>Never Wet</span>
        </a>
        <div className="topbar__title">
          <span className="panel-kicker">Wheel of Fortune</span>
          <h1>Decision wheel</h1>
        </div>
      </header>

      <section className="workspace">
        <InputPanel
          options={options}
          isSpinning={isSpinning}
          onAdd={addOption}
          onRemove={removeOption}
          onChange={updateOption}
          onRandomize={() => {
            setOptions((current) => shuffleOptions(current));
            setSelectedIndex(null);
          }}
          onLoadPreset={loadPreset}
        />

        <div className="wheel-column">
          <Wheel
            options={options}
            rotation={rotation}
            selectedIndex={selectedIndex}
            isSpinning={isSpinning}
            soundEnabled={soundEnabled}
            onSoundToggle={() => setSoundEnabled((value) => !value)}
            onSpinStart={handleSpinStart}
            onSpinComplete={handleSpinComplete}
          />
          <ResultDisplay result={result} resultKey={resultKey} isSpinning={isSpinning} />
        </div>
      </section>
    </main>
  );
}
