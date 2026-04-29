"use client";

import { useEffect, useState } from "react";
import type { EntityProfile } from "@/data/entities";

type BootSequenceProps = {
  entity: EntityProfile;
  onComplete: () => void;
};

const bootLines = ["GRID SYNC", "LINES DRAW", "ID BUFFER", "CORE WIRE", "ANALYSIS READY"];

export function BootSequence({ entity, onComplete }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(100, value + 6 + Math.random() * 8);
        if (next >= 100) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setComplete(true);
            window.setTimeout(onComplete, 620);
          }, 240);
        }
        return next;
      });
    }, 110);

    return () => window.clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`boot-sequence${complete ? " is-complete" : ""}`} aria-live="polite">
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-wire" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="boot-panel">
        <span className="micro-label">STATE 0 / SYSTEM BOOT</span>
        <strong>ENTITY DIAGNOSTIC</strong>
        <p>{entity.systemId} / {entity.classification}</p>
        <div className="boot-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="boot-readouts">
          {bootLines.map((line, index) => (
            <span className={progress >= (index + 1) * 18 ? "is-active" : ""} key={line}>
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
