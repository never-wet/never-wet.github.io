export type SpinPlan = {
  selectedIndex: number;
  targetRotation: number;
  initialVelocity: number;
  friction: number;
  startedAt: number;
  maxDuration: number;
};

export type SpinFrame = {
  rotation: number;
  velocity: number;
  complete: boolean;
};

export const TAU = Math.PI * 2;
export const POINTER_ANGLE = -Math.PI / 2;

export function normalizeAngle(angle: number) {
  return ((angle % TAU) + TAU) % TAU;
}

export function randomInt(maxExclusive: number) {
  const cryptoObject = typeof crypto !== "undefined" ? crypto : undefined;
  if (cryptoObject?.getRandomValues) {
    const buffer = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;

    do {
      cryptoObject.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return buffer[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

export function getIndexAtPointer(rotation: number, itemCount: number) {
  if (itemCount <= 0) return -1;

  const segmentAngle = TAU / itemCount;
  const localPointerAngle = normalizeAngle(POINTER_ANGLE - rotation - POINTER_ANGLE);
  return Math.floor(localPointerAngle / segmentAngle) % itemCount;
}

export function createSpinPlan(itemCount: number, currentRotation: number): SpinPlan {
  if (itemCount < 2) {
    throw new Error("At least two wheel options are required.");
  }

  const selectedIndex = randomInt(itemCount);
  const segmentAngle = TAU / itemCount;
  const landingOffset = segmentAngle * (0.24 + Math.random() * 0.52);
  const desiredModulo = normalizeAngle(-(selectedIndex * segmentAngle + landingOffset));
  const currentModulo = normalizeAngle(currentRotation);
  const fullTurns = 5 + randomInt(3);
  const delta = fullTurns * TAU + normalizeAngle(desiredModulo - currentModulo);
  const friction = 0.976 + Math.random() * 0.004;
  const initialVelocity = delta * (1 - friction);

  return {
    selectedIndex,
    targetRotation: currentRotation + delta,
    initialVelocity,
    friction,
    startedAt: performance.now(),
    maxDuration: 7000,
  };
}

export function advanceSpin(
  rotation: number,
  velocity: number,
  plan: SpinPlan,
  deltaMs: number,
  now: number,
): SpinFrame {
  const frameUnits = Math.max(0.1, Math.min(deltaMs / (1000 / 60), 8));
  const frictionPower = plan.friction ** frameUnits;
  const distance = velocity * ((1 - frictionPower) / (1 - plan.friction));
  const nextRotation = rotation + distance;
  const nextVelocity = velocity * frictionPower;
  const remaining = plan.targetRotation - nextRotation;
  const shouldClamp =
    remaining <= 0.001 ||
    nextVelocity < 0.0009 ||
    now - plan.startedAt > plan.maxDuration;

  if (shouldClamp) {
    return {
      rotation: plan.targetRotation,
      velocity: 0,
      complete: true,
    };
  }

  return {
    rotation: nextRotation,
    velocity: nextVelocity,
    complete: false,
  };
}
