import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";

export function AtmosphereField() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = state.clock.elapsedTime * 0.015;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[-10, 4.5, -12]}>
        <sphereGeometry args={[4.8, 40, 40]} />
        <meshBasicMaterial color="#20355c" transparent opacity={0.06} />
      </mesh>
      <mesh position={[12, 3.2, -20]}>
        <sphereGeometry args={[5.6, 36, 36]} />
        <meshBasicMaterial color="#3f2d56" transparent opacity={0.045} />
      </mesh>
      <mesh position={[0, -4.8, -16]}>
        <sphereGeometry args={[6.8, 32, 32]} />
        <meshBasicMaterial color="#11334a" transparent opacity={0.035} />
      </mesh>
    </group>
  );
}
