import * as THREE from "three";
import { RoundedBoxGeometry } from "../threejs/three.js-master/examples/jsm/geometries/RoundedBoxGeometry.js";

const { clamp, damp, lerp, smoothstep } = THREE.MathUtils;

function fract(value) {
  return value - Math.floor(value);
}

function hash2(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function noise2(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);

  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function fbm(x, y, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let index = 0; index < octaves; index += 1) {
    value += amplitude * noise2(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value;
}

function createCanvasTexture(size, painter, colorSpace = THREE.NoColorSpace) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const rgba = painter(x / size, y / size);

      image.data[index] = rgba[0];
      image.data[index + 1] = rgba[1];
      image.data[index + 2] = rgba[2];
      image.data[index + 3] = rgba[3];
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colorSpace;
  return texture;
}

function createSurfaceMaps() {
  const blockRelief = createCanvasTexture(256, (u, v) => {
    const grain = fbm(u * 14.8 + 4.2, v * 14.1 + 7.3, 5);
    const chips = Math.abs(Math.sin(u * 31 + fbm(u * 8.4 + 1.6, v * 7.5 + 2.9, 4) * 9.4));
    const value = clamp(0.58 + (grain - 0.5) * 0.54 - chips * 0.1, 0, 1);
    const shade = Math.round(value * 255);
    return [shade, shade, shade, 255];
  });
  blockRelief.repeat.set(2.2, 1.8);

  const blockTint = createCanvasTexture(256, (u, v) => {
    const grain = fbm(u * 8.4 + 2.8, v * 8 + 4.7, 5);
    const frost = Math.sin(u * 33 + v * 8.6) * 0.5 + 0.5;
    const cool = clamp(0.86 + (grain - 0.5) * 0.1 + (frost - 0.5) * 0.04, 0, 1);
    return [
      Math.round(198 * cool),
      Math.round(214 * cool),
      Math.round(226 * cool),
      255,
    ];
  }, THREE.SRGBColorSpace);
  blockTint.repeat.set(2.1, 1.7);

  const groundRelief = createCanvasTexture(256, (u, v) => {
    const large = fbm(u * 4.4 + 3.1, v * 6.8 + 5.7, 5);
    const wind = Math.sin(u * 38 + v * 6.4) * 0.5 + 0.5;
    const value = clamp(0.6 + (large - 0.5) * 0.58 + (wind - 0.5) * 0.12, 0, 1);
    const shade = Math.round(value * 255);
    return [shade, shade, shade, 255];
  });
  groundRelief.repeat.set(9, 9);

  const groundTint = createCanvasTexture(256, (u, v) => {
    const large = fbm(u * 3.8 + 1.9, v * 4.6 + 8.2, 5);
    const wind = Math.sin(u * 30 + v * 5.5) * 0.5 + 0.5;
    const cool = clamp(0.9 + (large - 0.5) * 0.08 + (wind - 0.5) * 0.04, 0, 1);
    return [
      Math.round(225 * cool),
      Math.round(235 * cool),
      Math.round(242 * cool),
      255,
    ];
  }, THREE.SRGBColorSpace);
  groundTint.repeat.set(10, 10);

  return {
    blockRelief,
    blockTint,
    groundRelief,
    groundTint,
  };
}

function createSnowParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 3, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.5, "rgba(240,246,250,0.85)");
  gradient.addColorStop(1, "rgba(240,246,250,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(0x7f909d) },
      uHorizonColor: { value: new THREE.Color(0xdce6ec) },
      uLowerColor: { value: new THREE.Color(0xc9d6df) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uLowerColor;
      varying vec3 vWorldPosition;

      void main() {
        vec3 direction = normalize(vWorldPosition);
        float heightMix = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 color = mix(uLowerColor, uHorizonColor, smoothstep(0.0, 0.45, heightMix));
        color = mix(color, uTopColor, smoothstep(0.42, 0.96, heightMix));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function createSkyDome(radius) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), createSkyMaterial());
}

function sampleGroundHeight(x, z, baseY) {
  const rolling = (fbm(x * 0.018 + 5.1, z * 0.018 - 2.4, 5) - 0.5) * 0.82;
  const drift = (noise2(x * 0.09 + 11.2, z * 0.12 + 6.7) - 0.5) * 0.15;
  const field = Math.sin(x * 0.12 + z * 0.04) * 0.08 + Math.cos(z * 0.1 - x * 0.02) * 0.05;
  const mound = Math.exp(-(x * x * 0.032 + z * z * 0.026)) * 0.24;
  const hillDepth = smoothstep(-z, 10, 45);
  const mountainDepth = smoothstep(-z, 20, 70);
  const hills = hillDepth * (0.9 + fbm(x * 0.02 + 14, z * 0.012 + 9, 5) * 3.2);
  const mountains = mountainDepth * (2.0 + fbm(x * 0.014 + 31, z * 0.01 - 13, 6) * 8.5);

  return baseY + rolling + drift + field + mound + hills + mountains;
}

function createGround(baseY, maps) {
  const geometry = new THREE.PlaneGeometry(180, 180, 260, 260);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const low = new THREE.Color(0xe4edf3);
  const high = new THREE.Color(0xf7fafc);
  const far = new THREE.Color(0xd7e2ea);
  const mixed = new THREE.Color();

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const y = sampleGroundHeight(x, z, baseY);
    position.setY(index, y);

    const blend = clamp(fbm(x * 0.035 + 2.4, z * 0.035 + 4.2, 4), 0, 1);
    const distanceMix = clamp(-z / 82, 0, 1);
    mixed.copy(low).lerp(high, blend * 0.78 + 0.12);
    mixed.lerp(far, distanceMix * 0.22);

    colors[index * 3] = mixed.r;
    colors[index * 3 + 1] = mixed.g;
    colors[index * 3 + 2] = mixed.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xebf3f8,
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.0,
    map: maps.groundTint,
    bumpMap: maps.groundRelief,
    bumpScale: 0.12,
    roughnessMap: maps.groundRelief,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createMountainBand({
  width,
  segments,
  baseY,
  frontZ,
  minHeight,
  maxHeight,
  depth,
  seed,
  color,
}) {
  const positions = [];
  const indices = [];
  const verticalOffset = 24;

  for (let index = 0; index <= segments; index += 1) {
    const mix = index / segments;
    const x = lerp(-width / 2, width / 2, mix);
    const ridge = fbm(x * 0.016 + seed, seed * 2.8, 6);
    const height = lerp(minHeight, maxHeight, clamp(ridge, 0, 1));
    const front = frontZ + (noise2(x * 0.026 + seed, seed * 2.1) - 0.5) * 3.4;
    const back = front - depth - noise2(x * 0.017 + seed * 2.4, seed * 3.8) * 7.0;

    positions.push(x, baseY - verticalOffset, back);
    positions.push(x, baseY + height, front);
  }

  for (let index = 0; index < segments; index += 1) {
    const a = index * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      metalness: 0,
    })
  );
}

const BRICK_WIDTH = 1.12;
const BRICK_HEIGHT = 0.76;
const BRICK_DEPTH = 0.42;
const BRICK_CORNER_RADIUS = 0.05;

function createBrickGeometries() {
  const geometries = [];

  for (let variation = 0; variation < 4; variation += 1) {
    const geometry = new RoundedBoxGeometry(BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH, 4, BRICK_CORNER_RADIUS);
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;

    for (let index = 0; index < position.count; index += 1) {
      const px = position.getX(index);
      const py = position.getY(index);
      const pz = position.getZ(index);
      const nx = normal.getX(index);
      const ny = normal.getY(index);
      const nz = normal.getZ(index);
      const topMix = py > 0 ? 0.91 - variation * 0.012 : 1;
      const upperSnow = py > 0.09 ? 0.008 + variation * 0.0025 : 0;
      const edge = clamp(
        Math.max(
          Math.abs(px) / (BRICK_WIDTH * 0.46),
          Math.abs(py) / (BRICK_HEIGHT * 0.44),
          Math.abs(pz) / (BRICK_DEPTH * 0.46)
        ),
        0,
        1
      );
      const chip = (hash2(px * 11 + variation * 4.1, pz * 13 + py * 5.2 + variation) - 0.5) * 0.01;
      const wear = chip * smoothstep(edge, 0.48, 1);

      position.setXYZ(
        index,
        px * topMix + nx * wear,
        py + upperSnow + ny * wear,
        pz * topMix + nz * wear
      );
    }

    geometry.computeVertexNormals();
    geometries.push(geometry);
  }

  return geometries;
}

function createBrickMaterial(baseColor, maps, roughnessOffset = 0) {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: clamp(0.8 + roughnessOffset, 0.74, 0.94),
    metalness: 0.0,
    map: maps.blockTint,
    bumpMap: maps.blockRelief,
    bumpScale: 0.05,
    roughnessMap: maps.blockRelief,
    emissive: new THREE.Color(0x11181d),
    emissiveIntensity: 0.018,
  });
}

function pushBrick(bricks, {
  position,
  normal,
  axisX,
  axisY,
  baseColor,
  scale,
  geometryIndex,
  separation,
  lateral,
  tilt,
  phase,
  baseQuaternion,
  tiltAxis,
}) {
  const resolvedNormal = normal.clone().normalize();
  const facing = resolvedNormal.clone().negate();
  let resolvedAxisX = axisX.clone().normalize();
  let resolvedAxisY = new THREE.Vector3().crossVectors(facing, resolvedAxisX);

  if (resolvedAxisY.lengthSq() < 0.0001) {
    resolvedAxisY = axisY.clone().normalize();
  } else {
    resolvedAxisY.normalize();
  }

  resolvedAxisX = new THREE.Vector3().crossVectors(resolvedAxisY, facing).normalize();

  const basis = new THREE.Matrix4().makeBasis(resolvedAxisX, resolvedAxisY, facing);
  const resolvedQuaternion = baseQuaternion
    ? baseQuaternion.clone()
    : new THREE.Quaternion().setFromRotationMatrix(basis);

  bricks.push({
    position,
    normal: resolvedNormal,
    axisX: resolvedAxisX,
    axisY: resolvedAxisY,
    tiltAxis: (tiltAxis ? tiltAxis.clone() : resolvedAxisX.clone().lerp(resolvedAxisY, 0.42)).normalize(),
    baseQuaternion: resolvedQuaternion,
    baseColor,
    scale,
    geometryIndex,
    activity: 0,
    phase,
    separation,
    lateral,
    tilt,
  });
}

function buildIglooData(center, radius) {
  const bricks = [];
  const brickColor = new THREE.Color(0xa7bbc8);
  const worldUp = new THREE.Vector3(0, 1, 0);
  const matrix = new THREE.Matrix4();
  const ringCount = 14;
  const verticalStep = 0.14;
  const baseRadius = radius * 0.98;
  const shrinkFactor = baseRadius / (ringCount + 4.5);
  const brickScale = new THREE.Vector3(0.9, 0.9, 0.8);

  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const ringRadius = baseRadius - ringIndex * shrinkFactor;
    const ringHeight = ringIndex * verticalStep;
    const tilt = ringIndex * 0.045;
    const brickCount = Math.max(
      4,
      Math.round((Math.PI * 2 * ringRadius) / (BRICK_WIDTH * brickScale.x * 0.94))
    );

    for (let index = 0; index < brickCount; index += 1) {
      const angle = (index / brickCount) * Math.PI * 2;
      const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const upAxis = worldUp.clone().addScaledVector(radial, -tilt).normalize();
      const outward = new THREE.Vector3().crossVectors(upAxis, tangent).normalize();
      const position = center.clone().add(new THREE.Vector3(
        Math.cos(angle) * ringRadius,
        ringHeight,
        Math.sin(angle) * ringRadius
      ));

      matrix.makeBasis(tangent, upAxis, outward);

      pushBrick(bricks, {
        position,
        normal: outward,
        axisX: tangent,
        axisY: upAxis,
        baseColor: brickColor,
        scale: brickScale.clone(),
        geometryIndex: 0,
        separation: 0.07,
        lateral: 0.012,
        tilt: 0.01,
        phase: ringIndex * 0.22 + index * 0.1,
        baseQuaternion: new THREE.Quaternion().setFromRotationMatrix(matrix),
        tiltAxis: tangent,
      });
    }
  }

  pushBrick(bricks, {
    position: center.clone().add(new THREE.Vector3(0, ringCount * verticalStep + 0.08, 0)),
    normal: worldUp.clone(),
    axisX: new THREE.Vector3(1, 0, 0),
    axisY: new THREE.Vector3(0, 1, 0),
    baseColor: brickColor.clone().offsetHSL(0, -0.02, 0.04),
    scale: new THREE.Vector3(0.4, 0.3, 0.28),
    geometryIndex: 0,
    separation: 0.05,
    lateral: 0.01,
    tilt: 0.01,
    phase: ringCount * 0.3,
    baseQuaternion: new THREE.Quaternion(),
    tiltAxis: new THREE.Vector3(1, 0, 0),
  });

  return bricks;
}

function createSnowField(texture, count, centerY) {
  const positions = new Float32Array(count * 3);
  const states = new Array(count);

  for (let index = 0; index < count; index += 1) {
    const i3 = index * 3;
    const x = (Math.random() - 0.5) * 46;
    const y = centerY + 1.4 + Math.random() * 12;
    const z = (Math.random() - 0.5) * 44;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    states[index] = {
      anchorX: x,
      anchorZ: z,
      speed: 0.1 + Math.random() * 0.12,
      sway: 0.25 + Math.random() * 0.45,
      drift: 0.04 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
    };
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xf4f8fb,
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.18,
    map: texture,
    alphaMap: texture,
    alphaTest: 0.02,
    depthWrite: false,
  });

  return {
    points: new THREE.Points(geometry, material),
    states,
    minY: centerY - 0.4,
    maxY: centerY + 13,
    width: 46,
    depth: 44,
  };
}

function updateSnowField(field, elapsed, delta) {
  const attribute = field.points.geometry.attributes.position;
  const positions = attribute.array;

  for (let index = 0; index < field.states.length; index += 1) {
    const i3 = index * 3;
    const flake = field.states[index];

    positions[i3 + 1] -= flake.speed * delta;
    positions[i3] = flake.anchorX + Math.sin(elapsed * flake.sway + flake.phase) * flake.drift;
    positions[i3 + 2] = flake.anchorZ + Math.cos(elapsed * flake.sway + flake.phase) * flake.drift * 0.8;

    if (positions[i3 + 1] < field.minY) {
      positions[i3 + 1] = field.maxY;
      flake.anchorX = (Math.random() - 0.5) * field.width;
      flake.anchorZ = (Math.random() - 0.5) * field.depth;
      positions[i3] = flake.anchorX;
      positions[i3 + 2] = flake.anchorZ;
    }
  }

  attribute.needsUpdate = true;
}

export function createIglooExperience({ canvas }) {
  if (!canvas) {
    throw new Error("Canvas element is required.");
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.8),
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9e4eb);
  scene.fog = new THREE.Fog(0xd9e4eb, 72, 182);

  const camera = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 0.1, 200);
  scene.add(createSkyDome(120));

  const baseY = -4.8;
  const maps = createSurfaceMaps();
  const ground = createGround(baseY, maps);
  scene.add(ground);

  const backHill = createMountainBand({
    width: 150,
    segments: 150,
    baseY: baseY - 2.2,
    frontZ: -17,
    minHeight: 5.5,
    maxHeight: 9.6,
    depth: 12,
    seed: 3.1,
    color: new THREE.Color(0xd7e1e8),
  });
  scene.add(backHill);

  const midHill = createMountainBand({
    width: 175,
    segments: 160,
    baseY: baseY - 4.6,
    frontZ: -31,
    minHeight: 8,
    maxHeight: 14,
    depth: 16,
    seed: 5.6,
    color: new THREE.Color(0xcfdbe4),
  });
  scene.add(midHill);

  const farMountain = createMountainBand({
    width: 220,
    segments: 190,
    baseY: baseY - 8.2,
    frontZ: -56,
    minHeight: 13,
    maxHeight: 26,
    depth: 28,
    seed: 7.4,
    color: new THREE.Color(0xc7d3dd),
  });
  scene.add(farMountain);

  const centerY = sampleGroundHeight(0, 0, baseY) - 0.28;
  const iglooCenter = new THREE.Vector3(0, centerY, 0);
  const shellRadius = 4.45;

  camera.position.set(2.2, centerY + 2.26, 13.3);

  const hemiLight = new THREE.HemisphereLight(0xe3edf3, 0xc2cfda, 0.42);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xd4dee5, 0.12);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xf8fbfe, 2.7);
  directionalLight.position.set(-14, 10.5, 11);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(4096, 4096);
  directionalLight.shadow.camera.left = -24;
  directionalLight.shadow.camera.right = 24;
  directionalLight.shadow.camera.top = 24;
  directionalLight.shadow.camera.bottom = -24;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 84;
  directionalLight.shadow.bias = -0.00014;
  directionalLight.shadow.normalBias = 0.018;
  directionalLight.target.position.set(iglooCenter.x, centerY + 1.32, iglooCenter.z + 1.45);
  scene.add(directionalLight.target);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xdae6ee, 0.28);
  fillLight.position.set(10, 5, 10);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xd7e7ef, 0.74);
  rimLight.position.set(12, 6.5, -12);
  scene.add(rimLight);

  const brickGeometries = createBrickGeometries();
  const brickData = buildIglooData(iglooCenter, shellRadius);
  const brickMeshes = [];

  for (const brick of brickData) {
    const mesh = new THREE.Mesh(
      brickGeometries[brick.geometryIndex],
      createBrickMaterial(brick.baseColor, maps, 0)
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(brick.position);
    mesh.quaternion.copy(brick.baseQuaternion);
    mesh.scale.copy(brick.scale);
    mesh.userData.baseColor = brick.baseColor.clone();
    mesh.userData.highlightColor = brick.baseColor.clone().lerp(new THREE.Color(0xe4edf2), 0.22);
    brick.mesh = mesh;
    brickMeshes.push(mesh);
    scene.add(mesh);
  }

  const entranceGlow = null;

  const snowField = createSnowField(createSnowParticleTexture(), reducedMotion ? 100 : 180, centerY);
  scene.add(snowField.points);

  const pointerTarget = new THREE.Vector2(0, 0);
  const pointer = new THREE.Vector2(0, 0);
  const zeroVector = new THREE.Vector2(0, 0);
  let pointerActive = false;

  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();
  const lookTarget = new THREE.Vector3(iglooCenter.x + 0.02, centerY + 1.4, iglooCenter.z + 1.16);
  const interactionPoint = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const interactionVector = new THREE.Vector3();
  const lateralPush = new THREE.Vector3();
  const targetPosition = new THREE.Vector3();
  const targetScale = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const tiltQuaternion = new THREE.Quaternion();
  const spinQuaternion = new THREE.Quaternion();

  function setPointer(clientX, clientY) {
    pointerTarget.set((clientX / sizes.width) * 2 - 1, -((clientY / sizes.height) * 2 - 1));
    pointerActive = true;
  }

  function onPointerMove(event) {
    setPointer(event.clientX, event.clientY);
  }

  function onPointerDown(event) {
    setPointer(event.clientX, event.clientY);
  }

  function clearPointer() {
    pointerActive = false;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", clearPointer, { passive: true });
  window.addEventListener("blur", clearPointer);
  canvas.addEventListener("pointerleave", clearPointer, { passive: true });

  function resize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    sizes.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.8);

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);
  }

  window.addEventListener("resize", resize);

  function tick() {
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    pointer.lerp(pointerActive ? pointerTarget : zeroVector, 1 - Math.exp(-delta * 4));

    cameraTarget.set(
      2.2 + Math.sin(elapsed * 0.08) * 0.08 + pointer.x * 0.12,
      centerY + 2.26 + Math.cos(elapsed * 0.09) * 0.04 + pointer.y * 0.05,
      13.3 + Math.sin(elapsed * 0.05) * 0.1
    );

    camera.position.x = damp(camera.position.x, cameraTarget.x, 3, delta);
    camera.position.y = damp(camera.position.y, cameraTarget.y, 3, delta);
    camera.position.z = damp(camera.position.z, cameraTarget.z, 3, delta);

    lookTarget.x = damp(lookTarget.x, iglooCenter.x + 0.02 + pointer.x * 0.05, 3, delta);
    lookTarget.y = damp(lookTarget.y, centerY + 1.4 + pointer.y * 0.03, 3, delta);
    lookTarget.z = damp(lookTarget.z, iglooCenter.z + 1.16, 3, delta);
    camera.lookAt(lookTarget);

    let hit = null;

    if (pointerActive || pointer.lengthSq() > 0.0002) {
      raycaster.setFromCamera(pointer, camera);
      hit = raycaster.intersectObjects(brickMeshes, false)[0] || null;
    }

    const interactionRadius = reducedMotion ? 1.0 : 1.15;

    if (hit) {
      interactionPoint.copy(hit.point);
    }

    for (const brick of brickData) {
      let influence = 0;

      if (hit) {
        interactionVector.subVectors(brick.position, interactionPoint);
        const distance = interactionVector.length();
        influence = 1 - smoothstep(distance, 0.06, interactionRadius);
        influence = clamp(influence * influence, 0, 1);

        if (hit.object === brick.mesh) {
          influence = 1;
        }
      }

      brick.activity = damp(brick.activity, influence, reducedMotion ? 4 : 6, delta);

      if (brick.activity > 0.0001) {
        lateralPush.subVectors(brick.position, interactionPoint);
        lateralPush.addScaledVector(brick.normal, -lateralPush.dot(brick.normal));

        if (lateralPush.lengthSq() < 0.0001) {
          lateralPush.copy(brick.axisX);
        } else {
          lateralPush.normalize();
        }
      } else {
        lateralPush.copy(brick.axisX);
      }

      targetPosition
        .copy(brick.position)
        .addScaledVector(brick.normal, brick.activity * brick.separation)
        .addScaledVector(lateralPush, brick.activity * brick.lateral);

      tiltQuaternion.setFromAxisAngle(brick.tiltAxis, brick.activity * brick.tilt);
      spinQuaternion.setFromAxisAngle(
        brick.normal,
        brick.activity * 0.035 * Math.sin(elapsed * 0.8 + brick.phase)
      );
      targetQuaternion.copy(brick.baseQuaternion).multiply(tiltQuaternion).multiply(spinQuaternion);

      brick.mesh.position.x = damp(brick.mesh.position.x, targetPosition.x, 6, delta);
      brick.mesh.position.y = damp(brick.mesh.position.y, targetPosition.y, 6, delta);
      brick.mesh.position.z = damp(brick.mesh.position.z, targetPosition.z, 6, delta);
      brick.mesh.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 6));

      targetScale.copy(brick.scale).multiplyScalar(1 + brick.activity * 0.015);
      brick.mesh.scale.lerp(targetScale, 1 - Math.exp(-delta * 6));

      brick.mesh.material.color.lerpColors(
        brick.mesh.userData.baseColor,
        brick.mesh.userData.highlightColor,
        brick.activity * 0.16
      );
    }

    updateSnowField(snowField, elapsed, delta);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(tick);

  return {
    brickCount: brickData.length,
  };
}
