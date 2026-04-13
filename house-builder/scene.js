import * as THREE from "three";
import { OrbitControls } from "../threejs/three.js-master/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("scene");
const pieceCount = document.getElementById("piece-count");
const levelReadout = document.getElementById("level-readout");
const rotationReadout = document.getElementById("rotation-readout");
const levelText = document.getElementById("level-text");
const footprintReadout = document.getElementById("footprint-readout");
const modeReadout = document.getElementById("mode-readout");
const selectedPartReadout = document.getElementById("selected-part-readout");
const summaryPart = document.getElementById("summary-part");
const summarySize = document.getElementById("summary-size");
const statusPill = document.getElementById("status-pill");
const paletteReadout = document.getElementById("palette-readout");
const areaReadout = document.getElementById("area-readout");
const volumeReadout = document.getElementById("volume-readout");
const integrityReadout = document.getElementById("integrity-readout");
const integrityBar = document.getElementById("integrity-bar");
const integrityCaption = document.getElementById("integrity-caption");
const concreteReadout = document.getElementById("concrete-readout");
const steelReadout = document.getElementById("steel-readout");
const glazingReadout = document.getElementById("glazing-readout");
const coordReadout = document.getElementById("coord-readout");
const selectionReadout = document.getElementById("selection-readout");
const builderModeReadout = document.getElementById("builder-mode-readout");
const activePrimitiveReadout = document.getElementById("active-primitive-readout");
const actionReadout = document.getElementById("action-readout");

const toolCards = [...document.querySelectorAll("[data-part]")];
const swatchChips = [...document.querySelectorAll(".swatch-chip")];
const viewChips = [...document.querySelectorAll(".view-chip")];
const rotateButton = document.getElementById("rotate-button");
const eraseButton = document.getElementById("erase-button");
const resetButton = document.getElementById("reset-button");
const levelUpButton = document.getElementById("level-up");
const levelDownButton = document.getElementById("level-down");

const sizeXInput = document.getElementById("size-x");
const sizeYInput = document.getElementById("size-y");
const sizeZInput = document.getElementById("size-z");
const sizeXValue = document.getElementById("size-x-value");
const sizeYValue = document.getElementById("size-y-value");
const sizeZValue = document.getElementById("size-z-value");

const cellSize = 2;
const seamOverlap = 0.08;
const baseFloorThickness = 0.18;
const baseWallHeight = 2.0;
const baseStoryHeight = baseWallHeight;
const placements = new Map();
const placedMeshes = [];
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const buildPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersection = new THREE.Vector3();
const cameraRig = {
  currentPosition: new THREE.Vector3(16, 13, 18),
  targetPosition: new THREE.Vector3(16, 13, 18),
  currentLookAt: new THREE.Vector3(0, 3, 0),
  targetLookAt: new THREE.Vector3(0, 3, 0),
};
let isPresetAnimating = false;

const palettePresets = {
  clay: {
    label: "Clay",
    sceneBackground: 0x070808,
    fog: 0x070808,
    hemiSky: 0x2b3137,
    hemiGround: 0x080909,
    pointLight: 0x8faccd,
    platform: 0x1d2022,
    stagePlate: 0x171a1c,
    gridMajor: 0x7e725b,
    gridMinor: 0x36393b,
    floor: 0xc3b28c,
    wall: 0xd9d4cb,
    window: 0x87acd8,
    door: 0x635340,
    column: 0x7d8378,
    roof: 0xa1825d,
    preview: 0xd5c5a3,
  },
  studio: {
    label: "Studio",
    sceneBackground: 0x08090b,
    fog: 0x08090b,
    hemiSky: 0x2a313c,
    hemiGround: 0x090a0c,
    pointLight: 0x9dbbe4,
    platform: 0x1d2126,
    stagePlate: 0x171b20,
    gridMajor: 0x6a7b95,
    gridMinor: 0x333942,
    floor: 0xa2afc0,
    wall: 0xd7dce4,
    window: 0x99bbdf,
    door: 0x596579,
    column: 0x7f8b97,
    roof: 0x72829a,
    preview: 0x9dbbe4,
  },
  forest: {
    label: "Forest",
    sceneBackground: 0x080908,
    fog: 0x080908,
    hemiSky: 0x252d29,
    hemiGround: 0x080908,
    pointLight: 0x8da88b,
    platform: 0x1c1d1a,
    stagePlate: 0x171915,
    gridMajor: 0x74725a,
    gridMinor: 0x33352f,
    floor: 0x9f8d70,
    wall: 0xd8d2c6,
    window: 0x87b2ad,
    door: 0x5d4f43,
    column: 0x6f7b63,
    roof: 0x8b6a50,
    preview: 0x9db18a,
  },
  night: {
    label: "Night",
    sceneBackground: 0x05070b,
    fog: 0x05070b,
    hemiSky: 0x1b2232,
    hemiGround: 0x05070b,
    pointLight: 0x7ea7ff,
    platform: 0x1a1f2a,
    stagePlate: 0x141925,
    gridMajor: 0x62789c,
    gridMinor: 0x2c3444,
    floor: 0x7a8597,
    wall: 0xcfd6e2,
    window: 0x86b3ff,
    door: 0x544947,
    column: 0x7d8572,
    roof: 0x697085,
    preview: 0x9db7ea,
  },
};

const scene = new THREE.Scene();
let activePalette = "clay";
scene.background = new THREE.Color(palettePresets[activePalette].sceneBackground);
scene.fog = new THREE.Fog(palettePresets[activePalette].fog, 28, 62);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
camera.position.copy(cameraRig.currentPosition);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.copy(cameraRig.currentLookAt);
controls.minDistance = 10;
controls.maxDistance = 42;
controls.maxPolarAngle = Math.PI / 2.04;

const hemi = new THREE.HemisphereLight(
  palettePresets[activePalette].hemiSky,
  palettePresets[activePalette].hemiGround,
  0.95
);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xf3e7cf, 1.65);
sun.position.set(14, 20, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);

const fillLight = new THREE.PointLight(palettePresets[activePalette].pointLight, 24, 56);
fillLight.position.set(-10, 8, -6);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x92bcf0, 0.56);
rimLight.position.set(-14, 8, -16);
scene.add(rimLight);

const world = new THREE.Group();
scene.add(world);

const platform = new THREE.Mesh(
  new THREE.BoxGeometry(40, 1.4, 40),
  new THREE.MeshStandardMaterial({
    color: palettePresets[activePalette].platform,
    roughness: 0.96,
    metalness: 0.08,
  })
);
platform.position.y = -0.72;
platform.receiveShadow = true;
world.add(platform);

const buildSurface = new THREE.Mesh(
  new THREE.PlaneGeometry(48, 48),
  new THREE.MeshStandardMaterial({
    color: palettePresets[activePalette].stagePlate,
    transparent: true,
    opacity: 0.28,
    roughness: 0.94,
    metalness: 0.02,
  })
);
buildSurface.rotation.x = -Math.PI / 2;
buildSurface.position.y = 0.001;
world.add(buildSurface);

const grid = new THREE.GridHelper(
  48,
  24,
  palettePresets[activePalette].gridMajor,
  palettePresets[activePalette].gridMinor
);
grid.position.y = 0.01;
world.add(grid);
const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
gridMaterials.forEach((material) => {
  material.transparent = true;
  material.opacity = 0.9;
});

const partsGroup = new THREE.Group();
world.add(partsGroup);

const partConfigs = {
  floor: {
    label: "Floor Plate",
    category: "floor",
    previewColor: 0xd8b17e,
    size: { x: [1, 6], y: [1, 2], z: [1, 6] },
    dimensions: (size) => ({
      width: size.x * cellSize - 0.12,
      height: baseFloorThickness + (size.y - 1) * 0.12,
      depth: size.z * cellSize - 0.12,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0xd6af79, roughness: 0.88 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.floor.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.floor.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  wall: {
    label: "Wall Panel",
    category: "body",
    previewColor: 0xf6eee3,
    size: { x: [1, 6], y: [1, 5], z: [1, 2] },
    dimensions: (size) => ({
      width: size.x * cellSize - 0.12,
      height: baseWallHeight + seamOverlap + (size.y - 1) * 0.8,
      depth: 0.22 + (size.z - 1) * 0.42,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0xf7f0e7, roughness: 0.78 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.wall.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.wall.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  window: {
    label: "Window",
    category: "body",
    previewColor: 0x9cbfcb,
    size: { x: [1, 5], y: [1, 4], z: [1, 2] },
    dimensions: (size) => ({
      width: Math.max(1, size.x) * cellSize - 0.18,
      height: 1.4 + (size.y - 1) * 0.55,
      depth: 0.16 + (size.z - 1) * 0.22,
    }),
    material: () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xa7ccd5,
        transparent: true,
        opacity: 0.84,
        roughness: 0.14,
        metalness: 0.08,
        transmission: 0.18,
      }),
    positionY: (level, size) => level * baseStoryHeight + 0.72 + (size.y - 1) * 0.3,
    buildGeometry: (size) => {
      const dim = partConfigs.window.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  door: {
    label: "Door",
    category: "body",
    previewColor: 0x7f513a,
    size: { x: [1, 3], y: [1, 4], z: [1, 2] },
    dimensions: (size) => ({
      width: 1 + (size.x - 1) * 0.7,
      height: baseWallHeight + seamOverlap + (size.y - 1) * 0.55,
      depth: 0.18 + (size.z - 1) * 0.18,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0x7b4c37, roughness: 0.76 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.door.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.door.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  column: {
    label: "Column",
    category: "body",
    previewColor: 0x7e8e69,
    size: { x: [1, 2], y: [1, 5], z: [1, 2] },
    dimensions: (size) => ({
      radius: 0.12 + (size.x - 1) * 0.14,
      height: baseWallHeight + seamOverlap + (size.y - 1) * 0.8,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0x83936f, roughness: 0.72 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.column.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.column.dimensions(size);
      return new THREE.CylinderGeometry(dim.radius, dim.radius, dim.height, 20);
    },
  },
  roof: {
    label: "Roof Volume",
    category: "roof",
    previewColor: 0xb45a3c,
    size: { x: [1, 5], y: [1, 4], z: [1, 5] },
    dimensions: (size) => ({
      radius: 1.1 + (size.x - 1) * 0.62,
      height: 1 + (size.y - 1) * 0.6,
      depthScale: 1 + (size.z - 1) * 0.28,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0xb45a3c, roughness: 0.86 }),
    positionY: (level, size) => level * baseStoryHeight + baseWallHeight + 0.78 + (size.y - 1) * 0.25,
    buildGeometry: (size) => {
      const dim = partConfigs.roof.dimensions(size);
      return new THREE.ConeGeometry(dim.radius, dim.height, 4);
    },
    afterCreate: (mesh, size) => {
      mesh.rotation.y += Math.PI / 4;
      mesh.scale.z = 1 + (size.z - 1) * 0.28;
    },
  },
};

const sizeState = {
  floor: { x: 2, y: 1, z: 2 },
  wall: { x: 2, y: 2, z: 1 },
  window: { x: 2, y: 2, z: 1 },
  door: { x: 1, y: 2, z: 1 },
  column: { x: 1, y: 2, z: 1 },
  roof: { x: 2, y: 2, z: 2 },
};

let activePart = "floor";
let eraseMode = false;
let currentLevel = 0;
let currentRotation = 0;

const previewMaterial = new THREE.MeshStandardMaterial({
  color: palettePresets[activePalette].preview,
  transparent: true,
  opacity: 0.38,
  emissive: new THREE.Color(palettePresets[activePalette].preview),
  emissiveIntensity: 0.1,
  roughness: 0.48,
  metalness: 0.12,
});

let previewMesh = createPreviewMesh(activePart);
world.add(previewMesh);

function getActiveSize() {
  return sizeState[activePart];
}

function getCurrentPartConfig() {
  return partConfigs[activePart];
}

function getPaletteColor(partName) {
  return palettePresets[activePalette][partName];
}

function setCanvasSize() {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function clampSizeForPart(partName, axis, value) {
  const [min, max] = partConfigs[partName].size[axis];
  return Math.max(min, Math.min(max, value));
}

function syncSizeInputs() {
  const config = getCurrentPartConfig();
  const size = getActiveSize();

  sizeXInput.min = String(config.size.x[0]);
  sizeXInput.max = String(config.size.x[1]);
  sizeYInput.min = String(config.size.y[0]);
  sizeYInput.max = String(config.size.y[1]);
  sizeZInput.min = String(config.size.z[0]);
  sizeZInput.max = String(config.size.z[1]);

  sizeXInput.value = String(size.x);
  sizeYInput.value = String(size.y);
  sizeZInput.value = String(size.z);

  sizeXValue.textContent = String(size.x);
  sizeYValue.textContent = String(size.y);
  sizeZValue.textContent = String(size.z);
}

function getPlacementSpan(size) {
  return {
    x: size.x,
    z: size.z,
  };
}

function snapToGrid(value, span) {
  const offset = span % 2 === 0 ? cellSize / 2 : 0;
  return Math.round((value - offset) / cellSize) * cellSize + offset;
}

function createMesh(partName, size) {
  const config = partConfigs[partName];
  const mesh = new THREE.Mesh(config.buildGeometry(size), config.material(size));
  mesh.material.color.setHex(getPaletteColor(partName));
  if (partName === "window" && "emissive" in mesh.material) {
    mesh.material.emissive.setHex(getPaletteColor(partName));
    mesh.material.emissiveIntensity = activePalette === "night" ? 0.34 : 0.12;
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (config.afterCreate) {
    config.afterCreate(mesh, size);
  }
  return mesh;
}

function createPreviewMesh(partName) {
  const config = partConfigs[partName];
  const size = sizeState[partName];
  const mesh = new THREE.Mesh(config.buildGeometry(size), previewMaterial);
  mesh.material.color.setHex(getPaletteColor(partName));
  if (config.afterCreate) {
    config.afterCreate(mesh, size);
  }
  return mesh;
}

function rebuildPreviewMesh() {
  const lastPosition = previewMesh ? previewMesh.position.clone() : new THREE.Vector3();

  if (previewMesh) {
    world.remove(previewMesh);
    previewMesh.geometry.dispose();
  }

  previewMesh = createPreviewMesh(activePart);
  previewMesh.position.copy(lastPosition);
  previewMesh.visible = !eraseMode;
  world.add(previewMesh);
  updatePreviewTransform();
}

function formatFootprint(size) {
  return `${size.x} x ${size.z}`;
}

function formatVolume(size) {
  return `${size.x} x ${size.y} x ${size.z}`;
}

function formatPrimitiveLabel(partName) {
  return partConfigs[partName].label.replace(/\s+/g, "_").toUpperCase();
}

function getPlacedVolume() {
  return placedMeshes.reduce((sum, mesh) => {
    const config = partConfigs[mesh.userData.part];
    const size = mesh.userData.size;
    const dimensions = config.dimensions(size);

    if ("width" in dimensions) {
      return sum + dimensions.width * dimensions.height * dimensions.depth;
    }

    if ("radius" in dimensions && "height" in dimensions) {
      const depthScale = dimensions.depthScale ?? 1;
      return sum + Math.PI * dimensions.radius * dimensions.radius * dimensions.height * depthScale;
    }

    return sum;
  }, 0);
}

function getMaterialUsage() {
  const usage = {
    concrete: 0,
    steel: 0,
    glazing: 0,
  };

  placedMeshes.forEach((mesh) => {
    const size = mesh.userData.size;
    const weight = size.x * size.y * size.z;

    if (mesh.userData.part === "window") {
      usage.glazing += weight * 22.05;
      usage.steel += weight * 8.5;
      return;
    }

    if (mesh.userData.part === "column") {
      usage.steel += weight * 16.2;
      usage.concrete += weight * 12.8;
      return;
    }

    if (mesh.userData.part === "roof") {
      usage.steel += weight * 10.4;
      usage.concrete += weight * 4.6;
      return;
    }

    if (mesh.userData.part === "door") {
      usage.steel += weight * 5.8;
      usage.concrete += weight * 2.4;
      return;
    }

    usage.concrete += weight * 18.4;
  });

  return usage;
}

function getIntegrityEstimate() {
  if (!placedMeshes.length) {
    return 100;
  }

  const floors = placedMeshes.filter((mesh) => mesh.userData.part === "floor").length;
  const supports = placedMeshes.filter((mesh) => ["wall", "column"].includes(mesh.userData.part)).length;
  const openings = placedMeshes.filter((mesh) => ["window", "door"].includes(mesh.userData.part)).length;
  const roofs = placedMeshes.filter((mesh) => mesh.userData.part === "roof").length;
  const base = 64 + floors * 6 + supports * 4 + roofs * 3 - openings * 2.5;

  return THREE.MathUtils.clamp(Math.round(base), 28, 100);
}

function updateHud() {
  const size = getActiveSize();
  const label = getCurrentPartConfig().label;
  const totalFloorArea = placedMeshes
    .filter((mesh) => mesh.userData.part === "floor")
    .reduce((sum, mesh) => sum + mesh.userData.size.x * mesh.userData.size.z * 4, 0);
  const totalVolume = getPlacedVolume();
  const usage = getMaterialUsage();
  const integrity = getIntegrityEstimate();
  const actionLabel = eraseMode ? "Erase" : "Deploy";

  pieceCount.textContent = String(placedMeshes.length);
  levelReadout.textContent = String(currentLevel + 1);
  levelText.textContent = `Level ${currentLevel + 1}`;
  rotationReadout.textContent = `${Math.round(THREE.MathUtils.radToDeg(currentRotation % (Math.PI * 2)))}deg`;
  footprintReadout.textContent = formatFootprint(size);
  modeReadout.textContent = eraseMode ? "Erase" : "Build";
  selectedPartReadout.textContent = label;
  summaryPart.textContent = label;
  summarySize.textContent = formatVolume(size);
  paletteReadout.textContent = palettePresets[activePalette].label;
  areaReadout.textContent = `${totalFloorArea} sqm`;
  volumeReadout.textContent = totalVolume.toFixed(2);
  concreteReadout.textContent = usage.concrete.toFixed(1);
  steelReadout.textContent = usage.steel.toFixed(1);
  glazingReadout.textContent = usage.glazing.toFixed(1);
  integrityReadout.textContent = `${integrity}%`;
  integrityBar.style.width = `${integrity}%`;
  integrityCaption.textContent = integrity >= 85 ? "EST. OPTIMAL" : integrity >= 60 ? "EST. STABLE" : "EST. FRAGILE";
  statusPill.textContent = eraseMode ? "Click a placed module to remove it" : "Ready to place";
  activePrimitiveReadout.textContent = formatPrimitiveLabel(activePart);
  selectionReadout.textContent = `SEL: ${formatPrimitiveLabel(activePart)}`;
  builderModeReadout.textContent = eraseMode ? "ERASE_MODE" : "BUILD_MODE";
  actionReadout.textContent = actionLabel;
  eraseButton.classList.toggle("is-active", eraseMode);
}

function updatePreviewTransform(x = previewMesh.position.x, z = previewMesh.position.z) {
  const size = getActiveSize();
  const config = getCurrentPartConfig();
  const span = getPlacementSpan(size);
  const snappedX = snapToGrid(x, span.x);
  const snappedZ = snapToGrid(z, span.z);

  previewMesh.position.set(snappedX, config.positionY(currentLevel, size), snappedZ);
  previewMesh.rotation.set(0, currentRotation, 0);

  if (config.afterCreate) {
    config.afterCreate(previewMesh, size);
  }

  coordReadout.textContent = `COORD: X=${snappedX.toFixed(2)} Y=${previewMesh.position.y.toFixed(2)} Z=${snappedZ.toFixed(2)}`;
}

function setActivePart(partName) {
  activePart = partName;
  eraseMode = false;
  toolCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.part === partName);
  });
  syncSizeInputs();
  rebuildPreviewMesh();
  updateHud();
}

function applyPaletteToScene() {
  const palette = palettePresets[activePalette];
  scene.background.setHex(palette.sceneBackground);
  scene.fog.color.setHex(palette.fog);
  hemi.color.setHex(palette.hemiSky);
  hemi.groundColor.setHex(palette.hemiGround);
  fillLight.color.setHex(palette.pointLight);
  platform.material.color.setHex(palette.platform);
  buildSurface.material.color.setHex(palette.stagePlate);
  if (gridMaterials[0]) {
    gridMaterials[0].color.setHex(palette.gridMajor);
  }
  if (gridMaterials[1]) {
    gridMaterials[1].color.setHex(palette.gridMinor);
  }
  previewMaterial.color.setHex(getPaletteColor(activePart));
  previewMaterial.emissive.setHex(getPaletteColor(activePart));

  placedMeshes.forEach((mesh) => {
    const partName = mesh.userData.part;
    mesh.material.dispose();
    mesh.material = partConfigs[partName].material(mesh.userData.size);
    mesh.material.color.setHex(getPaletteColor(partName));
    if (partName === "window" && "emissive" in mesh.material) {
      mesh.material.emissive.setHex(getPaletteColor(partName));
      mesh.material.emissiveIntensity = activePalette === "night" ? 0.34 : 0.12;
    }
  });

  updateHud();
}

function setPalette(paletteName) {
  activePalette = paletteName;
  swatchChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.palette === paletteName);
  });
  applyPaletteToScene();
  rebuildPreviewMesh();
}

function setViewPreset(viewName) {
  const presets = {
    perspective: {
      position: new THREE.Vector3(16, 13, 18),
      lookAt: new THREE.Vector3(0, 3, 0),
    },
    top: {
      position: new THREE.Vector3(0, 30, 0.01),
      lookAt: new THREE.Vector3(0, 0, 0),
    },
    front: {
      position: new THREE.Vector3(0, 8, 24),
      lookAt: new THREE.Vector3(0, 4, 0),
    },
    detail: {
      position: new THREE.Vector3(8, 6, 8),
      lookAt: new THREE.Vector3(0, 2, 0),
    },
  };

  const preset = presets[viewName];
  if (!preset) {
    return;
  }

  viewChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.view === viewName);
  });

  cameraRig.targetPosition.copy(preset.position);
  cameraRig.targetLookAt.copy(preset.lookAt);
  isPresetAnimating = true;
}

function rotatePiece() {
  currentRotation += Math.PI / 2;
  updatePreviewTransform();
  updateHud();
}

function getFootprintCells(centerX, centerZ, size) {
  const cells = [];
  const startX = centerX - ((size.x - 1) * cellSize) / 2;
  const startZ = centerZ - ((size.z - 1) * cellSize) / 2;

  for (let ix = 0; ix < size.x; ix += 1) {
    for (let iz = 0; iz < size.z; iz += 1) {
      cells.push({
        x: startX + ix * cellSize,
        z: startZ + iz * cellSize,
      });
    }
  }

  return cells;
}

function getPlacementKey(centerX, centerZ, level, category) {
  return `${centerX}:${centerZ}:${level}:${category}`;
}

function placeCurrentPart() {
  const config = getCurrentPartConfig();
  const size = { ...getActiveSize() };
  const centerX = previewMesh.position.x;
  const centerZ = previewMesh.position.z;
  const key = getPlacementKey(centerX, centerZ, currentLevel, config.category);

  if (placements.has(key)) {
    const oldMesh = placements.get(key);
    partsGroup.remove(oldMesh);
    placedMeshes.splice(placedMeshes.indexOf(oldMesh), 1);
    placements.delete(key);
  }

  const mesh = createMesh(activePart, size);
  mesh.position.set(centerX, config.positionY(currentLevel, size), centerZ);
  mesh.rotation.y += currentRotation;
  mesh.userData = {
    key,
    part: activePart,
    level: currentLevel,
    size,
    footprint: getFootprintCells(centerX, centerZ, size),
  };

  partsGroup.add(mesh);
  placedMeshes.push(mesh);
  placements.set(key, mesh);
  updateHud();
}

function updatePointerFromEvent(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
}

function updatePreviewPosition(event) {
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  if (raycaster.ray.intersectPlane(buildPlane, intersection)) {
    updatePreviewTransform(intersection.x, intersection.z);
  }
}

function eraseAtPointer(event) {
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(placedMeshes, false);

  if (!hits.length) {
    return;
  }

  const mesh = hits[0].object;
  placements.delete(mesh.userData.key);
  partsGroup.remove(mesh);
  placedMeshes.splice(placedMeshes.indexOf(mesh), 1);
  updateHud();
}

function resetScene() {
  placedMeshes.splice(0).forEach((mesh) => {
    partsGroup.remove(mesh);
  });
  placements.clear();
  updateHud();
}

function handleSizeInput(axis, value) {
  sizeState[activePart][axis] = clampSizeForPart(activePart, axis, Number(value));
  syncSizeInputs();
  rebuildPreviewMesh();
  updateHud();
}

toolCards.forEach((card) => {
  card.addEventListener("click", () => {
    setActivePart(card.dataset.part);
  });
});

swatchChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setPalette(chip.dataset.palette);
  });
});

viewChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setViewPreset(chip.dataset.view);
  });
});

rotateButton.addEventListener("click", rotatePiece);

eraseButton.addEventListener("click", () => {
  eraseMode = !eraseMode;
  previewMesh.visible = !eraseMode;
  updateHud();
});

resetButton.addEventListener("click", resetScene);

levelUpButton.addEventListener("click", () => {
  currentLevel = Math.min(currentLevel + 1, 5);
  updatePreviewTransform();
  updateHud();
});

levelDownButton.addEventListener("click", () => {
  currentLevel = Math.max(currentLevel - 1, 0);
  updatePreviewTransform();
  updateHud();
});

sizeXInput.addEventListener("input", (event) => handleSizeInput("x", event.target.value));
sizeYInput.addEventListener("input", (event) => handleSizeInput("y", event.target.value));
sizeZInput.addEventListener("input", (event) => handleSizeInput("z", event.target.value));

canvas.addEventListener("pointermove", updatePreviewPosition);

canvas.addEventListener("click", (event) => {
  if (eraseMode) {
    eraseAtPointer(event);
    return;
  }

  placeCurrentPart();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "r") {
    rotatePiece();
  }

  if (key === "e") {
    currentLevel = Math.min(currentLevel + 1, 5);
    updatePreviewTransform();
    updateHud();
  }

  if (key === "q") {
    currentLevel = Math.max(currentLevel - 1, 0);
    updatePreviewTransform();
    updateHud();
  }
});

controls.addEventListener("start", () => {
  isPresetAnimating = false;
  cameraRig.currentPosition.copy(camera.position);
  cameraRig.targetPosition.copy(camera.position);
  cameraRig.currentLookAt.copy(controls.target);
  cameraRig.targetLookAt.copy(controls.target);
});

window.addEventListener("resize", setCanvasSize);

function animate() {
  if (isPresetAnimating) {
    cameraRig.currentPosition.lerp(cameraRig.targetPosition, 0.06);
    cameraRig.currentLookAt.lerp(cameraRig.targetLookAt, 0.06);
    camera.position.copy(cameraRig.currentPosition);
    controls.target.copy(cameraRig.currentLookAt);

    if (
      cameraRig.currentPosition.distanceTo(cameraRig.targetPosition) < 0.05 &&
      cameraRig.currentLookAt.distanceTo(cameraRig.targetLookAt) < 0.05
    ) {
      isPresetAnimating = false;
      cameraRig.currentPosition.copy(cameraRig.targetPosition);
      cameraRig.currentLookAt.copy(cameraRig.targetLookAt);
      camera.position.copy(cameraRig.targetPosition);
      controls.target.copy(cameraRig.targetLookAt);
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

syncSizeInputs();

try {
  setCanvasSize();
  applyPaletteToScene();
  updatePreviewTransform();
  updateHud();
  animate();
} catch (error) {
  console.error(error);
  statusPill.textContent = "Scene failed to load";
  canvas.style.minHeight = "420px";
  canvas.style.background =
    "linear-gradient(180deg, rgba(248, 236, 228, 0.95), rgba(233, 221, 210, 0.95))";
}
