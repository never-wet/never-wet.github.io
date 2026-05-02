"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clampToWorld, getEntrancePoint, INTERACTION_RADIUS, WORLD_BUILDINGS } from "../lib/navigationSystem";
import { useWorldStore } from "../store/useWorldStore";

export type PlayerControllerOptions = {
  playerRef: MutableRefObject<THREE.Group | null>;
  lookTarget: MutableRefObject<THREE.Vector3>;
};

export function usePlayerController({ playerRef, lookTarget }: PlayerControllerOptions) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const playerPosition = useRef(new THREE.Vector3(0, 0, 1.8));
  const targetPosition = useRef<THREE.Vector3 | null>(null);
  const cameraYaw = useRef(0.72);
  const cameraPitch = useRef(0.58);
  const cameraDistance = useRef(13.8);
  const playerFacing = useRef(0);
  const setNearbyBuilding = useWorldStore((state) => state.setNearbyBuilding);
  const setPlayerPosition = useWorldStore((state) => state.setPlayerPosition);
  const cameraLocked = useWorldStore((state) => state.cameraLocked);

  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase());
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04);

    if (!cameraLocked) {
      movePlayer(dt);
      findNearbyBuilding();
      updateCamera(dt);
    }

    if (playerRef.current) {
      playerRef.current.position.copy(playerPosition.current);
      playerRef.current.rotation.y = lerpAngle(playerRef.current.rotation.y, playerFacing.current, 1 - Math.pow(0.001, dt));
    }

    setPlayerPosition(playerPosition.current.toArray() as [number, number, number]);
  });

  return {
    playerPosition,
    targetPosition,
    cameraYaw,
    cameraPitch,
    cameraDistance,
    walkTo(point: THREE.Vector3) {
      targetPosition.current = clampToWorld(point.clone());
    }
  };

  function movePlayer(dt: number) {
    const input = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(cameraYaw.current), 0, -Math.cos(cameraYaw.current));
    const right = new THREE.Vector3(Math.cos(cameraYaw.current), 0, -Math.sin(cameraYaw.current));

    if (keys.current.has("w") || keys.current.has("arrowup")) input.add(forward);
    if (keys.current.has("s") || keys.current.has("arrowdown")) input.sub(forward);
    if (keys.current.has("d") || keys.current.has("arrowright")) input.add(right);
    if (keys.current.has("a") || keys.current.has("arrowleft")) input.sub(right);

    if (input.lengthSq() > 0.0001) {
      input.normalize();
      targetPosition.current = null;
      playerPosition.current.addScaledVector(input, (keys.current.has("shift") ? 8 : 5.1) * dt);
      playerFacing.current = Math.atan2(input.x, input.z);
      clampToWorld(playerPosition.current);
      return;
    }

    if (!targetPosition.current) return;

    const toTarget = targetPosition.current.clone().sub(playerPosition.current).setY(0);
    const distance = toTarget.length();
    if (distance < 0.16) {
      playerPosition.current.copy(targetPosition.current);
      targetPosition.current = null;
      return;
    }

    toTarget.normalize();
    playerPosition.current.addScaledVector(toTarget, Math.min(distance, 4.6 * dt));
    playerFacing.current = Math.atan2(toTarget.x, toTarget.z);
    clampToWorld(playerPosition.current);
  }

  function findNearbyBuilding() {
    let nearbyId: string | null = null;
    let nearest = Infinity;

    WORLD_BUILDINGS.forEach((building) => {
      const entrance = getEntrancePoint(building);
      const distance = entrance.distanceTo(playerPosition.current);
      if (distance < nearest) {
        nearest = distance;
        nearbyId = building.id;
      }
    });

    setNearbyBuilding(nearest < INTERACTION_RADIUS ? nearbyId : null);
  }

  function updateCamera(dt: number) {
    const horizontal = Math.cos(cameraPitch.current) * cameraDistance.current;
    const desired = new THREE.Vector3(
      playerPosition.current.x + Math.sin(cameraYaw.current) * horizontal,
      playerPosition.current.y + Math.sin(cameraPitch.current) * cameraDistance.current + 1.8,
      playerPosition.current.z + Math.cos(cameraYaw.current) * horizontal
    );
    camera.position.lerp(desired, 1 - Math.pow(0.002, dt));
    lookTarget.current.lerp(playerPosition.current.clone().setY(1.25), 1 - Math.pow(0.001, dt));
    camera.lookAt(lookTarget.current);
  }
}

function lerpAngle(a: number, b: number, t: number) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
}
