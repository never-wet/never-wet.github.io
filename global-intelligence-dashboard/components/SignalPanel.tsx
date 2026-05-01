"use client";

import { AlertTriangle, ChevronDown, Gauge, TerminalSquare, X } from "lucide-react";
import { useIntelStore } from "@/store/useIntelStore";

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

interface SignalPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export function SignalPanel({ expanded, onToggle }: SignalPanelProps) {
  const logs = useIntelStore((state) => state.logs);
  const elevated = logs.filter((item) => item.level === "high" || item.level === "critical").length;

  return (
    <footer className={`signal-panel ${expanded ? "is-expanded" : ""}`} aria-label="Signals and system logs">
      <button className="signal-panel__title" type="button" onClick={onToggle}>
        <TerminalSquare size={15} />
        <span>Signals / Logs</span>
        <small>{elevated} elevated</small>
        {expanded ? <X size={14} /> : <ChevronDown size={14} />}
      </button>

      <div className="signal-strip">
        {logs.map((item) => (
          <article key={item.id} className={`signal-card signal-card--${item.level}`}>
            <div>
              <span className="signal-card__label">
                {item.level === "high" || item.level === "critical" ? <AlertTriangle size={13} /> : <Gauge size={13} />}
                {item.label}
              </span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </div>
            <footer>
              <span>{item.source}</span>
              <time>{formatTime(item.timestamp)}</time>
            </footer>
          </article>
        ))}
      </div>
    </footer>
  );
}
