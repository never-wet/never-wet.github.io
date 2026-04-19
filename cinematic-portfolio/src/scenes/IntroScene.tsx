import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { PortalFrame } from "@/objects/PortalFrame";

export function IntroScene() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, 0.55, 11.1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[2.1, 3.1, 72]} />
        <meshStandardMaterial
          color="#0b1222"
          metalness={0.86}
          roughness={0.28}
          emissive="#28406a"
          emissiveIntensity={0.22}
        />
      </mesh>
      <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.16}>
        <PortalFrame portalType="halo" glowColor="#8ab8ff" active scale={1.28} />
        <mesh castShadow position={[0, 0.78, 0.18]}>
          <boxGeometry args={[1.06, 1.36, 0.2]} />
          <MeshTransmissionMaterial
            thickness={0.3}
            transmission={0.95}
            roughness={0.06}
            chromaticAberration={0.05}
            ior={1.2}
          />
        </mesh>
      </Float>
      <mesh position={[0, 1.8, -0.4]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#d9edff" />
      </mesh>
    </group>
  );
}
