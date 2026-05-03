"use client";

import { ChevronDown, Focus, Ruler, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  formatCompact,
  formatDistance,
  formatGravity,
  formatMass,
  formatPeriod,
  formatRadius,
  formatRotation,
  formatTemperature,
  getDistanceFromSunKm,
  getKindLabel,
  getObjectById,
  getSizeComparison,
  isFamousStar,
  isSolarObject,
} from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";

export function ObjectInfoPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const [expandedObjectId, setExpandedObjectId] = useState<string | null>(null);
  const selectedObjectId = useSpaceStore((state) => state.selectedObjectId);
  const scaleMode = useSpaceStore((state) => state.scaleMode);
  const measurementMode = useSpaceStore((state) => state.measurementMode);
  const dateIso = useSpaceStore((state) => state.simulatedDateIso);
  const focusObject = useSpaceStore((state) => state.focusObject);
  const toggleMeasurementObject = useSpaceStore((state) => state.toggleMeasurementObject);
  const setMeasurementMode = useSpaceStore((state) => state.setMeasurementMode);
  const clearSelection = useSpaceStore((state) => state.clearSelection);
  const object = getObjectById(selectedObjectId);

  useEffect(() => {
    if (!selectedObjectId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || panelRef.current?.contains(target)) return;
      clearSelection();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [clearSelection, selectedObjectId]);

  if (!object || measurementMode === "distance") return null;

  const sizeComparison = getSizeComparison(object);
  const distanceFromSun = getDistanceFromSunKm(object, dateIso);
  const expanded = expandedObjectId === object.id;
  const metrics = isFamousStar(object)
    ? [
        { label: "Distance", value: formatDistance(object.distanceLy * 9_460_730_472_580.8) },
        { label: "Radius", value: `${formatCompact(object.radiusSolar, 3)} x Sun` },
        { label: "Luminosity", value: `${formatCompact(object.luminositySolar, 3)} x Sun` },
        { label: "Temp", value: `${formatCompact(object.temperatureK, 4)} K` },
      ]
    : [
        { label: "Distance", value: formatDistance(distanceFromSun) },
        { label: "Radius", value: formatRadius(object.radiusKm) },
        { label: "Gravity", value: formatGravity(object.gravityMs2) },
        { label: "Orbit", value: formatPeriod(object.orbitalPeriodDays) },
      ];

  return (
    <aside ref={panelRef} className="object-panel" aria-label={`${object.name} information`}>
      <div className="object-panel__top">
        <span className="object-swatch" style={{ background: object.color }} />
        <button type="button" className="icon-button" onClick={clearSelection} aria-label="Close object information">
          <X size={15} />
        </button>
      </div>

      <p className="object-panel__eyebrow">
        {getKindLabel(object)} / {isFamousStar(object) ? object.spectralType : object.classification}
      </p>

      <h1>{object.name}</h1>
      <p className="object-panel__summary">{object.shortDescription}</p>

      <div className="object-actions">
        <button type="button" onClick={() => focusObject(object.id)}>
          <Focus size={16} />
          Focus
        </button>
        <button
          type="button"
          onClick={() => {
            setMeasurementMode("distance");
            toggleMeasurementObject(object.id);
          }}
        >
          <Ruler size={16} />
          Measure from
        </button>
      </div>

      {scaleMode === "compressed" ? <div className="scale-note">Distances compressed for viewing.</div> : null}

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <button
        type="button"
        className="details-toggle"
        onClick={() => setExpandedObjectId(expanded ? null : object.id)}
      >
        More details
        <ChevronDown size={15} className={expanded ? "is-open" : ""} />
      </button>

      {expanded ? (
        <div className="details-panel">
          <div className="metrics-grid metrics-grid--details">
            {isFamousStar(object) ? null : (
              <>
                <Metric label="Diameter" value={object.radiusKm ? formatRadius(object.radiusKm * 2) : "Region"} />
                <Metric label="Mass" value={formatMass(object.massKg)} />
                <Metric label="Temp" value={formatTemperature(object.meanTempC)} />
                <Metric label="Rotation" value={formatRotation(object.rotationPeriodHours)} />
              </>
            )}
          </div>

          {sizeComparison ? (
            <section className="comparison-block">
              <CompareBar label="Earth radius" value={sizeComparison.earth} reference={109.2} suffix="x" />
              <CompareBar label="Sun radius" value={sizeComparison.sun} reference={1} suffix="x" />
            </section>
          ) : null}

          <ul className="facts-list">
            {object.facts.slice(0, 3).map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          {isSolarObject(object) && object.notes ? <p className="object-note">{object.notes}</p> : null}
        </div>
      ) : null}
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompareBar({
  label,
  value,
  reference,
  suffix,
}: {
  label: string;
  value: number;
  reference: number;
  suffix: string;
}) {
  const width = Math.min(100, Math.max(4, (Math.log10(value + 1) / Math.log10(reference + 1)) * 100));
  return (
    <div className="compare-row">
      <div>
        <span>{label}</span>
        <strong>
          {formatCompact(value, 3)}
          {suffix}
        </strong>
      </div>
      <i>
        <b style={{ width: `${width}%` }} />
      </i>
    </div>
  );
}
