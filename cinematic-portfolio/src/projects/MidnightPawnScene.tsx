import { Float, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useSite } from "@/app/SiteProvider";
import { useAudio } from "@/audio/AudioProvider";
import { FloatingIsland } from "@/objects/FloatingIsland";
import { MidnightPawnIcon } from "@/objects/ProjectIcons";
import { projectById, objectById } from "@/memory/contentRegistry";

const project = projectById["midnight-pawn"];
const anchor = objectById[project.objectId];
const previewUrl = "./media/midnight-pawn-preview.svg";

export function MidnightPawnScene() {
  const { activeProjectId, hoveredProjectId, openProject, projectBlendRef, setHoveredProjectId } =
    useSite();
  const { requestAudioStart, triggerCue } = useAudio();
  const groupRef = useRef<Group>(null);
  const iconRef = useRef<Group>(null);

  const active = activeProjectId === project.id;
  const hovered = hoveredProjectId === project.id;
  useCursor(hovered);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const icon = iconRef.current;
    if (!group || !icon) {
      return;
    }

    const openAmount = active ? projectBlendRef.current.value : 0;
    group.position.y = anchor.position[1] + Math.sin(state.clock.elapsedTime * 0.55) * 0.07;
    group.rotation.y = anchor.rotation[1] + Math.sin(state.clock.elapsedTime * 0.28) * 0.08;
    icon.rotation.y += delta * (0.11 + openAmount * 0.05);
    const scale = anchor.scale * (1 + (hovered ? 0.04 : 0) + openAmount * 0.05);
    group.scale.setScalar(scale);
  });

  return (
    <group
      ref={groupRef}
      position={anchor.position}
      rotation={anchor.rotation}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHoveredProjectId(project.id);
        triggerCue(project.soundCueIds.hover);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHoveredProjectId(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        requestAudioStart();
        triggerCue(project.soundCueIds.open);
        openProject(project.id);
      }}
    >
      <FloatingIsland radius={anchor.islandRadius} tint="#130f13" emissive="#523620" />
      <Float speed={1.05} rotationIntensity={0.08} floatIntensity={0.15}>
        <group ref={iconRef} position={[0, 0.04, 0]}>
          <MidnightPawnIcon
            active={active}
            hovered={hovered}
            glowColor={project.accentLighting.primary}
            rimColor={project.accentLighting.rim}
            previewUrl={previewUrl}
          />
        </group>
      </Float>
    </group>
  );
}
