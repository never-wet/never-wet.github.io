import gsap from "gsap";
import * as THREE from "three";
import {
  BuildingDestination,
  INTERACTION_RADIUS,
  WORLD_BUILDINGS,
  WORLD_LIMIT,
  getBuildingById
} from "./worldData";

export { INTERACTION_RADIUS, WORLD_BUILDINGS, WORLD_LIMIT, getBuildingById };
export type { BuildingDestination };

export function getEntrancePoint(destination: BuildingDestination, group?: THREE.Object3D) {
  const [, , depth] = destination.size;
  const localPoint = new THREE.Vector3(0, 0, -depth / 2 - 0.74);

  if (group) {
    return group.localToWorld(localPoint);
  }

  const worldPoint = new THREE.Vector3(...destination.position);
  const facingCenter = worldPoint.clone().multiplyScalar(-1).setY(0).normalize();
  return worldPoint.addScaledVector(facingCenter, depth / 2 + 0.74);
}

export function clampToWorld(point: THREE.Vector3) {
  point.x = THREE.MathUtils.clamp(point.x, -WORLD_LIMIT, WORLD_LIMIT);
  point.z = THREE.MathUtils.clamp(point.z, -WORLD_LIMIT, WORLD_LIMIT);
  point.y = 0;
  return point;
}

export function runPortalTransition(args: {
  camera: THREE.Camera;
  lookTarget: THREE.Vector3;
  destination: BuildingDestination;
  entrance: THREE.Vector3;
  focus: THREE.Vector3;
  overlay: HTMLElement | null;
  onComplete: () => void;
}) {
  const { camera, lookTarget, destination, entrance, focus, overlay, onComplete } = args;
  const frontDirection = entrance.clone().sub(new THREE.Vector3(...destination.position)).setY(0).normalize();
  const endPosition = entrance.clone().addScaledVector(frontDirection, 1.08);
  endPosition.y = 1.36;

  const timeline = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete
  });

  if (overlay) {
    timeline.to(overlay, { opacity: 0.98, duration: 0.52 }, 0.42);
  }

  timeline.to(
    camera.position,
    {
      x: endPosition.x,
      y: endPosition.y,
      z: endPosition.z,
      duration: 1.16,
      onUpdate: () => camera.lookAt(focus)
    },
    0
  );

  timeline.to(
    lookTarget,
    {
      x: focus.x,
      y: focus.y,
      z: focus.z,
      duration: 1.16,
      onUpdate: () => camera.lookAt(lookTarget)
    },
    0
  );

  return timeline;
}
