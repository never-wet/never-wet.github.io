"use client";

import type { SystemState } from "@/lib/stateMachine";

type StateRailProps = {
  activeIndex: number;
  states: readonly SystemState[];
  onStateSelect: (index: number) => void;
};

export function StateRail({ activeIndex, states, onStateSelect }: StateRailProps) {
  return (
    <nav className="state-rail" aria-label="System state controls" data-system-reveal>
      {states.map((state, index) => (
        <button
          type="button"
          key={state.id}
          className={index === activeIndex ? "is-active" : ""}
          onClick={() => onStateSelect(index)}
          data-cursor={state.shortLabel}
        >
          <span>{state.code.replace("STATE ", "S")}</span>
          <strong>{state.shortLabel}</strong>
        </button>
      ))}
    </nav>
  );
}
