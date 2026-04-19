import { Image, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";

interface IconProps {
  active: boolean;
  hovered: boolean;
  glowColor: string;
  rimColor: string;
  previewUrl: string;
}

function getGlow(active: boolean, hovered: boolean, idle: number, hover: number, opened: number) {
  if (active) {
    return opened;
  }

  if (hovered) {
    return hover;
  }

  return idle;
}

function GlowOrb({
  position,
  color,
  intensity,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  intensity: number;
  scale?: number;
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[0.18, 22, 22]} />
      <meshStandardMaterial color="#f6fbff" emissive={color} emissiveIntensity={intensity} roughness={0.08} />
    </mesh>
  );
}

function LightStud({
  position,
  color,
  intensity,
  size = [0.08, 0.08, 0.08],
}: {
  position: [number, number, number];
  color: string;
  intensity: number;
  size?: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#edf6ff"
        metalness={0.2}
        roughness={0.14}
        emissive={color}
        emissiveIntensity={intensity}
      />
    </mesh>
  );
}

function LightBlade({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  intensity,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  intensity: number;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <boxGeometry args={[0.12, 1.1, 0.16]} />
      <meshStandardMaterial
        color="#dfeefe"
        metalness={0.28}
        roughness={0.08}
        emissive={color}
        emissiveIntensity={intensity}
      />
    </mesh>
  );
}

function PreviewSurface({
  active,
  previewUrl,
  position,
  rotation = [0, 0, 0],
  frameSize,
  imageScale,
}: {
  active: boolean;
  previewUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  frameSize: [number, number, number];
  imageScale: [number, number];
}) {
  if (!active) {
    return null;
  }

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={frameSize} radius={0.045} smoothness={4} castShadow>
        <meshStandardMaterial
          color="#08111f"
          metalness={0.86}
          roughness={0.18}
          emissive="#7abfff"
          emissiveIntensity={0.18}
        />
      </RoundedBox>
      <Image url={previewUrl} scale={imageScale} position={[0, 0, frameSize[2] * 0.6]} toneMapped={false} />
    </group>
  );
}

export function LanternOathIcon({ active, hovered, glowColor, rimColor, previewUrl }: IconProps) {
  const glow = getGlow(active, hovered, 0.2, 0.42, 0.82);

  return (
    <group position={[0, 1.34, 0]}>
      <group position={[0, -0.86, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.44, 0.58, 0.24, 18]} />
          <meshStandardMaterial color="#130d09" metalness={0.94} roughness={0.16} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.42, 0.16, 16]} />
          <meshStandardMaterial color="#1c120b" metalness={0.9} roughness={0.18} />
        </mesh>
        {[
          [0.34, -0.06, 0.34],
          [-0.34, -0.06, 0.34],
          [0.34, -0.06, -0.34],
          [-0.34, -0.06, -0.34],
        ].map((position) => (
          <mesh key={position.join(",")} position={position as [number, number, number]} rotation={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.18, 0.28]} />
            <meshStandardMaterial color="#22140d" metalness={0.88} roughness={0.18} />
          </mesh>
        ))}
      </group>

      <RoundedBox args={[1.02, 1.56, 0.9]} radius={0.1} smoothness={6} position={[0, 0.46, 0]} castShadow>
        <meshStandardMaterial
          color="#181008"
          metalness={0.9}
          roughness={0.14}
          emissive={glowColor}
          emissiveIntensity={glow * 0.14}
        />
      </RoundedBox>

      <RoundedBox args={[0.7, 1.16, 0.12]} radius={0.05} smoothness={4} position={[0, 0.48, 0.44]}>
        {active ? (
          <meshStandardMaterial color="#101925" metalness={0.8} roughness={0.18} />
        ) : (
          <MeshTransmissionMaterial
            thickness={0.2}
            transmission={0.96}
            roughness={0.08}
            chromaticAberration={0.03}
            ior={1.15}
            color="#fff2d7"
          />
        )}
      </RoundedBox>

      <RoundedBox args={[0.64, 1.08, 0.12]} radius={0.05} smoothness={4} position={[0, 0.48, -0.44]}>
        <MeshTransmissionMaterial
          thickness={0.18}
          transmission={0.92}
          roughness={0.12}
          chromaticAberration={0.02}
          ior={1.13}
          color="#f4e4c7"
        />
      </RoundedBox>

      {[
        [0.38, 0.48, 0.32],
        [-0.38, 0.48, 0.32],
        [0.38, 0.48, -0.32],
        [-0.38, 0.48, -0.32],
      ].map((position) => (
        <mesh key={position.join(",")} position={position as [number, number, number]} castShadow>
          <boxGeometry args={[0.08, 1.5, 0.08]} />
          <meshStandardMaterial
            color="#2b190d"
            metalness={0.95}
            roughness={0.14}
            emissive={rimColor}
            emissiveIntensity={glow * 0.16}
          />
        </mesh>
      ))}

      {[
        [0.56, 0.48, 0],
        [-0.56, 0.48, 0],
      ].map((position, index) => (
        <mesh
          key={position.join(",")}
          position={position as [number, number, number]}
          rotation={[0, 0, index === 0 ? -0.26 : 0.26]}
          castShadow
        >
          <boxGeometry args={[0.08, 1.18, 0.26]} />
          <meshStandardMaterial
            color="#25160d"
            metalness={0.88}
            roughness={0.18}
            emissive={glowColor}
            emissiveIntensity={glow * 0.12}
          />
        </mesh>
      ))}

      <group position={[0, 1.5, 0]}>
        <RoundedBox args={[0.86, 0.16, 0.74]} radius={0.05} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#20140d"
            metalness={0.92}
            roughness={0.14}
            emissive={glowColor}
            emissiveIntensity={glow * 0.12}
          />
        </RoundedBox>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.54, 0.12, 0.5]} />
          <meshStandardMaterial color="#26170d" metalness={0.9} roughness={0.14} />
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.32, 12]} />
          <meshStandardMaterial color="#26170d" metalness={0.92} roughness={0.14} />
        </mesh>
        {[
          [0.18, 0.58, 0.18],
          [-0.18, 0.58, 0.18],
          [0.18, 0.58, -0.18],
          [-0.18, 0.58, -0.18],
        ].map((position) => (
          <mesh key={position.join(",")} position={position as [number, number, number]} castShadow>
            <coneGeometry args={[0.05, 0.18, 10]} />
            <meshStandardMaterial
              color="#f8f1e4"
              metalness={0.18}
              roughness={0.1}
              emissive={rimColor}
              emissiveIntensity={glow * 0.42}
            />
          </mesh>
        ))}
      </group>

      <GlowOrb position={[0, 0.58, 0]} color={glowColor} intensity={glow} scale={1.12} />
      <mesh position={[0, 0.58, 0]} rotation={[0.2, 0.4, 0]} castShadow>
        <octahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#fff5e4" emissive={glowColor} emissiveIntensity={glow * 0.92} roughness={0.1} />
      </mesh>
      <LightBlade position={[0, 0.58, 0]} rotation={[0, 0, Math.PI / 4]} scale={[0.34, 0.22, 0.08]} color={rimColor} intensity={glow * 0.34} />
      {[-0.18, 0, 0.18].map((x) => (
        <LightStud key={String(x)} position={[x, -0.08, 0.44]} color={rimColor} intensity={glow * 0.26} size={[0.07, 0.14, 0.04]} />
      ))}

      <mesh position={[0, -1.22, 0]} castShadow>
        <coneGeometry args={[0.14, 0.44, 12]} />
        <meshStandardMaterial
          color="#25160d"
          metalness={0.88}
          roughness={0.16}
          emissive={glowColor}
          emissiveIntensity={glow * 0.16}
        />
      </mesh>

      <PreviewSurface
        active={active}
        previewUrl={previewUrl}
        position={[0, 0.48, 0.49]}
        frameSize={[0.72, 1.02, 0.04]}
        imageScale={[0.64, 0.9]}
      />
    </group>
  );
}

export function MidnightPawnIcon({ active, hovered, glowColor, rimColor, previewUrl }: IconProps) {
  const glow = getGlow(active, hovered, 0.16, 0.34, 0.62);

  return (
    <group position={[0, 1.24, 0]}>
      <group position={[0, -0.74, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.74, 0.86, 0.22, 24]} />
          <meshStandardMaterial color="#120d0f" metalness={0.94} roughness={0.14} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.54, 0.68, 0.18, 20]} />
          <meshStandardMaterial color="#1a1114" metalness={0.92} roughness={0.16} />
        </mesh>
      </group>

      <group position={[0, -0.12, -0.08]}>
        <mesh position={[-0.58, 0, 0]} rotation={[0.22, 0.36, 0.02]} castShadow>
          <boxGeometry args={[1.16, 0.08, 1.42]} />
          <meshStandardMaterial color="#1a1111" metalness={0.82} roughness={0.28} />
        </mesh>
        <mesh position={[0.58, 0, 0]} rotation={[0.22, -0.36, -0.02]} castShadow>
          <boxGeometry args={[1.16, 0.08, 1.42]} />
          <meshStandardMaterial color="#201412" metalness={0.84} roughness={0.28} />
        </mesh>
        <mesh position={[0, -0.04, -0.5]} castShadow>
          <boxGeometry args={[2.18, 0.08, 0.1]} />
          <meshStandardMaterial
            color="#caa16b"
            metalness={0.96}
            roughness={0.1}
            emissive={rimColor}
            emissiveIntensity={glow * 0.22}
          />
        </mesh>
      </group>

      <RoundedBox args={[1.2, 2.24, 0.16]} radius={0.08} smoothness={4} position={[0, 0.72, -0.38]} castShadow>
        <meshStandardMaterial
          color="#181013"
          metalness={0.9}
          roughness={0.16}
          emissive={glowColor}
          emissiveIntensity={glow * 0.08}
        />
      </RoundedBox>

      {[
        [-0.48, 0.88, -0.26],
        [0.48, 0.88, -0.26],
      ].map((position) => (
        <mesh key={position.join(",")} position={position as [number, number, number]} castShadow>
          <boxGeometry args={[0.1, 1.74, 0.1]} />
          <meshStandardMaterial
            color="#c79b66"
            metalness={0.96}
            roughness={0.1}
            emissive={rimColor}
            emissiveIntensity={glow * 0.18}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.56, 0.24, 24]} />
        <meshStandardMaterial color="#171013" metalness={0.94} roughness={0.14} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow>
        <sphereGeometry args={[0.44, 28, 28]} />
        <meshStandardMaterial
          color="#1d1214"
          metalness={0.88}
          roughness={0.14}
          emissive={glowColor}
          emissiveIntensity={glow * 0.12}
        />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 0.42, 18]} />
        <meshStandardMaterial color="#1a1014" metalness={0.92} roughness={0.14} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial
          color="#251615"
          metalness={0.88}
          roughness={0.14}
          emissive={glowColor}
          emissiveIntensity={glow * 0.18}
        />
      </mesh>

      <mesh position={[0, 1.62, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.18, 12]} />
        <meshStandardMaterial color="#c79b66" metalness={0.95} roughness={0.12} />
      </mesh>
      <GlowOrb position={[0, 1.78, 0]} color={rimColor} intensity={glow * 0.58} scale={0.62} />

      {[
        [-0.82, 0.56, 0.02],
        [0.82, 0.56, 0.02],
      ].map((position, index) => (
        <group key={position.join(",")} position={position as [number, number, number]}>
          <mesh rotation={[0.04, 0, index === 0 ? 0.18 : -0.18]} castShadow>
            <boxGeometry args={[0.14, 0.94, 0.14]} />
            <meshStandardMaterial color="#c69c67" metalness={0.96} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.54, 0.18]} castShadow>
            <boxGeometry args={[0.36, 0.08, 0.42]} />
            <meshStandardMaterial color="#1a1214" metalness={0.88} roughness={0.18} />
          </mesh>
          <LightStud position={[0, -0.54, 0.38]} color={rimColor} intensity={glow * 0.28} size={[0.2, 0.06, 0.04]} />
        </group>
      ))}

      {[-0.56, -0.18, 0.18, 0.56].map((x) => (
        <LightStud key={String(x)} position={[x, -0.14, 0.56]} color={rimColor} intensity={glow * 0.22} size={[0.08, 0.16, 0.04]} />
      ))}

      <PreviewSurface
        active={active}
        previewUrl={previewUrl}
        position={[0.56, 0.02, 0.36]}
        rotation={[0.22, -0.36, 0]}
        frameSize={[1.02, 0.56, 0.04]}
        imageScale={[0.9, 0.46]}
      />
    </group>
  );
}

export function ReelsPullIcon({ active, hovered, glowColor, rimColor, previewUrl }: IconProps) {
  const glow = getGlow(active, hovered, 0.2, 0.44, 0.74);

  return (
    <group position={[0, 1.3, 0]}>
      <group position={[0, -0.86, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.82, 0.96, 0.22, 24]} />
          <meshStandardMaterial color="#0e1524" metalness={0.95} roughness={0.12} />
        </mesh>
        <mesh position={[0.48, -0.06, 0.34]} rotation={[0.06, -0.4, 0]} castShadow>
          <boxGeometry args={[0.66, 0.08, 0.28]} />
          <meshStandardMaterial color="#202948" metalness={0.84} roughness={0.22} />
        </mesh>
        <mesh position={[-0.48, -0.06, 0.34]} rotation={[0.06, 0.4, 0]} castShadow>
          <boxGeometry args={[0.66, 0.08, 0.28]} />
          <meshStandardMaterial color="#202948" metalness={0.84} roughness={0.22} />
        </mesh>
      </group>

      <RoundedBox args={[1.56, 2.24, 0.94]} radius={0.14} smoothness={6} position={[0, 0.82, 0]} castShadow>
        <meshStandardMaterial
          color="#111a30"
          metalness={0.92}
          roughness={0.14}
          emissive={glowColor}
          emissiveIntensity={glow * 0.1}
        />
      </RoundedBox>

      {[
        [0.92, 0.84, 0.04],
        [-0.92, 0.84, 0.04],
      ].map((position, index) => (
        <mesh
          key={position.join(",")}
          position={position as [number, number, number]}
          rotation={[0, 0, index === 0 ? 0.14 : -0.14]}
          castShadow
        >
          <boxGeometry args={[0.12, 1.86, 0.48]} />
          <meshStandardMaterial
            color="#18233f"
            metalness={0.9}
            roughness={0.14}
            emissive={glowColor}
            emissiveIntensity={glow * 0.14}
          />
        </mesh>
      ))}

      <RoundedBox args={[1.08, 0.36, 0.14]} radius={0.08} smoothness={4} position={[0, 1.86, 0.44]} castShadow>
        <meshStandardMaterial
          color="#18223a"
          metalness={0.88}
          roughness={0.14}
          emissive={glowColor}
          emissiveIntensity={glow * 0.28}
        />
      </RoundedBox>

      <RoundedBox args={[1.16, 0.88, 0.16]} radius={0.08} smoothness={4} position={[0, 1.06, 0.44]}>
        {active ? (
          <meshStandardMaterial color="#101826" metalness={0.82} roughness={0.16} />
        ) : (
          <MeshTransmissionMaterial
            thickness={0.2}
            transmission={0.96}
            roughness={0.08}
            chromaticAberration={0.04}
            ior={1.16}
            color="#deefff"
          />
        )}
      </RoundedBox>

      {[-0.34, 0, 0.34].map((x, index) => (
        <group key={String(x)} position={[x, 1.06, 0.36]} rotation={[Math.PI / 2, 0, index * 0.16]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.18, 24]} />
            <meshStandardMaterial
              color="#edf5ff"
              metalness={0.4}
              roughness={0.1}
              emissive={glowColor}
              emissiveIntensity={glow * (index === 1 ? 0.5 : 0.24)}
            />
          </mesh>
        </group>
      ))}

      <RoundedBox args={[0.96, 0.34, 0.18]} radius={0.08} smoothness={4} position={[0, 0.18, 0.46]} castShadow>
        <meshStandardMaterial
          color="#18223c"
          metalness={0.9}
          roughness={0.16}
          emissive={glowColor}
          emissiveIntensity={glow * 0.16}
        />
      </RoundedBox>

      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={String(x)} position={[x, 0.18, 0.58]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.1, 16]} />
          <meshStandardMaterial
            color={x === 0 ? glowColor : rimColor}
            metalness={0.92}
            roughness={0.08}
            emissive={glowColor}
            emissiveIntensity={glow * 0.44}
          />
        </mesh>
      ))}

      <mesh position={[0.96, 1.08, 0.02]} rotation={[0, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.92, 14]} />
        <meshStandardMaterial color="#1a2440" metalness={0.92} roughness={0.14} />
      </mesh>
      <GlowOrb position={[1.02, 1.58, 0.02]} color={glowColor} intensity={glow * 0.84} scale={0.72} />

      {[
        [-0.5, 1.92, 0.1],
        [0, 1.98, 0.1],
        [0.5, 1.92, 0.1],
      ].map((position, index) => (
        <LightBlade
          key={position.join(",")}
          position={position as [number, number, number]}
          rotation={[0.08, 0, index === 1 ? 0 : index === 0 ? 0.26 : -0.26]}
          scale={[0.44, 0.22, 0.06]}
          color={rimColor}
          intensity={glow * 0.34}
        />
      ))}

      <LightBlade position={[-0.5, 0.72, -0.36]} rotation={[0, 0.3, 0.24]} scale={[0.5, 0.86, 0.08]} color={glowColor} intensity={glow * 0.16} />
      <LightBlade position={[0.5, 0.72, -0.36]} rotation={[0, -0.3, -0.24]} scale={[0.5, 0.86, 0.08]} color={glowColor} intensity={glow * 0.16} />

      <PreviewSurface
        active={active}
        previewUrl={previewUrl}
        position={[0, -0.12, 0.57]}
        frameSize={[0.9, 0.48, 0.04]}
        imageScale={[0.8, 0.38]}
      />
    </group>
  );
}
