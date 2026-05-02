import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  CelestialBody,
  ShockwaveShell,
  SimulationParticle,
  Vector3D,
  add,
  normalize,
  scale,
  subtract,
  vec,
} from "../lib/physics/NBodyEngine";
import { PredictionResult } from "../lib/physics/PredictionEngine";
import {
  getAccretionDiskTexture,
  getAsteroidTexture,
  getDeepSpaceTexture,
  getGalaxySpriteTexture,
  getMilkyWayTexture,
  getNebulaTexture,
  getParticleTexture,
  getPlanetTexture,
  getStarHaloTexture,
  starColorFromTemperature,
} from "../lib/visuals/SpaceTextures";
import { CameraMode, VisualizationToggles, useSimulationStore } from "../store/useSimulationStore";

export function GalaxyScene() {
  const bodies = useSimulationStore((state) => state.bodies);
  const particles = useSimulationStore((state) => state.particles);
  const shells = useSimulationStore((state) => state.shells);
  const selectedId = useSimulationStore((state) => state.selectedId);
  const prediction = useSimulationStore((state) => state.prediction);
  const visualization = useSimulationStore((state) => state.visualization);
  const cameraMode = useSimulationStore((state) => state.cameraMode);
  const tick = useSimulationStore((state) => state.tick);
  const setSelectedId = useSimulationStore((state) => state.setSelectedId);
  const selectedBody = bodies.find((body) => body.id === selectedId);
  const smallBodies = bodies.filter(
    (body) => (body.type === "asteroid" || body.type === "dust") && body.id !== selectedId,
  );
  const featuredBodies = bodies.filter(
    (body) => !(body.type === "asteroid" || body.type === "dust") || body.id === selectedId,
  );

  return (
    <Canvas
      className="galaxy-canvas"
      camera={{ position: [0, 16, 28], fov: 47, near: 0.001, far: 12000 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
      }}
      onPointerMissed={() => setSelectedId(undefined)}
    >
      <color attach="background" args={["#00020a"]} />
      <fog attach="fog" args={["#020617", 140, 720]} />
      <ambientLight intensity={0.24} />
      <hemisphereLight args={["#b9d8ff", "#02040a", 0.34]} />
      <SimulationTicker tick={tick} />
      <CameraRig selectedBody={selectedBody} mode={cameraMode} />
      <CosmicBackdrop />
      <Stars radius={1200} depth={420} count={11500} factor={6.2} fade speed={0.12} />
      {visualization.simulationGrid ? <SimulationGrid /> : null}
      {visualization.gravityField ? <GravityField bodies={bodies} /> : null}
      {visualization.habitableZone ? <HabitableZones bodies={bodies} /> : null}
      <AsteroidBeltVisual bodies={bodies} />
      <ParticleCloud particles={particles} />
      <ShockwaveShells shells={shells} />
      <InstancedSmallBodies bodies={smallBodies} onSelect={setSelectedId} />
      {featuredBodies.map((body) => (
        <BodyMesh
          key={body.id}
          body={body}
          isSelected={body.id === selectedId}
          visualization={visualization}
          onSelect={setSelectedId}
        />
      ))}
      {visualization.predictionPaths && prediction?.trajectory.length ? (
        <TrajectoryLine
          points={prediction.trajectory}
          color={prediction.status === "stable" ? "#8ffcff" : "#ff6f8b"}
          dashed
          opacity={0.9}
        />
      ) : null}
      {visualization.velocityVectors ? <VelocityVectors bodies={bodies} selectedId={selectedId} /> : null}
      {visualization.collisionRisk && prediction ? <RiskMarker prediction={prediction} /> : null}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={1.06} luminanceThreshold={0.16} luminanceSmoothing={0.28} mipmapBlur />
        <Vignette offset={0.18} darkness={0.72} />
      </EffectComposer>
      <OrbitControls makeDefault enableDamping dampingFactor={0.07} minDistance={0.2} maxDistance={240} />
    </Canvas>
  );
}

function SimulationTicker({ tick }: { tick: (deltaSeconds: number) => void }) {
  useFrame((_, delta) => tick(delta));
  return null;
}

function CameraRig({ selectedBody, mode }: { selectedBody?: CelestialBody; mode: CameraMode }) {
  const { camera, controls } = useThree();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    if (!selectedBody || mode === "orbit" || mode === "free") return;

    const target = new THREE.Vector3(
      selectedBody.position.x,
      selectedBody.position.y,
      selectedBody.position.z,
    );
    const orbitControls = controls as { target?: THREE.Vector3 } | undefined;

    if (mode === "follow") {
      const desired = target.clone().add(new THREE.Vector3(0, 3.2, 7.4));
      camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
    }

    if (mode === "top-down") {
      const desired = target.clone().add(new THREE.Vector3(0, 32, 0.001));
      camera.position.lerp(desired, 1 - Math.pow(0.0001, delta));
    }

    if (mode === "cinematic") {
      angleRef.current += delta * 0.18;
      const desired = target
        .clone()
        .add(new THREE.Vector3(Math.cos(angleRef.current) * 12, 5.5, Math.sin(angleRef.current) * 12));
      camera.position.lerp(desired, 1 - Math.pow(0.004, delta));
    }

    camera.lookAt(target);
    if (orbitControls?.target) {
      orbitControls.target.lerp(target, 1 - Math.pow(0.002, delta));
    }
  });

  return null;
}

function CosmicBackdrop() {
  const deepSpace = useMemo(() => getDeepSpaceTexture(), []);
  const milkyWay = useMemo(() => getMilkyWayTexture(), []);
  const nebulae = useMemo(
    () => [
      { texture: getNebulaTexture(0), position: [-245, 98, -420] as [number, number, number], scale: 310, color: "#679dff", opacity: 0.48 },
      { texture: getNebulaTexture(1), position: [285, -65, -520] as [number, number, number], scale: 360, color: "#ff7ac4", opacity: 0.34 },
      { texture: getNebulaTexture(2), position: [-95, -165, -610] as [number, number, number], scale: 420, color: "#ffb36b", opacity: 0.26 },
      { texture: getNebulaTexture(3), position: [80, 190, -690] as [number, number, number], scale: 470, color: "#64ffd0", opacity: 0.18 },
    ],
    [],
  );
  const galaxies = useMemo(
    () => [
      { texture: getGalaxySpriteTexture(0), position: [-410, 130, -760] as [number, number, number], scale: [120, 56, 1] as [number, number, number], opacity: 0.42 },
      { texture: getGalaxySpriteTexture(1), position: [390, 170, -860] as [number, number, number], scale: [94, 44, 1] as [number, number, number], opacity: 0.32 },
      { texture: getGalaxySpriteTexture(2), position: [220, -210, -720] as [number, number, number], scale: [76, 36, 1] as [number, number, number], opacity: 0.3 },
    ],
    [],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[2200, 72, 36]} />
        <meshBasicMaterial map={deepSpace} side={THREE.BackSide} fog={false} toneMapped={false} />
      </mesh>
      <sprite position={[0, -32, -500]} scale={[760, 190, 1]} rotation={[0, 0, -0.18]}>
        <spriteMaterial
          map={milkyWay}
          transparent
          opacity={0.52}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      {nebulae.map((nebula, index) => (
        <sprite key={`nebula-${index}`} position={nebula.position} scale={[nebula.scale, nebula.scale, 1]}>
          <spriteMaterial
            map={nebula.texture}
            color={nebula.color}
            transparent
            opacity={nebula.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
      ))}
      {galaxies.map((galaxy, index) => (
        <sprite key={`distant-galaxy-${index}`} position={galaxy.position} scale={galaxy.scale}>
          <spriteMaterial
            map={galaxy.texture}
            transparent
            opacity={galaxy.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
      ))}
      <CosmicDustField />
    </group>
  );
}

function CosmicDustField() {
  const particleTexture = useMemo(() => getParticleTexture(), []);
  const { positions, colors } = useMemo(() => {
    const random = makeSceneRandom(89173);
    const count = 950;
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const radius = 70 + random() * 420;
      const angle = random() * Math.PI * 2;
      const lift = (random() - 0.5) * 170;
      positionArray[index * 3] = Math.cos(angle) * radius;
      positionArray[index * 3 + 1] = lift;
      positionArray[index * 3 + 2] = Math.sin(angle) * radius - 160;

      const tint = new THREE.Color(random() > 0.72 ? "#ffd9b2" : random() > 0.46 ? "#b9d8ff" : "#ffffff");
      const alpha = 0.18 + random() * 0.55;
      colorArray[index * 3] = tint.r * alpha;
      colorArray[index * 3 + 1] = tint.g * alpha;
      colorArray[index * 3 + 2] = tint.b * alpha;
    }

    return { positions: positionArray, colors: colorArray };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        vertexColors
        size={0.28}
        sizeAttenuation
        transparent
        opacity={0.62}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}

function BodyMesh({
  body,
  isSelected,
  visualization,
  onSelect,
}: {
  body: CelestialBody;
  isSelected: boolean;
  visualization: VisualizationToggles;
  onSelect: (id: string | undefined) => void;
}) {
  const updateBody = useSimulationStore((state) => state.updateBody);
  const [dragging, setDragging] = useState(false);
  const position: [number, number, number] = [body.position.x, body.position.y, body.position.z];
  const localTrail = useMemo(
    () =>
      body.trail.map((point) => ({
        x: point.x - body.position.x,
        y: point.y - body.position.y,
        z: point.z - body.position.z,
      })),
    [body.position.x, body.position.y, body.position.z, body.trail],
  );

  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(body.id);
  }

  function startDrag(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onSelect(body.id);
    setDragging(true);
    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId);
    }
  }

  function moveDrag(event: ThreeEvent<PointerEvent>) {
    if (!dragging) return;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -body.position.y);
    const point = new THREE.Vector3();
    if (event.ray.intersectPlane(plane, point)) {
      updateBody(body.id, {
        position: vec(point.x, point.y, point.z),
      });
    }
  }

  function endDrag(event: ThreeEvent<PointerEvent>) {
    if (dragging) {
      event.stopPropagation();
      setDragging(false);
      if (event.target instanceof Element) {
        event.target.releasePointerCapture(event.pointerId);
      }
    }
  }

  return (
    <group
      position={position}
      onClick={select}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {visualization.orbitTrails && localTrail.length > 2 ? (
        <TrajectoryLine points={localTrail} color={isSelected ? "#fff1a8" : body.color} opacity={isSelected ? 0.45 : 0.17} />
      ) : null}
      {body.type === "black-hole" ? (
        <BlackHoleVisual body={body} visualization={visualization} />
      ) : body.type === "star" ? (
        <StarVisual body={body} />
      ) : body.type === "neutron-star" ? (
        <>
          <NeutronStarVisual body={body} />
          <PulsarBeam body={body} />
        </>
      ) : (
        <TexturedBodyVisual body={body} />
      )}
      {body.type !== "black-hole" ? <SoftBodyHalo body={body} isSelected={isSelected} /> : null}
      {body.type === "star" ? (
        <pointLight color={starColorFromTemperature(body.temperatureK)} intensity={2.4 + Math.log10(body.luminositySolar + 1)} distance={46} />
      ) : null}
      {isSelected ? <SelectionRing radius={body.renderRadiusAU} /> : null}
      {visualization.objectLabels ? <ObjectLabel body={body} /> : null}
    </group>
  );
}

function StarVisual({ body }: { body: CelestialBody }) {
  const haloTexture = useMemo(() => getStarHaloTexture(), []);
  const starColor = starColorFromTemperature(body.temperatureK);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.09;
  });

  return (
    <>
      <mesh ref={coreRef}>
        <sphereGeometry args={[body.renderRadiusAU, 64, 32]} />
        <meshBasicMaterial color={starColor} toneMapped={false} />
      </mesh>
      <sprite scale={[body.renderRadiusAU * 8.5, body.renderRadiusAU * 8.5, 1]}>
        <spriteMaterial
          map={haloTexture}
          color={starColor}
          transparent
          opacity={0.66}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[body.renderRadiusAU * 18, body.renderRadiusAU * 18, 1]}>
        <spriteMaterial
          map={haloTexture}
          color={starColor}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </>
  );
}

function NeutronStarVisual({ body }: { body: CelestialBody }) {
  const haloTexture = useMemo(() => getStarHaloTexture(), []);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.7;
  });

  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[body.renderRadiusAU, 48, 24]} />
        <meshBasicMaterial color="#d8fbff" toneMapped={false} />
      </mesh>
      <sprite scale={[body.renderRadiusAU * 10, body.renderRadiusAU * 10, 1]}>
        <spriteMaterial
          map={haloTexture}
          color="#8ffcff"
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </>
  );
}

function TexturedBodyVisual({ body }: { body: CelestialBody }) {
  const texture = useMemo(() => getPlanetTexture(body), [body]);
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereColor = atmosphereTint(body);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const spin = body.type === "asteroid" ? 0.45 : body.type === "moon" ? 0.12 : 0.075;
    meshRef.current.rotation.y += delta * spin;
    meshRef.current.rotation.x = body.type === "asteroid" ? 0.35 : 0.08;
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[body.renderRadiusAU, body.type === "asteroid" ? 18 : 64, body.type === "asteroid" ? 12 : 32]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={texture}
          bumpScale={body.renderRadiusAU * (body.type === "asteroid" ? 0.24 : 0.045)}
          roughness={body.type === "planet" ? 0.66 : 0.88}
          metalness={0.02}
        />
      </mesh>
      {atmosphereColor ? (
        <mesh scale={1.075}>
          <sphereGeometry args={[body.renderRadiusAU, 48, 24]} />
          <meshBasicMaterial
            color={atmosphereColor}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </>
  );
}

function SoftBodyHalo({ body, isSelected }: { body: CelestialBody; isSelected: boolean }) {
  const haloTexture = useMemo(() => getStarHaloTexture(), []);
  const opacity = body.type === "planet" ? 0.06 : body.type === "moon" ? 0.035 : 0.12;
  const scaleFactor = isSelected ? 3.3 : body.type === "star" ? 8 : 2.4;

  return (
    <sprite scale={[body.renderRadiusAU * scaleFactor, body.renderRadiusAU * scaleFactor, 1]}>
      <spriteMaterial
        map={haloTexture}
        color={body.type === "star" ? starColorFromTemperature(body.temperatureK) : body.color}
        transparent
        opacity={isSelected ? opacity * 2.2 : opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function InstancedSmallBodies({
  bodies,
  onSelect,
}: {
  bodies: CelestialBody[];
  onSelect: (id: string | undefined) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const asteroidTexture = useMemo(() => getAsteroidTexture(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    bodies.forEach((body, index) => {
      dummy.position.set(body.position.x, body.position.y, body.position.z);
      const scaleValue = Math.max(body.renderRadiusAU, 0.01);
      dummy.scale.set(scaleValue * 1.15, scaleValue * (0.72 + (index % 5) * 0.08), scaleValue);
      dummy.rotation.set(index * 0.31, index * 1.17, index * 0.73);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
      meshRef.current?.setColorAt(index, new THREE.Color(body.color));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [bodies, dummy]);

  if (!bodies.length) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bodies.length]}
      onClick={(event) => {
        event.stopPropagation();
        if (event.instanceId != null) onSelect(bodies[event.instanceId]?.id);
      }}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial map={asteroidTexture} color="#ffffff" roughness={0.92} metalness={0.02} vertexColors />
    </instancedMesh>
  );
}

function BlackHoleVisual({
  body,
  visualization,
}: {
  body: CelestialBody;
  visualization: VisualizationToggles;
}) {
  const haloTexture = useMemo(() => getStarHaloTexture(), []);
  const diskTexture = useMemo(() => getAccretionDiskTexture(), []);
  const diskRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (diskRef.current) diskRef.current.rotation.z += delta * 0.18;
  });

  return (
    <group>
      {visualization.eventHorizon ? (
        <mesh>
          <sphereGeometry args={[body.renderRadiusAU * 1.18, 48, 24]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      ) : null}
      <sprite scale={[body.renderRadiusAU * 13, body.renderRadiusAU * 13, 1]}>
        <spriteMaterial
          map={haloTexture}
          color="#ffd18b"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[body.renderRadiusAU * 1.48, body.renderRadiusAU * 0.045, 10, 144]} />
        <meshBasicMaterial color="#ffe7aa" transparent opacity={0.78} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {visualization.accretionDisk ? (
        <group ref={diskRef} rotation={[Math.PI / 2, 0.2, -0.08]}>
          <mesh>
            <ringGeometry args={[body.renderRadiusAU * 2.2, body.renderRadiusAU * 12.5, 192, 4]} />
            <meshBasicMaterial
              map={diskTexture}
              transparent
              opacity={0.82}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI * 0.12]}>
            <ringGeometry args={[body.renderRadiusAU * 5.5, body.renderRadiusAU * 17, 192, 2]} />
            <meshBasicMaterial
              color="#73cfff"
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <BlackHoleParticleOrbit body={body} />
        </group>
      ) : null}
    </group>
  );
}

function BlackHoleParticleOrbit({ body }: { body: CelestialBody }) {
  const particleTexture = useMemo(() => getParticleTexture(), []);
  const { positions, colors } = useMemo(() => {
    const random = makeSceneRandom(body.id.length * 977 + Math.floor(body.massSolar * 37));
    const count = 360;
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = body.renderRadiusAU * (2.6 + random() * 12.8);
      positionArray[index * 3] = Math.cos(angle) * radius;
      positionArray[index * 3 + 1] = (random() - 0.5) * body.renderRadiusAU * 0.45;
      positionArray[index * 3 + 2] = Math.sin(angle) * radius * (0.65 + random() * 0.22);

      const color = new THREE.Color(random() > 0.34 ? "#ffbd71" : "#8ffcff");
      const alpha = 0.36 + random() * 0.64;
      colorArray[index * 3] = color.r * alpha;
      colorArray[index * 3 + 1] = color.g * alpha;
      colorArray[index * 3 + 2] = color.b * alpha;
    }

    return { positions: positionArray, colors: colorArray };
  }, [body.id, body.massSolar, body.renderRadiusAU]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        vertexColors
        size={body.renderRadiusAU * 0.3}
        sizeAttenuation
        transparent
        opacity={0.86}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function PulsarBeam({ body }: { body: CelestialBody }) {
  return (
    <group rotation={[0.6, 0, 0.8]}>
      <mesh>
        <coneGeometry args={[body.renderRadiusAU * 0.28, body.renderRadiusAU * 18, 24, 1, true]} />
        <meshBasicMaterial color="#9ffcff" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[body.renderRadiusAU * 0.28, body.renderRadiusAU * 18, 24, 1, true]} />
        <meshBasicMaterial color="#9ffcff" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SelectionRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 1.75, radius * 1.92, 96]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ObjectLabel({ body }: { body: CelestialBody }) {
  return (
    <Html position={[0, body.renderRadiusAU * 1.8, 0]} center distanceFactor={9} className="space-label">
      <span>{body.name}</span>
    </Html>
  );
}

function TrajectoryLine({
  points,
  color,
  opacity = 0.5,
  dashed = false,
}: {
  points: Vector3D[];
  color: string;
  opacity?: number;
  dashed?: boolean;
}) {
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x, point.y, point.z))),
    [points],
  );
  const material = useMemo(
    () =>
      dashed
        ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.32, gapSize: 0.18, depthWrite: false })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
    [color, dashed, opacity],
  );
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useEffect(() => {
    if (dashed) line.computeLineDistances();
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [dashed, geometry, line, material]);

  return <primitive object={line} />;
}

function ParticleCloud({ particles }: { particles: SimulationParticle[] }) {
  const particleTexture = useMemo(() => getParticleTexture(), []);
  const { positions, colors, sizes } = useMemo(() => {
    const positionArray = new Float32Array(particles.length * 3);
    const colorArray = new Float32Array(particles.length * 3);
    const sizeArray = new Float32Array(particles.length);
    particles.forEach((particle, index) => {
      const color = new THREE.Color(particle.color);
      const alpha = Math.max(particle.lifeDays / particle.maxLifeDays, 0);
      positionArray[index * 3] = particle.position.x;
      positionArray[index * 3 + 1] = particle.position.y;
      positionArray[index * 3 + 2] = particle.position.z;
      colorArray[index * 3] = color.r * alpha;
      colorArray[index * 3 + 1] = color.g * alpha;
      colorArray[index * 3 + 2] = color.b * alpha;
      sizeArray[index] = particle.sizeAU;
    });
    return { positions: positionArray, colors: colorArray, sizes: sizeArray };
  }, [particles]);

  if (!particles.length) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        vertexColors
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function ShockwaveShells({ shells }: { shells: ShockwaveShell[] }) {
  const nebulaTexture = useMemo(() => getNebulaTexture(8), []);
  const haloTexture = useMemo(() => getStarHaloTexture(), []);

  return (
    <>
      {shells.map((shell) => (
        <group key={shell.id} position={[shell.center.x, shell.center.y, shell.center.z]}>
          <sprite scale={[shell.radiusAU * 3.1, shell.radiusAU * 3.1, 1]}>
            <spriteMaterial
              map={nebulaTexture}
              color={shell.color}
              transparent
              opacity={shell.opacity * 0.44}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
          <sprite scale={[shell.radiusAU * 1.3, shell.radiusAU * 1.3, 1]}>
            <spriteMaterial
              map={haloTexture}
              color="#fff2b4"
              transparent
              opacity={shell.opacity * 0.34}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
          <mesh>
            <sphereGeometry args={[shell.radiusAU, 72, 36]} />
            <meshBasicMaterial
              color={shell.color}
              transparent
              opacity={shell.opacity * 0.14}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function VelocityVectors({ bodies, selectedId }: { bodies: CelestialBody[]; selectedId?: string }) {
  const segments = useMemo(() => {
    const points: Vector3D[] = [];
    bodies.forEach((body) => {
      if (body.type === "dust" && body.id !== selectedId) return;
      points.push(body.position);
      points.push(add(body.position, scale(body.velocity, body.id === selectedId ? 80 : 45)));
    });
    return points;
  }, [bodies, selectedId]);

  return <LineSegments points={segments} color="#6fffe2" opacity={0.42} />;
}

function GravityField({ bodies }: { bodies: CelestialBody[] }) {
  const lines = useMemo(() => {
    const anchors = bodies.filter((body) => body.type === "star" || body.type === "black-hole" || body.type === "neutron-star").slice(0, 5);
    const points: Vector3D[] = [];
    for (let x = -18; x <= 18; x += 3) {
      for (let z = -18; z <= 18; z += 3) {
        const origin = vec(x, -0.08, z);
        const field = anchors.reduce((sum, body) => {
          const offset = subtract(body.position, origin);
          const r2 = Math.max(offset.x ** 2 + offset.z ** 2, 0.08);
          return add(sum, scale(normalize(offset), Math.min(body.massSolar / r2, 2.2)));
        }, vec());
        points.push(origin);
        points.push(add(origin, scale(normalize(field), Math.min(0.85, Math.sqrt(field.x ** 2 + field.z ** 2) * 0.22))));
      }
    }
    return points;
  }, [bodies]);

  return <LineSegments points={lines} color="#315e7a" opacity={0.36} />;
}

function RiskMarker({ prediction }: { prediction: PredictionResult }) {
  if (prediction.status === "stable" || !prediction.futurePosition) return null;

  return (
    <mesh position={[prediction.futurePosition.x, prediction.futurePosition.y, prediction.futurePosition.z]}>
      <sphereGeometry args={[0.12, 18, 12]} />
      <meshBasicMaterial color="#ff6f8b" transparent opacity={0.72} />
    </mesh>
  );
}

function HabitableZones({ bodies }: { bodies: CelestialBody[] }) {
  return (
    <>
      {bodies
        .filter((body) => body.type === "star" && body.luminositySolar > 0)
        .slice(0, 4)
        .map((star) => {
          const center = Math.sqrt(star.luminositySolar);
          return (
            <group key={`${star.id}-habitable`} position={[star.position.x, star.position.y, star.position.z]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <ringGeometry args={[center * 0.75, center * 1.55, 128]} />
                <meshBasicMaterial color="#4ff0a7" transparent opacity={0.08} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}
    </>
  );
}

function AsteroidBeltVisual({ bodies }: { bodies: CelestialBody[] }) {
  const anchors = bodies
    .filter((body) => body.type === "star" && body.massSolar > 0.4)
    .slice(0, 2);

  return (
    <>
      {anchors.map((anchor, index) => (
        <AsteroidDustBelt key={`${anchor.id}-belt`} anchor={anchor} index={index} />
      ))}
    </>
  );
}

function AsteroidDustBelt({ anchor, index }: { anchor: CelestialBody; index: number }) {
  const particleTexture = useMemo(() => getParticleTexture(), []);
  const { positions, colors } = useMemo(() => {
    const random = makeSceneRandom(anchor.id.length * 431 + index * 7919);
    const count = 680;
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const innerRadius = 2.15 + index * 1.2;
    const width = 1.65 + index * 0.55;

    for (let item = 0; item < count; item += 1) {
      const angle = random() * Math.PI * 2;
      const radius = innerRadius + random() * width + (random() - 0.5) * 0.18;
      positionArray[item * 3] = Math.cos(angle) * radius;
      positionArray[item * 3 + 1] = (random() - 0.5) * 0.085;
      positionArray[item * 3 + 2] = Math.sin(angle) * radius;

      const tint = new THREE.Color(random() > 0.58 ? "#c7ad86" : random() > 0.28 ? "#7f8fa0" : "#e2d0ad");
      const alpha = 0.16 + random() * 0.42;
      colorArray[item * 3] = tint.r * alpha;
      colorArray[item * 3 + 1] = tint.g * alpha;
      colorArray[item * 3 + 2] = tint.b * alpha;
    }

    return { positions: positionArray, colors: colorArray };
  }, [anchor.id, index]);

  return (
    <points position={[anchor.position.x, anchor.position.y, anchor.position.z]} rotation={[0.035, 0, index * 0.28]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        vertexColors
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.62}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function LineSegments({
  points,
  color,
  opacity,
}: {
  points: Vector3D[];
  color: string;
  opacity: number;
}) {
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x, point.y, point.z))),
    [points],
  );
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
    [color, opacity],
  );
  const lineSegments = useMemo(() => new THREE.LineSegments(geometry, material), [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive object={lineSegments} />;
}

function SimulationGrid() {
  return (
    <group>
      <gridHelper args={[80, 40, "#2c5267", "#0a1822"]} position={[0, -0.09, 0]} />
      {[1, 5, 10, 20, 40].map((radius) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.01, radius + 0.01, 192]} />
          <meshBasicMaterial color="#4c8ba8" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function atmosphereTint(body: CelestialBody): string | undefined {
  if (body.type !== "planet") return undefined;
  const name = body.name.toLowerCase();
  if (name.includes("mars")) return "#ff9f6f";
  if (name.includes("jupiter") || name.includes("saturn") || name.includes("gas")) return "#ffd8a3";
  if (name.includes("ice") || body.temperatureK < 180) return "#9be8ff";
  if (body.temperatureK >= 230 && body.temperatureK <= 320) return "#7fc8ff";
  return "#d4b18a";
}

function makeSceneRandom(seedInput: number): () => number {
  let seed = seedInput >>> 0;
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
