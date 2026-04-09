import * as THREE from "./three.js-master/build/three.module.js";
import { EffectComposer } from "./three.js-master/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./three.js-master/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./three.js-master/examples/jsm/postprocessing/UnrealBloomPass.js";

const canvas = document.getElementById("webgl");
const notice = document.getElementById("notice");

function setNotice(message, isError = false) {
  notice.textContent = message;
  notice.style.background = isError ? "rgba(127, 29, 29, 0.88)" : "rgba(15, 23, 42, 0.8)";
  notice.style.color = isError ? "#fee2e2" : "#dbeafe";
}

try {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030712, 0.038);

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const camera = new THREE.PerspectiveCamera(42, sizes.width / sizes.height, 0.1, 100);
  camera.position.set(0, 0.6, 13);
  scene.add(camera);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(sizes.pixelRatio);
  composer.setSize(sizes.width, sizes.height);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(sizes.width, sizes.height),
    1.1,
    0.8,
    0.18
  );
  composer.addPass(bloomPass);

  const pointer = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();

  const world = new THREE.Group();
  scene.add(world);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const keyLight = new THREE.PointLight(0x67e8f9, 140, 30, 2);
  keyLight.position.set(0, 0, 0);
  world.add(keyLight);

  const fillLight = new THREE.PointLight(0xfb7185, 90, 30, 2);
  fillLight.position.set(6, 3, 4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xfbbf24, 70, 32, 2);
  rimLight.position.set(-8, -3, -3);
  scene.add(rimLight);

  const baseGeometry = new THREE.IcosahedronGeometry(2.2, 6);
  const basePosition = baseGeometry.attributes.position;
  const originalPositions = basePosition.array.slice();

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa5f3fc,
    emissive: 0x2563eb,
    emissiveIntensity: 0.72,
    roughness: 0.16,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    iridescence: 0.7,
    iridescenceIOR: 1.3,
  });

  const core = new THREE.Mesh(baseGeometry, coreMaterial);
  world.add(core);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
    })
  );
  world.add(shell);

  const rings = [];
  const ringConfigs = [
    { radius: 3.4, tube: 0.05, color: 0xffffff, tilt: [1.16, 0.2, 0.15] },
    { radius: 4.5, tube: 0.04, color: 0x67e8f9, tilt: [0.78, 0.4, 1.0] },
    { radius: 5.2, tube: 0.025, color: 0xfb7185, tilt: [2.1, 0.3, 0.6] },
  ];

  ringConfigs.forEach((config) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(config.radius, config.tube, 20, 240),
      new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.3,
        metalness: 0.68,
        roughness: 0.24,
      })
    );
    ring.rotation.set(config.tilt[0], config.tilt[1], config.tilt[2]);
    world.add(ring);
    rings.push(ring);
  });

  const starCount = 5000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const colorA = new THREE.Color(0xffffff);
  const colorB = new THREE.Color(0x67e8f9);
  const colorC = new THREE.Color(0xfb7185);

  for (let i = 0; i < starCount; i += 1) {
    const i3 = i * 3;
    const radius = 18 + Math.random() * 34;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i3 + 1] = radius * Math.cos(phi) * 0.55;
    starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const mix = Math.random();
    const color = mix < 0.55 ? colorA : mix < 0.82 ? colorB : colorC;
    starColors[i3] = color.r;
    starColors[i3 + 1] = color.g;
    starColors[i3 + 2] = color.b;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(stars);

  const orbiters = [];
  const orbiterGeometry = new THREE.SphereGeometry(0.12, 20, 20);

  for (let i = 0; i < 42; i += 1) {
    const color = i % 3 === 0 ? 0xfb7185 : i % 2 === 0 ? 0xfbbf24 : 0x67e8f9;
    const orbiter = new THREE.Mesh(
      orbiterGeometry,
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        metalness: 0.22,
      })
    );
    scene.add(orbiter);
    orbiters.push({
      mesh: orbiter,
      radius: 3.8 + Math.random() * 5.4,
      speed: 0.22 + Math.random() * 0.65,
      offset: Math.random() * Math.PI * 2,
      height: (Math.random() - 0.5) * 2.8,
      wobble: 0.2 + Math.random() * 0.5,
    });
  }

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(8, 12.5, 128),
    new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -4.8;
  scene.add(halo);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 22, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x0b1120,
      transparent: true,
      opacity: 0.34,
    })
  );
  backdrop.position.set(0, 0, -18);
  scene.add(backdrop);

  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / sizes.width) * 2 - 1;
    pointer.y = (event.clientY / sizes.height) * 2 - 1;
  });

  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);

    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(sizes.pixelRatio);
  });

  function animateCore(elapsed) {
    const positions = baseGeometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];
      const noise =
        Math.sin(ox * 1.7 + elapsed * 1.8) * 0.08 +
        Math.sin(oy * 2.1 + elapsed * 1.3) * 0.08 +
        Math.sin(oz * 1.4 + elapsed * 1.6) * 0.08;
      const scale = 1 + noise;

      positions[i] = ox * scale;
      positions[i + 1] = oy * scale;
      positions[i + 2] = oz * scale;
    }

    baseGeometry.attributes.position.needsUpdate = true;
    baseGeometry.computeVertexNormals();
  }

  function tick() {
    const elapsed = clock.getElapsedTime();

    animateCore(elapsed);

    world.rotation.y = elapsed * 0.18;
    world.rotation.x = Math.sin(elapsed * 0.34) * 0.1;
    world.position.y = Math.sin(elapsed * 1.25) * 0.18;

    shell.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.035);

    rings[0].rotation.z = elapsed * 0.36;
    rings[1].rotation.y = elapsed * 0.24;
    rings[2].rotation.x = elapsed * 0.18;

    keyLight.intensity = 136 + Math.sin(elapsed * 2.4) * 12;
    fillLight.position.x = Math.cos(elapsed * 0.6) * 8;
    fillLight.position.z = Math.sin(elapsed * 0.6) * 6;
    rimLight.position.x = Math.sin(elapsed * 0.5) * -9;
    rimLight.position.y = -2 + Math.cos(elapsed * 0.9) * 2;

    orbiters.forEach((orbiter, index) => {
      const angle = elapsed * orbiter.speed + orbiter.offset;
      orbiter.mesh.position.set(
        Math.cos(angle) * orbiter.radius,
        Math.sin(angle * 1.8 + index) * orbiter.wobble + orbiter.height,
        Math.sin(angle) * orbiter.radius
      );
    });

    stars.rotation.y = elapsed * 0.015;
    stars.rotation.x = Math.sin(elapsed * 0.08) * 0.08;

    camera.position.x += ((pointer.x * 1.8) - camera.position.x) * 0.03;
    camera.position.y += ((pointer.y * -1.2 + 0.6) - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    composer.render();
    requestAnimationFrame(tick);
  }

  setNotice("Scene ready. Move your mouse.");
  window.setTimeout(() => {
    notice.style.opacity = "0";
    notice.style.transition = "opacity 800ms ease";
  }, 2200);

  tick();
} catch (error) {
  console.error(error);
  setNotice("Scene failed to load. Open this page through a local server if modules are blocked.", true);
}
