"use client";

import { MutableRefObject, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getNightLift, getTimeLabel } from "../lib/worldData";
import { useWorldStore } from "../store/useWorldStore";

export function DayNightCycle() {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const timeOfDay = useWorldStore((state) => state.timeOfDay);
  const autoCycle = useWorldStore((state) => state.autoCycle);
  const setTimeOfDay = useWorldStore((state) => state.setTimeOfDay);

  useFrame((_, delta) => {
    const nextTime = autoCycle ? (timeOfDay + delta * 0.012) % 1 : timeOfDay;
    if (autoCycle) setTimeOfDay(nextTime);

    const daylight = Math.min(1, Math.max(0, Math.sin(nextTime * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5));
    const sunset = Math.exp(-Math.pow((nextTime - 0.72) / 0.12, 2));
    const night = getNightLift(nextTime);
    const sky = new THREE.Color("#07101a")
      .lerp(new THREE.Color("#7da9b8"), daylight)
      .lerp(new THREE.Color("#ff9a5f"), sunset * 0.34)
      .lerp(new THREE.Color("#171125"), night * 0.44);

    scene.background = sky;
    if (scene.fog instanceof THREE.FogExp2) scene.fog.color.copy(sky).lerp(new THREE.Color("#050608"), 0.35);

    if (sunRef.current) {
      sunRef.current.intensity = 0.28 + daylight * 2.55 + sunset * 0.45;
      sunRef.current.position.set(Math.cos(nextTime * Math.PI * 2) * 18, 5 + daylight * 18, Math.sin(nextTime * Math.PI * 2) * 18);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.55 + daylight * 1.85;
    }
    if (starsRef.current) {
      (starsRef.current.material as THREE.PointsMaterial).opacity = night * 0.72;
    }

    document.documentElement.dataset.timeOfDay = getTimeLabel(nextTime);
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#dffdfa", "#19120d", 2.4]} />
      <directionalLight ref={sunRef} castShadow position={[8, 18, 10]} intensity={2.5} />
      <Stars refTarget={starsRef} />
    </>
  );
}

function Stars({ refTarget }: { refTarget: MutableRefObject<THREE.Points | null> }) {
  const geometry = useMemo(() => {
    const starGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i < 180; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 24 + Math.random() * 34;
      positions.push(Math.cos(angle) * radius, 18 + Math.random() * 28, Math.sin(angle) * radius);
    }
    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return starGeometry;
  }, []);

  return (
    <points ref={refTarget} geometry={geometry}>
      <pointsMaterial color="#f7fbff" size={0.08} transparent opacity={0} />
    </points>
  );
}
