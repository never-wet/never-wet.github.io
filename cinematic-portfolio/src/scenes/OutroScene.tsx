import { Float } from "@react-three/drei";
import { FloatingIsland } from "@/objects/FloatingIsland";

export function OutroScene() {
  return (
    <group position={[0, 0.95, -28.4]}>
      <FloatingIsland radius={3.1} tint="#0f1524" emissive="#3b4b79" />
      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.16}>
        <mesh castShadow position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 2.3, 24]} />
          <meshStandardMaterial
            color="#101827"
            metalness={0.94}
            roughness={0.18}
            emissive="#8ab6ff"
            emissiveIntensity={0.54}
          />
        </mesh>
        <mesh position={[0, 2.9, 0]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshBasicMaterial color="#dbeefe" />
        </mesh>
        <mesh position={[0, 1.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.86, 0.06, 10, 64]} />
          <meshStandardMaterial
            color="#8ab6ff"
            emissive="#8ab6ff"
            emissiveIntensity={0.72}
            metalness={0.9}
            roughness={0.12}
          />
        </mesh>
      </Float>
    </group>
  );
}
