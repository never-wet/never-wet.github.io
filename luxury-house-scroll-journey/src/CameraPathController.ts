import { MathUtils, Vector3 } from "three";

export type VectorTuple = [number, number, number];

export type CameraKeyframe = {
  id: string;
  progress: number;
  position: VectorTuple;
  target: VectorTuple;
  fov: number;
};

export type CameraSample = {
  position: Vector3;
  target: Vector3;
  fov: number;
};

export const cameraPath: CameraKeyframe[] = [
  {
    id: "gate",
    progress: 0,
    position: [0, 2.35, 18.2],
    target: [0, 1.55, 8.6],
    fov: 42,
  },
  {
    id: "through-gate",
    progress: 0.15,
    position: [0, 2.25, 9.6],
    target: [0, 1.2, 0.2],
    fov: 44,
  },
  {
    id: "driveway",
    progress: 0.3,
    position: [0.3, 2.08, 1.2],
    target: [0.1, 1.5, -11.8],
    fov: 43,
  },
  {
    id: "exterior-reveal",
    progress: 0.44,
    position: [6.1, 3.05, -7.2],
    target: [0.3, 2.3, -16.2],
    fov: 48,
  },
  {
    id: "front-door",
    progress: 0.56,
    position: [0.35, 1.85, -12.0],
    target: [0.05, 1.45, -18.8],
    fov: 39,
  },
  {
    id: "living-room",
    progress: 0.7,
    position: [-0.4, 1.74, -21.8],
    target: [0.1, 1.42, -30.4],
    fov: 43,
  },
  {
    id: "feature-rooms",
    progress: 0.84,
    position: [4.75, 1.82, -31.2],
    target: [7.15, 1.24, -39.2],
    fov: 45,
  },
  {
    id: "suite",
    progress: 0.92,
    position: [-4.55, 1.88, -39.4],
    target: [-5.8, 1.35, -47.4],
    fov: 44,
  },
  {
    id: "final",
    progress: 1,
    position: [0.15, 2.28, -50.6],
    target: [0, 1.52, -58.2],
    fov: 41,
  },
];

const scratchStartPosition = new Vector3();
const scratchEndPosition = new Vector3();
const scratchStartTarget = new Vector3();
const scratchEndTarget = new Vector3();

export function sampleCameraPath(progress: number): CameraSample {
  const clamped = MathUtils.clamp(progress, 0, 1);
  const startIndex = getSegmentStartIndex(clamped);
  const start = cameraPath[startIndex];
  const end = cameraPath[Math.min(startIndex + 1, cameraPath.length - 1)];
  const span = Math.max(end.progress - start.progress, 0.0001);
  const localProgress = MathUtils.clamp((clamped - start.progress) / span, 0, 1);
  const eased = smoothstep(localProgress);

  scratchStartPosition.fromArray(start.position);
  scratchEndPosition.fromArray(end.position);
  scratchStartTarget.fromArray(start.target);
  scratchEndTarget.fromArray(end.target);

  return {
    position: scratchStartPosition.clone().lerp(scratchEndPosition, eased),
    target: scratchStartTarget.clone().lerp(scratchEndTarget, eased),
    fov: MathUtils.lerp(start.fov, end.fov, eased),
  };
}

function getSegmentStartIndex(progress: number) {
  for (let index = cameraPath.length - 2; index >= 0; index -= 1) {
    if (progress >= cameraPath[index].progress) {
      return index;
    }
  }

  return 0;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}
