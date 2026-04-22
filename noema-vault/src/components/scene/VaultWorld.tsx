"use client";
/* eslint-disable react-hooks/immutability */

import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type QualityTier = "high" | "low";

type StoryState = {
  chapter: number;
  drift: number;
};

type VaultWorldProps = {
  storyRef: MutableRefObject<StoryState>;
  reducedMotion: boolean;
  qualityTier: QualityTier;
};

type CameraKeyframe = {
  t: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
};

type ReleaseParticleDatum = {
  base: THREE.Vector3;
  direction: THREE.Vector3;
  drift: number;
};

type FragmentDatum = {
  direction: THREE.Vector3;
  rotation: THREE.Euler;
  rotationAxis: THREE.Vector3;
  scale: number;
  drift: number;
};

type RibbonDatum = {
  geometry: THREE.TubeGeometry;
  offset: THREE.Vector3;
  rotation: THREE.Euler;
};

type VaultFrameDatum = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  width: number;
  height: number;
};

type MonolithDatum = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  width: number;
  height: number;
  depth: number;
};

const clamp = THREE.MathUtils.clamp;
const tempObject = new THREE.Object3D();
const tempVectorA = new THREE.Vector3();
const tempVectorB = new THREE.Vector3();

function smoothRange(value: number, start: number, end: number) {
  const normalized = clamp((value - start) / (end - start), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function sampleKeyframes(progress: number, keyframes: CameraKeyframe[]) {
  if (progress <= keyframes[0].t) {
    return keyframes[0];
  }

  const last = keyframes[keyframes.length - 1];
  if (progress >= last.t) {
    return last;
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index];
    const next = keyframes[index + 1];

    if (progress >= current.t && progress <= next.t) {
      const local = smoothRange((progress - current.t) / (next.t - current.t), 0, 1);
      return {
        t: progress,
        position: current.position.clone().lerp(next.position, local),
        target: current.target.clone().lerp(next.target, local),
      };
    }
  }

  return last;
}

function createArchiveMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uTransform: { value: 0 },
      uVault: { value: 0 },
      uFinal: { value: 0 },
      uColorA: { value: new THREE.Color("#89c6ff") },
      uColorB: { value: new THREE.Color("#f3f7ff") },
      uAccent: { value: new THREE.Color("#d9a96a") },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uTransform;
      uniform float uVault;
      uniform float uFinal;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vPulse;

      void main() {
        vec3 transformed = position;
        float warp = sin(position.y * 5.8 + uTime * 1.05) * 0.08;
        warp += sin(position.x * 8.2 - uTime * 0.62) * 0.05;
        float split = sin((position.x + position.y) * 4.6 + uTime * 0.48) * 0.14 * uTransform;
        transformed += normal * warp * (1.0 - uVault * 0.45);
        transformed += normalize(position) * split;
        transformed += normal * uFinal * 0.16;

        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * viewPosition;

        vNormal = normalize(normalMatrix * normal);
        vWorldPosition = worldPosition.xyz;
        vPulse = warp + split;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAccent;
      uniform float uTime;
      uniform float uTransform;
      uniform float uFinal;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vPulse;

      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(viewDirection, normalize(vNormal)), 0.0), 2.3);
        float seam = sin(vWorldPosition.y * 3.1 + uTime * 0.72 + vPulse * 9.0) * 0.5 + 0.5;
        vec3 color = mix(uColorA, uColorB, fresnel * 0.82 + seam * 0.26);
        color = mix(color, uAccent, pow(seam, 6.0) * 0.22 + uFinal * 0.14 + uTransform * 0.08);
        float alpha = 0.54 + fresnel * 0.28 - uTransform * 0.08;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createRibbonMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uColorA: { value: new THREE.Color("#7ebdff") },
      uColorB: { value: new THREE.Color("#eef5ff") },
      uAccent: { value: new THREE.Color("#d9a96a") },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      varying float vBand;

      void main() {
        vUv = uv;
        vec3 transformed = position;
        transformed += normal * sin(uv.y * 16.0 + uTime * 1.7) * 0.04 * uStrength;
        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * viewPosition;
        vBand = sin(uv.y * 30.0 - uTime * 2.1) * 0.5 + 0.5;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAccent;
      uniform float uStrength;
      varying vec2 vUv;
      varying float vBand;

      void main() {
        float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
        float stream = smoothstep(0.36, 0.96, vBand);
        vec3 color = mix(uColorA, uColorB, stream);
        color = mix(color, uAccent, pow(stream, 5.0) * 0.25);
        gl_FragColor = vec4(color, edge * (0.2 + uStrength * 0.82));
      }
    `,
  });
}

function createBackgroundPoints(count: number) {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = THREE.MathUtils.randFloatSpread(28);
    positions[stride + 1] = THREE.MathUtils.randFloatSpread(18);
    positions[stride + 2] = THREE.MathUtils.randFloatSpread(52) - 12;
  }

  return positions;
}

function createReleaseParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const data: ReleaseParticleDatum[] = [];

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const base = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(0.8),
      THREE.MathUtils.randFloatSpread(0.8),
      THREE.MathUtils.randFloatSpread(0.8)
    );
    const direction = base.clone().normalize();

    if (direction.lengthSq() < 0.01) {
      direction.set(0, 1, 0);
    }

    data.push({
      base,
      direction,
      drift: Math.random(),
    });

    positions[stride] = base.x;
    positions[stride + 1] = base.y;
    positions[stride + 2] = base.z;
  }

  return { positions, data };
}

function createFragmentData(count: number): FragmentDatum[] {
  return Array.from({ length: count }, () => ({
    direction: new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1.5),
      THREE.MathUtils.randFloatSpread(1.5),
      THREE.MathUtils.randFloatSpread(1.5)
    ).normalize(),
    rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
    rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
    scale: THREE.MathUtils.randFloat(0.12, 0.34),
    drift: Math.random(),
  }));
}

function createRibbonData(count: number): RibbonDatum[] {
  return Array.from({ length: count }, (_, index) => {
    const points: THREE.Vector3[] = [];
    const angleOffset = (index / count) * Math.PI * 2;

    for (let step = 0; step < 28; step += 1) {
      const t = step / 27;
      const radius = 0.82 + Math.sin(t * Math.PI * 2 + angleOffset) * 0.22 + index * 0.05;
      const spread = 1 + t * 1.8;
      points.push(
        new THREE.Vector3(
          Math.cos(t * Math.PI * 2.5 + angleOffset) * radius * spread,
          Math.sin(t * Math.PI * 1.8 + angleOffset * 0.8) * (0.7 + t * 2.4) + Math.sin(t * Math.PI * 5) * 0.18,
          -t * 26 - index * 0.8
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(points);

    return {
      geometry: new THREE.TubeGeometry(curve, 170, 0.04 + (index % 3) * 0.008, 10, false),
      offset: new THREE.Vector3(
        Math.sin(angleOffset) * 0.5,
        Math.cos(angleOffset * 1.3) * 0.2,
        Math.sin(angleOffset * 0.7) * 0.28
      ),
      rotation: new THREE.Euler(index * 0.18, index * 0.28, index * 0.12),
    };
  });
}

function createVaultFrameData(count: number): VaultFrameDatum[] {
  return Array.from({ length: count }, (_, index) => ({
    position: new THREE.Vector3(
      Math.sin(index * 0.4) * 1.15,
      -1.2 + Math.cos(index * 0.34) * 0.28,
      -9 - index * 3.4
    ),
    rotation: new THREE.Euler(0, Math.sin(index * 0.24) * 0.22, Math.cos(index * 0.2) * 0.04),
    scale: 1 + index * 0.08,
    width: 1.55 + index * 0.07,
    height: 2.1 + index * 0.12,
  }));
}

function createMonolithData(count: number): MonolithDatum[] {
  return Array.from({ length: count }, (_, index) => ({
    position: new THREE.Vector3(
      index % 2 === 0 ? -2.6 - Math.sin(index * 0.34) * 0.5 : 2.6 + Math.cos(index * 0.28) * 0.5,
      -1.1 + (index % 3) * 0.16,
      -18 - index * 2.7
    ),
    rotation: new THREE.Euler(0, index * 0.2, 0),
    width: 0.18 + (index % 3) * 0.05,
    height: 1.3 + (index % 4) * 0.5,
    depth: 0.18 + (index % 2) * 0.06,
  }));
}

function AtmosphereDust({
  count,
  storyRef,
}: {
  count: number;
  storyRef: MutableRefObject<StoryState>;
}) {
  const fieldRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => createBackgroundPoints(count), [count]);

  useFrame((state) => {
    if (!fieldRef.current) {
      return;
    }

    const drift = storyRef.current.drift;
    fieldRef.current.rotation.y = state.clock.elapsedTime * 0.018 + drift * 0.55;
    fieldRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.05;
    fieldRef.current.position.z = -drift * 5.5;
  });

  return (
    <points ref={fieldRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#90caff"
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </points>
  );
}

function ReleaseParticles({
  count,
  qualityTier,
  storyRef,
}: {
  count: number;
  qualityTier: QualityTier;
  storyRef: MutableRefObject<StoryState>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const { data, positions } = useMemo(() => createReleaseParticles(count), [count]);

  useFrame((state) => {
    const stage = storyRef.current.chapter;
    const release = smoothRange(stage, 0.75, 2.05);
    const vault = smoothRange(stage, 1.6, 3.1);
    const settle = smoothRange(stage, 3.2, 4.2);

    if (!pointsRef.current) {
      return;
    }

    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = positionAttr.array as Float32Array;

    for (let index = 0; index < data.length; index += 1) {
      const stride = index * 3;
      const datum = data[index];
      const spread = release * (1.6 + datum.drift * 3.8) + vault * 1.8;
      const swirl = state.clock.elapsedTime * (0.4 + datum.drift * 0.8);

      array[stride] =
        datum.base.x +
        datum.direction.x * spread +
        Math.sin(swirl + datum.drift * 8) * 0.16 * (1 - settle);
      array[stride + 1] =
        datum.base.y +
        datum.direction.y * spread +
        Math.cos(swirl * 1.1 + datum.drift * 6) * 0.14 * (1 - settle);
      array[stride + 2] =
        datum.base.z +
        datum.direction.z * spread -
        vault * (qualityTier === "high" ? 12 : 8) +
        Math.sin(swirl * 0.8 + datum.drift * 9) * 0.18;
    }

    positionAttr.needsUpdate = true;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#eef5ff"
        size={qualityTier === "high" ? 0.055 : 0.045}
        sizeAttenuation
        transparent
        opacity={0.66}
        depthWrite={false}
      />
    </points>
  );
}

export function VaultWorld({
  storyRef,
  reducedMotion,
  qualityTier,
}: VaultWorldProps) {
  const camera = useThree((state) => state.camera);

  const archiveGroupRef = useRef<THREE.Group>(null);
  const fragmentMeshRef = useRef<THREE.InstancedMesh>(null);
  const ribbonGroupRef = useRef<THREE.Group>(null);
  const vaultGroupRef = useRef<THREE.Group>(null);
  const monolithGroupRef = useRef<THREE.Group>(null);
  const finaleGroupRef = useRef<THREE.Group>(null);
  const targetRef = useRef(new THREE.Vector3());
  const fogRef = useRef<THREE.Fog>(null);

  const fragmentCount = qualityTier === "high" ? 38 : 24;
  const particleCount = qualityTier === "high" ? 920 : 520;
  const dustCount = qualityTier === "high" ? 2600 : 1400;
  const ribbonCount = qualityTier === "high" ? 6 : 4;
  const vaultFrameCount = qualityTier === "high" ? 9 : 6;
  const monolithCount = qualityTier === "high" ? 8 : 5;

  const archiveMaterial = useMemo(() => createArchiveMaterial(), []);
  const ribbonMaterial = useMemo(() => createRibbonMaterial(), []);
  const shardGeometry = useMemo(() => new THREE.OctahedronGeometry(1.42, 5), []);
  const shellGeometry = useMemo(() => new THREE.OctahedronGeometry(1.74, 2), []);
  const wireGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.95, 0), []);
  const innerRingGeometry = useMemo(() => new THREE.TorusGeometry(1.3, 0.018, 12, 72), []);
  const finalCoreGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.1, 4), []);
  const fragmentData = useMemo(() => createFragmentData(fragmentCount), [fragmentCount]);
  const ribbonData = useMemo(() => createRibbonData(ribbonCount), [ribbonCount]);
  const vaultFrames = useMemo(() => createVaultFrameData(vaultFrameCount), [vaultFrameCount]);
  const monolithData = useMemo(() => createMonolithData(monolithCount), [monolithCount]);

  const cameraKeyframes = useMemo<CameraKeyframe[]>(
    () => [
      {
        t: 0,
        position: new THREE.Vector3(0, 0.3, 8.8),
        target: new THREE.Vector3(0, 0, 0),
      },
      {
        t: 1,
        position: new THREE.Vector3(-1.1, 0.95, 5.9),
        target: new THREE.Vector3(0, 0, 0),
      },
      {
        t: 2,
        position: new THREE.Vector3(0.75, 0.55, 4.1),
        target: new THREE.Vector3(0, 0, -7),
      },
      {
        t: 3,
        position: new THREE.Vector3(-0.9, 0.78, 0.4),
        target: new THREE.Vector3(0, 0, -16),
      },
      {
        t: 4,
        position: new THREE.Vector3(1.05, 0.9, -4.8),
        target: new THREE.Vector3(0.1, 0, -25),
      },
      {
        t: 5,
        position: new THREE.Vector3(0, 1.15, -10.6),
        target: new THREE.Vector3(0, 0.1, -34),
      },
    ],
    []
  );

  useEffect(() => {
    return () => {
      archiveMaterial.dispose();
      ribbonMaterial.dispose();
      shardGeometry.dispose();
      shellGeometry.dispose();
      wireGeometry.dispose();
      innerRingGeometry.dispose();
      finalCoreGeometry.dispose();
      ribbonData.forEach((item) => item.geometry.dispose());
    };
  }, [archiveMaterial, finalCoreGeometry, innerRingGeometry, ribbonData, ribbonMaterial, shardGeometry, shellGeometry, wireGeometry]);

  useFrame((state, delta) => {
    const rawStage = clamp(storyRef.current.chapter, 0, 5);
    const drift = storyRef.current.drift;
    const stage = reducedMotion ? Math.round(rawStage * 2) / 2 : rawStage;

    const transformPhase = smoothRange(stage, 0.08, 1.18);
    const releasePhase = smoothRange(stage, 0.75, 2.05);
    const vaultPhase = smoothRange(stage, 1.6, 3.15);
    const capabilityPhase = smoothRange(stage, 2.45, 3.75);
    const proofPhase = smoothRange(stage, 3.25, 4.55);
    const finalPhase = smoothRange(stage, 4.12, 5);
    const archiveFade = smoothRange(stage, 1.9, 3);

    const shot = sampleKeyframes(stage, cameraKeyframes);
    tempVectorA.copy(shot.position);
    tempVectorA.x += Math.sin(state.clock.elapsedTime * 0.2 + drift * 3.8) * 0.14 * (1 - finalPhase * 0.7);
    tempVectorA.y += reducedMotion ? 0 : Math.cos(state.clock.elapsedTime * 0.24 + drift * 2.8) * 0.08 * (1 - proofPhase * 0.55);
    camera.position.lerp(tempVectorA, 1 - Math.exp(-delta * 2.6));

    tempVectorB.copy(shot.target);
    tempVectorB.y += reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.18) * 0.05 * (1 - finalPhase);
    targetRef.current.lerp(tempVectorB, 1 - Math.exp(-delta * 2.8));
    camera.lookAt(targetRef.current);

    if (fogRef.current) {
      fogRef.current.near = THREE.MathUtils.lerp(8.5, 5.8, vaultPhase);
      fogRef.current.far = THREE.MathUtils.lerp(42, 25, finalPhase);
    }

    archiveMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    archiveMaterial.uniforms.uTransform.value = transformPhase;
    archiveMaterial.uniforms.uVault.value = vaultPhase;
    archiveMaterial.uniforms.uFinal.value = finalPhase;

    ribbonMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    ribbonMaterial.uniforms.uStrength.value = Math.max(releasePhase, capabilityPhase * 0.8, finalPhase * 0.5);

    if (archiveGroupRef.current) {
      archiveGroupRef.current.visible = finalPhase < 0.99;
      archiveGroupRef.current.rotation.y += delta * (0.16 + transformPhase * 0.1) * (1 - archiveFade * 0.82);
      archiveGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
      archiveGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.38) * 0.12 * (1 - archiveFade);
      archiveGroupRef.current.position.z = -releasePhase * 1.25 - vaultPhase * 1.05;
      archiveGroupRef.current.scale.setScalar(1 + transformPhase * 0.08 - releasePhase * 0.12 - archiveFade * 0.24);
    }

    if (fragmentMeshRef.current) {
      const fade = Math.max(0, 1 - vaultPhase * 0.78 - finalPhase * 0.2);

      fragmentData.forEach((datum, index) => {
        const distance = releasePhase * (1.8 + datum.drift * 4) + vaultPhase * 1.3;
        tempObject.position.copy(datum.direction).multiplyScalar(distance);
        tempObject.position.z -= vaultPhase * 6.5;
        tempObject.position.x += Math.sin(state.clock.elapsedTime * (0.8 + datum.drift) + index) * 0.16 * fade;
        tempObject.position.y += Math.cos(state.clock.elapsedTime * (1.1 + datum.drift) + index) * 0.16 * fade;
        tempObject.rotation.copy(datum.rotation);
        tempObject.rotateOnAxis(datum.rotationAxis, state.clock.elapsedTime * (0.28 + datum.drift * 0.7) + releasePhase * 2.1);
        tempObject.scale.setScalar(Math.max(0.001, datum.scale * (0.08 + releasePhase * 1.32) * fade));
        tempObject.updateMatrix();
        fragmentMeshRef.current?.setMatrixAt(index, tempObject.matrix);
      });

      fragmentMeshRef.current.instanceMatrix.needsUpdate = true;
      fragmentMeshRef.current.visible = releasePhase > 0.02 && finalPhase < 0.98;
    }

    if (ribbonGroupRef.current) {
      ribbonGroupRef.current.visible = releasePhase > 0.02 || vaultPhase > 0.02;
      ribbonGroupRef.current.rotation.y = state.clock.elapsedTime * 0.08 + vaultPhase * 0.9;
      ribbonGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
      ribbonGroupRef.current.position.z = -vaultPhase * 4.2;
      ribbonGroupRef.current.scale.setScalar(0.35 + releasePhase * 0.55 + vaultPhase * 0.32 + finalPhase * 0.12);
    }

    if (vaultGroupRef.current) {
      vaultGroupRef.current.visible = vaultPhase > 0.01 || finalPhase > 0.01;
      vaultGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.08 + capabilityPhase * 0.06;
      vaultGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.18 + drift * 3) * 0.16;
      vaultGroupRef.current.scale.setScalar(0.72 + vaultPhase * 0.34 + finalPhase * 0.18);
    }

    if (monolithGroupRef.current) {
      monolithGroupRef.current.visible = proofPhase > 0.01 || finalPhase > 0.01;
      monolithGroupRef.current.rotation.y = -0.12 + proofPhase * 0.32;
      monolithGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.1;
      monolithGroupRef.current.scale.setScalar(0.86 + proofPhase * 0.18);
    }

    if (finaleGroupRef.current) {
      finaleGroupRef.current.visible = finalPhase > 0.01;
      finaleGroupRef.current.rotation.y = state.clock.elapsedTime * 0.08 + finalPhase * 0.9;
      finaleGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.32) * 0.18;
      finaleGroupRef.current.scale.setScalar(0.74 + finalPhase * 0.6);
    }
  });

  return (
    <>
      <color attach="background" args={["#040609"]} />
      <fog ref={fogRef} attach="fog" args={["#040609", 8.5, 42]} />
      <ambientLight intensity={0.16} />
      <hemisphereLight args={["#afcbff", "#030405", 0.36]} position={[0, 8, 0]} />
      <directionalLight color="#eef5ff" intensity={1.1} position={[4, 5, 6]} />
      <pointLight color="#8cc4ff" distance={24} intensity={1.9} position={[0, 2.2, 4.5]} />
      <pointLight color="#d9a96a" distance={16} intensity={0.72} position={[2.6, 1.2, 2.4]} />
      <pointLight color="#dce7ff" distance={30} intensity={1.15} position={[0, 1.6, -34]} />

      <AtmosphereDust count={dustCount} storyRef={storyRef} />
      <ReleaseParticles count={particleCount} qualityTier={qualityTier} storyRef={storyRef} />

      <group ref={archiveGroupRef}>
        <mesh geometry={shardGeometry} material={archiveMaterial} />

        <mesh geometry={shellGeometry} rotation={[0.22, 0.5, 0]}>
          <MeshTransmissionMaterial
            anisotropy={0.26}
            attenuationColor="#58769a"
            attenuationDistance={2.4}
            backside
            chromaticAberration={0.06}
            color="#eef5ff"
            distortion={0.08}
            distortionScale={0.16}
            ior={1.22}
            roughness={0.12}
            thickness={0.52}
            transmission={0.92}
          />
        </mesh>

        <mesh geometry={innerRingGeometry} rotation={[0.44, 0.12, 0.62]}>
          <meshBasicMaterial color="#eef5ff" transparent opacity={0.1} />
        </mesh>

        <mesh rotation={[1.18, 0.36, 0.12]}>
          <torusGeometry args={[1.98, 0.04, 16, 90, Math.PI * 1.68]} />
          <meshBasicMaterial color="#d9a96a" transparent opacity={0.18} />
        </mesh>

        <mesh geometry={wireGeometry} rotation={[0.16, 0.48, 0.28]}>
          <meshBasicMaterial color="#dbeeff" wireframe transparent opacity={0.08} />
        </mesh>
      </group>

      <instancedMesh ref={fragmentMeshRef} args={[undefined, undefined, fragmentCount]}>
        <tetrahedronGeometry args={[0.25, 0]} />
        <meshPhysicalMaterial
          color="#dbeeff"
          emissive="#83c5ff"
          emissiveIntensity={0.38}
          metalness={0.18}
          opacity={0.92}
          roughness={0.14}
          thickness={0.24}
          transmission={0.82}
          transparent
        />
      </instancedMesh>

      <group ref={ribbonGroupRef}>
        {ribbonData.map((ribbon, index) => (
          <mesh
            geometry={ribbon.geometry}
            key={index}
            material={ribbonMaterial}
            position={ribbon.offset}
            rotation={ribbon.rotation}
          />
        ))}
      </group>

      <group ref={vaultGroupRef}>
        {vaultFrames.map((frame, index) => (
          <group key={index} position={frame.position} rotation={frame.rotation} scale={frame.scale}>
            <mesh position={[-frame.width, frame.height / 2, 0]}>
              <boxGeometry args={[0.08, frame.height, 0.16]} />
              <meshStandardMaterial color="#9eb9d7" emissive="#6a95c7" emissiveIntensity={0.22} metalness={0.82} roughness={0.34} />
            </mesh>

            <mesh position={[frame.width, frame.height / 2, 0]}>
              <boxGeometry args={[0.08, frame.height, 0.16]} />
              <meshStandardMaterial color="#9eb9d7" emissive="#6a95c7" emissiveIntensity={0.22} metalness={0.82} roughness={0.34} />
            </mesh>

            <mesh position={[0, frame.height, 0]}>
              <torusGeometry args={[frame.width, 0.06, 16, 90, Math.PI]} />
              <meshStandardMaterial color="#bfdcff" emissive="#7fbaff" emissiveIntensity={0.3} metalness={0.78} roughness={0.24} />
            </mesh>

            <mesh position={[0, frame.height * 0.66, 0.04]}>
              <torusGeometry args={[frame.width * 0.72, 0.018, 12, 72, Math.PI]} />
              <meshBasicMaterial color="#eef5ff" transparent opacity={0.16} />
            </mesh>

            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[frame.width * 1.5, 0.02, 0.05]} />
              <meshBasicMaterial color="#8cc4ff" transparent opacity={0.12} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={monolithGroupRef}>
        {monolithData.map((monolith, index) => (
          <group key={index} position={monolith.position} rotation={monolith.rotation}>
            <mesh position={[0, monolith.height / 2, 0]}>
              <boxGeometry args={[monolith.width, monolith.height, monolith.depth]} />
              <meshStandardMaterial color="#dde9f6" emissive="#89c6ff" emissiveIntensity={0.32} metalness={0.88} roughness={0.18} />
            </mesh>

            <mesh position={[0, monolith.height + 0.18, 0]}>
              <sphereGeometry args={[monolith.width * 0.65, 18, 18]} />
              <meshBasicMaterial color="#d9a96a" transparent opacity={0.28} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={finaleGroupRef} position={[0, -1.1, -34]}>
        <mesh position={[0, 2.35, 0]}>
          <torusGeometry args={[3.8, 0.055, 18, 140, Math.PI]} />
          <meshStandardMaterial color="#dceaff" emissive="#88c1ff" emissiveIntensity={0.44} metalness={0.84} roughness={0.22} />
        </mesh>

        <mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[2.8, 0.045, 18, 120, Math.PI]} />
          <meshStandardMaterial color="#dceaff" emissive="#88c1ff" emissiveIntensity={0.28} metalness={0.8} roughness={0.24} />
        </mesh>

        <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.2, 0.05, 20, 150]} />
          <meshBasicMaterial color="#d9a96a" transparent opacity={0.18} />
        </mesh>

        <mesh position={[0, 1.2, 0]}>
          <primitive attach="geometry" object={finalCoreGeometry} />
          <meshPhysicalMaterial
            color="#f2f7ff"
            emissive="#8ec7ff"
            emissiveIntensity={0.34}
            metalness={0.18}
            opacity={0.92}
            roughness={0.08}
            thickness={0.6}
            transmission={0.88}
            transparent
          />
        </mesh>

        <mesh position={[0, 1.2, 0]} scale={1.55}>
          <primitive attach="geometry" object={wireGeometry} />
          <meshBasicMaterial color="#edf5ff" transparent opacity={0.08} wireframe />
        </mesh>

        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 2.7, 1.25, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2.9, 10]} />
            <meshStandardMaterial color="#a9bed7" emissive="#7fb6f0" emissiveIntensity={0.22} metalness={0.8} roughness={0.26} />
          </mesh>
        ))}
      </group>
    </>
  );
}
