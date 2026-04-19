import { MeshTransmissionMaterial } from "@react-three/drei";

export function PortalFrame({
  portalType,
  glowColor,
  active,
  scale = 1,
}: {
  portalType: "halo" | "vault" | "prism";
  glowColor: string;
  active: boolean;
  scale?: number;
}) {
  if (portalType === "vault") {
    return (
      <group scale={scale}>
        {[
          [0, 1.05, 0, 1.7, 0.11, 0.12],
          [0, -1.05, 0, 1.7, 0.11, 0.12],
          [-0.85, 0, 0, 0.11, 2.2, 0.12],
          [0.85, 0, 0, 0.11, 2.2, 0.12],
        ].map(([x, y, z, width, height, depth], index) => (
          <mesh key={index} position={[x, y, z]} castShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color="#111827"
              metalness={0.92}
              roughness={0.24}
              emissive={glowColor}
              emissiveIntensity={active ? 0.65 : 0.28}
            />
          </mesh>
        ))}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[1.5, 1.9]} />
          <MeshTransmissionMaterial
            thickness={0.18}
            transmission={0.94}
            roughness={0.12}
            chromaticAberration={0.05}
            ior={1.22}
            backside
          />
        </mesh>
      </group>
    );
  }

  if (portalType === "prism") {
    return (
      <group scale={scale}>
        <mesh castShadow>
          <torusGeometry args={[1.1, 0.08, 18, 96]} />
          <meshStandardMaterial
            color="#141b2d"
            metalness={0.95}
            roughness={0.15}
            emissive={glowColor}
            emissiveIntensity={active ? 0.72 : 0.28}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 3]} castShadow>
          <torusGeometry args={[0.88, 0.05, 16, 72]} />
          <meshStandardMaterial
            color="#0f1525"
            metalness={0.92}
            roughness={0.18}
            emissive={glowColor}
            emissiveIntensity={active ? 0.48 : 0.16}
          />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[0.74, 48]} />
          <MeshTransmissionMaterial
            thickness={0.16}
            transmission={0.95}
            roughness={0.08}
            chromaticAberration={0.08}
            ior={1.18}
            backside
          />
        </mesh>
      </group>
    );
  }

  return (
    <group scale={scale}>
      <mesh castShadow>
        <torusGeometry args={[1.06, 0.09, 18, 96]} />
        <meshStandardMaterial
          color="#0f1626"
          metalness={0.95}
          roughness={0.17}
          emissive={glowColor}
          emissiveIntensity={active ? 0.68 : 0.24}
        />
      </mesh>
      <mesh position={[0, 0, -0.06]}>
        <circleGeometry args={[0.7, 48]} />
        <MeshTransmissionMaterial
          thickness={0.2}
          transmission={0.95}
          roughness={0.1}
          chromaticAberration={0.06}
          ior={1.18}
          backside
        />
      </mesh>
    </group>
  );
}
