"use client";
/* eslint-disable react-hooks/immutability */

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

type QualityTier = "high" | "low";

type SignalWorldProps = {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
  qualityTier: QualityTier;
};

type CameraKeyframe = {
  t: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
};

type BurstParticleDatum = {
  base: THREE.Vector3;
  direction: THREE.Vector3;
  drift: number;
};

const tempObject = new THREE.Object3D();
const tempVectorA = new THREE.Vector3();
const tempVectorB = new THREE.Vector3();

const clamp = THREE.MathUtils.clamp;

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

function createCrystalMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uFracture: { value: 0 },
      uFilaments: { value: 0 },
      uFinale: { value: 0 },
      uColorA: { value: new THREE.Color("#6fb4ff") },
      uColorB: { value: new THREE.Color("#ddefff") },
      uAccent: { value: new THREE.Color("#d28f52") },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uFracture;
      uniform float uFilaments;
      uniform float uFinale;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vPulse;

      void main() {
        vec3 transformed = position;
        float warp = sin(position.y * 5.0 + uTime * 1.1) * 0.08;
        warp += sin(position.x * 7.0 - uTime * 0.7) * 0.06;
        transformed += normal * warp * (1.0 - uFracture * 0.58);
        transformed += normal * uFilaments * 0.12;
        transformed += normal * uFinale * 0.22;

        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * viewPosition;

        vNormal = normalize(normalMatrix * normal);
        vWorldPosition = worldPosition.xyz;
        vPulse = warp;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAccent;
      uniform float uTime;
      uniform float uFracture;
      uniform float uFinale;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vPulse;

      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(viewDirection, normalize(vNormal)), 0.0), 2.4);
        float glint = sin(vWorldPosition.y * 3.4 + uTime * 0.9 + vPulse * 8.0) * 0.5 + 0.5;
        vec3 color = mix(uColorA, uColorB, fresnel * 0.9 + glint * 0.28);
        color = mix(color, uAccent, pow(glint, 7.0) * 0.35 + uFinale * 0.18);
        float alpha = 0.5 + fresnel * 0.3 - uFracture * 0.16;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createFilamentMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uColorA: { value: new THREE.Color("#6fb4ff") },
      uColorB: { value: new THREE.Color("#eaf4ff") },
      uAccent: { value: new THREE.Color("#d28f52") },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      varying float vBand;

      void main() {
        vUv = uv;
        vec3 transformed = position;
        transformed += normal * sin(uv.y * 14.0 + uTime * 1.8) * 0.05 * uStrength;
        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * viewPosition;
        vBand = sin(uv.y * 28.0 - uTime * 2.2) * 0.5 + 0.5;
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
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float stream = smoothstep(0.38, 0.95, vBand);
        vec3 color = mix(uColorA, uColorB, stream);
        color = mix(color, uAccent, pow(stream, 5.0) * 0.28);
        gl_FragColor = vec4(color, edge * (0.28 + uStrength * 0.78));
      }
    `,
  });
}

function createBackgroundPoints(count: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = THREE.MathUtils.randFloatSpread(26);
    positions[stride + 1] = THREE.MathUtils.randFloatSpread(18);
    positions[stride + 2] = THREE.MathUtils.randFloatSpread(42) - 10;
  }
  return positions;
}

function createBurstParticles(count: number) {
  const basePositions = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const data: BurstParticleDatum[] = [];

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const base = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(0.9),
      THREE.MathUtils.randFloatSpread(0.9),
      THREE.MathUtils.randFloatSpread(0.9)
    );
    const direction = base.clone().normalize();
    if (direction.lengthSq() < 0.01) {
      direction.set(0, 1, 0);
    }

    const datum = {
      base,
      direction,
      drift: Math.random(),
    };

    data.push(datum);
    basePositions[stride] = base.x;
    basePositions[stride + 1] = base.y;
    basePositions[stride + 2] = base.z;
    positions[stride] = base.x;
    positions[stride + 1] = base.y;
    positions[stride + 2] = base.z;
  }

  return { basePositions, positions, data };
}

function createShardData(count: number) {
  return Array.from({ length: count }, () => {
    const direction = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1.4),
      THREE.MathUtils.randFloatSpread(1.4),
      THREE.MathUtils.randFloatSpread(1.4)
    ).normalize();

    return {
      direction,
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      scale: THREE.MathUtils.randFloat(0.14, 0.42),
      drift: Math.random(),
    };
  });
}

function createFilamentData(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const points: THREE.Vector3[] = [];
    const angleOffset = (index / count) * Math.PI * 2;

    for (let step = 0; step < 26; step += 1) {
      const t = step / 25;
      const radius = 0.85 + Math.sin(t * Math.PI * 2 + angleOffset) * 0.28 + index * 0.05;
      const spread = 1.1 + t * 2.8;
      points.push(
        new THREE.Vector3(
          Math.cos(t * Math.PI * 3.4 + angleOffset) * radius * spread,
          Math.sin(t * Math.PI * 2.6 + angleOffset) * (0.9 + t * 1.8),
          -t * 18 - index * 0.65
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(points);

    return {
      geometry: new THREE.TubeGeometry(curve, 160, 0.045 + (index % 3) * 0.008, 10, false),
      offset: new THREE.Vector3(
        Math.sin(angleOffset) * 0.4,
        Math.cos(angleOffset * 1.4) * 0.25,
        Math.sin(angleOffset * 0.8) * 0.35
      ),
      rotation: new THREE.Euler(index * 0.2, index * 0.34, index * 0.12),
      speed: THREE.MathUtils.randFloat(0.4, 1.05),
    };
  });
}

function createCorridorData(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    position: new THREE.Vector3(
      Math.sin(index * 0.46) * 1.25,
      Math.cos(index * 0.38) * 0.68,
      -7 - index * 2.1
    ),
    rotation: new THREE.Euler(index * 0.14, index * 0.28, index * 0.22),
    scale: 1 + index * 0.085,
  }));
}

function OrbitingDust({
  count,
  progressRef,
}: {
  count: number;
  progressRef: MutableRefObject<number>;
}) {
  const fieldRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => createBackgroundPoints(count), [count]);

  useFrame((state) => {
    if (!fieldRef.current) {
      return;
    }

    const progress = progressRef.current;
    fieldRef.current.rotation.y = state.clock.elapsedTime * 0.02 + progress * 0.5;
    fieldRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.06;
    fieldRef.current.position.z = -progress * 6;
  });

  return (
    <points ref={fieldRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#89c2ff"
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.26}
        depthWrite={false}
      />
    </points>
  );
}

function BurstParticles({
  count,
  progressRef,
  qualityTier,
}: {
  count: number;
  progressRef: MutableRefObject<number>;
  qualityTier: QualityTier;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, data } = useMemo(() => createBurstParticles(count), [count]);

  useFrame((state) => {
    const progress = progressRef.current;
    const burst = smoothRange(progress, 0.16, 0.42);
    const travel = smoothRange(progress, 0.32, 0.84);
    const settle = smoothRange(progress, 0.72, 1);

    if (!pointsRef.current) {
      return;
    }

    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = positionAttr.array as Float32Array;

    for (let index = 0; index < data.length; index += 1) {
      const stride = index * 3;
      const datum = data[index];
      const spread = burst * (1.8 + datum.drift * 3.8) + travel * 2.1;
      const swirl = state.clock.elapsedTime * (0.4 + datum.drift * 0.7);
      array[stride] =
        datum.base.x +
        datum.direction.x * spread +
        Math.sin(swirl + datum.drift * 9) * 0.16 * (1 - settle);
      array[stride + 1] =
        datum.base.y +
        datum.direction.y * spread +
        Math.cos(swirl * 1.2 + datum.drift * 6) * 0.16 * (1 - settle);
      array[stride + 2] =
        datum.base.z +
        datum.direction.z * spread -
        travel * (qualityTier === "high" ? 10 : 7) +
        Math.sin(swirl * 0.8 + datum.drift * 10) * 0.18;
    }

    positionAttr.needsUpdate = true;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#dfefff"
        size={qualityTier === "high" ? 0.06 : 0.05}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

export function SignalWorld({
  progressRef,
  reducedMotion,
  qualityTier,
}: SignalWorldProps) {
  const camera = useThree((state) => state.camera);

  const coreGroupRef = useRef<THREE.Group>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const filamentGroupRef = useRef<THREE.Group>(null);
  const shardMeshRef = useRef<THREE.InstancedMesh>(null);
  const environmentGroupRef = useRef<THREE.Group>(null);
  const finalGroupRef = useRef<THREE.Group>(null);
  const targetRef = useRef(new THREE.Vector3());
  const fogRef = useRef<THREE.Fog>(null);

  const shardCount = qualityTier === "high" ? 44 : 28;
  const particleCount = qualityTier === "high" ? 950 : 520;
  const dustCount = qualityTier === "high" ? 2600 : 1300;
  const filamentCount = qualityTier === "high" ? 7 : 5;
  const corridorCount = qualityTier === "high" ? 8 : 6;

  const crystalMaterial = useMemo(() => createCrystalMaterial(), []);
  const filamentMaterial = useMemo(() => createFilamentMaterial(), []);
  const coreGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.52, 7), []);
  const shellGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.7, 2), []);
  const wireGeometry = useMemo(() => new THREE.IcosahedronGeometry(2.02, 0), []);
  const finalGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.15, 5), []);
  const shardData = useMemo(() => createShardData(shardCount), [shardCount]);
  const filamentData = useMemo(() => createFilamentData(filamentCount), [filamentCount]);
  const corridorData = useMemo(() => createCorridorData(corridorCount), [corridorCount]);

  const cameraKeyframes = useMemo<CameraKeyframe[]>(
    () => [
      {
        t: 0,
        position: new THREE.Vector3(0, 0.35, 8.4),
        target: new THREE.Vector3(0, 0, 0),
      },
      {
        t: 0.22,
        position: new THREE.Vector3(-1.5, 0.8, 6.2),
        target: new THREE.Vector3(0, -0.1, 0),
      },
      {
        t: 0.46,
        position: new THREE.Vector3(1.9, 0.35, 8.8),
        target: new THREE.Vector3(0, 0, -2.2),
      },
      {
        t: 0.68,
        position: new THREE.Vector3(-0.8, 1.15, 4.8),
        target: new THREE.Vector3(0, 0.25, -12),
      },
      {
        t: 0.86,
        position: new THREE.Vector3(0.55, 0.5, 1.2),
        target: new THREE.Vector3(0, 0, -19),
      },
      {
        t: 1,
        position: new THREE.Vector3(0, 0.7, -1.8),
        target: new THREE.Vector3(0, 0, -20),
      },
    ],
    []
  );

  useEffect(() => {
    return () => {
      crystalMaterial.dispose();
      filamentMaterial.dispose();
      coreGeometry.dispose();
      shellGeometry.dispose();
      wireGeometry.dispose();
      finalGeometry.dispose();
      filamentData.forEach((item) => item.geometry.dispose());
    };
  }, [coreGeometry, crystalMaterial, filamentData, filamentMaterial, finalGeometry, shellGeometry, wireGeometry]);

  useFrame((state, delta) => {
    const rawProgress = progressRef.current;
    const progress = reducedMotion ? Math.round(rawProgress * 5) / 5 : rawProgress;

    const reveal = smoothRange(progress, 0, 0.18);
    const fracture = smoothRange(progress, 0.18, 0.42);
    const filamentPhase = smoothRange(progress, 0.32, 0.7);
    const environmentPhase = smoothRange(progress, 0.55, 0.86);
    const finalPhase = smoothRange(progress, 0.78, 1);

    const shot = sampleKeyframes(progress, cameraKeyframes);
    const wobble = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.32) * 0.08;
    tempVectorA.copy(shot.position);
    tempVectorA.x += Math.sin(state.clock.elapsedTime * 0.24) * 0.08 * (1 - finalPhase);
    tempVectorA.y += wobble;
    camera.position.lerp(tempVectorA, 1 - Math.exp(-delta * 2.4));

    tempVectorB.copy(shot.target);
    tempVectorB.y += Math.cos(state.clock.elapsedTime * 0.3) * 0.04 * (1 - environmentPhase);
    targetRef.current.lerp(tempVectorB, 1 - Math.exp(-delta * 2.8));
    camera.lookAt(targetRef.current);

    if (fogRef.current) {
      fogRef.current.near = THREE.MathUtils.lerp(8, 6, environmentPhase);
      fogRef.current.far = THREE.MathUtils.lerp(32, 23, finalPhase);
    }

    if (coreGroupRef.current) {
      coreGroupRef.current.rotation.y += delta * (0.24 + reveal * 0.08) * (1 - environmentPhase * 0.8);
      coreGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.16;
      coreGroupRef.current.position.z = -fracture * 1.1;
      coreGroupRef.current.scale.setScalar(1 + reveal * 0.08 - fracture * 0.1 - environmentPhase * 0.2);
    }

    crystalMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    crystalMaterial.uniforms.uFracture.value = fracture;
    crystalMaterial.uniforms.uFilaments.value = filamentPhase;
    crystalMaterial.uniforms.uFinale.value = finalPhase;

    if (crystalRef.current) {
      crystalRef.current.visible = finalPhase < 0.98;
    }

    if (shardMeshRef.current) {
      const fade = 1 - environmentPhase * 0.82;
      shardData.forEach((datum, index) => {
        const distance = fracture * (2.3 + datum.drift * 3.6) + filamentPhase * 1.4;
        tempObject.position.copy(datum.direction).multiplyScalar(distance);
        tempObject.position.z -= filamentPhase * 4.6;
        tempObject.position.x += Math.sin(state.clock.elapsedTime * (0.8 + datum.drift) + index) * 0.12 * fade;
        tempObject.position.y += Math.cos(state.clock.elapsedTime * (1.1 + datum.drift) + index) * 0.12 * fade;
        tempObject.rotation.copy(datum.rotation);
        tempObject.rotateOnAxis(datum.rotationAxis, state.clock.elapsedTime * (0.3 + datum.drift * 0.7) + fracture * 2.1);
        tempObject.scale.setScalar(Math.max(0.001, datum.scale * (fracture * 1.4 + 0.05) * fade));
        tempObject.updateMatrix();
        shardMeshRef.current?.setMatrixAt(index, tempObject.matrix);
      });
      shardMeshRef.current.instanceMatrix.needsUpdate = true;
      shardMeshRef.current.visible = fracture > 0.02 && environmentPhase < 0.95;
    }

    if (filamentGroupRef.current) {
      filamentGroupRef.current.visible = filamentPhase > 0.01 || environmentPhase > 0.01;
      filamentGroupRef.current.rotation.y = state.clock.elapsedTime * 0.08 + filamentPhase * 1.4;
      filamentGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
      filamentGroupRef.current.scale.setScalar(0.45 + filamentPhase * 0.82 + finalPhase * 0.14);
    }

    filamentMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    filamentMaterial.uniforms.uStrength.value = Math.max(filamentPhase, environmentPhase * 0.8);

    if (environmentGroupRef.current) {
      environmentGroupRef.current.visible = environmentPhase > 0.01 || finalPhase > 0.01;
      environmentGroupRef.current.rotation.y = 0.14 + Math.sin(state.clock.elapsedTime * 0.1) * 0.04;
      environmentGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.22;
      environmentGroupRef.current.scale.setScalar(0.65 + environmentPhase * 0.45);
    }

    if (finalGroupRef.current) {
      finalGroupRef.current.visible = finalPhase > 0.01;
      finalGroupRef.current.rotation.y = state.clock.elapsedTime * 0.1 + finalPhase * 0.6;
      finalGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.42) * 0.18;
      finalGroupRef.current.scale.setScalar(0.85 + finalPhase * 0.45);
    }
  });

  return (
    <>
      <color attach="background" args={["#03060a"]} />
      <fog ref={fogRef} attach="fog" args={["#02050a", 8, 32]} />
      <ambientLight intensity={0.14} />
      <directionalLight position={[4, 5, 6]} intensity={1.2} color="#dceeff" />
      <pointLight position={[-4, -2, 5]} intensity={2.3} color="#67b7ff" distance={24} />
      <pointLight position={[2.8, 1.2, 3.2]} intensity={0.65} color="#d28f52" distance={14} />
      <pointLight position={[0, 0, -18]} intensity={1.2} color="#dceeff" distance={20} />

      <OrbitingDust count={dustCount} progressRef={progressRef} />
      <BurstParticles count={particleCount} progressRef={progressRef} qualityTier={qualityTier} />

      <group ref={coreGroupRef} position={[0, 0, 0]}>
        <mesh ref={crystalRef} geometry={coreGeometry} material={crystalMaterial} />

        <mesh geometry={shellGeometry} rotation={[0.2, 0.5, 0]}>
          <MeshTransmissionMaterial
            thickness={0.4}
            roughness={0.16}
            chromaticAberration={0.08}
            anisotropy={0.26}
            ior={1.22}
            transmission={0.92}
            distortion={0.1}
            distortionScale={0.14}
            color="#dceeff"
            attenuationColor="#5d8ec6"
            attenuationDistance={1.8}
            backside
          />
        </mesh>

        <mesh geometry={wireGeometry} rotation={[0.1, 0.4, 0.2]}>
          <meshBasicMaterial color="#7dc0ff" wireframe transparent opacity={0.08} />
        </mesh>
      </group>

      <instancedMesh ref={shardMeshRef} args={[undefined, undefined, shardCount]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshPhysicalMaterial
          color="#cfe8ff"
          emissive="#7cc0ff"
          emissiveIntensity={0.4}
          roughness={0.16}
          metalness={0.24}
          transmission={0.86}
          thickness={0.28}
          transparent
          opacity={0.92}
        />
      </instancedMesh>

      <group ref={filamentGroupRef}>
        {filamentData.map((filament, index) => (
          <mesh
            geometry={filament.geometry}
            material={filamentMaterial}
            position={filament.offset}
            rotation={filament.rotation}
            key={index}
          />
        ))}
      </group>

      <group ref={environmentGroupRef}>
        {corridorData.map((frame, index) => (
          <group key={index} position={frame.position} rotation={frame.rotation} scale={frame.scale}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2.2, 0.05, 20, 80]} />
              <meshStandardMaterial
                color="#99ccff"
                emissive="#6aa8ea"
                emissiveIntensity={0.38}
                roughness={0.3}
                metalness={0.7}
                transparent
                opacity={0.36}
              />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[1.3, 0.028, 18, 64]} />
              <meshBasicMaterial color="#e4f1ff" transparent opacity={0.18} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={finalGroupRef} position={[0, 0, -20]}>
        <mesh rotation={[0.3, 0.2, 0]}>
          <torusKnotGeometry args={[2.05, 0.18, 240, 24, 3, 7]} />
          <meshStandardMaterial
            color="#d9ecff"
            emissive="#70b5ff"
            emissiveIntensity={0.56}
            roughness={0.24}
            metalness={0.82}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.15, 0.065, 24, 160]} />
          <meshBasicMaterial color="#d28f52" transparent opacity={0.22} />
        </mesh>
        <mesh>
          <primitive attach="geometry" object={finalGeometry} />
          <meshPhysicalMaterial
            color="#ebf5ff"
            emissive="#84c4ff"
            emissiveIntensity={0.35}
            roughness={0.1}
            metalness={0.18}
            transmission={0.84}
            thickness={0.6}
            transparent
            opacity={0.92}
          />
        </mesh>
      </group>
    </>
  );
}
