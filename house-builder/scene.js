import * as THREE from "three";
import { OrbitControls } from "../threejs/three.js-master/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("scene");
const pieceCount = document.getElementById("piece-count");
const levelReadout = document.getElementById("level-readout");
const rotationReadout = document.getElementById("rotation-readout");
const levelText = document.getElementById("level-text");
const statusPill = document.getElementById("status-pill");
const toolCards = [...document.querySelectorAll(".tool-card")];
const rotateButton = document.getElementById("rotate-button");
const eraseButton = document.getElementById("erase-button");
const resetButton = document.getElementById("reset-button");
const levelUpButton = document.getElementById("level-up");
const levelDownButton = document.getElementById("level-down");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4ede1);
scene.fog = new THREE.Fog(0xf4ede1, 28, 58);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
camera.position.set(14, 12, 16);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 2.5, 0);
controls.minDistance = 10;
controls.maxDistance = 38;
controls.maxPolarAngle = Math.PI / 2.05;

const ambient = new THREE.HemisphereLight(0xfff2d7, 0xb18f67, 1.7);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(16, 24, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
scene.add(sun);

const fillLight = new THREE.PointLight(0x8fbfd2, 35, 60);
fillLight.position.set(-10, 8, -8);
scene.add(fillLight);

const world = new THREE.Group();
scene.add(world);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(16, 18, 1.6, 60),
  new THREE.MeshStandardMaterial({
    color: 0xe2c89f,
    roughness: 0.96,
    metalness: 0.04,
  })
);
platform.receiveShadow = true;
platform.position.y = -0.8;
world.add(platform);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({
    color: 0xf0e3cd,
    transparent: true,
    opacity: 0.05,
  })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0.001;
plane.name = "build-plane";
world.add(plane);

const grid = new THREE.GridHelper(40, 20, 0xb38c63, 0xcdbda9);
grid.position.y = 0.01;
world.add(grid);

const partsGroup = new THREE.Group();
world.add(partsGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const buildPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersection = new THREE.Vector3();

const cellSize = 2;
const storyHeight = 2.4;
const placements = new Map();
const placedMeshes = [];

const partConfigs = {
  floor: {
    label: "Floor Tile",
    category: "floor",
    getGeometry: () => new THREE.BoxGeometry(1.9, 0.22, 1.9),
    material: () => new THREE.MeshStandardMaterial({ color: 0xd5b07c, roughness: 0.9 }),
    previewColor: 0xd5b07c,
    getPositionY: (level) => 0.11 + level * storyHeight,
  },
  wall: {
    label: "Wall",
    category: "body",
    getGeometry: () => new THREE.BoxGeometry(1.9, 2.1, 0.24),
    material: () => new THREE.MeshStandardMaterial({ color: 0xf7f0e6, roughness: 0.8 }),
    previewColor: 0xf7f0e6,
    getPositionY: (level) => 1.05 + level * storyHeight,
  },
  window: {
    label: "Window",
    category: "body",
    getGeometry: () => new THREE.BoxGeometry(1.9, 2, 0.2),
    material: () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xa9ced7,
        transparent: true,
        opacity: 0.82,
        roughness: 0.2,
        metalness: 0.08,
        transmission: 0.16,
      }),
    previewColor: 0x8fbfd2,
    getPositionY: (level) => 1 + level * storyHeight,
  },
  door: {
    label: "Door",
    category: "body",
    getGeometry: () => new THREE.BoxGeometry(1.15, 2, 0.18),
    material: () => new THREE.MeshStandardMaterial({ color: 0x7c4a34, roughness: 0.75 }),
    previewColor: 0x7c4a34,
    getPositionY: (level) => 1 + level * storyHeight,
  },
  column: {
    label: "Column",
    category: "body",
    getGeometry: () => new THREE.CylinderGeometry(0.18, 0.18, 2.16, 18),
    material: () => new THREE.MeshStandardMaterial({ color: 0x8ea07f, roughness: 0.7 }),
    previewColor: 0x7c9471,
    getPositionY: (level) => 1.08 + level * storyHeight,
  },
  roof: {
    label: "Roof",
    category: "roof",
    getGeometry: () => new THREE.ConeGeometry(1.52, 1.3, 4),
    material: () => new THREE.MeshStandardMaterial({ color: 0xb5543a, roughness: 0.86 }),
    previewColor: 0xb5543a,
    getPositionY: (level) => 2.75 + level * storyHeight,
    setupMesh: (mesh) => {
      mesh.rotation.y += Math.PI / 4;
    },
  },
};

let activePart = "floor";
let eraseMode = false;
let currentLevel = 0;
let currentRotation = 0;

const previewMaterial = new THREE.MeshStandardMaterial({
  color: partConfigs.floor.previewColor,
  transparent: true,
  opacity: 0.45,
});

let previewMesh = createPreviewMesh(activePart);
world.add(previewMesh);

function setCanvasSize() {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function gridToWorld(value) {
  return Math.round(value / cellSize) * cellSize;
}

function getPlacementKey(gridX, gridZ, level, category) {
  return `${gridX}:${gridZ}:${level}:${category}`;
}

function createMesh(partName) {
  const config = partConfigs[partName];
  const mesh = new THREE.Mesh(config.getGeometry(), config.material());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (config.setupMesh) {
    config.setupMesh(mesh);
  }
  return mesh;
}

function createPreviewMesh(partName) {
  const config = partConfigs[partName];
  const mesh = new THREE.Mesh(config.getGeometry(), previewMaterial);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.material.color.setHex(config.previewColor);
  if (config.setupMesh) {
    config.setupMesh(mesh);
  }
  return mesh;
}

function rebuildPreviewMesh() {
  world.remove(previewMesh);
  previewMesh.geometry.dispose();
  previewMesh = createPreviewMesh(activePart);
  previewMesh.rotation.y += currentRotation;
  previewMesh.visible = !eraseMode;
  world.add(previewMesh);
}

function updateHud() {
  pieceCount.textContent = String(placedMeshes.length);
  levelReadout.textContent = String(currentLevel + 1);
  levelText.textContent = `Level ${currentLevel + 1}`;
  rotationReadout.textContent = `${Math.round(THREE.MathUtils.radToDeg(currentRotation))}deg`;

  const modeText = eraseMode ? "Erase mode" : `${partConfigs[activePart].label} selected`;
  statusPill.textContent = `${modeText} | ${placedMeshes.length} pieces`;
  eraseButton.classList.toggle("is-active", eraseMode);
}

function setActivePart(partName) {
  activePart = partName;
  eraseMode = false;
  toolCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.part === partName);
  });
  rebuildPreviewMesh();
  updateHud();
}

function rotatePiece() {
  currentRotation += Math.PI / 2;
  previewMesh.rotation.y += Math.PI / 2;
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
    const x = gridToWorld(intersection.x);
    const z = gridToWorld(intersection.z);
    previewMesh.position.set(x, partConfigs[activePart].getPositionY(currentLevel), z);
    previewMesh.rotation.y = currentRotation;
    if (partConfigs[activePart].setupMesh) {
      previewMesh.rotation.y += Math.PI / 4;
    }
  }
}

function placeCurrentPart() {
  const gridX = gridToWorld(previewMesh.position.x);
  const gridZ = gridToWorld(previewMesh.position.z);
  const config = partConfigs[activePart];
  const key = getPlacementKey(gridX, gridZ, currentLevel, config.category);

  if (placements.has(key)) {
    const oldMesh = placements.get(key);
    partsGroup.remove(oldMesh);
    placedMeshes.splice(placedMeshes.indexOf(oldMesh), 1);
    placements.delete(key);
  }

  const mesh = createMesh(activePart);
  mesh.position.set(gridX, config.getPositionY(currentLevel), gridZ);
  mesh.rotation.y += currentRotation;
  mesh.userData = {
    key,
    part: activePart,
    gridX,
    gridZ,
    level: currentLevel,
    category: config.category,
  };

  partsGroup.add(mesh);
  placedMeshes.push(mesh);
  placements.set(key, mesh);
  updateHud();
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

toolCards.forEach((card) => {
  card.addEventListener("click", () => {
    setActivePart(card.dataset.part);
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
  currentLevel = Math.min(currentLevel + 1, 4);
  previewMesh.position.y = partConfigs[activePart].getPositionY(currentLevel);
  updateHud();
});

levelDownButton.addEventListener("click", () => {
  currentLevel = Math.max(currentLevel - 1, 0);
  previewMesh.position.y = partConfigs[activePart].getPositionY(currentLevel);
  updateHud();
});

canvas.addEventListener("pointermove", updatePreviewPosition);

canvas.addEventListener("click", (event) => {
  if (eraseMode) {
    eraseAtPointer(event);
    return;
  }

  placeCurrentPart();
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    rotatePiece();
  }

  if (event.key.toLowerCase() === "e") {
    currentLevel = Math.min(currentLevel + 1, 4);
    previewMesh.position.y = partConfigs[activePart].getPositionY(currentLevel);
    updateHud();
  }

  if (event.key.toLowerCase() === "q") {
    currentLevel = Math.max(currentLevel - 1, 0);
    previewMesh.position.y = partConfigs[activePart].getPositionY(currentLevel);
    updateHud();
  }
});

window.addEventListener("resize", setCanvasSize);

const skyPieces = [];
for (let i = 0; i < 7; i += 1) {
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(0.8 + Math.random() * 1.2, 18, 18),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 1,
    })
  );
  cloud.position.set(-16 + i * 5.3, 12 + Math.sin(i) * 1.4, -12 + Math.cos(i) * 4);
  cloud.scale.set(1.6, 0.8, 1);
  scene.add(cloud);
  skyPieces.push(cloud);
}

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  skyPieces.forEach((cloud, index) => {
    cloud.position.x += Math.sin(elapsed * 0.08 + index) * 0.0024;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

setCanvasSize();
updateHud();
animate();
