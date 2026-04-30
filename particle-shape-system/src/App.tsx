import { ChangeEvent, useEffect, useRef, useState } from "react";
import { RotateCcw, Upload } from "lucide-react";
import { ParticleEngine, ParticleMode } from "./particleEngine";

const DEFAULT_TEXT = "NEVER WET";
const DEFAULT_DENSITY = 9000;
const DEFAULT_RADIUS = 130;
const modes: ParticleMode[] = ["image", "text", "idle"];

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const [mode, setMode] = useState<ParticleMode>("text");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new ParticleEngine(canvasRef.current);
    engineRef.current = engine;
    engine.setParticleCount(density);
    engine.setCursorRadius(radius);
    engine.setText(text);
    engine.setMode(mode);
    engine.start();

    if ("fonts" in document) {
      void document.fonts.ready.then(() => {
        engine.setText(text);
      });
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    engineRef.current?.setParticleCount(density);
  }, [density]);

  useEffect(() => {
    engineRef.current?.setCursorRadius(radius);
  }, [radius]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      engineRef.current?.setText(text);
    }, 90);

    return () => window.clearTimeout(id);
  }, [text]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    await engineRef.current?.setImageFile(file);
    setMode("image");
  }

  function handleReset() {
    setText(DEFAULT_TEXT);
    setDensity(DEFAULT_DENSITY);
    setRadius(DEFAULT_RADIUS);
    setMode("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    engineRef.current?.reset(DEFAULT_TEXT);
  }

  return (
    <main className="particle-app">
      <h1 className="sr-only">Particle Shape System</h1>
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />

      <div className="control-dock" aria-label="Particle controls">
        <label className="action-button" title="Upload image">
          <Upload size={16} strokeWidth={1.8} aria-hidden="true" />
          <span>Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            aria-label="Upload image"
          />
        </label>

        <input
          className="text-field"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setMode("text");
          }}
          placeholder="Type text"
          aria-label="Type text"
          spellCheck={false}
        />

        <div className="segmented" aria-label="Mode">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              className={mode === item ? "is-active" : ""}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="range-control">
          <span>Density</span>
          <input
            type="range"
            min="2500"
            max="16000"
            step="500"
            value={density}
            onChange={(event) => setDensity(Number(event.target.value))}
            aria-label="Particle density"
          />
        </label>

        <label className="range-control">
          <span>Radius</span>
          <input
            type="range"
            min="40"
            max="260"
            step="5"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            aria-label="Cursor radius"
          />
        </label>

        <button type="button" className="action-button" onClick={handleReset} title="Reset">
          <RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </main>
  );
}

export default App;
