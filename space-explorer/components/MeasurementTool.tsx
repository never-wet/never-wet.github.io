"use client";

import { Html, Line } from "@react-three/drei";
import { Ruler, X } from "lucide-react";
import * as THREE from "three";
import {
  formatDistance,
  getDistanceBetweenObjectsKm,
  getObjectById,
  getObjectScenePosition,
  type ScaleMode,
} from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";

export function MeasurementLine({ scaleMode }: { scaleMode: ScaleMode }) {
  const measurementIds = useSpaceStore((state) => state.measurementIds);
  const measurementMode = useSpaceStore((state) => state.measurementMode);
  const dateIso = useSpaceStore((state) => state.simulatedDateIso);
  if (measurementMode !== "distance" || measurementIds.length < 2) return null;

  const objectA = getObjectById(measurementIds[0]);
  const objectB = getObjectById(measurementIds[1]);
  if (!objectA || !objectB) return null;

  const pointA = getObjectScenePosition(objectA, dateIso, scaleMode);
  const pointB = getObjectScenePosition(objectB, dateIso, scaleMode);
  const mid: [number, number, number] = [
    (pointA[0] + pointB[0]) / 2,
    (pointA[1] + pointB[1]) / 2 + 2.4,
    (pointA[2] + pointB[2]) / 2,
  ];
  const distance = getDistanceBetweenObjectsKm(objectA.id, objectB.id, dateIso);

  return (
    <group>
      <Line
        points={[new THREE.Vector3(...pointA), new THREE.Vector3(...pointB)]}
        color="#8feaff"
        lineWidth={1.8}
        transparent
        opacity={0.82}
        depthWrite={false}
      />
      <Html center zIndexRange={[2, 0]} position={mid} className="measurement-label">
        <span>
          {objectA.name}
          {" -> "}
          {objectB.name}: {formatDistance(distance?.km)}
        </span>
      </Html>
    </group>
  );
}

export function MeasurementToast() {
  const measurementIds = useSpaceStore((state) => state.measurementIds);
  const clearMeasurement = useSpaceStore((state) => state.clearMeasurement);
  const dateIso = useSpaceStore((state) => state.simulatedDateIso);
  const mode = useSpaceStore((state) => state.measurementMode);
  const objectA = getObjectById(measurementIds[0]);
  const objectB = getObjectById(measurementIds[1]);
  const result = objectA && objectB ? getDistanceBetweenObjectsKm(objectA.id, objectB.id, dateIso) : undefined;
  if (mode !== "distance") return null;

  return (
    <section className="measurement-toast" aria-label="Distance measurement">
      <span className="measurement-toast__icon">
        <Ruler size={14} />
      </span>
      <div>
        {result && objectA && objectB ? (
          <>
            <strong>
              {objectA.name}
              {" -> "}
              {objectB.name}
            </strong>
            <span>{formatDistance(result.km)}</span>
          </>
        ) : (
          <>
            <strong>Distance mode</strong>
            <span>{objectA ? `Select destination from ${objectA.name}` : "Select first object"}</span>
          </>
        )}
      </div>
      {measurementIds.length ? (
        <button type="button" className="icon-button" onClick={clearMeasurement} aria-label="Clear measurement">
          <X size={15} />
        </button>
      ) : null}
    </section>
  );
}
