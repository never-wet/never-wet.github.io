import React from "react";
import { motion } from "framer-motion";

export type Mode = "Theory" | "Visual" | "Analogy";

interface IntuitionToggleProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export default function IntuitionToggle({ mode, setMode }: IntuitionToggleProps) {
  const modes: Mode[] = ["Theory", "Visual", "Analogy"];

  return (
    <div className="inline-flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
      {modes.map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative px-6 py-2 text-sm font-bold transition-colors duration-300 rounded-xl ${
              isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="toggle-pill"
                className="absolute inset-0 bg-primary-600 rounded-xl -z-10 shadow-lg shadow-primary-500/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {m}
          </button>
        );
      })}
    </div>
  );
}
