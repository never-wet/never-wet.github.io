"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Activity, Cpu, LockKeyhole, ScanLine } from "lucide-react";
import { entities, entityById } from "@/data/entities";
import { useSystemTimeline } from "@/hooks/useSystemTimeline";
import { getScrollProgressForState, systemStates } from "@/lib/stateMachine";
import { getEntityTheme } from "@/lib/theme";
import { useSystemStore } from "@/store/useSystemStore";
import { BootSequence } from "@/components/ui/BootSequence";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { IdentitySelector } from "@/components/ui/IdentitySelector";
import { ReadoutPanels } from "@/components/ui/ReadoutPanels";
import { StateRail } from "@/components/ui/StateRail";
import { SystemChrome } from "@/components/ui/SystemChrome";

const DiagnosticScene = dynamic(
  () => import("@/components/scene/DiagnosticScene").then((module) => module.DiagnosticScene),
  {
    ssr: false
  }
);

export function DiagnosticSystem() {
  const rootRef = useRef<HTMLElement | null>(null);
  const activeEntityId = useSystemStore((state) => state.activeEntityId);
  const previewEntityId = useSystemStore((state) => state.previewEntityId);
  const stateIndex = useSystemStore((state) => state.stateIndex);
  const progress = useSystemStore((state) => state.progress);
  const bootComplete = useSystemStore((state) => state.bootComplete);
  const setBootComplete = useSystemStore((state) => state.setBootComplete);

  const entity = entityById[previewEntityId ?? activeEntityId] ?? entities[0];
  const activeEntity = entityById[activeEntityId] ?? entities[0];
  const systemState = systemStates[stateIndex];

  useSystemTimeline(rootRef);

  useEffect(() => {
    const theme = getEntityTheme(activeEntity);
    for (const [key, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(key, value);
    }
  }, [activeEntity]);

  const rootStyle = useMemo(
    () =>
      ({
        ...getEntityTheme(activeEntity),
        "--state-index": stateIndex,
        "--system-progress": progress
      }) as CSSProperties,
    [activeEntity, progress, stateIndex]
  );

  const jumpToState = (index: number) => {
    const scrollHost = document.getElementById("system-scroll");
    if (!scrollHost) return;

    const scrollable = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      window.innerHeight
    );
    const target = getScrollProgressForState(index) * scrollable;

    window.scrollTo({
      top: target,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  };

  return (
    <main
      ref={rootRef}
      className="diagnostic-system"
      data-state={systemState.id}
      style={rootStyle}
      aria-label="Entity Diagnostic System"
    >
      <CustomCursor />
      {!bootComplete ? <BootSequence entity={activeEntity} onComplete={() => setBootComplete(true)} /> : null}

      <div className="system-frame">
        <DiagnosticScene entity={activeEntity} stateIndex={stateIndex} progress={progress} />
        <div className="system-grid" aria-hidden="true" />
        <div className="system-noise" aria-hidden="true" />
        <div className="scan-bar" data-scan-bar aria-hidden="true" />

        <SystemChrome entity={entity} systemState={systemState} progress={progress} />
        <StateRail activeIndex={stateIndex} onStateSelect={jumpToState} states={systemStates} />

        <section className="identity-module" aria-label="Active identity module" data-system-reveal>
          <div className="module-kicker">
            <LockKeyhole size={14} strokeWidth={1.5} />
            <span>{entity.systemId}</span>
          </div>
          <h1>{entity.name}</h1>
          <div className="classification-line">
            <span>CLASS</span>
            <strong>{entity.classification}</strong>
          </div>
          <div className="score-stack">
            <div>
              <span>RANK</span>
              <strong>{String(entity.rank).padStart(2, "0")}</strong>
            </div>
            <div>
              <span>TRUST</span>
              <strong>{entity.trustScore}</strong>
            </div>
            <div>
              <span>VALUE</span>
              <strong>{entity.valueScore}</strong>
            </div>
          </div>
        </section>

        <ReadoutPanels entity={entity} activeEntity={activeEntity} stateIndex={stateIndex} />

        <section className="state-response" aria-label="System response" data-system-reveal>
          <div className="response-header">
            <Activity size={14} strokeWidth={1.5} />
            <span>{systemState.code}</span>
            <strong>{systemState.signal}</strong>
          </div>
          <div className="response-lines">
            {entity.profile.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <div className="response-status">
            {entity.statusLabels.map((label) => (
              <i key={label}>{label}</i>
            ))}
          </div>
        </section>

        <IdentitySelector entities={entities} activeId={activeEntityId} />

        <div className="bottom-command" data-system-reveal>
          <button type="button" aria-label="Advance to identification state" onClick={() => jumpToState(1)}>
            <ScanLine size={15} strokeWidth={1.5} />
            <span>IDENTIFY</span>
          </button>
          <button type="button" aria-label="Advance to comparison state" onClick={() => jumpToState(4)}>
            <Cpu size={15} strokeWidth={1.5} />
            <span>COMPARE</span>
          </button>
          <span>{systemState.response}</span>
        </div>
      </div>

      <div id="system-scroll" className="scroll-driver" aria-hidden="true">
        {systemStates.map((state) => (
          <section key={state.id} />
        ))}
      </div>
    </main>
  );
}
