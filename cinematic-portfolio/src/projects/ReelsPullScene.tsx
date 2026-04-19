import { Float, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useSite } from "@/app/SiteProvider";
import { useAudio } from "@/audio/AudioProvider";
import { FloatingIsland } from "@/objects/FloatingIsland";
import { ReelsPullIcon } from "@/objects/ProjectIcons";
import { projectById, objectById } from "@/memory/contentRegistry";

const project = projectById.reelspull;
const anchor = objectById[project.objectId];
const previewUrl = "./media/reelspull-preview.svg";

export function ReelsPullScene() {
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
    group.position.y = anchor.position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    group.rotation.y = anchor.rotation[1] + Math.sin(state.clock.elapsedTime * 0.25) * 0.06;
    icon.rotation.y += delta * (0.18 + openAmount * 0.12);
    const scale = anchor.scale * (1 + (hovered ? 0.05 : 0) + openAmount * 0.08);
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
      <FloatingIsland radius={anchor.islandRadius} tint="#0d1222" emissive="#284d88" />
      <Float speed={1.35} rotationIntensity={0.18} floatIntensity={0.18}>
        <group ref={iconRef} position={[0, 0.08, 0]}>
          <ReelsPullIcon
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
