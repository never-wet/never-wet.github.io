import {
  CelestialBody,
  PhysicsOptions,
  add,
  cloneBody,
  cloneVector,
  computeAccelerations,
  scale,
} from "./NBodyEngine";

export type IntegratorResult = {
  bodies: CelestialBody[];
  maxAcceleration: number;
};

export function velocityVerletStep(
  inputBodies: CelestialBody[],
  dtDays: number,
  options: PhysicsOptions,
): IntegratorResult {
  const bodies = inputBodies.map(cloneBody);
  const previous = computeAccelerations(bodies, options).accelerations;
  const predicted = bodies.map((body, index) => ({
    ...body,
    position: add(
      add(body.position, scale(body.velocity, dtDays)),
      scale(previous[index], 0.5 * dtDays * dtDays),
    ),
  }));
  const nextAccelerationsResult = computeAccelerations(predicted, options);
  const nextBodies = predicted.map((body, index) => {
    const velocity = add(
      body.velocity,
      scale(add(previous[index], nextAccelerationsResult.accelerations[index]), 0.5 * dtDays),
    );
    const trail = [...body.trail, cloneVector(body.position)].slice(-options.trailLength);

    return {
      ...body,
      velocity,
      acceleration: nextAccelerationsResult.accelerations[index],
      trail,
    };
  });

  return {
    bodies: nextBodies,
    maxAcceleration: nextAccelerationsResult.diagnostics.maxAcceleration,
  };
}

export function initializeAccelerations(
  bodies: CelestialBody[],
  options: PhysicsOptions,
): CelestialBody[] {
  const accelerations = computeAccelerations(bodies, options).accelerations;
  return bodies.map((body, index) => ({
    ...body,
    acceleration: accelerations[index],
  }));
}
