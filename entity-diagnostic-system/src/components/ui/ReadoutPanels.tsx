"use client";

import { BarChart3, Binary, Radar } from "lucide-react";
import type { EntityProfile, EntityMetric } from "@/data/entities";

type ReadoutPanelsProps = {
  entity: EntityProfile;
  activeEntity: EntityProfile;
  stateIndex: number;
};

function MetricRow({ metric, invert = false }: { metric: EntityMetric; invert?: boolean }) {
  const width = invert ? 100 - metric.strength : metric.strength;

  return (
    <div className="metric-row">
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <i>
        <b style={{ width: `${Math.max(4, Math.min(100, width))}%` }} />
      </i>
    </div>
  );
}

export function ReadoutPanels({ entity, activeEntity, stateIndex }: ReadoutPanelsProps) {
  const previewing = entity.id !== activeEntity.id;

  return (
    <>
      <section className="metrics-panel" aria-label="Metrics panel" data-system-reveal>
        <div className="panel-heading">
          <span>
            <Radar size={14} strokeWidth={1.5} />
            PRIMARY READ
          </span>
          <strong>{previewing ? "PREVIEW" : "LOCKED"}</strong>
        </div>
        <div className="metric-list">
          {entity.metrics.map((metric) => (
            <MetricRow key={metric.label} metric={metric} invert={metric.label === "DRIFT"} />
          ))}
        </div>
      </section>

      <section className="comparison-panel" aria-label="Comparison panel" data-system-reveal>
        <div className="panel-heading">
          <span>
            <BarChart3 size={14} strokeWidth={1.5} />
            COMPARISON MATRIX
          </span>
          <strong>{stateIndex >= 4 ? "OPEN" : "STANDBY"}</strong>
        </div>
        <div className="comparison-grid">
          {entity.comparison.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <i>
                <b style={{ height: `${Math.max(8, Math.min(100, metric.strength))}%` }} />
              </i>
            </div>
          ))}
        </div>
      </section>

      <section className="output-panel" aria-label="Output panel" data-system-reveal>
        <div className="panel-heading">
          <span>
            <Binary size={14} strokeWidth={1.5} />
            OUTPUT
          </span>
          <strong>{stateIndex >= 5 ? "FINAL" : "LIVE"}</strong>
        </div>
        <div className="output-grid">
          <div>
            <span>MASS</span>
            <strong>{entity.mass}</strong>
          </div>
          <div>
            <span>SIGNAL</span>
            <strong>{entity.signal}</strong>
          </div>
          <div>
            <span>VOLATILITY</span>
            <strong>{entity.volatility}%</strong>
          </div>
          <div>
            <span>CLASSIFY</span>
            <strong>{stateIndex >= 1 ? "PASS" : "PEND"}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
