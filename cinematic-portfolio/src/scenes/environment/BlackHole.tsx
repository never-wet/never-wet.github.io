import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, BackSide, DoubleSide, Group, Mesh } from "three";

export function BlackHole() {
  const groupRef = useRef<Group>(null);
  const auraRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const innerHaloRef = useRef<Mesh>(null);
  const accretionRef = useRef<Mesh>(null);
  const hotRingRef = useRef<Mesh>(null);
  const lensRef = useRef<Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(time * 0.12) * 0.08;
    }

    if (auraRef.current) {
      const scale = 1 + Math.sin(time * 0.28) * 0.04;
      auraRef.current.scale.setScalar(scale);
    }

    if (haloRef.current) {
      haloRef.current.rotation.z = time * 0.08;
      const scale = 1 + Math.sin(time * 0.45) * 0.05;
      haloRef.current.scale.setScalar(scale);
    }

    if (innerHaloRef.current) {
      innerHaloRef.current.rotation.z = -time * 0.12;
    }

    if (accretionRef.current) {
      accretionRef.current.rotation.z = -time * 0.16;
    }

    if (hotRingRef.current) {
      hotRingRef.current.rotation.z = time * 0.22;
      const scale = 1 + Math.sin(time * 0.52) * 0.035;
      hotRingRef.current.scale.setScalar(scale);
    }

    if (lensRef.current) {
      const scale = 1 + Math.sin(time * 0.38) * 0.045;
      lensRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} position={[14.5, 6.4, -41.5]} rotation={[0.6, -0.42, -0.18]}>
      <mesh ref={auraRef}>
        <sphereGeometry args={[8.8, 52, 52]} />
        <meshBasicMaterial
          color="#68d8ff"
          transparent
          opacity={0.12}
          blending={AdditiveBlending}
          depthWrite={false}
          side={BackSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={haloRef} rotation={[1.1, -0.15, 0.2]}>
        <torusGeometry args={[6.25, 0.94, 28, 140]} />
        <meshBasicMaterial
          color="#8fe6ff"
          transparent
          opacity={0.42}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={innerHaloRef} rotation={[1.26, 0.24, -0.18]}>
        <torusGeometry args={[4.9, 0.46, 22, 120]} />
        <meshBasicMaterial
          color="#7fd0ff"
          transparent
          opacity={0.48}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={accretionRef} rotation={[0.42, 0.2, 0]}>
        <ringGeometry args={[2.15, 6.95, 128]} />
        <meshBasicMaterial
          color="#86dfff"
          transparent
          opacity={0.34}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={hotRingRef} rotation={[1.06, 0.34, 0.08]}>
        <ringGeometry args={[1.55, 4.15, 112]} />
        <meshBasicMaterial
          color="#ffd39c"
          transparent
          opacity={0.44}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={lensRef}>
        <sphereGeometry args={[4.7, 48, 48]} />
        <meshBasicMaterial
          color="#7bd6ff"
          transparent
          opacity={0.12}
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.12, 48, 48]} />
        <meshStandardMaterial
          color="#010103"
          roughness={0.96}
          metalness={0.02}
          emissive="#020204"
          emissiveIntensity={0.08}
        />
      </mesh>
      <mesh position={[-0.2, 0.12, 0]}>
        <sphereGeometry args={[1.18, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh rotation={[1.22, 0.22, 0]}>
        <ringGeometry args={[1.65, 3.95, 96]} />
        <meshBasicMaterial
          color="#fff3d6"
          transparent
          opacity={0.22}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0.76, -0.35, 0.28]}>
        <ringGeometry args={[3.9, 8.1, 112]} />
        <meshBasicMaterial
          color="#3fc5ff"
          transparent
          opacity={0.08}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
