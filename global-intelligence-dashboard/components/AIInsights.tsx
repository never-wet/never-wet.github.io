"use client";

import { BrainCircuit, TrendingDown, TrendingUp, Waves } from "lucide-react";
import { useMemo } from "react";
import { useIntelStore } from "@/store/useIntelStore";
import type { TrendDirection } from "@/types";

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === "up") return <TrendingUp size={14} />;
  if (trend === "down") return <TrendingDown size={14} />;
  return <Waves size={14} />;
}

export function AIInsights() {
  const insights = useIntelStore((state) => state.insights);
  const selectedEvent = useIntelStore((state) => state.selectedEvent);
  const relevantInsights = useMemo(() => {
    if (!selectedEvent) return insights.slice(0, 4);
    const direct = insights.filter(
      (insight) => insight.region === selectedEvent.region || insight.category === selectedEvent.category
    );
    return (direct.length ? direct : insights).slice(0, 4);
  }, [insights, selectedEvent]);

  return (
    <section className="insight-block" aria-label="AI insights">
      <div className="panel-heading">
        <span><BrainCircuit size={15} /> AI Insights</span>
        <small>{selectedEvent ? "attached to selection" : "local risk model"}</small>
      </div>

      <div className="insight-list">
        {relevantInsights.map((insight) => (
          <article key={insight.id} className={`insight-item insight-item--${insight.riskLevel}`}>
            <div className="insight-item__top">
              <span>{insight.region}</span>
              <strong><TrendIcon trend={insight.trend} /> {insight.trend}</strong>
            </div>
            <h2>{insight.title}</h2>
            <p>{insight.summary}</p>
            <div className="confidence-meter" aria-label={`Confidence ${Math.round(insight.confidence * 100)} percent`}>
              <span style={{ width: `${Math.round(insight.confidence * 100)}%` }} />
            </div>
            <div className="insight-item__meta">
              <span>{insight.riskLevel} risk</span>
              <span>{Math.round(insight.confidence * 100)}% confidence</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
