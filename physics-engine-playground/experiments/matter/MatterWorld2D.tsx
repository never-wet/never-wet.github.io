"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Matter from "matter-js";

import { FIXED_TIMESTEP_MS, WORLD_BOUNDS } from "@/physics/constants";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";
import type { ExperimentId, PlaygroundSettings, SpawnShape } from "@/physics/types";

type FieldPoint = {
  x: number;
  y: number;
  charge: number;
  label: string;
};

type StreamParticle = {
  x: number;
  y: number;
  phase: number;
  speed: number;
};

type BodyPlugin = {
  role?: "dynamic" | "wall" | "anchor" | "attractor" | "magnet" | "probe";
  color?: string;
  charge?: number;
  lastForce?: Matter.Vector;
  drawRadius?: number;
};

type CollisionFlash = {
  x: number;
  y: number;
  life: number;
  impulse: number;
};

const dynamicColors = ["#65d6c8", "#f6c85f", "#78a8ff", "#ff7b8a", "#9ee493", "#c39bff"];

const getPlugin = (body: Matter.Body): BodyPlugin => body.plugin as BodyPlugin;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalize = (vector: Matter.Vector) => {
  const magnitude = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};

const kineticEnergy = (body: Matter.Body) => {
  if (body.isStatic) {
    return 0;
  }
  const speedSquared = body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y;
  return 0.5 * body.mass * speedSquared;
};

const drawArrow = (
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  width = 1.6
) => {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const head = 9;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
  context.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
};

const makeBodyOptions = (settings: PlaygroundSettings, color: string): Matter.IChamferableBodyDefinition => ({
  friction: settings.friction,
  restitution: settings.restitution,
  frictionAir: settings.damping,
  density: 0.001,
  render: {
    fillStyle: color
  },
  plugin: {
    role: "dynamic",
    color
  } satisfies BodyPlugin
});

const setPhysicalMass = (body: Matter.Body, mass: number) => {
  Matter.Body.setMass(body, clamp(mass, 0.5, 80));
};

const createShape = (
  shape: SpawnShape,
  x: number,
  y: number,
  settings: PlaygroundSettings,
  index: number,
  sizeScale = 1
) => {
  const color = dynamicColors[index % dynamicColors.length];
  const options = makeBodyOptions(settings, color);
  const radius = clamp(18 + settings.mass * 2.2, 18, 48) * sizeScale;
  let body: Matter.Body;

  if (shape === "box") {
    body = Matter.Bodies.rectangle(x, y, radius * 1.8, radius * 1.45, options);
  } else if (shape === "capsule") {
    body = Matter.Bodies.rectangle(x, y, radius * 2.35, radius * 1.05, {
      ...options,
      chamfer: { radius: radius * 0.5 }
    });
  } else if (shape === "compound") {
    const torso = Matter.Bodies.rectangle(x, y, radius * 1.7, radius * 1.05, options);
    const left = Matter.Bodies.circle(x - radius * 0.95, y, radius * 0.45, options);
    const right = Matter.Bodies.circle(x + radius * 0.95, y, radius * 0.45, options);
    body = Matter.Body.create({
      parts: [torso, left, right],
      friction: settings.friction,
      restitution: settings.restitution,
      frictionAir: settings.damping,
      render: { fillStyle: color },
      plugin: { role: "dynamic", color } satisfies BodyPlugin
    });
  } else {
    body = Matter.Bodies.circle(x, y, radius, options);
  }

  setPhysicalMass(body, settings.mass);
  return body;
};

const createWalls = (width: number, height: number) => {
  const thickness = WORLD_BOUNDS.wallThickness;
  const wallOptions: Matter.IChamferableBodyDefinition = {
    isStatic: true,
    friction: 0.8,
    restitution: 0.15,
    render: { fillStyle: "rgba(119, 154, 190, 0.26)" },
    plugin: { role: "wall", color: "rgba(119, 154, 190, 0.26)" } satisfies BodyPlugin
  };

  return [
    Matter.Bodies.rectangle(width / 2, height + thickness / 2, width + thickness * 2, thickness, wallOptions),
    Matter.Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, wallOptions),
    Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, wallOptions),
    Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + thickness * 2, wallOptions)
  ];
};

const seedStreamParticles = (width: number, height: number) =>
  Array.from({ length: 72 }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(36, height - 36),
    phase: Math.random() * Math.PI * 2,
    speed: randomBetween(0.4, 1.6)
  }));

export default function MatterWorld2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const dimensionsRef = useRef({ width: WORLD_BOUNDS.width, height: WORLD_BOUNDS.height });
  const trailsRef = useRef(new Map<number, Matter.Vector[]>());
  const collisionsRef = useRef<CollisionFlash[]>([]);
  const streamParticlesRef = useRef<StreamParticle[]>([]);
  const fieldPointsRef = useRef<FieldPoint[]>([]);
  const rafRef = useRef(0);
  const tickRef = useRef(0);
  const lastTimeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const fpsFramesRef = useRef(0);
  const fpsTimeRef = useRef(0);
  const collisionCountRef = useRef(0);

  const experimentId = usePlaygroundStore((state) => state.experimentId);
  const paused = usePlaygroundStore((state) => state.paused);
  const debug = usePlaygroundStore((state) => state.debug);
  const showVectors = usePlaygroundStore((state) => state.showVectors);
  const showTrails = usePlaygroundStore((state) => state.showTrails);
  const showForces = usePlaygroundStore((state) => state.showForces);
  const objectType = usePlaygroundStore((state) => state.objectType);
  const gravityX = usePlaygroundStore((state) => state.gravityX);
  const gravityY = usePlaygroundStore((state) => state.gravityY);
  const gravityZ = usePlaygroundStore((state) => state.gravityZ);
  const mass = usePlaygroundStore((state) => state.mass);
  const friction = usePlaygroundStore((state) => state.friction);
  const restitution = usePlaygroundStore((state) => state.restitution);
  const windSpeed = usePlaygroundStore((state) => state.windSpeed);
  const damping = usePlaygroundStore((state) => state.damping);
  const springStiffness = usePlaygroundStore((state) => state.springStiffness);
  const pendulumLength = usePlaygroundStore((state) => state.pendulumLength);
  const fieldStrength = usePlaygroundStore((state) => state.fieldStrength);
  const orbitalGravity = usePlaygroundStore((state) => state.orbitalGravity);
  const initialVelocity = usePlaygroundStore((state) => state.initialVelocity);
  const resetSignal = usePlaygroundStore((state) => state.resetSignal);
  const spawnSignal = usePlaygroundStore((state) => state.spawnSignal);
  const stepSignal = usePlaygroundStore((state) => state.stepSignal);
  const setMetrics = usePlaygroundStore((state) => state.setMetrics);

  const settings = useMemo<PlaygroundSettings>(
    () => ({
      experimentId,
      paused,
      debug,
      showVectors,
      showTrails,
      showForces,
      objectType,
      gravityX,
      gravityY,
      gravityZ,
      mass,
      friction,
      restitution,
      windSpeed,
      damping,
      springStiffness,
      pendulumLength,
      fieldStrength,
      orbitalGravity,
      initialVelocity
    }),
    [
      damping,
      debug,
      experimentId,
      fieldStrength,
      friction,
      gravityX,
      gravityY,
      gravityZ,
      initialVelocity,
      mass,
      objectType,
      orbitalGravity,
      paused,
      pendulumLength,
      restitution,
      showForces,
      showTrails,
      showVectors,
      springStiffness,
      windSpeed
    ]
  );
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const applyRuntimeBodySettings = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    const current = settingsRef.current;
    engine.gravity.x = current.gravityX;
    engine.gravity.y = current.gravityY;
    engine.gravity.scale = current.experimentId === "orbit-gravity" || current.experimentId === "magnet-field" ? 0 : 0.001;

    for (const body of Matter.Composite.allBodies(engine.world)) {
      const plugin = getPlugin(body);
      if (body.isStatic || plugin.role === "wall" || plugin.role === "anchor" || plugin.role === "attractor" || plugin.role === "magnet") {
        continue;
      }
      body.friction = current.friction;
      body.restitution = current.restitution;
      body.frictionAir = current.damping;
    }

    for (const constraint of Matter.Composite.allConstraints(engine.world)) {
      if (constraint.label === "spring") {
        constraint.stiffness = current.springStiffness;
        constraint.damping = current.damping;
      }
      if (constraint.label === "pendulum") {
        constraint.length = current.pendulumLength;
        constraint.damping = current.damping;
      }
      if (constraint.label === "ragdoll-joint") {
        constraint.damping = current.damping;
      }
    }
  }, []);

  const spawnBody = useCallback((x?: number, y?: number, shape?: SpawnShape) => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    const { width, height } = dimensionsRef.current;
    const current = settingsRef.current;
    const body = createShape(shape ?? current.objectType, x ?? randomBetween(width * 0.35, width * 0.65), y ?? height * 0.18, current, tickRef.current);

    if (current.experimentId === "collision-lab") {
      Matter.Body.setVelocity(body, { x: randomBetween(-current.initialVelocity, current.initialVelocity), y: randomBetween(-2, 1) });
    }
    if (current.experimentId === "orbit-gravity") {
      Matter.Body.setVelocity(body, { x: randomBetween(-current.initialVelocity, current.initialVelocity), y: randomBetween(-current.initialVelocity, current.initialVelocity) });
    }
    if (current.experimentId === "magnet-field") {
      getPlugin(body).charge = Math.random() > 0.5 ? 1 : -1;
    }

    Matter.Composite.add(engine.world, body);
  }, []);

  const addPendulumAndSpring = useCallback((engine: Matter.Engine, width: number, height: number, current: PlaygroundSettings) => {
    const anchorA = Matter.Bodies.circle(width * 0.28, 92, 8, {
      isStatic: true,
      render: { fillStyle: "#eaf2ff" },
      plugin: { role: "anchor", color: "#eaf2ff" } satisfies BodyPlugin
    });
    const bob = Matter.Bodies.circle(width * 0.28, 92 + current.pendulumLength, 36, makeBodyOptions(current, "#f6c85f"));
    setPhysicalMass(bob, current.mass);
    const pendulum = Matter.Constraint.create({
      label: "pendulum",
      bodyA: anchorA,
      bodyB: bob,
      length: current.pendulumLength,
      stiffness: 0.94,
      damping: current.damping,
      render: { visible: true }
    });

    const anchorB = Matter.Bodies.circle(width * 0.65, height * 0.28, 8, {
      isStatic: true,
      render: { fillStyle: "#eaf2ff" },
      plugin: { role: "anchor", color: "#eaf2ff" } satisfies BodyPlugin
    });
    const oscillator = Matter.Bodies.rectangle(width * 0.72, height * 0.54, 76, 52, makeBodyOptions(current, "#65d6c8"));
    setPhysicalMass(oscillator, current.mass + 2);
    const spring = Matter.Constraint.create({
      label: "spring",
      bodyA: anchorB,
      bodyB: oscillator,
      length: 270,
      stiffness: current.springStiffness,
      damping: current.damping,
      render: { visible: true }
    });

    Matter.Body.setVelocity(bob, { x: 4, y: 0 });
    Matter.Body.setVelocity(oscillator, { x: -3, y: 0 });
    Matter.Composite.add(engine.world, [anchorA, bob, pendulum, anchorB, oscillator, spring]);
  }, []);

  const addRagdoll = useCallback((engine: Matter.Engine, width: number, height: number, current: PlaygroundSettings) => {
    const color = "#78a8ff";
    const head = Matter.Bodies.circle(width * 0.58, height * 0.22, 24, makeBodyOptions(current, "#f6c85f"));
    const torso = Matter.Bodies.rectangle(width * 0.58, height * 0.32, 54, 82, makeBodyOptions(current, color));
    const leftArm = Matter.Bodies.rectangle(width * 0.52, height * 0.32, 26, 88, makeBodyOptions(current, "#65d6c8"));
    const rightArm = Matter.Bodies.rectangle(width * 0.64, height * 0.32, 26, 88, makeBodyOptions(current, "#65d6c8"));
    const leftLeg = Matter.Bodies.rectangle(width * 0.55, height * 0.46, 28, 94, makeBodyOptions(current, "#c39bff"));
    const rightLeg = Matter.Bodies.rectangle(width * 0.61, height * 0.46, 28, 94, makeBodyOptions(current, "#c39bff"));
    const bodies = [head, torso, leftArm, rightArm, leftLeg, rightLeg];
    bodies.forEach((body) => setPhysicalMass(body, current.mass));

    const joint = (bodyA: Matter.Body, bodyB: Matter.Body, pointA: Matter.Vector, pointB: Matter.Vector) =>
      Matter.Constraint.create({
        label: "ragdoll-joint",
        bodyA,
        bodyB,
        pointA,
        pointB,
        length: 4,
        stiffness: 0.78,
        damping: current.damping
      });

    const joints = [
      joint(head, torso, { x: 0, y: 22 }, { x: 0, y: -43 }),
      joint(leftArm, torso, { x: 0, y: -36 }, { x: -31, y: -32 }),
      joint(rightArm, torso, { x: 0, y: -36 }, { x: 31, y: -32 }),
      joint(leftLeg, torso, { x: 0, y: -42 }, { x: -18, y: 43 }),
      joint(rightLeg, torso, { x: 0, y: -42 }, { x: 18, y: 43 })
    ];

    const links: Matter.Body[] = [];
    const chainBodies: Matter.Body[] = [];
    const constraints: Matter.Constraint[] = [];
    const startX = width * 0.2;
    for (let index = 0; index < 8; index += 1) {
      const link = Matter.Bodies.rectangle(startX + index * 44, height * 0.18, 38, 20, makeBodyOptions(current, dynamicColors[index % dynamicColors.length]));
      setPhysicalMass(link, current.mass * 0.7);
      chainBodies.push(link);
      links.push(link);
      if (index === 0) {
        const anchor = Matter.Bodies.circle(startX - 28, height * 0.18, 7, {
          isStatic: true,
          plugin: { role: "anchor", color: "#eaf2ff" } satisfies BodyPlugin
        });
        links.push(anchor);
        constraints.push(
          Matter.Constraint.create({
            label: "ragdoll-joint",
            bodyA: anchor,
            bodyB: link,
            length: 30,
            stiffness: 0.86,
            damping: current.damping
          })
        );
      } else {
        constraints.push(
          Matter.Constraint.create({
            label: "ragdoll-joint",
            bodyA: chainBodies[index - 1],
            bodyB: link,
            length: 32,
            stiffness: 0.82,
            damping: current.damping
          })
        );
      }
    }

    Matter.Composite.add(engine.world, [...bodies, ...joints, ...links, ...constraints]);
  }, []);

  const resetScene = useCallback((nextExperiment?: ExperimentId) => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    const experiment = nextExperiment ?? settingsRef.current.experimentId;
    const current = settingsRef.current;
    const { width, height } = dimensionsRef.current;

    Matter.Composite.clear(engine.world, false, true);
    Matter.Engine.clear(engine);
    trailsRef.current.clear();
    collisionsRef.current = [];
    collisionCountRef.current = 0;
    streamParticlesRef.current = seedStreamParticles(width, height);
    fieldPointsRef.current = [];

    const useWalls = experiment !== "orbit-gravity";
    if (useWalls) {
      Matter.Composite.add(engine.world, createWalls(width, height));
    }

    engine.gravity.x = experiment === "orbit-gravity" || experiment === "magnet-field" ? 0 : current.gravityX;
    engine.gravity.y = experiment === "orbit-gravity" || experiment === "magnet-field" ? 0 : current.gravityY;
    engine.gravity.scale = experiment === "orbit-gravity" || experiment === "magnet-field" ? 0 : 0.001;

    if (experiment === "pendulum-spring") {
      addPendulumAndSpring(engine, width, height, current);
    } else if (experiment === "chain-ragdoll") {
      addRagdoll(engine, width, height, current);
    } else if (experiment === "collision-lab") {
      const left = createShape("ball", width * 0.24, height * 0.45, current, 1, 1.15);
      const right = createShape("box", width * 0.76, height * 0.45, current, 2, 1.2);
      setPhysicalMass(left, current.mass);
      setPhysicalMass(right, current.mass * 1.8);
      Matter.Body.setVelocity(left, { x: current.initialVelocity, y: -1.2 });
      Matter.Body.setVelocity(right, { x: -current.initialVelocity * 0.72, y: 0.6 });
      Matter.Composite.add(engine.world, [
        left,
        right,
        Matter.Bodies.rectangle(width * 0.5, height * 0.78, width * 0.54, 18, {
          isStatic: true,
          angle: -0.02,
          friction: 0.2,
          render: { fillStyle: "rgba(255,255,255,0.18)" },
          plugin: { role: "wall", color: "rgba(255,255,255,0.18)" } satisfies BodyPlugin
        })
      ]);
    } else if (experiment === "wind-aerodynamics") {
      for (let index = 0; index < 8; index += 1) {
        const body = createShape(index % 2 === 0 ? "capsule" : "box", width * (0.22 + index * 0.075), height * (0.2 + (index % 3) * 0.14), current, index);
        Matter.Body.setAngle(body, randomBetween(-0.55, 0.55));
        Matter.Composite.add(engine.world, body);
      }
    } else if (experiment === "orbit-gravity") {
      const star = Matter.Bodies.circle(width * 0.5, height * 0.5, 42, {
        isStatic: true,
        restitution: 1,
        render: { fillStyle: "#f6c85f" },
        plugin: { role: "attractor", color: "#f6c85f", drawRadius: 42 } satisfies BodyPlugin
      });
      const planetA = createShape("ball", width * 0.5, height * 0.25, current, 0, 0.78);
      const planetB = createShape("ball", width * 0.5, height * 0.76, current, 1, 0.62);
      const planetC = createShape("ball", width * 0.72, height * 0.5, current, 2, 0.52);
      setPhysicalMass(planetA, current.mass);
      setPhysicalMass(planetB, current.mass * 0.8);
      setPhysicalMass(planetC, current.mass * 0.48);
      Matter.Body.setVelocity(planetA, { x: current.initialVelocity, y: 0 });
      Matter.Body.setVelocity(planetB, { x: -current.initialVelocity * 0.78, y: 0 });
      Matter.Body.setVelocity(planetC, { x: 0, y: current.initialVelocity * 0.62 });
      Matter.Composite.add(engine.world, [star, planetA, planetB, planetC]);
    } else if (experiment === "magnet-field") {
      fieldPointsRef.current = [
        { x: width * 0.31, y: height * 0.42, charge: 1, label: "N" },
        { x: width * 0.69, y: height * 0.54, charge: -1, label: "S" }
      ];
      for (let index = 0; index < 12; index += 1) {
        const probe = createShape("ball", randomBetween(width * 0.2, width * 0.8), randomBetween(height * 0.18, height * 0.82), current, index, 0.42);
        getPlugin(probe).charge = index % 2 === 0 ? 1 : -1;
        getPlugin(probe).role = "probe";
        Matter.Composite.add(engine.world, probe);
      }
    } else {
      for (let index = 0; index < 10; index += 1) {
        Matter.Composite.add(
          engine.world,
          createShape(index % 3 === 0 ? "box" : "ball", randomBetween(width * 0.18, width * 0.82), randomBetween(80, height * 0.44), current, index)
        );
      }
    }

    if (mouseConstraintRef.current) {
      Matter.Composite.add(engine.world, mouseConstraintRef.current);
    }
    applyRuntimeBodySettings();
  }, [addPendulumAndSpring, addRagdoll, applyRuntimeBodySettings]);

  const applyExperimentForces = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    const current = settingsRef.current;
    const bodies = Matter.Composite.allBodies(engine.world);

    for (const body of bodies) {
      getPlugin(body).lastForce = { x: 0, y: 0 };
    }

    if (current.experimentId === "wind-aerodynamics") {
      const wind = current.windSpeed;
      for (const body of bodies) {
        const plugin = getPlugin(body);
        if (body.isStatic || plugin.role === "wall") {
          continue;
        }
        const area = Math.max(0.4, body.bounds.max.y - body.bounds.min.y) / 70;
        const drag = -body.velocity.x * 0.00028;
        const force = { x: wind * 0.00038 * area + drag, y: Math.sin(body.position.y * 0.022) * Math.abs(wind) * 0.000025 };
        Matter.Body.applyForce(body, body.position, force);
        plugin.lastForce = force;
      }
    }

    if (current.experimentId === "orbit-gravity") {
      const bodiesWithGravity = bodies.filter((body) => getPlugin(body).role !== "wall");
      for (let i = 0; i < bodiesWithGravity.length; i += 1) {
        for (let j = i + 1; j < bodiesWithGravity.length; j += 1) {
          const bodyA = bodiesWithGravity[i];
          const bodyB = bodiesWithGravity[j];
          const dx = bodyB.position.x - bodyA.position.x;
          const dy = bodyB.position.y - bodyA.position.y;
          const distanceSquared = clamp(dx * dx + dy * dy, 2800, 280000);
          const direction = normalize({ x: dx, y: dy });
          const massA = bodyA.isStatic ? 220 : bodyA.mass;
          const massB = bodyB.isStatic ? 220 : bodyB.mass;
          const magnitude = (current.orbitalGravity * massA * massB) / distanceSquared;
          const force = { x: direction.x * magnitude, y: direction.y * magnitude };
          if (!bodyA.isStatic) {
            Matter.Body.applyForce(bodyA, bodyA.position, force);
            getPlugin(bodyA).lastForce = Matter.Vector.add(getPlugin(bodyA).lastForce ?? { x: 0, y: 0 }, force);
          }
          if (!bodyB.isStatic) {
            const reverse = { x: -force.x, y: -force.y };
            Matter.Body.applyForce(bodyB, bodyB.position, reverse);
            getPlugin(bodyB).lastForce = Matter.Vector.add(getPlugin(bodyB).lastForce ?? { x: 0, y: 0 }, reverse);
          }
        }
      }
    }

    if (current.experimentId === "magnet-field") {
      for (const body of bodies) {
        const plugin = getPlugin(body);
        if (body.isStatic || plugin.role === "wall") {
          continue;
        }
        const charge = plugin.charge ?? 1;
        let total = { x: 0, y: 0 };
        for (const point of fieldPointsRef.current) {
          const dx = point.x - body.position.x;
          const dy = point.y - body.position.y;
          const distanceSquared = clamp(dx * dx + dy * dy, 2200, 220000);
          const direction = normalize({ x: dx, y: dy });
          const sign = charge * point.charge > 0 ? -1 : 1;
          const magnitude = (current.fieldStrength * sign * 1.8) / distanceSquared;
          const force = { x: direction.x * magnitude, y: direction.y * magnitude };
          total = Matter.Vector.add(total, force);
        }
        Matter.Body.applyForce(body, body.position, total);
        plugin.lastForce = total;
      }
    }
  }, []);

  const updateTrails = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    const current = settingsRef.current;
    if (!current.showTrails) {
      trailsRef.current.clear();
      return;
    }
    const dynamicBodies = Matter.Composite.allBodies(engine.world).filter((body) => !body.isStatic && getPlugin(body).role !== "wall");
    for (const body of dynamicBodies) {
      const trail = trailsRef.current.get(body.id) ?? [];
      trail.push({ x: body.position.x, y: body.position.y });
      if (trail.length > 96) {
        trail.shift();
      }
      trailsRef.current.set(body.id, trail);
    }
  }, []);

  const stepSimulation = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    applyRuntimeBodySettings();
    applyExperimentForces();
    Matter.Engine.update(engine, FIXED_TIMESTEP_MS);
    updateTrails();
  }, [applyExperimentForces, applyRuntimeBodySettings, updateTrails]);

  const drawBackground = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#07111d");
    gradient.addColorStop(0.48, "#0d1820");
    gradient.addColorStop(1, "#141119");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.strokeStyle = "rgba(136, 165, 190, 0.09)";
    context.lineWidth = 1;
    for (let x = 0; x <= width; x += 48) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y <= height; y += 48) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.strokeStyle = "rgba(101, 214, 200, 0.14)";
    context.strokeRect(16, 16, width - 32, height - 32);
    context.restore();
  }, []);

  const drawStreamParticles = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => {
    const current = settingsRef.current;
    if (current.experimentId !== "wind-aerodynamics") {
      return;
    }
    const wind = current.windSpeed;
    const speed = Math.max(0.5, Math.abs(wind));
    context.save();
    const nextParticles = streamParticlesRef.current.map((particle) => {
      const nextX = particle.x + speed * particle.speed * 0.9;
      const wrapped = nextX > width + 40;
      return {
        ...particle,
        x: wrapped ? -40 : nextX,
        y: wrapped ? randomBetween(36, height - 36) : particle.y + Math.sin(tickRef.current * 0.03 + particle.phase) * 0.35
      };
    });
    streamParticlesRef.current = nextParticles;

    for (const particle of nextParticles) {
      context.strokeStyle = `rgba(101, 214, 200, ${0.16 + speed * 0.018})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(particle.x - 34, particle.y);
      context.lineTo(particle.x, particle.y);
      context.stroke();
    }
    context.restore();
  }, []);

  const drawFieldLines = useCallback((context: CanvasRenderingContext2D) => {
    const current = settingsRef.current;
    if (current.experimentId !== "magnet-field") {
      return;
    }

    context.save();
    for (const point of fieldPointsRef.current) {
      context.fillStyle = point.charge > 0 ? "#ff7b8a" : "#65d6c8";
      context.strokeStyle = point.charge > 0 ? "rgba(255, 123, 138, 0.42)" : "rgba(101, 214, 200, 0.42)";
      context.lineWidth = 1.2;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const radius = 32;
        const end = {
          x: point.x + Math.cos(angle) * (130 + current.fieldStrength * 95),
          y: point.y + Math.sin(angle) * (130 + current.fieldStrength * 95)
        };
        context.beginPath();
        context.moveTo(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius);
        context.quadraticCurveTo(
          point.x + Math.cos(angle + 0.45 * point.charge) * 86,
          point.y + Math.sin(angle + 0.45 * point.charge) * 86,
          end.x,
          end.y
        );
        context.stroke();
      }
      context.beginPath();
      context.arc(point.x, point.y, 28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#07111d";
      context.font = "700 16px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(point.label, point.x, point.y);
    }
    context.restore();
  }, []);

  const drawTrails = useCallback((context: CanvasRenderingContext2D) => {
    if (!settingsRef.current.showTrails) {
      return;
    }
    context.save();
    for (const trail of trailsRef.current.values()) {
      if (trail.length < 3) {
        continue;
      }
      context.lineWidth = 1.4;
      for (let index = 1; index < trail.length; index += 1) {
        const alpha = index / trail.length;
        context.strokeStyle = `rgba(246, 200, 95, ${alpha * 0.34})`;
        context.beginPath();
        context.moveTo(trail[index - 1].x, trail[index - 1].y);
        context.lineTo(trail[index].x, trail[index].y);
        context.stroke();
      }
    }
    context.restore();
  }, []);

  const drawConstraints = useCallback((context: CanvasRenderingContext2D, constraints: Matter.Constraint[]) => {
    context.save();
    for (const constraint of constraints) {
      const bodyA = constraint.bodyA;
      const bodyB = constraint.bodyB;
      const pointA = bodyA
        ? Matter.Vector.add(bodyA.position, constraint.pointA)
        : constraint.pointA;
      const pointB = bodyB
        ? Matter.Vector.add(bodyB.position, constraint.pointB)
        : constraint.pointB;
      if (!pointA || !pointB) {
        continue;
      }
      const isSpring = constraint.label === "spring";
      context.strokeStyle = isSpring ? "rgba(101, 214, 200, 0.72)" : "rgba(234, 242, 255, 0.42)";
      context.lineWidth = isSpring ? 2.2 : 1.5;
      if (isSpring) {
        const segments = 16;
        const dx = pointB.x - pointA.x;
        const dy = pointB.y - pointA.y;
        const normal = normalize({ x: -dy, y: dx });
        context.beginPath();
        context.moveTo(pointA.x, pointA.y);
        for (let index = 1; index < segments; index += 1) {
          const t = index / segments;
          const wiggle = (index % 2 === 0 ? -1 : 1) * 9;
          context.lineTo(pointA.x + dx * t + normal.x * wiggle, pointA.y + dy * t + normal.y * wiggle);
        }
        context.lineTo(pointB.x, pointB.y);
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(pointA.x, pointA.y);
        context.lineTo(pointB.x, pointB.y);
        context.stroke();
      }
    }
    context.restore();
  }, []);

  const drawBodies = useCallback((context: CanvasRenderingContext2D, bodies: Matter.Body[]) => {
    const current = settingsRef.current;
    for (const body of bodies) {
      const plugin = getPlugin(body);
      if (plugin.role === "wall") {
        context.fillStyle = plugin.color ?? "rgba(119,154,190,0.18)";
      } else {
        context.fillStyle = plugin.color ?? body.render.fillStyle ?? "#65d6c8";
      }
      context.strokeStyle = body.isSleeping ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.42)";
      context.lineWidth = plugin.role === "attractor" ? 2.4 : 1;

      if (body.circleRadius) {
        context.beginPath();
        context.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      } else {
        context.beginPath();
        body.vertices.forEach((vertex, index) => {
          if (index === 0) {
            context.moveTo(vertex.x, vertex.y);
          } else {
            context.lineTo(vertex.x, vertex.y);
          }
        });
        context.closePath();
        context.fill();
        context.stroke();
      }

      if (plugin.role !== "wall") {
        context.fillStyle = "rgba(234, 242, 255, 0.86)";
        context.beginPath();
        context.arc(body.position.x, body.position.y, 3.2, 0, Math.PI * 2);
        context.fill();
      }

      if (current.debug && !body.isStatic && plugin.role !== "wall") {
        context.fillStyle = "rgba(7, 17, 29, 0.68)";
        context.font = "600 10px Inter, sans-serif";
        context.textAlign = "center";
        context.fillText(`${body.mass.toFixed(1)}kg`, body.position.x, body.position.y - 8);
      }

      if (current.showVectors && !body.isStatic && plugin.role !== "wall") {
        drawArrow(
          context,
          body.position.x,
          body.position.y,
          body.position.x + body.velocity.x * 8,
          body.position.y + body.velocity.y * 8,
          "rgba(106, 169, 255, 0.78)",
          1.6
        );
      }

      if (current.showForces && plugin.lastForce && !body.isStatic && plugin.role !== "wall") {
        const scale = current.experimentId === "orbit-gravity" || current.experimentId === "magnet-field" ? 160000 : 18000;
        drawArrow(
          context,
          body.position.x,
          body.position.y,
          body.position.x + plugin.lastForce.x * scale,
          body.position.y + plugin.lastForce.y * scale,
          "rgba(104, 211, 145, 0.72)",
          1.4
        );
      }
    }
  }, []);

  const drawCollisions = useCallback((context: CanvasRenderingContext2D) => {
    context.save();
    collisionsRef.current = collisionsRef.current
      .map((collision) => ({ ...collision, life: collision.life - 1 }))
      .filter((collision) => collision.life > 0);
    for (const collision of collisionsRef.current) {
      const alpha = collision.life / 34;
      context.strokeStyle = `rgba(255, 123, 138, ${alpha})`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(collision.x, collision.y, 8 + collision.impulse * 0.9 + (1 - alpha) * 24, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const { width, height } = dimensionsRef.current;

    context.clearRect(0, 0, width, height);
    drawBackground(context, width, height);
    drawStreamParticles(context, width, height);
    drawFieldLines(context);
    drawTrails(context);
    drawConstraints(context, Matter.Composite.allConstraints(engine.world));
    drawBodies(context, Matter.Composite.allBodies(engine.world));
    drawCollisions(context);
  }, [drawBackground, drawBodies, drawCollisions, drawConstraints, drawFieldLines, drawStreamParticles, drawTrails]);

  const publishMetrics = useCallback((fps: number) => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    const bodies = Matter.Composite.allBodies(engine.world);
    setMetrics({
      fps,
      bodyCount: bodies.filter((body) => getPlugin(body).role !== "wall").length,
      constraintCount: Matter.Composite.allConstraints(engine.world).length,
      timestep: FIXED_TIMESTEP_MS,
      collisions: collisionCountRef.current,
      kineticEnergy: bodies.reduce((total, body) => total + kineticEnergy(body), 0)
    });
  }, [setMetrics]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const engine = Matter.Engine.create({
      enableSleeping: true,
      constraintIterations: 4,
      positionIterations: 8,
      velocityIterations: 6
    });
    engineRef.current = engine;

    const mouse = Matter.Mouse.create(canvas);
    const mouseWithRatio = mouse as Matter.Mouse & { pixelRatio: number };
    mouseWithRatio.pixelRatio = window.devicePixelRatio || 1;
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.18,
        damping: 0.04,
        render: { visible: false }
      }
    });
    mouseConstraintRef.current = mouseConstraint;

    const collisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const supports = pair.collision.supports;
        const point = supports.length > 0 ? supports[0] : pair.bodyA.position;
        const impulse = Matter.Vector.magnitude(Matter.Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity));
        collisionsRef.current.push({ x: point.x, y: point.y, life: 34, impulse: clamp(impulse, 0.5, 18) });
        collisionCountRef.current += 1;
      }
    };
    Matter.Events.on(engine, "collisionStart", collisionHandler);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(640, rect.width);
      const height = Math.max(460, rect.height);
      dimensionsRef.current = { width, height };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const context = canvas.getContext("2d");
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      mouseWithRatio.pixelRatio = dpr;
      resetScene(settingsRef.current.experimentId);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = (time: number) => {
      tickRef.current += 1;
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const delta = Math.min(50, time - lastTimeRef.current);
      lastTimeRef.current = time;
      fpsFramesRef.current += 1;
      fpsTimeRef.current += delta;

      if (!settingsRef.current.paused) {
        accumulatorRef.current += delta;
        while (accumulatorRef.current >= FIXED_TIMESTEP_MS) {
          stepSimulation();
          accumulatorRef.current -= FIXED_TIMESTEP_MS;
        }
      }

      if (fpsTimeRef.current >= 300) {
        publishMetrics((fpsFramesRef.current * 1000) / fpsTimeRef.current);
        fpsFramesRef.current = 0;
        fpsTimeRef.current = 0;
      }

      draw();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      Matter.Events.off(engine, "collisionStart", collisionHandler);
      Matter.Composite.clear(engine.world, false, true);
      Matter.Engine.clear(engine);
      engineRef.current = null;
      mouseConstraintRef.current = null;
    };
  }, [draw, publishMetrics, resetScene, stepSimulation]);

  useEffect(() => {
    applyRuntimeBodySettings();
  }, [applyRuntimeBodySettings, settings]);

  useEffect(() => {
    resetScene(experimentId);
  }, [experimentId, resetScene, resetSignal]);

  useEffect(() => {
    if (spawnSignal > 0) {
      spawnBody();
    }
  }, [spawnBody, spawnSignal]);

  useEffect(() => {
    if (stepSignal > 0) {
      stepSimulation();
      draw();
    }
  }, [draw, stepSignal, stepSimulation]);

  return <canvas ref={canvasRef} className="h-full min-h-[520px] w-full cursor-crosshair touch-none" aria-label="Matter.js physics simulation canvas" />;
}
