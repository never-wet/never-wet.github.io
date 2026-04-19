import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { useSite } from "@/app/SiteProvider";
import { getJourneyCameraAnchor, getProjectCamera, sampleJourneyCamera } from "@/animation/cameraPaths";
import { damp, dampVector3 } from "@/utils/math";

export function ScrollCameraRig() {
  const { activeProjectId, activeScene, projectBlendRef, reducedMotion, scrollProgress } = useSite();
  const lookAtVector = useRef(new Vector3());
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());

  const sceneAnchor = useMemo(
    () => getJourneyCameraAnchor(activeScene.cameraAnchorId),
    [activeScene.cameraAnchorId],
  );

  useFrame(({ camera, pointer }, delta) => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }

    const sampledJourney = sampleJourneyCamera(scrollProgress);
    targetPosition.current.copy(sampledJourney.position);
    targetLookAt.current.copy(sampledJourney.target);

    const projectBlend = projectBlendRef.current.value;
    const projectCamera = activeProjectId ? getProjectCamera(activeProjectId) : null;

    if (projectCamera) {
      const projectPosition = new Vector3(
        projectCamera.position[0],
        projectCamera.position[1],
        projectCamera.position[2],
      );
      const projectTarget = new Vector3(
        projectCamera.target[0],
        projectCamera.target[1],
        projectCamera.target[2],
      );

      targetPosition.current.lerp(projectPosition, projectBlend);
      targetLookAt.current.lerp(projectTarget, projectBlend);
    }

    const pointerOffset = reducedMotion ? 0 : activeProjectId ? 0.34 : 0.16;
    targetPosition.current.x += pointer.x * pointerOffset;
    targetPosition.current.y += pointer.y * pointerOffset * 0.6;

    dampVector3(camera.position, targetPosition.current, activeProjectId ? 3.6 : 2.6, delta);
    dampVector3(lookAtVector.current, targetLookAt.current, 3.2, delta);
    camera.lookAt(lookAtVector.current);

    const targetFov = projectCamera ? projectCamera.fov : sceneAnchor?.fov ?? 36;
    camera.fov = damp(camera.fov, targetFov, 3, delta);
    camera.updateProjectionMatrix();
  });

  return null;
}
