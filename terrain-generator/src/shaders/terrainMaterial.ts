import * as THREE from "three";
import type { MaterialPreset } from "@/types/terrain";

const materialPalettes: Record<
  MaterialPreset,
  {
    low: string;
    mid: string;
    high: string;
    snow: string;
    rock: string;
  }
> = {
  alpine: {
    low: "#4f9f6f",
    mid: "#8a734f",
    high: "#7d7f78",
    snow: "#eef5f3",
    rock: "#505752"
  },
  arid: {
    low: "#b49758",
    mid: "#c9824c",
    high: "#94765f",
    snow: "#e9d3a0",
    rock: "#715348"
  },
  temperate: {
    low: "#4f9d73",
    mid: "#91a05f",
    high: "#8c806c",
    snow: "#edf3e9",
    rock: "#606458"
  },
  volcanic: {
    low: "#4b4d45",
    mid: "#7c634f",
    high: "#978979",
    snow: "#d4d2ca",
    rock: "#2f3335"
  }
};

const vertexShader = `
  attribute float terrainHeight;
  attribute float terrainSlope;

  varying float vHeight;
  varying float vSlope;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  #include <fog_pars_vertex>

  void main() {
    vHeight = terrainHeight;
    vSlope = terrainSlope;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = `
  uniform vec3 lowColor;
  uniform vec3 midColor;
  uniform vec3 highColor;
  uniform vec3 snowColor;
  uniform vec3 rockColor;
  uniform float minHeight;
  uniform float maxHeight;
  uniform vec3 lightDirection;

  varying float vHeight;
  varying float vSlope;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  #include <fog_pars_fragment>

  float saturateValue(float value) {
    return clamp(value, 0.0, 1.0);
  }

  void main() {
    float h = saturateValue((vHeight - minHeight) / max(0.001, maxHeight - minHeight));
    vec3 color = mix(lowColor, midColor, smoothstep(0.16, 0.52, h));
    color = mix(color, highColor, smoothstep(0.48, 0.78, h));
    color = mix(color, snowColor, smoothstep(0.76, 0.94, h));
    color = mix(color, rockColor, smoothstep(0.22, 0.86, vSlope) * 0.54);

    vec3 normal = normalize(vNormal);
    vec3 light = normalize(lightDirection);
    float diffuse = saturateValue(dot(normal, light));
    float rim = pow(1.0 - saturateValue(dot(normal, normalize(cameraPosition - vWorldPosition))), 2.0);
    float shade = 0.35 + diffuse * 0.74 - vSlope * 0.16 + rim * 0.08;
    vec3 finalColor = color * shade;
    finalColor += vec3(0.035, 0.055, 0.052) * smoothstep(0.0, 0.32, h);

    gl_FragColor = vec4(finalColor, 1.0);
    #include <fog_fragment>
  }
`;

export function createTerrainMaterial(preset: MaterialPreset, minHeight: number, maxHeight: number) {
  const palette = materialPalettes[preset];
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
      lowColor: { value: new THREE.Color(palette.low) },
      midColor: { value: new THREE.Color(palette.mid) },
      highColor: { value: new THREE.Color(palette.high) },
      snowColor: { value: new THREE.Color(palette.snow) },
      rockColor: { value: new THREE.Color(palette.rock) },
      minHeight: { value: minHeight },
      maxHeight: { value: maxHeight },
      lightDirection: { value: new THREE.Vector3(-0.34, 0.88, 0.38).normalize() }
      }
    ]),
    vertexShader,
    fragmentShader,
    fog: true,
    side: THREE.FrontSide
  });

  return material;
}
