"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Grid, Line, OrbitControls } from "@react-three/drei";
import RAPIER, { type Collider, type EventQueue, type RigidBody, type World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";

import { FIXED_TIMESTEP_MS } from "@/physics/constants";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";
import type { SpawnShape } from "@/physics/types";

type LabBody = {
  id: number;
  shape: Exclude<SpawnShape, "compound">;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
};

type PhysicsBody = {
  rigidBody: RigidBody;
  collider: Collider;
};

type DebugLine = {
  trail: THREE.Vector3[];
  vector: [THREE.Vector3, THREE.Vector3];
};

type DragState = {
  id: number;
  pointerId: number;
  plane: THREE.Plane;
  target: THREE.Vector3;
};

const colors = ["#65d6c8", "#f6c85f", "#78a8ff", "#ff7b8a", "#9ee493", "#c39bff"];

const initialBodies = (): LabBody[] => [
  { id: 1, shape: "box", position: [-2.8, 5.8, -1.4], rotation: [0.24, 0.36, 0.12], color: colors[0] },
  { id: 2, shape: "ball", position: [-0.6, 7.8, 0.4], rotation: [0, 0, 0], color: colors[1] },
  { id: 3, shape: "box", position: [1.7, 9.3, -0.8], rotation: [0.18, 0.7, 0.24], color: colors[2] },
  { id: 4, shape: "ball", position: [3.0, 11.2, 1.0], rotation: [0, 0, 0], color: colors[3] }
];

const randomSpawn = (shape: SpawnShape, index: number): LabBody => ({
  id: Date.now() + index,
  shape: shape === "box" || shape === "ball" ? shape : shape === "capsule" ? "capsule" : "box",
  position: [(Math.random() - 0.5) * 5, 7 + Math.random() * 5, (Math.random() - 0.5) * 4],
  rotation: [Math.random() * 0.5, Math.random() * 0.8, Math.random() * 0.4],
  color: colors[index % colors.length]
});

const eulerToRapierRotation = (rotation: [number, number, number]) => {
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
};

const makeColliderDesc = (shape: LabBody["shape"], scale: number, friction: number, restitution: number) => {
  const desc =
    shape === "ball"
      ? RAPIER.ColliderDesc.ball(scale * 0.48)
      : shape === "capsule"
        ? RAPIER.ColliderDesc.capsule(scale * 0.46, scale * 0.34)
        : RAPIER.ColliderDesc.cuboid(scale * 0.5, scale * 0.5, scale * 0.5);

  return desc.setFriction(friction).setRestitution(restitution).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
};

const BodyMesh = memo(function BodyMesh({
  body,
  mass,
  register,
  onDragStart,
  debugLine,
  showVectors,
  showTrails
}: {
  body: LabBody;
  mass: number;
  register: (id: number, group: THREE.Group | null) => void;
  onDragStart: (id: number, event: ThreeEvent<PointerEvent>) => void;
  debugLine?: DebugLine;
  showVectors: boolean;
  showTrails: boolean;
}) {
  const scale = Math.max(0.7, Math.min(1.4, 0.58 + mass * 0.08));

  return (
    <group
      ref={(group) => register(body.id, group)}
      position={body.position}
      rotation={body.rotation}
      onPointerDown={(event) => onDragStart(body.id, event)}
    >
      {body.shape === "ball" ? (
        <mesh>
          <sphereGeometry args={[scale * 0.48, 36, 20]} />
          <meshStandardMaterial color={body.color} roughness={0.36} metalness={0.12} />
        </mesh>
      ) : body.shape === "capsule" ? (
        <mesh>
          <capsuleGeometry args={[scale * 0.34, scale * 0.9, 12, 24]} />
          <meshStandardMaterial color={body.color} roughness={0.32} metalness={0.16} />
        </mesh>
      ) : (
        <mesh>
          <boxGeometry args={[scale, scale, scale]} />
          <meshStandardMaterial color={body.color} roughness={0.42} metalness={0.1} />
        </mesh>
      )}
      {showTrails && debugLine && debugLine.trail.length > 2 ? <Line points={debugLine.trail} color="#f6c85f" transparent opacity={0.42} lineWidth={1.2} /> : null}
      {showVectors && debugLine ? <Line points={debugLine.vector} color="#6aa9ff" transparent opacity={0.85} lineWidth={2} /> : null}
    </group>
  );
});

function RapierScene({ bodies }: { bodies: LabBody[] }) {
  const paused = usePlaygroundStore((state) => state.paused);
  const debug = usePlaygroundStore((state) => state.debug);
  const showVectors = usePlaygroundStore((state) => state.showVectors);
  const showTrails = usePlaygroundStore((state) => state.showTrails);
  const gravityX = usePlaygroundStore((state) => state.gravityX);
  const gravityY = usePlaygroundStore((state) => state.gravityY);
  const gravityZ = usePlaygroundStore((state) => state.gravityZ);
  const mass = usePlaygroundStore((state) => state.mass);
  const friction = usePlaygroundStore((state) => state.friction);
  const restitution = usePlaygroundStore((state) => state.restitution);
  const stepSignal = usePlaygroundStore((state) => state.stepSignal);
  const setMetrics = usePlaygroundStore((state) => state.setMetrics);
  const { camera, gl } = useThree();

  const [ready, setReady] = useState(false);
  const [debugLines, setDebugLines] = useState<Record<number, DebugLine>>({});
  const [dragTarget, setDragTarget] = useState<THREE.Vector3 | null>(null);
  const worldRef = useRef<World | null>(null);
  const eventQueueRef = useRef<EventQueue | null>(null);
  const rigidBodiesRef = useRef(new Map<number, PhysicsBody>());
  const groupRefs = useRef(new Map<number, THREE.Group>());
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const dragRef = useRef<DragState | null>(null);
  const accumulatorRef = useRef(0);
  const frameRef = useRef(0);
  const fpsRef = useRef({ frames: 0, time: 0 });
  const collisionCountRef = useRef(0);
  const lastStepRef = useRef(stepSignal);
  const gravityRef = useRef({ x: gravityX, y: gravityY, z: gravityZ });

  useEffect(() => {
    gravityRef.current = { x: gravityX, y: gravityY, z: gravityZ };
    if (worldRef.current) {
      worldRef.current.gravity = gravityRef.current;
    }
  }, [gravityX, gravityY, gravityZ]);

  useEffect(() => {
    let cancelled = false;
    const rigidBodies = rigidBodiesRef.current;
    const groups = groupRefs.current;

    RAPIER.init().then(() => {
      if (cancelled) {
        return;
      }
      const world = new RAPIER.World(gravityRef.current);
      world.timestep = 1 / 60;
      const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.08, 0));
      world.createCollider(RAPIER.ColliderDesc.cuboid(7, 0.08, 5).setFriction(0.88).setRestitution(0.2), floorBody);
      worldRef.current = world;
      eventQueueRef.current = new RAPIER.EventQueue(true);
      setReady(true);
    });

    return () => {
      cancelled = true;
      worldRef.current?.free();
      eventQueueRef.current?.free();
      worldRef.current = null;
      eventQueueRef.current = null;
      rigidBodies.clear();
      groups.clear();
    };
  }, []);

  useEffect(() => {
    const world = worldRef.current;
    if (!world || !ready) {
      return;
    }

    const bodyIds = new Set(bodies.map((body) => body.id));
    for (const [id, physicsBody] of rigidBodiesRef.current) {
      if (!bodyIds.has(id)) {
        world.removeRigidBody(physicsBody.rigidBody);
        rigidBodiesRef.current.delete(id);
      }
    }

    for (const body of bodies) {
      const scale = Math.max(0.7, Math.min(1.4, 0.58 + mass * 0.08));
      const existing = rigidBodiesRef.current.get(body.id);
      if (existing) {
        existing.rigidBody.setAdditionalMass(mass, true);
        existing.collider.setFriction(friction);
        existing.collider.setRestitution(restitution);
        continue;
      }

      const rigidBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(...body.position)
          .setRotation(eulerToRapierRotation(body.rotation))
          .setAdditionalMass(mass)
          .setLinearDamping(0.025)
          .setAngularDamping(0.08)
          .setCanSleep(false)
      );
      rigidBody.setLinvel({ x: (Math.random() - 0.5) * 1.2, y: 0, z: (Math.random() - 0.5) * 1.2 }, true);
      const collider = world.createCollider(makeColliderDesc(body.shape, scale, friction, restitution), rigidBody);
      rigidBodiesRef.current.set(body.id, { rigidBody, collider });
    }
  }, [bodies, friction, mass, ready, restitution]);

  const register = (id: number, group: THREE.Group | null) => {
    if (group) {
      groupRefs.current.set(id, group);
    } else {
      groupRefs.current.delete(id);
    }
  };

  const setPointerFromEvent = (event: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointerRef.current.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };

  const moveDragTarget = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    setPointerFromEvent(event);
    raycasterRef.current.setFromCamera(pointerRef.current, camera);
    const next = new THREE.Vector3();
    if (raycasterRef.current.ray.intersectPlane(drag.plane, next)) {
      drag.target.copy(next);
      setDragTarget(next.clone());
    }
  };

  const endDrag = (event?: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.pointerId)) {
      return;
    }
    dragRef.current = null;
    setDragTarget(null);
    if (event?.pointerId !== undefined) {
      gl.domElement.releasePointerCapture?.(event.pointerId);
    }
  };

  useEffect(() => {
    const element = gl.domElement;
    element.addEventListener("pointermove", moveDragTarget);
    window.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    return () => {
      element.removeEventListener("pointermove", moveDragTarget);
      window.removeEventListener("pointerup", endDrag);
      element.removeEventListener("pointercancel", endDrag);
    };
  });

  const startDrag = (id: number, event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const nativeEvent = event.nativeEvent;
    const physicsBody = rigidBodiesRef.current.get(id);
    if (!physicsBody) {
      return;
    }
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).normalize(), event.point);
    dragRef.current = {
      id,
      pointerId: nativeEvent.pointerId,
      plane,
      target: event.point.clone()
    };
    physicsBody.rigidBody.wakeUp();
    gl.domElement.setPointerCapture?.(nativeEvent.pointerId);
    setDragTarget(event.point.clone());
  };

  useFrame((_, delta) => {
    const world = worldRef.current;
    const eventQueue = eventQueueRef.current;
    if (!world || !eventQueue || !ready) {
      return;
    }

    frameRef.current += 1;
    world.gravity = gravityRef.current;

    const shouldStepOnce = lastStepRef.current !== stepSignal;
    if (shouldStepOnce) {
      lastStepRef.current = stepSignal;
    }

    if (dragRef.current) {
      accumulatorRef.current += Math.min(delta, 0.05);
    } else if (!paused) {
      accumulatorRef.current += Math.min(delta, 0.05);
    } else if (shouldStepOnce) {
      accumulatorRef.current += 1 / 60;
    }

    while (accumulatorRef.current >= 1 / 60) {
      const drag = dragRef.current;
      if (drag) {
        const physicsBody = rigidBodiesRef.current.get(drag.id);
        if (physicsBody) {
          const translation = physicsBody.rigidBody.translation();
          const velocity = physicsBody.rigidBody.linvel();
          const dx = drag.target.x - translation.x;
          const dy = drag.target.y - translation.y;
          const dz = drag.target.z - translation.z;
          const forceScale = Math.max(80, mass * 150);
          const dampingScale = Math.max(12, mass * 24);
          physicsBody.rigidBody.addForce(
            {
              x: dx * forceScale - velocity.x * dampingScale,
              y: dy * forceScale - velocity.y * dampingScale,
              z: dz * forceScale - velocity.z * dampingScale
            },
            true
          );
        }
      }
      world.step(eventQueue);
      eventQueue.drainCollisionEvents((_, __, started) => {
        if (started) {
          collisionCountRef.current += 1;
        }
      });
      accumulatorRef.current -= 1 / 60;
    }

    let kineticEnergy = 0;
    const nextLines: Record<number, DebugLine> = {};
    for (const [id, physicsBody] of rigidBodiesRef.current) {
      const group = groupRefs.current.get(id);
      const translation = physicsBody.rigidBody.translation();
      const rotation = physicsBody.rigidBody.rotation();
      const velocity = physicsBody.rigidBody.linvel();
      if (group) {
        group.position.set(translation.x, translation.y, translation.z);
        group.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }

      const speedSquared = velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z;
      kineticEnergy += 0.5 * mass * speedSquared;
      if (frameRef.current % 4 === 0) {
        const start = new THREE.Vector3(translation.x, translation.y, translation.z);
        const prior = debugLines[id]?.trail ?? [];
        nextLines[id] = {
          trail: showTrails ? [...prior.slice(-28), start] : [],
          vector: [start, new THREE.Vector3(translation.x + velocity.x * 0.18, translation.y + velocity.y * 0.18, translation.z + velocity.z * 0.18)]
        };
      } else if (debugLines[id]) {
        nextLines[id] = debugLines[id];
      }
    }

    if (frameRef.current % 4 === 0) {
      setDebugLines(nextLines);
    }

    fpsRef.current.frames += 1;
    fpsRef.current.time += delta;
    if (fpsRef.current.time >= 0.35) {
      setMetrics({
        fps: fpsRef.current.frames / fpsRef.current.time,
        bodyCount: rigidBodiesRef.current.size + 1,
        constraintCount: 0,
        collisions: collisionCountRef.current,
        timestep: FIXED_TIMESTEP_MS,
        kineticEnergy
      });
      fpsRef.current = { frames: 0, time: 0 };
    }
  });

  return (
    <>
      <color attach="background" args={["#07111d"]} />
      <fog attach="fog" args={["#07111d", 14, 34]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[5, 9, 5]} intensity={2.2} />
      <pointLight position={[-4, 5, -4]} color="#65d6c8" intensity={4.2} />
      <pointLight position={[4, 3, 3]} color="#f6c85f" intensity={1.6} />
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[14, 0.12, 10]} />
        <meshStandardMaterial color="#15202b" roughness={0.75} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.01, 7.1, 4]} />
        <meshBasicMaterial color="#65d6c8" transparent opacity={0.12} />
      </mesh>
      {bodies.map((body) => (
        <BodyMesh
          key={body.id}
          body={body}
          debugLine={debugLines[body.id]}
          mass={mass}
          onDragStart={startDrag}
          register={register}
          showTrails={showTrails}
          showVectors={showVectors}
        />
      ))}
      {dragTarget ? (
        <mesh position={dragTarget}>
          <sphereGeometry args={[0.09, 16, 10]} />
          <meshBasicMaterial color="#65d6c8" transparent opacity={0.82} />
        </mesh>
      ) : null}
      <Grid args={[16, 16]} cellColor="#243447" cellSize={0.5} fadeDistance={18} fadeStrength={1.5} position={[0, 0.012, 0]} sectionColor="#36556c" />
      {debug ? (
        <group position={[-6.2, 0.05, -4.2]}>
          <mesh>
            <boxGeometry args={[0.06, 0.06, 8.4]} />
            <meshStandardMaterial color="#65d6c8" emissive="#103c38" />
          </mesh>
          <mesh position={[6.2, 0, 0]}>
            <boxGeometry args={[12.4, 0.04, 0.06]} />
            <meshStandardMaterial color="#f6c85f" emissive="#332400" />
          </mesh>
        </group>
      ) : null}
      <OrbitControls enabled={!dragTarget} enableDamping dampingFactor={0.08} makeDefault maxDistance={20} minDistance={5} target={[0, 2.4, 0]} />
    </>
  );
}

export default function ThreeGravityWorld() {
  const objectType = usePlaygroundStore((state) => state.objectType);
  const spawnSignal = usePlaygroundStore((state) => state.spawnSignal);
  const resetSignal = usePlaygroundStore((state) => state.resetSignal);
  const [bodies, setBodies] = useState<LabBody[]>(initialBodies);
  const [worldKey, setWorldKey] = useState(0);
  const lastSpawn = useRef(spawnSignal);
  const lastReset = useRef(resetSignal);

  useEffect(() => {
    if (lastReset.current === resetSignal) {
      return;
    }
    lastReset.current = resetSignal;
    setBodies(initialBodies());
    setWorldKey((value) => value + 1);
  }, [resetSignal]);

  useEffect(() => {
    if (lastSpawn.current === spawnSignal) {
      return;
    }
    lastSpawn.current = spawnSignal;
    setBodies((current) => [...current, randomSpawn(objectType, current.length + 1)].slice(-28));
  }, [objectType, spawnSignal]);

  return (
    <Canvas
      camera={{ position: [7, 6, 9], fov: 48 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => gl.setClearColor("#07111d", 1)}
      className="h-full min-h-[520px] w-full"
      style={{ background: "#07111d" }}
    >
      <RapierScene key={worldKey} bodies={bodies} />
    </Canvas>
  );
}
