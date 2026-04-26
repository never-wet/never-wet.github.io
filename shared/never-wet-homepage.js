import * as THREE from "three";
import { projects } from "../igloo-home/projects.js";

const localProjects = projects.filter((project) => !project.external);
const featuredProjects = [
  "ARCTIS / SIGNAL",
  "Aeroform Car Showcase",
  "Noema Vault",
  "Loreline",
  "Electric Circuit Lab",
  "AI Lab",
].map((title) => localProjects.find((project) => project.title === title)).filter(Boolean);

const state = {
  activeIndex: 0,
  hoveredIndex: -1,
  pointer: new THREE.Vector2(),
  targetPointer: { x: 0, y: 0 },
  scrollProgress: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const els = {
  canvas: document.getElementById("portfolioStage"),
  loader: document.getElementById("pageLoader"),
  loaderProgress: document.getElementById("loaderProgress"),
  cursor: document.getElementById("customCursor"),
  cursorLabel: document.querySelector(".cursor__label"),
  rail: document.querySelector("[data-project-rail]"),
  activeTag: document.getElementById("activeProjectTag"),
  activeTitle: document.getElementById("activeProjectTitle"),
  activeDescription: document.getElementById("activeProjectDescription"),
  activeLink: document.getElementById("activeProjectLink"),
};

function normalizeHref(href) {
  if (!href) return "#";
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith("../")) return `./${href.slice(3)}`;
  return href;
}

function boot() {
  populateProjectRail();
  updateActiveProject(0);
  initReveals();
  initLoader();
  initCursor();
  initMagnetic();
  initCapabilityTilt();
  initScene();
  initParallaxLayers();
  updateCounts();
}

function populateProjectRail() {
  if (!els.rail) return;

  featuredProjects.forEach((project, index) => {
    const link = document.createElement("a");
    link.className = "project-pill";
    link.href = normalizeHref(project.href);
    link.dataset.projectIndex = String(index);
    link.dataset.cursor = "Open";
    link.innerHTML = `
      <span class="project-pill__index">${String(index + 1).padStart(2, "0")}</span>
      <span>
        <strong>${project.title}</strong>
        <span>${project.tag}</span>
      </span>
      <span class="project-pill__arrow">Open</span>
    `;

    link.addEventListener("mouseenter", () => updateActiveProject(index));
    link.addEventListener("focus", () => updateActiveProject(index));
    els.rail.append(link);
  });
}

function updateCounts() {
  document.querySelectorAll("[data-live-count], [data-live-count-secondary]").forEach((node) => {
    node.textContent = String(localProjects.length);
  });
}

function updateActiveProject(index) {
  const safeIndex = THREE.MathUtils.clamp(index, 0, featuredProjects.length - 1);
  const project = featuredProjects[safeIndex];
  if (!project) return;

  state.activeIndex = safeIndex;
  if (els.activeTag) els.activeTag.textContent = project.tag;
  if (els.activeTitle) els.activeTitle.textContent = project.title;
  if (els.activeDescription) els.activeDescription.textContent = project.description;
  if (els.activeLink) {
    els.activeLink.href = normalizeHref(project.href);
    els.activeLink.target = project.external ? "_blank" : "";
    els.activeLink.rel = project.external ? "noreferrer" : "";
  }

  document.querySelectorAll(".project-pill").forEach((pill, pillIndex) => {
    pill.classList.toggle("is-active", pillIndex === safeIndex);
  });
}

function initLoader() {
  if (!els.loader || !els.loaderProgress) return;

  let progress = 0;
  const interval = window.setInterval(() => {
    progress = Math.min(progress + Math.random() * 18 + 7, 92);
    els.loaderProgress.style.width = `${progress}%`;
  }, 130);

  window.setTimeout(() => {
    window.clearInterval(interval);
    els.loaderProgress.style.width = "100%";
    window.setTimeout(() => {
      els.loader.classList.add("is-hidden");
      window.setTimeout(() => els.loader?.remove(), 1000);
    }, 360);
  }, 1100);
}

function initReveals() {
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  reveals.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 360)}ms`;
    observer.observe(element);
  });
}

function initCursor() {
  const cursor = els.cursor;
  if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

  const dot = cursor.querySelector(".cursor__dot");
  const ring = cursor.querySelector(".cursor__ring");
  let dotX = 0;
  let dotY = 0;
  let ringX = 0;
  let ringY = 0;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  document.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.classList.add("is-visible");
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("is-clicking"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-clicking"));

  document.addEventListener("mouseover", (event) => {
    const target = event.target.closest("a, button, [data-cursor]");
    if (!target) return;
    cursor.classList.add("is-hovering");
    if (els.cursorLabel) els.cursorLabel.textContent = target.dataset.cursor || "Open";
  });

  document.addEventListener("mouseout", (event) => {
    const target = event.target.closest("a, button, [data-cursor]");
    if (!target) return;
    cursor.classList.remove("is-hovering");
  });

  function animate() {
    dotX += (mouseX - dotX) * 0.32;
    dotY += (mouseY - dotY) * 0.32;
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    if (els.cursorLabel) {
      els.cursorLabel.style.transform = `translate(${ringX}px, ${ringY}px) translate(22px, -50%)`;
    }
    requestAnimationFrame(animate);
  }

  animate();
}

function initMagnetic() {
  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}

function initCapabilityTilt() {
  document.querySelectorAll(".capability-orbit article").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -7}deg) rotateY(${x * 9}deg) translateZ(16px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function initParallaxLayers() {
  const far = document.querySelector(".atmosphere--far");
  const near = document.querySelector(".atmosphere--near");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (far) far.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
    if (near) near.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
  }, { passive: true });
}

function initScene() {
  if (!els.canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060b, 0.035);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.25, 9.5);

    const rig = new THREE.Group();
    scene.add(rig);

    const ambient = new THREE.AmbientLight(0x7189ff, 0.85);
    const key = new THREE.DirectionalLight(0x73e3ff, 2.2);
    key.position.set(4, 5, 7);
    const rim = new THREE.PointLight(0xd6a84f, 30, 18);
    rim.position.set(-5, 1.2, 2);
    scene.add(ambient, key, rim);

    const raycaster = new THREE.Raycaster();
    const projectMeshes = createProjectObjects(scene);
    createEnvironment(scene);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("pointermove", (event) => {
      state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      state.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      state.targetPointer.x = state.pointer.x;
      state.targetPointer.y = state.pointer.y;

      raycaster.setFromCamera(state.pointer, camera);
      const hit = raycaster.intersectObjects(projectMeshes, false)[0];
      const nextIndex = hit ? hit.object.userData.index : -1;
      if (state.hoveredIndex !== nextIndex) {
        state.hoveredIndex = nextIndex;
        if (nextIndex >= 0) updateActiveProject(nextIndex);
        document.body.classList.toggle("is-project-hover", nextIndex >= 0);
        if (els.cursor) els.cursor.classList.toggle("is-hovering", nextIndex >= 0);
        if (els.cursorLabel && nextIndex >= 0) els.cursorLabel.textContent = "Open";
      }
    });

    window.addEventListener("click", () => {
      if (state.hoveredIndex < 0) return;
      const project = featuredProjects[state.hoveredIndex];
      if (project) window.location.href = normalizeHref(project.href);
    });

    window.addEventListener("scroll", () => {
      const max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      state.scrollProgress = window.scrollY / max;
      const projectZone = document.getElementById("projects");
      if (!projectZone) return;
      const rect = projectZone.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.35) {
        const local = THREE.MathUtils.clamp((window.innerHeight * 0.55 - rect.top) / Math.max(rect.height, 1), 0, 0.999);
        updateActiveProject(Math.floor(local * featuredProjects.length));
      }
    }, { passive: true });

    const clock = new THREE.Clock();

    function tick() {
      const time = clock.getElapsedTime();
      const targetZ = 9.5 - state.scrollProgress * 2.2;
      camera.position.x += (state.targetPointer.x * 0.55 - camera.position.x) * 0.035;
      camera.position.y += (1.25 + state.targetPointer.y * 0.35 - camera.position.y) * 0.035;
      camera.position.z += (targetZ - camera.position.z) * 0.035;
      camera.lookAt(0, 0.25, 0);

      rig.rotation.y += ((state.targetPointer.x * 0.06) - rig.rotation.y) * 0.04;
      rig.rotation.x += ((-state.targetPointer.y * 0.035) - rig.rotation.x) * 0.04;

      projectMeshes.forEach((mesh, index) => {
        const isActive = index === state.activeIndex;
        const isHover = index === state.hoveredIndex;
        const targetScale = isHover ? 1.14 : isActive ? 1.08 : 1;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        mesh.position.y = mesh.userData.baseY + Math.sin(time * 0.75 + index) * 0.09;
        mesh.rotation.y = mesh.userData.baseRotY + Math.sin(time * 0.35 + index) * 0.05 + (isActive ? 0.12 : 0);
        mesh.rotation.x = Math.sin(time * 0.42 + index * 0.7) * 0.035;
        mesh.material.emissiveIntensity += (((isActive || isHover) ? 0.45 : 0.12) - mesh.material.emissiveIntensity) * 0.08;
      });

      scene.traverse((object) => {
        if (object.userData.spin) object.rotation.y += object.userData.spin;
        if (object.userData.pulse) object.material.opacity = object.userData.baseOpacity + Math.sin(time + object.userData.phase) * 0.08;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }

    if (!state.reducedMotion) tick();
    else renderer.render(scene, camera);
  } catch (error) {
    document.body.classList.add("scene-failed");
    console.error("Portfolio scene failed to start:", error);
  }
}

function createProjectObjects(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const meshes = [];
  const radius = 4.25;
  const colors = [0x38d5ff, 0x8b5cf6, 0xd6a84f, 0x4ade80, 0x7dd3fc, 0xa78bfa];

  featuredProjects.forEach((project, index) => {
    const angle = (index / featuredProjects.length) * Math.PI * 2 - Math.PI * 0.42;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * 1.55;
    const y = Math.sin(index * 1.7) * 0.52;
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      metalness: 0.35,
      roughness: 0.22,
      transmission: 0.12,
      thickness: 0.3,
      transparent: true,
      opacity: 0.86,
      emissive: colors[index % colors.length],
      emissiveIntensity: 0.12,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.72, 2.28, 0.12, 4, 4, 1), material);
    mesh.position.set(x, y, z - 1.8);
    mesh.rotation.y = -angle * 0.42;
    mesh.userData = {
      index,
      project,
      baseY: y,
      baseRotY: mesh.rotation.y,
    };
    group.add(mesh);
    meshes.push(mesh);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: colors[index % colors.length], transparent: true, opacity: 0.55 })
    );
    edge.position.copy(mesh.position);
    edge.rotation.copy(mesh.rotation);
    edge.scale.setScalar(1.01);
    group.add(edge);

    const icon = createIconMark(colors[index % colors.length], index);
    icon.position.set(x, y + 0.2, z - 1.71);
    icon.rotation.copy(mesh.rotation);
    group.add(icon);
  });

  return meshes;
}

function createIconMark(color, index) {
  const mark = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.01, 16, 80), material);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), material);
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.018, 0.018), material);
  ring.userData.spin = 0.002 + index * 0.0003;
  core.userData.spin = -0.004;
  mark.add(ring, core, line);
  mark.scale.setScalar(1.35);
  return mark;
}

function createEnvironment(scene) {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 900;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 2] = -Math.random() * 16 - 1;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x9edfff,
      size: 0.018,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    })
  );
  scene.add(stars);

  const floor = new THREE.GridHelper(34, 32, 0x38d5ff, 0x1f2937);
  floor.position.y = -2.55;
  floor.position.z = -2.5;
  floor.material.transparent = true;
  floor.material.opacity = 0.18;
  scene.add(floor);

  for (let i = 0; i < 10; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9 + i * 0.34, 0.006, 8, 128),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x8b5cf6 : 0x38d5ff,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = i * 0.22;
    ring.position.z = -2.15 - i * 0.05;
    ring.userData.spin = (i % 2 ? -1 : 1) * (0.0007 + i * 0.00008);
    scene.add(ring);
  }

  for (let i = 0; i < 16; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06 + Math.random() * 0.1, 0),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xd6a84f : 0x7dd3fc,
        transparent: true,
        opacity: 0.36,
      })
    );
    shard.position.set((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 5.5, -2 - Math.random() * 5);
    shard.userData.spin = (Math.random() - 0.5) * 0.006;
    scene.add(shard);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
