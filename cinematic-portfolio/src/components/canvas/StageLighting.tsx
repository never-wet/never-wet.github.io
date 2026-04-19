import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { PointLight, Vector3 } from "three";
import { useSite } from "@/app/SiteProvider";
import { objectById } from "@/memory/contentRegistry";
import { dampVector3 } from "@/utils/math";

const defaultAccentPosition = new Vector3(0, 5.8, 8.5);
const singularityLightPosition = new Vector3(14.5, 6.4, -34);

export function StageLighting() {
  const { activeProject } = useSite();
  const accentLightRef = useRef<PointLight>(null);
  const singularityLightRef = useRef<PointLight>(null);
  const tempVector = useRef(defaultAccentPosition.clone());

  useFrame((state, delta) => {
    if (!accentLightRef.current) {
      return;
    }

    const anchor = activeProject ? objectById[activeProject.objectId] : null;
    tempVector.current.set(
      anchor ? anchor.position[0] + 1.8 : defaultAccentPosition.x,
      anchor ? anchor.position[1] + 3.4 : defaultAccentPosition.y,
      anchor ? anchor.position[2] + 2.8 : defaultAccentPosition.z,
    );

    dampVector3(accentLightRef.current.position, tempVector.current, 2.5, delta);
    accentLightRef.current.color.set(activeProject?.accentLighting.primary ?? "#88b7ff");

    if (singularityLightRef.current) {
      singularityLightRef.current.intensity =
        14.8 + Math.sin(state.clock.elapsedTime * 0.42) * 2.2;
      singularityLightRef.current.color.set(activeProject?.accentLighting.rim ?? "#8fd6ff");
    }
  });

  return (
    <>
      <ambientLight intensity={0.34} color="#abc4ff" />
      <hemisphereLight intensity={0.42} color="#e1f0ff" groundColor="#050711" />
      <directionalLight
        castShadow
        position={[5.2, 9.5, 6.1]}
        intensity={2.05}
        color="#e9f3ff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={48}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <pointLight
        ref={accentLightRef}
        castShadow
        position={[0, 5.8, 8.5]}
        intensity={22}
        distance={52}
        decay={2}
      />
      <pointLight
        ref={singularityLightRef}
        position={singularityLightPosition}
        intensity={14.8}
        color="#8fd6ff"
        distance={84}
        decay={1.55}
      />
      <pointLight position={[-9, 3.5, -16]} intensity={9.5} color="#84d1ff" distance={34} />
      <pointLight position={[8, 2.4, -8]} intensity={8.6} color="#f6c07e" distance={28} />
    </>
  );
}
