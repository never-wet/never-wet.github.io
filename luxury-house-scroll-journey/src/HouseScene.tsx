import { EffectComposer, Bloom, DepthOfField, Vignette } from "@react-three/postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, SoftShadows } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleCameraPath, type VectorTuple } from "@/CameraPathController";
import { Hotspot } from "@/Hotspot";
import { propertyHotspots, type StageId } from "@/PropertyData";

type HouseSceneProps = {
  progress: number;
  activeStageId: StageId;
  onReady: () => void;
};

type BlockProps = {
  material: THREE.Material;
  position: VectorTuple;
  scale: VectorTuple;
  rotation?: VectorTuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

type MaterialKit = ReturnType<typeof useMaterials>;

export function HouseScene({ progress, activeStageId, onReady }: HouseSceneProps) {
  return (
    <Canvas
      className="residence-canvas"
      dpr={[1, 1.7]}
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }}
      shadows
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.Fog(0x0b0d0d, 18, 78);
        onReady();
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 2.35, 18.2]} fov={42} near={0.08} far={120} />
      <SoftShadows size={18} samples={9} focus={0.7} />
      <Suspense fallback={null}>
        <ResidenceWorld progress={progress} activeStageId={activeStageId} />
      </Suspense>
      <CameraRig progress={progress} />
      <PostEffects />
    </Canvas>
  );
}

function ResidenceWorld({ progress, activeStageId }: { progress: number; activeStageId: StageId }) {
  const materials = useMaterials();

  return (
    <>
      <color attach="background" args={[0x0b0d0d]} />
      <hemisphereLight args={[0xd8e4ff, 0x17120d, 1.55]} />
      <directionalLight
        castShadow
        intensity={3.6}
        position={[9, 14, 9]}
        shadow-camera-bottom={-34}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={24}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <directionalLight intensity={1.4} position={[-8, 8, -12]} color={0x7d9ec8} />
      <pointLight color={0xffc986} intensity={16} distance={20} position={[0, 2.6, -21]} />
      <pointLight color={0xffa75c} intensity={18} distance={18} position={[5.6, 2.2, -32.6]} />
      <pointLight color={0x7fb8ff} intensity={7} distance={22} position={[8.5, 0.7, -35.5]} />

      <Grounds materials={materials} />
      <EntranceGate materials={materials} progress={progress} />
      <Driveway materials={materials} />
      <Landscape materials={materials} />
      <LuxuryVilla materials={materials} />
      <InteriorRooms materials={materials} />
      <FinalViewingGallery materials={materials} />
      <HotspotLayer activeStageId={activeStageId} />
    </>
  );
}

function CameraRig({ progress }: { progress: number }) {
  const { camera, pointer } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3(0, 1.55, 8.6));

  useFrame((_, delta) => {
    const sample = sampleCameraPath(progress);
    targetPosition.current.copy(sample.position);
    targetPosition.current.x += pointer.x * 0.22;
    targetPosition.current.y += pointer.y * 0.12;

    const positionLerp = 1 - Math.exp(-delta * 3.15);
    const targetLerp = 1 - Math.exp(-delta * 3.35);
    camera.position.lerp(targetPosition.current, positionLerp);
    lookAtTarget.current.lerp(sample.target, targetLerp);
    camera.lookAt(lookAtTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, sample.fov, 3.8, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function PostEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.42} intensity={0.28} mipmapBlur />
      <DepthOfField focusDistance={0.02} focalLength={0.032} bokehScale={1.45} />
      <Vignette darkness={0.56} offset={0.22} />
    </EffectComposer>
  );
}

function useMaterials() {
  return useMemo(
    () => ({
      asphalt: new THREE.MeshStandardMaterial({ color: 0x151716, roughness: 0.92, metalness: 0.03 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xb9925a, roughness: 0.38, metalness: 0.72 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0x8d8980, roughness: 0.82, metalness: 0.04 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: 0x111313, roughness: 0.36, metalness: 0.74 }),
      fabric: new THREE.MeshStandardMaterial({ color: 0xc8c1b3, roughness: 0.9, metalness: 0.02 }),
      floorStone: new THREE.MeshStandardMaterial({ color: 0xaaa394, roughness: 0.78, metalness: 0.06 }),
      garden: new THREE.MeshStandardMaterial({ color: 0x192a1d, roughness: 0.86, metalness: 0 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xaec3c6,
        metalness: 0.08,
        roughness: 0.04,
        transparent: true,
        opacity: 0.52,
        transmission: 0.26,
      }),
      interiorGlow: new THREE.MeshStandardMaterial({
        color: 0xffd8a1,
        emissive: 0xffb265,
        emissiveIntensity: 1.45,
        roughness: 0.5,
      }),
      limestone: new THREE.MeshStandardMaterial({ color: 0xc9c1ad, roughness: 0.86, metalness: 0.02 }),
      pool: new THREE.MeshPhysicalMaterial({
        color: 0x6aa7c4,
        emissive: 0x12354f,
        emissiveIntensity: 0.36,
        metalness: 0.02,
        roughness: 0.03,
        transparent: true,
        opacity: 0.76,
        transmission: 0.16,
      }),
      rug: new THREE.MeshStandardMaterial({ color: 0x534b42, roughness: 0.96, metalness: 0 }),
      walnut: new THREE.MeshStandardMaterial({ color: 0x5f3f27, roughness: 0.62, metalness: 0.04 }),
      whitePlaster: new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.74, metalness: 0.02 }),
    }),
    [],
  );
}

function Grounds({ materials }: { materials: MaterialKit }) {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -21]}>
        <planeGeometry args={[42, 96]} />
        <primitive object={materials.garden} attach="material" />
      </mesh>
      <Block material={materials.floorStone} position={[0, -0.02, -20]} scale={[20, 0.08, 74]} receiveShadow />
      <Block material={materials.garden} position={[-13.2, 0.08, -16]} scale={[4.2, 0.2, 78]} receiveShadow />
      <Block material={materials.garden} position={[13.2, 0.08, -16]} scale={[4.2, 0.2, 78]} receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -20]}>
        <planeGeometry args={[36, 88]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.018} />
      </mesh>
    </group>
  );
}

function EntranceGate({ materials, progress }: { materials: MaterialKit; progress: number }) {
  const leftPanel = useRef<THREE.Group>(null);
  const rightPanel = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const gateOpen = THREE.MathUtils.smoothstep(progress, 0.04, 0.18);
    if (leftPanel.current) {
      leftPanel.current.position.x = THREE.MathUtils.damp(leftPanel.current.position.x, -2.15 - gateOpen * 2.45, 5, delta);
    }
    if (rightPanel.current) {
      rightPanel.current.position.x = THREE.MathUtils.damp(rightPanel.current.position.x, 2.15 + gateOpen * 2.45, 5, delta);
    }
  });

  return (
    <group position={[0, 0, 9.2]}>
      <Block material={materials.limestone} position={[-6.1, 1.9, 0]} scale={[1.2, 3.8, 1.1]} />
      <Block material={materials.limestone} position={[6.1, 1.9, 0]} scale={[1.2, 3.8, 1.1]} />
      <Block material={materials.limestone} position={[-9.5, 1.25, 0]} scale={[5.4, 2.5, 0.72]} />
      <Block material={materials.limestone} position={[9.5, 1.25, 0]} scale={[5.4, 2.5, 0.72]} />
      <Block material={materials.darkMetal} position={[0, 3.82, 0]} scale={[13.6, 0.14, 0.26]} />

      <group ref={leftPanel} position={[-2.15, 1.72, 0]}>
        {[-1.3, -0.78, -0.26, 0.26, 0.78, 1.3].map((x) => (
          <Block key={x} material={materials.darkMetal} position={[x, 0, 0]} scale={[0.12, 3.15, 0.18]} />
        ))}
        <Block material={materials.darkMetal} position={[0, 1.52, 0]} scale={[3.2, 0.1, 0.2]} />
        <Block material={materials.darkMetal} position={[0, -1.52, 0]} scale={[3.2, 0.1, 0.2]} />
      </group>

      <group ref={rightPanel} position={[2.15, 1.72, 0]}>
        {[-1.3, -0.78, -0.26, 0.26, 0.78, 1.3].map((x) => (
          <Block key={x} material={materials.darkMetal} position={[x, 0, 0]} scale={[0.12, 3.15, 0.18]} />
        ))}
        <Block material={materials.darkMetal} position={[0, 1.52, 0]} scale={[3.2, 0.1, 0.2]} />
        <Block material={materials.darkMetal} position={[0, -1.52, 0]} scale={[3.2, 0.1, 0.2]} />
      </group>

      <Block material={materials.brass} position={[0, 0.18, -0.32]} scale={[12.8, 0.08, 0.18]} receiveShadow />
    </group>
  );
}

function Driveway({ materials }: { materials: MaterialKit }) {
  const lightPositions = [-1.9, 1.9];
  const zPositions = [5.8, 1.8, -2.2, -6.2, -10.2];

  return (
    <group>
      <Block material={materials.asphalt} position={[0, 0.04, -2.8]} scale={[5.65, 0.08, 25.5]} receiveShadow />
      {zPositions.map((z) => (
        <Block key={z} material={materials.floorStone} position={[0, 0.1, z]} scale={[5.86, 0.05, 0.08]} receiveShadow />
      ))}
      {zPositions.flatMap((z) =>
        lightPositions.map((x) => (
          <group key={`${x}-${z}`} position={[x * 1.9, 0.38, z]}>
            <Block material={materials.darkMetal} position={[0, -0.12, 0]} scale={[0.12, 0.34, 0.12]} />
            <mesh>
              <sphereGeometry args={[0.11, 16, 8]} />
              <meshStandardMaterial color={0xffd6a1} emissive={0xffa95c} emissiveIntensity={1.9} />
            </mesh>
            <pointLight color={0xffb56a} intensity={1.6} distance={4.2} />
          </group>
        )),
      )}
    </group>
  );
}

function Landscape({ materials }: { materials: MaterialKit }) {
  const hedgeSpecs: [number, number, number, number, number, number][] = [
    [-5.7, 0.58, 2.2, 1.0, 0.9, 13.8],
    [5.7, 0.58, 2.2, 1.0, 0.9, 13.8],
    [-8.7, 0.52, -8.8, 1.2, 0.78, 13.6],
    [8.7, 0.52, -8.8, 1.2, 0.78, 13.6],
    [-9.8, 0.52, -28.8, 1.4, 0.78, 16.6],
    [10.8, 0.52, -31.8, 1.4, 0.78, 16.6],
  ];
  const treePositions = [
    [-10.6, 0, 5.5],
    [10.6, 0, 4.7],
    [-11.4, 0, -2.6],
    [11.2, 0, -4.8],
    [-11.2, 0, -18.6],
    [12, 0, -21.4],
    [-11.5, 0, -38.2],
  ] as VectorTuple[];

  return (
    <group>
      {hedgeSpecs.map(([x, y, z, sx, sy, sz]) => (
        <Block key={`${x}-${z}`} material={materials.garden} position={[x, y, z]} scale={[sx, sy, sz]} />
      ))}
      {treePositions.map((position) => (
        <ArchitecturalTree key={position.join("-")} materials={materials} position={position} />
      ))}
      <Block material={materials.pool} position={[-7.65, 0.05, -4.2]} scale={[2.6, 0.05, 8.8]} receiveShadow={false} />
    </group>
  );
}

function ArchitecturalTree({ materials, position }: { materials: MaterialKit; position: VectorTuple }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 2, 8]} />
        <primitive object={materials.walnut} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.86, 16, 10]} />
        <primitive object={materials.garden} attach="material" />
      </mesh>
      <mesh castShadow position={[0.25, 2.78, -0.1]}>
        <sphereGeometry args={[0.58, 16, 10]} />
        <primitive object={materials.garden} attach="material" />
      </mesh>
    </group>
  );
}

function LuxuryVilla({ materials }: { materials: MaterialKit }) {
  return (
    <group position={[0, 0, -17.1]}>
      <Block material={materials.floorStone} position={[0, 0.1, 0]} scale={[15.8, 0.2, 14.2]} receiveShadow />
      <Block material={materials.whitePlaster} position={[-4.7, 1.75, -0.5]} scale={[4.2, 3.5, 9.2]} />
      <Block material={materials.limestone} position={[1.8, 1.75, -2.1]} scale={[9.2, 3.5, 6.7]} />
      <Block material={materials.glass} position={[2.35, 2.0, 3.38]} scale={[8.1, 3.0, 0.12]} castShadow={false} />
      <Block material={materials.walnut} position={[0, 1.78, 3.52]} scale={[1.55, 3.05, 0.18]} />
      <Block material={materials.darkMetal} position={[0, 3.4, 3.62]} scale={[2.05, 0.12, 0.2]} />
      <Block material={materials.darkMetal} position={[0, 0.35, 3.62]} scale={[2.05, 0.12, 0.2]} />
      <Block material={materials.glass} position={[-4.82, 2.0, 3.38]} scale={[2.6, 2.8, 0.12]} castShadow={false} />
      <Block material={materials.concrete} position={[1.2, 4.06, -0.2]} scale={[12.8, 0.46, 8.9]} />
      <Block material={materials.concrete} position={[2.6, 5.52, -1.3]} scale={[9.6, 2.9, 5.2]} />
      <Block material={materials.glass} position={[2.7, 5.55, 1.35]} scale={[8.7, 2.2, 0.12]} castShadow={false} />
      <Block material={materials.walnut} position={[-3.5, 5.55, 1.48]} scale={[1.15, 2.25, 0.18]} />
      <Block material={materials.limestone} position={[0, 7.1, -1.1]} scale={[14.8, 0.42, 8.1]} />
      <Block material={materials.darkMetal} position={[-7.0, 2.15, 0.7]} scale={[0.16, 3.4, 7.4]} />
      <Block material={materials.darkMetal} position={[7.3, 2.15, 0.7]} scale={[0.16, 3.4, 7.4]} />
      <Block material={materials.interiorGlow} position={[2.2, 2.45, 2.95]} scale={[7.2, 0.06, 0.08]} castShadow={false} receiveShadow={false} />
      <Block material={materials.brass} position={[-2.05, 0.26, 3.7]} scale={[5.2, 0.08, 0.28]} receiveShadow />
    </group>
  );
}

function InteriorRooms({ materials }: { materials: MaterialKit }) {
  return (
    <group>
      <LivingRoom materials={materials} />
      <KitchenSuite materials={materials} />
      <PoolCourtyard materials={materials} />
      <BedroomOffice materials={materials} />
    </group>
  );
}

function LivingRoom({ materials }: { materials: MaterialKit }) {
  return (
    <group position={[0, 0, -25.8]}>
      <Block material={materials.floorStone} position={[0, 0.12, 0]} scale={[13.2, 0.22, 12.6]} receiveShadow />
      <Block material={materials.whitePlaster} position={[-6.7, 2, -1.2]} scale={[0.22, 3.8, 10.6]} />
      <Block material={materials.glass} position={[6.7, 2, -0.2]} scale={[0.18, 3.3, 8.6]} castShadow={false} />
      <Block material={materials.concrete} position={[0, 4.08, -0.2]} scale={[13.6, 0.25, 11.2]} />
      <Block material={materials.rug} position={[0, 0.26, -1.1]} scale={[5.7, 0.05, 4.0]} receiveShadow />
      <Sofa materials={materials} position={[-2.2, 0.72, -1.2]} rotation={[0, Math.PI / 2, 0]} />
      <Sofa materials={materials} position={[2.6, 0.72, -1.3]} rotation={[0, -Math.PI / 2, 0]} />
      <Block material={materials.walnut} position={[0.2, 0.56, -1.2]} scale={[1.9, 0.28, 1.05]} />
      <Block material={materials.darkMetal} position={[0.2, 0.88, -1.2]} scale={[1.3, 0.04, 0.58]} />
      <Block material={materials.walnut} position={[-6.45, 1.75, 2.7]} scale={[0.2, 2.6, 4.2]} />
      <Block material={materials.interiorGlow} position={[-6.28, 1.7, 2.7]} scale={[0.08, 1.2, 3.3]} castShadow={false} />
      <Pendant position={[-1.6, 2.95, -1.2]} />
      <Pendant position={[1.6, 2.95, -1.2]} />
    </group>
  );
}

function Sofa({ materials, position, rotation }: { materials: MaterialKit; position: VectorTuple; rotation: VectorTuple }) {
  return (
    <group position={position} rotation={rotation}>
      <Block material={materials.fabric} position={[0, 0, 0]} scale={[2.3, 0.48, 0.9]} />
      <Block material={materials.fabric} position={[0, 0.42, -0.38]} scale={[2.3, 0.8, 0.24]} />
      <Block material={materials.fabric} position={[-1.04, 0.26, 0]} scale={[0.22, 0.52, 0.9]} />
      <Block material={materials.fabric} position={[1.04, 0.26, 0]} scale={[0.22, 0.52, 0.9]} />
    </group>
  );
}

function KitchenSuite({ materials }: { materials: MaterialKit }) {
  return (
    <group position={[4.5, 0, -34.5]}>
      <Block material={materials.floorStone} position={[0, 0.1, 0]} scale={[8.4, 0.2, 9.8]} receiveShadow />
      <Block material={materials.limestone} position={[-4.28, 2, -0.2]} scale={[0.22, 3.6, 8.2]} />
      <Block material={materials.glass} position={[4.28, 2, -0.2]} scale={[0.16, 3.1, 8.2]} castShadow={false} />
      <Block material={materials.walnut} position={[-2.9, 1.1, -2.3]} scale={[1.4, 2.0, 4.8]} />
      <Block material={materials.walnut} position={[0.2, 0.72, -0.4]} scale={[3.8, 0.85, 1.35]} />
      <Block material={materials.limestone} position={[0.2, 1.2, -0.4]} scale={[4.0, 0.14, 1.48]} />
      <Block material={materials.darkMetal} position={[2.9, 0.88, 2.1]} scale={[2.5, 0.12, 2.1]} />
      <Pendant position={[-0.9, 2.65, -0.4]} />
      <Pendant position={[0.9, 2.65, -0.4]} />
    </group>
  );
}

function PoolCourtyard({ materials }: { materials: MaterialKit }) {
  return (
    <group position={[9.2, 0, -35.2]}>
      <Block material={materials.floorStone} position={[0, 0.08, 0]} scale={[5.4, 0.16, 11.8]} receiveShadow />
      <Block material={materials.pool} position={[0, 0.18, -0.8]} scale={[3.5, 0.08, 8.2]} receiveShadow={false} />
      <Block material={materials.darkMetal} position={[-2.88, 0.45, -0.8]} scale={[0.1, 0.38, 8.4]} />
      <Block material={materials.darkMetal} position={[2.88, 0.45, -0.8]} scale={[0.1, 0.38, 8.4]} />
      <Block material={materials.fabric} position={[-1.15, 0.38, 4.1]} scale={[1.45, 0.18, 2.3]} />
      <Block material={materials.fabric} position={[1.15, 0.38, 4.1]} scale={[1.45, 0.18, 2.3]} />
    </group>
  );
}

function BedroomOffice({ materials }: { materials: MaterialKit }) {
  return (
    <group position={[-4.8, 0, -43.8]}>
      <Block material={materials.floorStone} position={[0, 0.1, 0]} scale={[9.8, 0.2, 11.8]} receiveShadow />
      <Block material={materials.whitePlaster} position={[-5, 2, -0.6]} scale={[0.2, 3.8, 9.2]} />
      <Block material={materials.glass} position={[4.95, 2, -1.1]} scale={[0.16, 3.15, 8.4]} castShadow={false} />
      <Block material={materials.fabric} position={[-1.8, 0.65, -2.2]} scale={[3.2, 0.55, 2.3]} />
      <Block material={materials.fabric} position={[-1.8, 0.98, -3.25]} scale={[3.3, 1.0, 0.24]} />
      <Block material={materials.walnut} position={[2.2, 0.82, 2.1]} scale={[2.9, 0.18, 1.1]} />
      <Block material={materials.darkMetal} position={[1.1, 1.55, 2.1]} scale={[0.1, 1.4, 1.0]} />
      <Block material={materials.walnut} position={[-4.82, 1.8, 2.2]} scale={[0.14, 2.7, 3.6]} />
      <Pendant position={[-1.8, 2.8, -1.6]} />
    </group>
  );
}

function FinalViewingGallery({ materials }: { materials: MaterialKit }) {
  return (
    <group position={[0, 0, -55.5]}>
      <Block material={materials.floorStone} position={[0, 0.12, 0]} scale={[12.4, 0.22, 12]} receiveShadow />
      <Block material={materials.limestone} position={[0, 2.2, -4.9]} scale={[12.8, 4.4, 0.24]} />
      <Block material={materials.glass} position={[-6.35, 2, 0.2]} scale={[0.16, 3.4, 9.2]} castShadow={false} />
      <Block material={materials.glass} position={[6.35, 2, 0.2]} scale={[0.16, 3.4, 9.2]} castShadow={false} />
      <Block material={materials.brass} position={[0, 2.6, -4.72]} scale={[5.8, 0.08, 0.12]} castShadow={false} />
      <Block material={materials.interiorGlow} position={[0, 3.25, -4.7]} scale={[8.5, 0.1, 0.1]} castShadow={false} />
      <Sofa materials={materials} position={[-2.2, 0.72, -0.4]} rotation={[0, 0, 0]} />
      <Sofa materials={materials} position={[2.2, 0.72, -0.4]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

function Pendant({ position }: { position: VectorTuple }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.85, 8]} />
        <meshStandardMaterial color={0x151515} roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.16, 18, 10]} />
        <meshStandardMaterial color={0xffc484} emissive={0xffa45f} emissiveIntensity={1.8} />
      </mesh>
      <pointLight color={0xffb36c} distance={4.5} intensity={2.6} />
    </group>
  );
}

function HotspotLayer({ activeStageId }: { activeStageId: StageId }) {
  return (
    <>
      {propertyHotspots.map((hotspot) => (
        <Hotspot activeStageId={activeStageId} data={hotspot} key={hotspot.id} />
      ))}
    </>
  );
}

function Block({
  material,
  position,
  scale,
  rotation = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
}: BlockProps) {
  return (
    <mesh castShadow={castShadow} receiveShadow={receiveShadow} position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
