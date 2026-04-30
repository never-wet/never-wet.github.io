export type MotionPose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  confidence: number;
};

export type MotionFeatureSample = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

export type EstimatedMotion = {
  dx: number;
  dy: number;
  rotation: number;
  magnitude: number;
  directionLabel: string;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function getMotionDirectionLabel(dx: number, dy: number, magnitude: number) {
  if (magnitude < 0.4) return "Hold steady";
  if (Math.abs(dx) > Math.abs(dy) * 1.25) return dx > 0 ? "Panning right" : "Panning left";
  return dy > 0 ? "Tilting down" : "Tilting up";
}

export function estimateMotionFromFeatures(features: MotionFeatureSample[], width: number, height: number): EstimatedMotion {
  const avgDx = features.reduce((sum, feature) => sum + feature.dx, 0) / Math.max(1, features.length);
  const avgDy = features.reduce((sum, feature) => sum + feature.dy, 0) / Math.max(1, features.length);
  const rotation =
    features.reduce((sum, feature) => {
      const horizontalOffset = feature.x / width - 0.5;
      const verticalOffset = feature.y / height - 0.5;
      return sum + horizontalOffset * feature.dy * 0.003 - verticalOffset * feature.dx * 0.0011 - feature.dx * 0.0007;
    }, 0) / Math.max(1, features.length);
  const magnitude = Math.hypot(avgDx, avgDy);

  return {
    dx: avgDx,
    dy: avgDy,
    rotation,
    magnitude,
    directionLabel: getMotionDirectionLabel(avgDx, avgDy, magnitude),
  };
}

export function integrateCameraPose(pose: MotionPose, motion: EstimatedMotion, width: number, height: number) {
  const nextPose = { ...pose };
  const normalizedPan = clamp(-motion.dx / width, -0.055, 0.055);
  const normalizedTilt = clamp(motion.dy / height, -0.04, 0.055);
  const motionEnergy = clamp(motion.magnitude / Math.max(width, height), 0, 0.08);
  const lateralStep = normalizedPan * 2.45;
  const forwardStep = motionEnergy * 1.55 + Math.max(0, normalizedTilt) * 0.75;
  const cos = Math.cos(nextPose.yaw);
  const sin = Math.sin(nextPose.yaw);

  nextPose.x += lateralStep * cos + forwardStep * sin;
  nextPose.z += -lateralStep * sin + forwardStep * cos;
  nextPose.yaw += clamp(-motion.dx / width, -0.028, 0.028) + motion.rotation;
  nextPose.pitch = nextPose.pitch * 0.78 + clamp(motion.dy / height, -0.22, 0.22);
  nextPose.roll = nextPose.roll * 0.82 + clamp(motion.rotation * 2.4, -0.18, 0.18);

  return nextPose;
}
