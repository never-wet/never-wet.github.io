export function FloatingIsland({
  radius = 2.4,
  tint = "#121a2b",
  emissive = "#2e4872",
}: {
  radius?: number;
  tint?: string;
  emissive?: string;
}) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, -0.48, 0]}>
        <cylinderGeometry args={[radius * 0.82, radius, 0.9, 56]} />
        <meshStandardMaterial
          color={tint}
          metalness={0.52}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={0.12}
        />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius, 56]} />
        <meshStandardMaterial color="#090f1c" metalness={0.78} roughness={0.38} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <torusGeometry args={[radius * 0.7, 0.05, 10, 80]} />
        <meshStandardMaterial
          color={emissive}
          emissive={emissive}
          emissiveIntensity={0.32}
          metalness={0.92}
          roughness={0.28}
        />
      </mesh>
    </group>
  );
}
