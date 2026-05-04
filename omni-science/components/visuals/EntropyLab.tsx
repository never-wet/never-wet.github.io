import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Box } from "@react-three/drei";
import * as THREE from "three";

export default function EntropyLab() {
  const count = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Start in a small organized cluster
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  const pointsRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
        // Particles slowly drift away (increasing entropy)
        const drift = Math.min(time * 0.1, 5);
        pos[i * 3] += (Math.random() - 0.5) * 0.02 * drift;
        pos[i * 3 + 1] += (Math.random() - 0.5) * 0.02 * drift;
        pos[i * 3 + 2] += (Math.random() - 0.5) * 0.02 * drift;

        // Containment bounce
        if (Math.abs(pos[i * 3]) > 10) pos[i * 3] *= -0.9;
        if (Math.abs(pos[i * 3 + 1]) > 10) pos[i * 3 + 1] *= -0.9;
        if (Math.abs(pos[i * 3 + 2]) > 10) pos[i * 3 + 2] *= -0.9;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <Points ref={pointsRef} positions={positions} stride={3}>
        <PointMaterial
          transparent
          color="#10b981"
          size={0.1}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
      
      {/* Container */}
      <Box args={[20, 20, 20]}>
        <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.05} />
      </Box>
    </group>
  );
}
