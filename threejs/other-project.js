import * as THREE from "./three.js-master/build/three.module.js";
import { EffectComposer } from "./three.js-master/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./three.js-master/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./three.js-master/examples/jsm/postprocessing/UnrealBloomPass.js";

const notice = document.getElementById("notice");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const introShell = document.getElementById("intro-shell");

function setNotice(message, isError = false) {
  notice.textContent = message;
  notice.style.background = isError ? "rgba(127, 29, 29, 0.88)" : "rgba(2, 6, 23, 0.68)";
}

function makeComposer(renderer, scene, camera, width, height, bloomStrength) {
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(new THREE.Vector2(width, height), bloomStrength, 0.95, 0.18)
  );
  return composer;
}

function setupVoidScene() {
  const canvas = document.getElementById("void-canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020611, 0.032);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 1.8, 16);
  scene.add(camera);

  const composer = makeComposer(
    renderer,
    scene,
    camera,
    window.innerWidth,
    window.innerHeight,
    1.45
  );

  const pointer = new THREE.Vector2(0, 0);
  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff, 0.24));

  const coreLight = new THREE.PointLight(0x67d4ff, 220, 40, 2);
  root.add(coreLight);

  const upperLight = new THREE.PointLight(0x7dd3fc, 70, 35, 2);
  upperLight.position.set(0, 8, 2);
  scene.add(upperLight);

  const lowerLight = new THREE.PointLight(0x1d4ed8, 90, 50, 2);
  lowerLight.position.set(0, -8, -2);
  scene.add(lowerLight);

  const singularity = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xbfeaff,
      emissive: 0x2563eb,
      emissiveIntensity: 1.2,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.9,
    })
  );
  root.add(singularity);

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.95 })
  );
  pupil.scale.set(1.1, 0.56, 0.45);
  root.add(pupil);

  const iris = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.18, 24, 160),
    new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.95 })
  );
  iris.rotation.x = Math.PI / 2;
  root.add(iris);

  const auraShell = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    })
  );
  root.add(auraShell);

  const blackSphere = new THREE.Mesh(
    new THREE.SphereGeometry(16, 96, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      emissive: 0x050505,
      emissiveIntensity: 0.02,
      roughness: 0.82,
      metalness: 0.02,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
    })
  );
  scene.add(blackSphere);

  const blackSphereGlow = new THREE.Mesh(
    new THREE.SphereGeometry(16.8, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  );
  scene.add(blackSphereGlow);

  const rings = [];
  [
    { radius: 3.4, tube: 0.045, y: 0, color: 0x93c5fd },
    { radius: 4.7, tube: 0.03, y: 0.6, color: 0x60a5fa },
    { radius: 6.4, tube: 0.024, y: -0.5, color: 0xbfdbfe },
  ].forEach((spec) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 24, 280),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.78 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = spec.y;
    root.add(ring);
    rings.push(ring);
  });

  const glyphs = [];
  for (let i = 0; i < 24; i += 1) {
    const glyph = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.24 + Math.random() * 0.16, 5 + (i % 5)),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xdbeafe : 0x7dd3fc,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      })
    );
    const angle = (i / 24) * Math.PI * 2;
    const radius = 5.2 + (i % 3) * 0.55;
    glyph.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.9, Math.sin(angle) * radius);
    glyph.lookAt(0, 0, 0);
    scene.add(glyph);
    glyphs.push({ mesh: glyph, angle, radius, speed: 0.12 + (i % 7) * 0.016 });
  }

  const shardGeometry = new THREE.OctahedronGeometry(0.32, 0);
  const shards = [];
  for (let i = 0; i < 140; i += 1) {
    const shard = new THREE.Mesh(
      shardGeometry,
      new THREE.MeshPhysicalMaterial({
        color: i % 2 === 0 ? 0x93c5fd : 0xffffff,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.28,
        roughness: 0.08,
        metalness: 0.16,
        transmission: 0.2,
        transparent: true,
        opacity: 0.82,
      })
    );
    const radius = 4 + Math.random() * 15;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 12;
    shard.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
    shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(shard);
    shards.push({
      mesh: shard,
      radius,
      theta,
      baseY: y,
      speed: 0.08 + Math.random() * 0.22,
      drift: 0.12 + Math.random() * 0.28,
    });
  }

  const particleCount = 7000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const nearColor = new THREE.Color(0xdbeafe);
  const farColor = new THREE.Color(0x1d4ed8);

  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    const radius = 8 + Math.random() * 46;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.cos(phi) * 0.9;
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const color = nearColor.clone().lerp(farColor, Math.random());
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const stars = new THREE.Points(
    new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(positions, 3))
      .setAttribute("color", new THREE.BufferAttribute(colors, 3)),
    new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(stars);

  const floorSigil = new THREE.Mesh(
    new THREE.RingGeometry(6.5, 13.5, 160),
    new THREE.MeshBasicMaterial({
      color: 0x0f2d5c,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    })
  );
  floorSigil.rotation.x = -Math.PI / 2;
  floorSigil.position.y = -5.8;
  scene.add(floorSigil);

  return {
    updatePointer(x, y) {
      pointer.set(x, y);
    },
    resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(width, height);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render(elapsed, progress) {
      const collapseProgress = THREE.MathUtils.clamp(progress / 3, 0, 1);
      const sphereStarted = progress >= 3;
      const sphereProgress = sphereStarted ? THREE.MathUtils.clamp((progress - 3) / 2, 0, 1) : 0;
      const eased = THREE.MathUtils.smoothstep(collapseProgress, 0, 1);
      const spherePhase = sphereStarted ? THREE.MathUtils.smoothstep(sphereProgress, 0, 1) : 0;
      const sphereShrinkPhase = sphereProgress < 0.12
        ? 0
        : THREE.MathUtils.smoothstep(
            THREE.MathUtils.clamp((sphereProgress - 0.12) / 0.38, 0, 1),
            0,
            1
          );
      const domainScale = THREE.MathUtils.lerp(1, 0.12, eased);

      singularity.rotation.y = elapsed * 0.3;
      singularity.scale.setScalar((1 + Math.sin(elapsed * 2.2) * 0.035) * THREE.MathUtils.lerp(1, 0.86, eased));
      pupil.rotation.z = Math.sin(elapsed * 0.8) * 0.22;
      iris.rotation.z = elapsed * 0.55;
      auraShell.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.055);

      rings[0].rotation.z = elapsed * 0.18;
      rings[1].rotation.z = -elapsed * 0.26;
      rings[2].rotation.z = elapsed * 0.12;

      glyphs.forEach((glyph, index) => {
        const a = glyph.angle + elapsed * glyph.speed;
        const glyphPull = THREE.MathUtils.lerp(1, 0.08, spherePhase);
        glyph.mesh.position.x = Math.cos(a) * glyph.radius * glyphPull;
        glyph.mesh.position.y = Math.sin(a * 2.2 + index) * 1.2 * glyphPull;
        glyph.mesh.position.z = Math.sin(a) * glyph.radius * glyphPull;
        glyph.mesh.rotation.z += 0.01;
        glyph.mesh.material.opacity = THREE.MathUtils.lerp(0.8, 0.08, eased);
      });

      shards.forEach((shard, index) => {
        const a = shard.theta + elapsed * shard.speed;
        const shardPull = THREE.MathUtils.lerp(1, 0.05, spherePhase);
        shard.mesh.position.x = Math.cos(a) * shard.radius * shardPull;
        shard.mesh.position.z = Math.sin(a) * shard.radius * shardPull;
        shard.mesh.position.y =
          (shard.baseY + Math.sin(elapsed * shard.drift + index) * 0.7) * shardPull;
        shard.mesh.rotation.x += 0.008;
        shard.mesh.rotation.y += 0.012;
        shard.mesh.material.opacity = THREE.MathUtils.lerp(0.82, 0.1, eased);
      });

      stars.rotation.y = elapsed * 0.025;
      stars.rotation.x = Math.sin(elapsed * 0.1) * 0.09;
      stars.scale.setScalar(THREE.MathUtils.lerp(1, 0.06, spherePhase));
      floorSigil.rotation.z = elapsed * 0.07;

      root.scale.setScalar(domainScale);
      root.rotation.y = elapsed * 0.08;
      root.position.y = Math.sin(elapsed * 1.3) * 0.18 - eased * 0.5;
      root.position.z = THREE.MathUtils.lerp(0, -4.3, eased);

      blackSphere.position.copy(root.position);
      blackSphere.scale.setScalar(
        sphereShrinkPhase === 0
          ? 3.4
          : THREE.MathUtils.lerp(3.4, 0.42, sphereShrinkPhase)
      );
      blackSphere.material.opacity = sphereStarted
        ? THREE.MathUtils.lerp(0.55, 1, spherePhase)
        : 0;
      blackSphere.material.emissiveIntensity = sphereStarted
        ? THREE.MathUtils.lerp(0.08, 0.18, spherePhase)
        : 0.02;

      blackSphereGlow.position.copy(root.position);
      blackSphereGlow.scale.setScalar(
        sphereShrinkPhase === 0
          ? 3.7
          : THREE.MathUtils.lerp(3.7, 0.5, sphereShrinkPhase)
      );
      blackSphereGlow.material.opacity = sphereStarted
        ? THREE.MathUtils.lerp(0.18, 0.36, spherePhase)
        : 0;

      auraShell.material.opacity = THREE.MathUtils.lerp(0.08, 0.005, eased);
      stars.material.opacity = THREE.MathUtils.lerp(0.92, 0.04, eased);
      floorSigil.material.opacity = THREE.MathUtils.lerp(0.42, 0.02, eased);

      coreLight.intensity = THREE.MathUtils.lerp(220 + Math.sin(elapsed * 3) * 20, 12, eased);
      upperLight.intensity = THREE.MathUtils.lerp(70, 6, eased);
      lowerLight.intensity = THREE.MathUtils.lerp(90, 8, eased);

      camera.position.x += ((pointer.x * 2.3) - camera.position.x) * 0.028;
      camera.position.y += ((pointer.y * -1.5 + 1.8) - camera.position.y) * 0.028;
      camera.lookAt(root.position.x, root.position.y, root.position.z);

      composer.render();
    },
  };
}

function setupShrineScene() {
  const canvas = document.getElementById("shrine-canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x140404, 0.03);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 150);
  camera.position.set(0, 3.8, 17);
  scene.add(camera);

  const composer = makeComposer(
    renderer,
    scene,
    camera,
    window.innerWidth,
    window.innerHeight,
    1.05
  );

  const pointer = new THREE.Vector2(0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.16));

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x7f1d1d, transparent: true, opacity: 0.96 })
  );
  moon.position.set(0, 8, -26);
  scene.add(moon);

  const moonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    })
  );
  moonGlow.position.copy(moon.position);
  scene.add(moonGlow);

  const root = new THREE.Group();
  scene.add(root);

  const shrineLight = new THREE.PointLight(0xef4444, 110, 50, 2);
  shrineLight.position.set(0, 4, 2);
  root.add(shrineLight);

  const underLight = new THREE.PointLight(0xf97316, 50, 30, 2);
  underLight.position.set(0, -2, 6);
  root.add(underLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 160),
    new THREE.MeshStandardMaterial({
      color: 0x150505,
      roughness: 0.95,
      metalness: 0.04,
      emissive: 0x2a0808,
      emissiveIntensity: 0.24,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.2;
  scene.add(floor);

  const ritualRing = new THREE.Mesh(
    new THREE.RingGeometry(5.5, 11.5, 160),
    new THREE.MeshBasicMaterial({
      color: 0xb91c1c,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    })
  );
  ritualRing.rotation.x = -Math.PI / 2;
  ritualRing.position.y = -4.15;
  scene.add(ritualRing);

  const altar = new THREE.Group();
  altar.position.y = -1.8;
  root.add(altar);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0x241010, roughness: 0.85, metalness: 0.06 })
  );
  altar.add(base);

  for (let i = 0; i < 4; i += 1) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(7 - i * 0.8, 0.4, 6 - i * 0.7),
      new THREE.MeshStandardMaterial({ color: 0x2a1111, roughness: 0.88, metalness: 0.03 })
    );
    step.position.y = 0.65 + i * 0.34;
    altar.add(step);
  }

  const gate = new THREE.Group();
  gate.position.y = 2.6;
  altar.add(gate);

  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a0d0d,
    roughness: 0.75,
    metalness: 0.08,
    emissive: 0x220606,
    emissiveIntensity: 0.24,
  });

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.4, 0.8), pillarMaterial);
  leftPillar.position.set(-2.2, 0, 0);
  gate.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 2.2;
  gate.add(rightPillar);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.75, 0.95), pillarMaterial);
  topBeam.position.y = 2.35;
  gate.add(topBeam);

  const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.46, 0.8), pillarMaterial);
  lowerBeam.position.y = 1.68;
  gate.add(lowerBeam);

  const shrineRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.6, 2.8, 4),
    new THREE.MeshStandardMaterial({
      color: 0x1b0707,
      roughness: 0.88,
      metalness: 0.05,
      emissive: 0x140404,
      emissiveIntensity: 0.2,
    })
  );
  shrineRoof.rotation.y = Math.PI / 4;
  shrineRoof.position.y = 4.2;
  altar.add(shrineRoof);

  const shrineBack = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 3.2, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x120707, roughness: 0.86, metalness: 0.04 })
  );
  shrineBack.position.set(0, 2.3, -0.9);
  altar.add(shrineBack);

  const haloRings = [];
  [3.5, 5.2, 7.5].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, index === 0 ? 0.08 : 0.04, 20, 240),
      new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xfb7185 : 0xf97316,
        transparent: true,
        opacity: index === 0 ? 0.45 : 0.28,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.9 + index * 0.35;
    root.add(ring);
    haloRings.push(ring);
  });

  const debris = [];
  const debrisGeometry = new THREE.DodecahedronGeometry(0.34, 0);
  for (let i = 0; i < 180; i += 1) {
    const rock = new THREE.Mesh(
      debrisGeometry,
      new THREE.MeshStandardMaterial({
        color: i % 4 === 0 ? 0x4a1a1a : 0x2b1111,
        roughness: 0.96,
        metalness: 0.02,
      })
    );
    const radius = 4 + Math.random() * 18;
    const angle = Math.random() * Math.PI * 2;
    const height = -2 + Math.random() * 8;
    rock.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    scene.add(rock);
    debris.push({
      mesh: rock,
      radius,
      angle,
      height,
      speed: 0.04 + Math.random() * 0.12,
      lift: 0.1 + Math.random() * 0.24,
    });
  }

  const emberCount = 4500;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);
  const emberA = new THREE.Color(0xfca5a5);
  const emberB = new THREE.Color(0xf97316);

  for (let i = 0; i < emberCount; i += 1) {
    const i3 = i * 3;
    emberPositions[i3] = (Math.random() - 0.5) * 46;
    emberPositions[i3 + 1] = (Math.random() - 0.1) * 20;
    emberPositions[i3 + 2] = (Math.random() - 0.5) * 46;
    const color = emberA.clone().lerp(emberB, Math.random());
    emberColors[i3] = color.r;
    emberColors[i3 + 1] = color.g;
    emberColors[i3 + 2] = color.b;
  }

  const embers = new THREE.Points(
    new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(emberPositions, 3))
      .setAttribute("color", new THREE.BufferAttribute(emberColors, 3)),
    new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(embers);

  const ash = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(
          Array.from({ length: 3000 * 3 }, (_, index) => {
            if (index % 3 === 0) return (Math.random() - 0.5) * 60;
            if (index % 3 === 1) return (Math.random() - 0.5) * 28;
            return (Math.random() - 0.5) * 60;
          })
        ),
        3
      )
    ),
    new THREE.PointsMaterial({
      color: 0xd6c6c6,
      size: 0.04,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
  );
  scene.add(ash);

  return {
    updatePointer(x, y) {
      pointer.set(x, y);
    },
    resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(width, height);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render(elapsed, pageScroll) {
      haloRings[0].rotation.z = elapsed * 0.2;
      haloRings[1].rotation.z = -elapsed * 0.14;
      haloRings[2].rotation.z = elapsed * 0.09;
      ritualRing.rotation.z = elapsed * 0.05;

      debris.forEach((rock, index) => {
        const a = rock.angle + elapsed * rock.speed;
        rock.mesh.position.x = Math.cos(a) * rock.radius;
        rock.mesh.position.z = Math.sin(a) * rock.radius;
        rock.mesh.position.y = rock.height + Math.sin(elapsed * rock.lift + index) * 0.45;
        rock.mesh.rotation.x += 0.006;
        rock.mesh.rotation.y += 0.009;
      });

      embers.rotation.y = elapsed * 0.04;
      embers.position.y = Math.sin(elapsed * 0.4) * 0.3;
      ash.rotation.y = -elapsed * 0.01;

      shrineRoof.position.y = 4.2 + Math.sin(elapsed * 1.3) * 0.06;
      gate.rotation.y = Math.sin(elapsed * 0.6) * 0.06;
      shrineLight.intensity = 105 + Math.sin(elapsed * 3.2) * 14;
      underLight.intensity = 44 + Math.sin(elapsed * 2.3) * 8;

      camera.position.x += ((pointer.x * 1.8) - camera.position.x) * 0.025;
      camera.position.y += ((pointer.y * -0.9 + 3.8) - camera.position.y) * 0.025;
      camera.position.z = 17 - Math.min(pageScroll * 0.008, 2.5);
      camera.lookAt(0, 0.8, 0);

      composer.render();
    },
  };
}

try {
  const voidScene = setupVoidScene();
  const shrineScene = setupShrineScene();
  const clock = new THREE.Clock();
  let shrineUnlocked = false;
  const MAX_PROGRESS = 5;

  const progressState = {
    current: 0,
    target: 0,
  };

  function updateUi() {
    const percent = Math.round((progressState.current / MAX_PROGRESS) * 100);
    progressFill.style.width = `${(progressState.current / MAX_PROGRESS) * 100}%`;
    progressText.textContent = `${percent}%`;

    if (progressState.current >= 4.995) {
      document.body.classList.add("release-scroll");
      setNotice("100%. Scroll down to reach Malevolent Shrine.");
      if (!shrineUnlocked) {
        shrineUnlocked = true;
        window.setTimeout(() => {
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
        }, 180);
      }
    } else {
      shrineUnlocked = false;
      document.body.classList.remove("release-scroll");
      setNotice("Scroll to drive the collapse.");
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    }
  }

  window.addEventListener(
    "wheel",
    (event) => {
      const activeForward = event.deltaY > 0 && progressState.current < 4.995;
      const activeBackward = event.deltaY < 0 && (progressState.current > 0 || window.scrollY <= 0);

      if (activeForward || activeBackward) {
        if (!(document.body.classList.contains("release-scroll") && event.deltaY > 0)) {
          event.preventDefault();
        }
        progressState.target = THREE.MathUtils.clamp(
          progressState.target + event.deltaY * 0.00045,
          0,
          MAX_PROGRESS
        );
      }
    },
    { passive: false }
  );

  window.addEventListener("scroll", () => {
    if (progressState.current < 4.995 && window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  });

  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    voidScene.updatePointer(x, y);
    shrineScene.updatePointer(x, y);
  });

  window.addEventListener("resize", () => {
    voidScene.resize();
    shrineScene.resize();
  });

  function tick() {
    const elapsed = clock.getElapsedTime();
    progressState.current = THREE.MathUtils.lerp(progressState.current, progressState.target, 0.12);
    if (Math.abs(progressState.current - progressState.target) < 0.0005) {
      progressState.current = progressState.target;
    }

    updateUi();

    const completionFade = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp((progressState.current - 4.96) / 0.04, 0, 1),
      0,
      1
    );
    const introFade = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp(window.scrollY / Math.max(window.innerHeight * 0.7, 1), 0, 1),
      0,
      1
    );
    introShell.style.opacity = `${1 - Math.max(introFade, completionFade)}`;

    voidScene.render(elapsed, progressState.current);
    shrineScene.render(elapsed, window.scrollY);

    requestAnimationFrame(tick);
  }

  tick();
} catch (error) {
  console.error(error);
  setNotice("Scene failed to load. Open it through a local server if modules are blocked.", true);
}
