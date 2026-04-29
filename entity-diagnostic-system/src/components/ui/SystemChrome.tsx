"use client";

import { Cpu, Database, ShieldCheck } from "lucide-react";
import type { EntityProfile } from "@/data/entities";
import type { SystemState } from "@/lib/stateMachine";

type SystemChromeProps = {
  entity: EntityProfile;
  systemState: SystemState;
  progress: number;
};

export function SystemChrome({ entity, systemState, progress }: SystemChromeProps) {
  return (
    <header className="system-chrome" data-system-reveal>
      <a className="system-brand" href="../" aria-label="Return to Never Wet homepage" data-cursor="HOME">
        <span className="brand-mark">EDS</span>
        <span>
          <strong>ENTITY DIAGNOSTIC SYSTEM</strong>
          <small>LIVE IDENTITY ANALYSIS</small>
        </span>
      </a>

      <div className="central-readout">
        <span>{systemState.code}</span>
        <strong>{systemState.label}</strong>
      </div>

      <div className="top-readouts" aria-label="System readouts">
        <span>
          <Cpu size={14} strokeWidth={1.5} />
          LOAD {Math.round(progress * 100).toString().padStart(2, "0")}%
        </span>
        <span>
          <ShieldCheck size={14} strokeWidth={1.5} />
          TRUST {entity.trustScore}
        </span>
        <span>
          <Database size={14} strokeWidth={1.5} />
          RANK {String(entity.rank).padStart(2, "0")}
        </span>
      </div>
    </header>
  );
}
