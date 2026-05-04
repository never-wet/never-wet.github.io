import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane, Sphere } from "@react-three/drei";
import * as THREE from "three";

export default function GravitySimulation() {
  const gridRef = useRef<THREE.Mesh>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  // Create a high-res grid for warping
  const gridSize = 40;
  const gridRes = 60;

  useFrame(({ clock }) => {
    if (!gridRef.current) return;
    
    const time = clock.getElapsedTime();
    const positions = gridRef.current.geometry.attributes.position;
    
    // Position of the heavy mass
    const massPos = new THREE.Vector3(0, 0, 0);
    const massStrength = 2.5;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      const dist = Math.sqrt(x * x + y * y);
      // Spacetime curvature formula (simplified)
      const z = -(massStrength / (dist + 1));
      
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;

    // Animate the central mass slightly
    if (ballRef.current) {
        ballRef.current.position.y = Math.sin(time) * 0.1 - 1.2;
    }
  });

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]}>
      {/* Curved Grid */}
      <mesh ref={gridRef}>
        <planeGeometry args={[gridSize, gridSize, gridRes, gridRes]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          wireframe 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Central Mass */}
      <Sphere ref={ballRef} args={[1, 32, 32]} position={[0, -1, 0]}>
        <meshStandardMaterial 
          color="#1e293b" 
          emissive="#3b82f6" 
          emissiveIntensity={0.5} 
          roughness={0}
        />
      </Sphere>

      {/* Orbiting Body */}
      <OrbitingBody />
    </group>
  );
}

function OrbitingBody() {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() * 0.5;
        const r = 5;
        ref.current.position.x = Math.cos(t) * r;
        ref.current.position.y = Math.sin(t) * r;
        // Adjust Z to follow curvature
        const dist = Math.sqrt(ref.current.position.x**2 + ref.current.position.y**2);
        ref.current.position.z = -(2.5 / (dist + 1)) + 0.3;
    });

    return (
        <Sphere ref={ref} args={[0.3, 16, 16]}>
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </Sphere>
    )
}
