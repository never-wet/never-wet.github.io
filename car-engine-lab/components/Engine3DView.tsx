import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EngineData } from '../data/engineData';

interface Engine3DProps {
  engine: EngineData;
  speed: number;
  showXRay?: boolean;
  explode?: number;
}

const CRANK_RADIUS = 0.6;
const ROD_LENGTH = 2.2;

/**
 * Mechanical Piston & Connecting Rod Assembly
 * Uses real crank-slider math for pivot points.
 */
const PistonAssembly = ({ 
  z, 
  bankAngle, 
  phase, 
  speed, 
  explode, 
  color 
}: { 
  z: number, 
  bankAngle: number, 
  phase: number, 
  speed: number, 
  explode: number, 
  color: string 
}) => {
  const rodRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + phase;
    
    // Piston position relative to crank center
    // h = r*cos(a) + sqrt(l^2 - (r*sin(a))^2)
    const x = CRANK_RADIUS * Math.sin(t);
    const h = CRANK_RADIUS * Math.cos(t) + Math.sqrt(Math.pow(ROD_LENGTH, 2) - Math.pow(x, 2));
    
    // Rod angle
    const angle = Math.atan2(x, h - CRANK_RADIUS * Math.cos(t));

    if (headRef.current) headRef.current.position.y = h + (explode * 3);
    if (rodRef.current) {
      rodRef.current.position.y = (CRANK_RADIUS * Math.cos(t));
      rodRef.current.position.x = x;
      rodRef.current.rotation.z = -angle;
    }

    if (flashRef.current) {
      const cycle = t % (Math.PI * 2);
      flashRef.current.intensity = cycle < 0.3 ? 8 : 0;
    }
  });

  return (
    <group position={[0, 0, z]} rotation={[0, 0, bankAngle]}>
      <pointLight ref={flashRef} position={[0, 4, 0]} color="#ffaa00" distance={4} decay={2} />
      
      {/* Piston Head */}
      <group ref={headRef}>
        <mesh>
          <cylinderGeometry args={[0.75, 0.75, 0.8, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.76, 0.76, 0.05, 32]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      {/* Connecting Rod */}
      <group ref={rodRef}>
        <mesh position={[0, ROD_LENGTH / 2, 0]}>
          <boxGeometry args={[0.2, ROD_LENGTH, 0.3]} />
          <meshStandardMaterial color="#444" metalness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.4, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Detailed Rotating Crankshaft with Throws
 */
const Crankshaft = ({ cylinders, banks, speed, radius }: { cylinders: number, banks: number, speed: number, radius: number }) => {
  const ref = useRef<THREE.Group>(null);
  const perBank = cylinders / banks;
  
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.getElapsedTime() * speed;
  });

  const parts = useMemo(() => {
    const items = [];
    const spacing = 2.2;
    for (let i = 0; i < perBank; i++) {
      const z = (i - (perBank - 1) / 2) * spacing;
      const phase = (i / perBank) * Math.PI * 2;
      
      // Main journal
      items.push(
        <mesh key={`main-${i}`} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, spacing, 16]} />
          <meshStandardMaterial color="#222" metalness={1} />
        </mesh>
      );

      // Crank throw (the arm)
      items.push(
        <group key={`throw-${i}`} position={[0, 0, z]} rotation={[0, 0, phase]}>
          <mesh position={[0, radius / 2, 0]}>
            <boxGeometry args={[0.4, radius + 0.4, 0.4]} />
            <meshStandardMaterial color="#444" metalness={1} />
          </mesh>
          {/* The Pin where the rod attaches */}
          <mesh position={[0, radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
            <meshStandardMaterial color="#999" metalness={1} />
          </mesh>
        </group>
      );
    }
    return items;
  }, [perBank, radius]);

  return (
    <group ref={ref}>{parts}</group>
  );
};

/**
 * Wankel Rotary Rotor (Reuleaux Triangle)
 */
const RotaryAssembly = ({ speed }: { speed: number }) => {
  const rotorRef = useRef<THREE.Mesh>(null);
  const rotorShape = useMemo(() => {
    const s = 1.8;
    const shape = new THREE.Shape();
    shape.moveTo(0, s);
    shape.quadraticCurveTo(s * 1.1, s * 0.5, s * 0.86, -s * 0.5);
    shape.quadraticCurveTo(0, -s * 1.3, -s * 0.86, -s * 0.5);
    shape.quadraticCurveTo(-s * 1.1, s * 0.5, 0, s);
    return shape;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed * 0.5;
    if (rotorRef.current) {
      rotorRef.current.rotation.z = -t / 3;
      rotorRef.current.position.x = Math.cos(t) * 0.4;
      rotorRef.current.position.y = Math.sin(t) * 0.4;
      rotorRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={rotorRef}>
        <extrudeGeometry args={[rotorShape, { depth: 1, bevelEnabled: true, bevelThickness: 0.1 }]} />
        <meshStandardMaterial color="#f2c94c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 3, 32]} />
        <meshStandardMaterial color="#111" metalness={1} />
      </mesh>
    </group>
  );
};

/**
 * EV Traction Motor
 */
const ElectricAssembly = ({ speed }: { speed: number }) => {
  const rotorRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (rotorRef.current) rotorRef.current.rotation.z += 0.02 * speed;
  });

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Stator with Copper Coils */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]} position={[0, 2, 0]}>
          <boxGeometry args={[0.4, 0.6, 3.5]} />
          <meshStandardMaterial color="#b87333" metalness={0.8} emissive="#ff6600" emissiveIntensity={0.1} />
        </mesh>
      ))}
      {/* Rotor Core */}
      <group ref={rotorRef}>
        <mesh>
          <cylinderGeometry args={[1.4, 1.4, 3.2, 32]} />
          <meshStandardMaterial color="#333" metalness={1} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, (i / 6) * Math.PI * 2]}>
            <boxGeometry args={[0.1, 2.8, 3.3]} />
            <meshStandardMaterial color="#56ccf2" emissive="#56ccf2" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const Engine3DView: React.FC<Engine3DProps> = ({ 
  engine, 
  speed, 
  showXRay = false, 
  explode = 0 
}) => {
  const rotationSpeed = speed * 2;

  const renderPistons = () => {
    const items = [];
    const banks = engine.banks || 1;
    const perBank = engine.cylinders / banks;
    const bankAngle = engine.modelKind === 'v' ? Math.PI / 4 : engine.modelKind === 'boxer' ? Math.PI / 2 : 0;

    for (let b = 0; b < banks; b++) {
      const offset = b === 0 ? -bankAngle : bankAngle;
      for (let i = 0; i < perBank; i++) {
        const spacing = 2.2;
        const zPos = (i - (perBank - 1) / 2) * spacing;
        // Alternate phase for V-engines
        const phase = (i / perBank) * Math.PI * 2 + (b * Math.PI / banks);
        items.push(
          <PistonAssembly 
            key={`${b}-${i}`} 
            z={zPos + (b * 0.1)} 
            bankAngle={offset} 
            phase={phase} 
            speed={rotationSpeed}
            explode={explode}
            color={engine.color}
          />
        );
      }
    }
    return items;
  };

  return (
    <group>
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={3} castShadow />
      <pointLight position={[-10, -5, -10]} intensity={1} color="#56ccf2" />
      
      {/* Mechanical Core */}
      <group>
        {engine.modelKind === 'rotary' ? (
          <RotaryAssembly speed={rotationSpeed * 0.5} />
        ) : engine.modelKind === 'electric' ? (
          <ElectricAssembly speed={rotationSpeed * 0.5} />
        ) : (
          <>
            {renderPistons()}
            <Crankshaft 
              cylinders={engine.cylinders} 
              banks={engine.banks || 1} 
              speed={rotationSpeed} 
              radius={CRANK_RADIUS} 
            />
          </>
        )}
      </group>

      {/* Structural Block / Outer Shell */}
      <mesh scale={[1 + explode, 1 + explode, 1 + explode]}>
        <boxGeometry args={[
          engine.modelKind === 'v' ? 6 : 4, 
          engine.modelKind === 'boxer' ? 3 : 5.5, 
          Math.max(3, (engine.cylinders / (engine.banks || 1)) * 2.4)
        ]} />
        <meshStandardMaterial 
          color={engine.color} 
          transparent 
          opacity={showXRay ? 0.05 : 0.25} 
          wireframe
          metalness={1}
          roughness={0.1}
        />
      </mesh>

      {/* Cylinder Heads (The "Valve Covers") */}
      <mesh position={[0, 4.5 + explode, 0]} rotation={[0, 0, engine.modelKind === 'v' ? -Math.PI / 4 : 0]}>
        <boxGeometry args={[2.5, 1, Math.max(2, (engine.cylinders / (engine.banks || 1)) * 2.2)]} />
        <meshStandardMaterial 
          color={engine.color} 
          metalness={0.9} 
          roughness={0.2}
          emissive={engine.color}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Structural Accents */}
      <mesh position={[0, -2.4, 0]}>
        <boxGeometry args={[4.2, 0.2, Math.max(3, (engine.cylinders / (engine.banks || 1)) * 2.4)]} />
        <meshStandardMaterial color="#222" metalness={1} />
      </mesh>
    </group>
  );
};