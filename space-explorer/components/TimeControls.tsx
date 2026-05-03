"use client";

import { CalendarDays, Pause, Play, Timer } from "lucide-react";
import { useEffect } from "react";
import { useSpaceStore } from "../lib/useSpaceStore";

const speedMarks = [0.5, 1, 8, 30, 365];

export function TimeControls() {
  const dateIso = useSpaceStore((state) => state.simulatedDateIso);
  const timeSpeed = useSpaceStore((state) => state.timeSpeed);
  const isPaused = useSpaceStore((state) => state.isPaused);
  const setPaused = useSpaceStore((state) => state.setPaused);
  const setTimeSpeed = useSpaceStore((state) => state.setTimeSpeed);
  const advanceSimulation = useSpaceStore((state) => state.advanceSimulation);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      advanceSimulation(timeSpeed);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [advanceSimulation, isPaused, timeSpeed]);

  return (
    <section className="time-controls" aria-label="Time controls">
      <div className="time-readout">
        <CalendarDays size={16} />
        <time dateTime={dateIso}>{new Date(dateIso).toLocaleDateString("en-US", { dateStyle: "medium" })}</time>
      </div>

      <div className="transport">
        <button type="button" className="icon-button" onClick={() => setPaused(!isPaused)} aria-label={isPaused ? "Play time" : "Pause time"}>
          {isPaused ? <Play size={17} /> : <Pause size={17} />}
        </button>
      </div>

      <label className="speed-control">
        <span>
          <Timer size={15} />
          {timeSpeed} d/s
        </span>
        <input
          type="range"
          min="0"
          max={speedMarks.length - 1}
          step="1"
          value={speedMarks.indexOf(timeSpeed)}
          onChange={(event) => setTimeSpeed(speedMarks[Number(event.currentTarget.value)] ?? 8)}
        />
      </label>
    </section>
  );
}
