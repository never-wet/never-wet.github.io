import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group } from "three";
import { PortalFrame } from "@/objects/PortalFrame";

export function TransitionScene() {
  const groupRef = useRef<Group>(null);
  const frames = useMemo(
    () => [
      { position: [1.1, 1.4, 7.6], scale: 0.7 },
      { position: [1.8, 1.8, 5.2], scale: 0.88 },
      { position: [2.6, 1.3, 3.2], scale: 1.02 },
      { position: [3.2, 2, 1.2], scale: 1.16 },
    ],
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
  });

  return (
    <group ref={groupRef}>
      {frames.map((frame, index) => (
        <group
          key={index}
          position={frame.position as [number, number, number]}
          rotation={[0.25, 0.28 * index, index * 0.2]}
        >
          <PortalFrame
            portalType={index % 2 === 0 ? "halo" : "prism"}
            glowColor={index % 2 === 0 ? "#8ec8ff" : "#bc9bff"}
            active={index >= 2}
            scale={frame.scale}
          />
        </group>
      ))}
      <mesh position={[2.25, 1.65, 4.8]} rotation={[0.4, 0.4, 0]}>
        <boxGeometry args={[0.18, 3.6, 0.12]} />
        <meshStandardMaterial
          color="#16223a"
          emissive="#7cb9ff"
          emissiveIntensity={0.35}
          metalness={0.92}
          roughness={0.18}
        />
      </mesh>
    </group>
  );
}
