"use client";

import { Preload } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import {
  type SceneStateRef,
  SCENE_PALETTE,
  sampleVector3,
  segmentProgress,
} from "./scene-utils";

const CAMERA_KEYFRAMES = [
  { at: 0, value: new Vector3(0.2, 0.05, 5.8) },
  { at: 0.24, value: new Vector3(2.55, 0.55, 4.9) },
  { at: 0.5, value: new Vector3(-2.1, 0.95, 7.4) },
  { at: 0.77, value: new Vector3(1.25, -0.25, 10.4) },
  { at: 1, value: new Vector3(0.35, 0.5, 8.8) },
] as const;

const TARGET_KEYFRAMES = [
  { at: 0, value: new Vector3(0, 0, 0) },
  { at: 0.24, value: new Vector3(0.1, 0.05, 0) },
  { at: 0.5, value: new Vector3(0, 0, -0.8) },
  { at: 0.77, value: new Vector3(0.2, 0, -4.1) },
  { at: 1, value: new Vector3(0, 0.05, -2.25) },
] as const;

const coreVertexShader = `
  varying vec3 vNormalDirection;
  varying vec3 vWorldPosition;
  varying float vEnergy;
  uniform float uTime;
  uniform float uFracture;
  uniform float uReveal;
  uniform float uPulse;

  void main() {
    vec3 transformed = position;
    float waveA = sin(position.y * 6.0 + uTime * 1.3);
    float waveB = sin((position.x + position.z) * 5.0 - uTime * 1.1);
    float energy = (waveA + waveB) * 0.5;

    transformed += normal * energy * (0.05 + uReveal * 0.07 + uFracture * 0.16);
    transformed += normalize(position) * (uPulse * 0.05 + uFracture * 0.08);

    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalDirection = normalize(normalMatrix * normal);
    vEnergy = energy;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const coreFragmentShader = `
  varying vec3 vNormalDirection;
  varying vec3 vWorldPosition;
  varying float vEnergy;
  uniform vec3 uAccent;
  uniform vec3 uBase;
  uniform vec3 uHighlight;
  uniform float uFracture;
  uniform float uReveal;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(vNormalDirection, viewDirection), 0.0), 2.75);
    float pulse = 0.5 + 0.5 * sin(vWorldPosition.y * 3.0 + uReveal * 6.0 + vEnergy * 4.0);
    vec3 color = mix(uBase, uAccent, 0.18 + fresnel * 0.72 + pulse * 0.18 + uFracture * 0.18);
    color = mix(color, uHighlight, fresnel * 0.48 + uReveal * 0.22);

    float alpha = 0.62 + fresnel * 0.24 + uReveal * 0.12;
    gl_FragColor = vec4(color, alpha);
  }
`;

const particleVertexShader = `
  attribute float aScale;
  attribute float aRandom;
  varying float vAlpha;
  uniform float uTime;
  uniform float uProgress;
  uniform float uStrength;

  void main() {
    vec3 transformed = position;
    float drift = 0.25 + uProgress * 2.8;

    transformed.x += sin(uTime * 0.12 + aRandom * 20.0) * drift * (0.1 + aRandom * 0.32);
    transformed.y += cos(uTime * 0.14 + aRandom * 15.0) * drift * (0.08 + aRandom * 0.26);
    transformed.z -= uProgress * (1.5 + aRandom * 6.5);

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (aScale * (12.0 + uStrength * 16.0)) / max(1.0, -mvPosition.z);

    vAlpha = (0.18 + aRandom * 0.65) * (0.35 + uStrength * 0.9);
  }
`;

const particleFragmentShader = `
  varying float vAlpha;
  uniform vec3 uAccent;
  uniform vec3 uBase;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    float strength = smoothstep(0.5, 0.06, dist);
    vec3 color = mix(uBase, uAccent, strength);
    gl_FragColor = vec4(color, strength * vAlpha);
  }
`;

const ribbonVertexShader = `
  varying vec2 vUv;
  varying float vDepth;
  uniform float uTime;
  uniform float uOffset;

  void main() {
    vUv = uv;
    vec3 transformed = position + normal * sin(uv.y * 18.0 + uTime * 2.5 + uOffset) * 0.035;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vDepth = 1.0 / max(1.0, -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ribbonFragmentShader = `
  varying vec2 vUv;
  varying float vDepth;
  uniform vec3 uAccent;
  uniform vec3 uBase;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uOffset;

  void main() {
    float stripe = sin(vUv.y * 36.0 - uTime * 3.8 + uOffset) * 0.5 + 0.5;
    float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
    edge = pow(max(edge, 0.0), 1.7);
    vec3 color = mix(uBase, uAccent, stripe);
    float alpha = uOpacity * edge * (0.28 + stripe * 0.82) * clamp(vDepth * 11.0, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function WebGLStage({
  sceneState,
  lowPower,
  reducedMotion,
}: {
  sceneState: SceneStateRef;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  const dprMax = lowPower ? 1.25 : 1.8;

  return (
    <Canvas
      dpr={[1, dprMax]}
      camera={{ fov: lowPower ? 36 : 32, near: 0.1, far: 80, position: [0.2, 0.05, 5.8] }}
      gl={{ antialias: !lowPower, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[SCENE_PALETTE.background]} />
      <fogExp2 attach="fog" args={[SCENE_PALETTE.fog, lowPower ? 0.05 : 0.038]} />

      <ambientLight intensity={0.25} color="#98b2cf" />
      <directionalLight position={[6, 8, 6]} intensity={1.05} color="#dce9ff" />
      <directionalLight position={[-8, -4, 5]} intensity={0.35} color="#1d3d5a" />
      <pointLight position={[0, 0, 2.5]} intensity={1.4} distance={10} color={SCENE_PALETTE.accent} />

      <SceneWorld
        lowPower={lowPower}
        reducedMotion={reducedMotion}
        sceneState={sceneState}
      />
      <Preload all />
    </Canvas>
  );
}

function SceneWorld({
  sceneState,
  lowPower,
  reducedMotion,
}: {
  sceneState: SceneStateRef;
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  return (
    <>
      <CameraRig sceneState={sceneState} />
      <ParticleField lowPower={lowPower} sceneState={sceneState} />
      <SignalCore lowPower={lowPower} sceneState={sceneState} />
      <FractureShards lowPower={lowPower} sceneState={sceneState} />
      <RibbonField lowPower={lowPower} sceneState={sceneState} />
      <EnvironmentalStructures sceneState={sceneState} />
      <PostEffects lowPower={lowPower} reducedMotion={reducedMotion} />
    </>
  );
}

function CameraRig({ sceneState }: { sceneState: SceneStateRef }) {
  const { camera } = useThree();
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  const currentTarget = useRef(new Vector3());

  useFrame((_, delta) => {
    const progress = sceneState.current.storyProgress;
    const pointerStrength = sceneState.current.mobile
      ? 0
      : sceneState.current.reducedMotion
        ? 0.05
        : 0.14;
    const easing = 1 - Math.exp(-delta * (sceneState.current.reducedMotion ? 2.2 : 3.8));

    sampleVector3(CAMERA_KEYFRAMES, progress, desiredPosition.current);
    sampleVector3(TARGET_KEYFRAMES, progress, desiredTarget.current);

    desiredPosition.current.x += sceneState.current.pointerX * pointerStrength;
    desiredPosition.current.y += sceneState.current.pointerY * pointerStrength * 0.5;
    desiredTarget.current.x += sceneState.current.pointerX * pointerStrength * 0.28;
    desiredTarget.current.y += sceneState.current.pointerY * pointerStrength * 0.18;

    camera.position.lerp(desiredPosition.current, easing);
    currentTarget.current.lerp(desiredTarget.current, easing);
    camera.lookAt(currentTarget.current);
  });

  return null;
}

function SignalCore({
  sceneState,
  lowPower,
}: {
  sceneState: SceneStateRef;
  lowPower: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const innerShellRef = useRef<Mesh>(null);
  const outerShellRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uAccent: { value: new Color(SCENE_PALETTE.accent) },
          uBase: { value: new Color("#101822") },
          uFracture: { value: 0 },
          uHighlight: { value: new Color(SCENE_PALETTE.steelBright) },
          uPulse: { value: 0 },
          uReveal: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: coreVertexShader,
        fragmentShader: coreFragmentShader,
      }),
    []
  );

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useFrame((state, delta) => {
    const progress = sceneState.current.storyProgress;
    const reveal = segmentProgress(progress, 0.08, 0.34);
    const fracture = segmentProgress(progress, 0.32, 0.7);
    const environment = segmentProgress(progress, 0.6, 0.9);
    const final = segmentProgress(progress, 0.84, 1);
    const motionFactor = sceneState.current.reducedMotion ? 0.55 : 1;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.2 + fracture * 0.45 + final * 0.16) * motionFactor;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.2 * motionFactor) * 0.14 + reveal * 0.16;
      groupRef.current.position.z = -environment * 2.8 - final * 0.75;
      groupRef.current.scale.setScalar(1.02 + final * 0.82 - fracture * 0.08);
    }

    if (innerShellRef.current) {
      innerShellRef.current.rotation.y -= delta * 0.22 * motionFactor;
      innerShellRef.current.scale.setScalar(0.72 + reveal * 0.06 + final * 0.08);
      const innerMaterial = innerShellRef.current.material as MeshStandardMaterial;
      innerMaterial.opacity = 0.12 + reveal * 0.14 + final * 0.08;
    }

    if (outerShellRef.current) {
      outerShellRef.current.rotation.y += delta * 0.08 * motionFactor;
      outerShellRef.current.rotation.z -= delta * 0.05 * motionFactor;
      outerShellRef.current.scale.setScalar(1.18 + fracture * 0.32 + final * 0.28);
      const outerMaterial = outerShellRef.current.material as MeshStandardMaterial;
      outerMaterial.opacity = 0.05 + reveal * 0.05 + final * 0.06;
    }

    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * motionFactor;
    materialRef.current.uniforms.uReveal.value = reveal + final * 0.35;
    materialRef.current.uniforms.uFracture.value = fracture;
    materialRef.current.uniforms.uPulse.value = 0.24 + reveal * 0.24 + final * 0.48;
  });

  return (
    <group ref={groupRef}>
      <mesh material={material}>
        <icosahedronGeometry args={[1.08, lowPower ? 3 : 4]} />
      </mesh>

      <mesh ref={innerShellRef}>
        <icosahedronGeometry args={[0.78, 2]} />
        <meshStandardMaterial
          color={SCENE_PALETTE.steelBright}
          emissive={SCENE_PALETTE.accent}
          emissiveIntensity={0.15}
          metalness={0.7}
          opacity={0.12}
          roughness={0.15}
          transparent
          wireframe
        />
      </mesh>

      <mesh ref={outerShellRef}>
        <icosahedronGeometry args={[1.46, 2]} />
        <meshStandardMaterial
          color={SCENE_PALETTE.accent}
          emissive={SCENE_PALETTE.accent}
          emissiveIntensity={0.16}
          metalness={0.35}
          opacity={0.05}
          roughness={0.1}
          transparent
          wireframe
        />
      </mesh>
    </group>
  );
}

function FractureShards({
  sceneState,
  lowPower,
}: {
  sceneState: SceneStateRef;
  lowPower: boolean;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const count = lowPower ? 28 : 64;
  const dummy = useMemo(() => new Object3D(), []);

  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const vertical = ((index % 11) / 10 - 0.5) * 1.8;
        const radius = 0.8 + ((index * 1.73) % 9) * 0.08;
        const direction = new Vector3(
          Math.cos(angle) * (0.85 + ((index * 13.1) % 7) * 0.03),
          vertical,
          Math.sin(angle) * (0.85 + ((index * 7.3) % 5) * 0.04)
        ).normalize();

        return {
          direction,
          offset: angle * 0.7 + index * 0.21,
          scale: 0.08 + (index % 7) * 0.018,
          speed: 0.7 + (index % 5) * 0.18,
          tension: radius,
        };
      }),
    [count]
  );

  useFrame((state) => {
    const fracture = segmentProgress(sceneState.current.storyProgress, 0.32, 0.7);
    const environment = segmentProgress(sceneState.current.storyProgress, 0.58, 0.9);
    const final = segmentProgress(sceneState.current.storyProgress, 0.84, 1);
    const time = state.clock.elapsedTime * (sceneState.current.reducedMotion ? 0.6 : 1);
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    shards.forEach((shard, index) => {
      const burst = 1.05 + fracture * (1.6 + shard.tension) + environment * 0.9;
      const streamOffset = environment * (1.2 + shard.tension * 0.4);

      dummy.position.copy(shard.direction).multiplyScalar(burst);
      dummy.position.x += Math.cos(time * 0.55 * shard.speed + shard.offset) * fracture * 0.45;
      dummy.position.y += Math.sin(time * 0.45 * shard.speed + shard.offset) * fracture * 0.38;
      dummy.position.z -= streamOffset * (0.7 + (index % 4) * 0.2);
      dummy.position.z += Math.sin(time * 0.4 + shard.offset) * fracture * 0.55;

      dummy.rotation.set(
        shard.offset + time * 0.18 * shard.speed,
        time * 0.24 * shard.speed + fracture * 1.2,
        shard.offset * 0.5 + time * 0.14 * shard.speed
      );

      const scale = Math.max(0.015, shard.scale * (0.45 + fracture * 1.35 - final * 0.18));
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    const material = mesh.material as MeshStandardMaterial;
    material.opacity = 0.06 + fracture * 0.52 + environment * 0.12;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[0.16, 0]} />
      <meshStandardMaterial
        color={SCENE_PALETTE.steelBright}
        emissive={SCENE_PALETTE.accent}
        emissiveIntensity={0.35}
        metalness={0.9}
        opacity={0.45}
        roughness={0.18}
        transparent
      />
    </instancedMesh>
  );
}

function ParticleField({
  sceneState,
  lowPower,
}: {
  sceneState: SceneStateRef;
  lowPower: boolean;
}) {
  const materialRef = useRef<ShaderMaterial | null>(null);
  const particleCount = lowPower ? 520 : 1280;

  const { geometry, material } = useMemo(() => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const randomness = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      const radius = 2.5 + ((index * 17.7) % 100) * 0.08;
      const theta = (index * 1.618) % (Math.PI * 2);
      const phi = Math.acos(1 - 2 * (((index * 11.3) % 100) / 100));
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.7;
      const z = -radius * Math.sin(phi) * Math.sin(theta);

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      scales[index] = 0.35 + ((index * 5.1) % 10) * 0.12;
      randomness[index] = ((index * 7.31) % 100) / 100;
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aScale", new BufferAttribute(scales, 1));
    geometry.setAttribute("aRandom", new BufferAttribute(randomness, 1));

    const material = new ShaderMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      uniforms: {
        uAccent: { value: new Color(SCENE_PALETTE.accent) },
        uBase: { value: new Color(SCENE_PALETTE.steelBright) },
        uProgress: { value: 0 },
        uStrength: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
    });

    return { geometry, material };
  }, [particleCount]);

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const fracture = segmentProgress(sceneState.current.storyProgress, 0.3, 0.72);
    const environment = segmentProgress(sceneState.current.storyProgress, 0.58, 0.9);
    const final = segmentProgress(sceneState.current.storyProgress, 0.84, 1);
    const intensity = 0.24 + fracture * 0.58 + environment * 0.22 + final * 0.1;

    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value =
      state.clock.elapsedTime * (sceneState.current.reducedMotion ? 0.55 : 1);
    materialRef.current.uniforms.uProgress.value = fracture + environment * 0.5;
    materialRef.current.uniforms.uStrength.value = lowPower ? intensity * 0.85 : intensity;
  });

  return <points geometry={geometry} material={material} />;
}

function RibbonField({
  sceneState,
  lowPower,
}: {
  sceneState: SceneStateRef;
  lowPower: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const ribbonCount = lowPower ? 5 : 8;

  const ribbons = useMemo(() => {
    return Array.from({ length: ribbonCount }, (_, index) => {
      const points = Array.from({ length: 18 }, (_, pointIndex) => {
        const t = pointIndex / 17;
        const spiral = t * Math.PI * (1.8 + index * 0.12) + index * 0.9;
        const radius = 1.3 + Math.sin(t * Math.PI * 2 + index * 0.6) * 0.35 + index * 0.11;

        return new Vector3(
          Math.cos(spiral) * radius,
          (t - 0.5) * (4.4 + index * 0.22),
          -1.1 - t * (5.4 + index * 0.5) + Math.sin(spiral * 0.7) * 0.9
        );
      });

      const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.65);
      const geometry = new TubeGeometry(
        curve,
        lowPower ? 56 : 84,
        0.024 + index * 0.0025,
        10,
        false
      );

      const material = new ShaderMaterial({
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        transparent: true,
        uniforms: {
          uAccent: { value: new Color(SCENE_PALETTE.accent) },
          uBase: { value: new Color(SCENE_PALETTE.accentShadow) },
          uOffset: { value: index * 0.85 },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: ribbonVertexShader,
        fragmentShader: ribbonFragmentShader,
      });

      return {
        geometry,
        material,
        rotation: [index * 0.2, index * 0.36, index * 0.12] as [number, number, number],
      };
    });
  }, [lowPower, ribbonCount]);

  useEffect(() => {
    return () => {
      ribbons.forEach((ribbon) => {
        ribbon.geometry.dispose();
        ribbon.material.dispose();
      });
    };
  }, [ribbons]);

  useFrame((state, delta) => {
    const reveal = segmentProgress(sceneState.current.storyProgress, 0.42, 0.82);
    const final = segmentProgress(sceneState.current.storyProgress, 0.84, 1);
    const motion = sceneState.current.reducedMotion ? 0.55 : 1;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.08 + reveal * 0.16) * motion;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08 * motion) * 0.12;
      groupRef.current.scale.setScalar(0.5 + reveal * 0.9 + final * 0.35);
      groupRef.current.position.z = -reveal * 2.3 - final * 1.1;
    }

    ribbons.forEach((ribbon, index) => {
      ribbon.material.uniforms.uOpacity.value =
        (0.04 + reveal * 0.28 + final * 0.12) * (1 - index * 0.035);
      ribbon.material.uniforms.uTime.value = state.clock.elapsedTime * motion;
    });
  });

  return (
    <group ref={groupRef}>
      {ribbons.map((ribbon, index) => (
        <mesh
          key={`ribbon-${index}`}
          geometry={ribbon.geometry}
          material={ribbon.material}
          rotation={ribbon.rotation}
        />
      ))}
    </group>
  );
}

function EnvironmentalStructures({ sceneState }: { sceneState: SceneStateRef }) {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const environment = segmentProgress(sceneState.current.storyProgress, 0.58, 0.9);
    const final = segmentProgress(sceneState.current.storyProgress, 0.84, 1);
    const motion = sceneState.current.reducedMotion ? 0.55 : 1;

    if (!groupRef.current) {
      return;
    }

    groupRef.current.scale.setScalar(0.15 + environment * 0.92 + final * 0.18);
    groupRef.current.position.z = -2.8 - environment * 4.8;
    groupRef.current.rotation.y += delta * 0.04 * motion;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.06 * motion) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0.2, 0]}>
        <torusGeometry args={[3.1, 0.05, 20, 180]} />
        <meshStandardMaterial
          color={SCENE_PALETTE.steelBright}
          emissive={SCENE_PALETTE.accent}
          emissiveIntensity={0.22}
          metalness={0.92}
          opacity={0.24}
          roughness={0.14}
          transparent
        />
      </mesh>

      <mesh position={[0.3, -0.2, -3.4]} rotation={[1.08, 0.3, 0.68]}>
        <torusGeometry args={[4.8, 0.06, 20, 180]} />
        <meshStandardMaterial
          color={SCENE_PALETTE.steelBright}
          emissive={SCENE_PALETTE.accent}
          emissiveIntensity={0.2}
          metalness={0.95}
          opacity={0.2}
          roughness={0.12}
          transparent
        />
      </mesh>

      <mesh position={[-0.4, 0.45, -7.2]} rotation={[0.82, 0.18, -0.26]}>
        <torusGeometry args={[7.2, 0.08, 20, 220]} />
        <meshStandardMaterial
          color={SCENE_PALETTE.steelBright}
          emissive={SCENE_PALETTE.accent}
          emissiveIntensity={0.18}
          metalness={0.98}
          opacity={0.16}
          roughness={0.12}
          transparent
        />
      </mesh>

      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        const radius = 3.8 + (index % 3) * 1.7;
        const height = 4.5 + (index % 4) * 0.9;

        return (
          <mesh
            key={`column-${index}`}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle * 1.3) * 1.6,
              -1.2 - (index % 5) * 1.75,
            ]}
            rotation={[Math.PI / 2, angle, 0]}
          >
            <cylinderGeometry args={[0.025, 0.025, height, 10]} />
            <meshStandardMaterial
              color={SCENE_PALETTE.steelBright}
              emissive={SCENE_PALETTE.accent}
              emissiveIntensity={0.14}
              metalness={0.82}
              opacity={0.12}
              roughness={0.18}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}

function PostEffects({
  lowPower,
  reducedMotion,
}: {
  lowPower: boolean;
  reducedMotion: boolean;
}) {
  if (lowPower || reducedMotion) {
    return null;
  }

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={0.45}
        luminanceSmoothing={0.85}
        luminanceThreshold={0.62}
        mipmapBlur
        radius={0.6}
      />
      <Vignette darkness={0.82} eskil={false} offset={0.2} />
      <ChromaticAberration offset={new Vector2(0.00015, 0.00022)} radialModulation />
    </EffectComposer>
  );
}
