import { Float, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useSite } from "@/app/SiteProvider";
import { useAudio } from "@/audio/AudioProvider";
import { FloatingIsland } from "@/objects/FloatingIsland";
import { LanternOathIcon } from "@/objects/ProjectIcons";
import { projectById, objectById } from "@/memory/contentRegistry";

const project = projectById["lantern-oath"];
const anchor = objectById[project.objectId];
const previewUrl = "./media/lantern-oath-preview.svg";

export function LanternOathScene() {
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
    const lift = hovered ? 0.08 : 0;
    group.position.y = anchor.position[1] + lift + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    group.rotation.y = anchor.rotation[1] + Math.sin(state.clock.elapsedTime * 0.22) * 0.05;
    const scale = anchor.scale * (1 + (hovered ? 0.05 : 0) + openAmount * 0.08);
    group.scale.setScalar(scale);
    icon.rotation.y += delta * (0.14 + openAmount * 0.08);
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
      <FloatingIsland radius={anchor.islandRadius} tint="#1a1511" emissive="#6d432d" />
      <Float speed={1.1} rotationIntensity={0.14} floatIntensity={0.18}>
        <group ref={iconRef} position={[0, 0.02, 0]}>
          <LanternOathIcon
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
