import * as THREE from "three";
import { projects } from "../igloo-home/projects.js";

const localProjects = projects.filter((project) => !project.external);
const featuredNames = [
  "Wheel of Fortune",
  "Hand Draw Studio",
  "Market Intel AI",
  "Loop DAW",
  "Entity Diagnostic System",
  "Code Workspace",
  "Terrain Generator",
  "Physics Engine Playground",
  "ARCTIS / SIGNAL",
  "AeroRank Vehicle System",
  "Aeroform Car Showcase",
  "Noema Vault",
  "Loreline",
  "Electric Circuit Lab",
  "AI Lab",
];

const projectImages = [
  "./assets/homepage/architecture-shadow.jpg",
  "./assets/homepage/gallery-installation.jpg",
  "./assets/homepage/render-structure.jpg",
  "./assets/homepage/hero-light-abstract.jpg",
];

const featuredProjects = featuredNames
  .map((title) => projects.find((project) => project.title === title))
  .filter(Boolean);

const state = {
  pointer: new THREE.Vector2(),
  pointerTarget: { x: 0, y: 0 },
  scrollProgress: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const els = {
  canvas: document.getElementById("portfolioStage"),
  loader: document.getElementById("pageLoader"),
  loaderProgress: document.getElementById("loaderProgress"),
  cursor: document.getElementById("customCursor"),
  cursorLabel: document.querySelector(".cursor__label"),
  projectGrid: document.querySelector("[data-project-grid]"),
  projectIndex: document.querySelector("[data-project-index]"),
  pageTransition: null,
  pageTransitionTitle: null,
};

function normalizeHref(href) {
  if (!href) return "#";
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith("../")) return `./${href.slice(3)}`;
  return href;
}

function boot() {
  populateProjects();
  populateArchive();
  updateCounts();
  initLoader();
  initReveals();
  initCursor();
  initMagnetic();
  initAnchorNavigation();
  initPageTransitions();
  initTiltCards();
  initParallax();
  initScene();
}

function populateProjects() {
  if (!els.projectGrid) return;

  featuredProjects.forEach((project, index) => {
    const card = document.createElement("a");
    card.className = "project-card reveal";
    card.href = normalizeHref(project.href);
    card.dataset.reveal = "";
    card.dataset.tiltCard = "";
    card.dataset.cursor = "Open";
    if (project.external) {
      card.target = "_blank";
      card.rel = "noreferrer";
    }

    const image = projectImages[index % projectImages.length];
    card.innerHTML = `
      <span class="project-card__media" aria-hidden="true">
        <img src="${image}" alt="" loading="lazy" />
      </span>
      <span class="project-card__top">
        <span class="project-card__meta">${String(index + 1).padStart(2, "0")} / ${project.tag}</span>
        <span class="project-card__arrow">Open</span>
      </span>
      <span class="project-card__body">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
      </span>
    `;
    els.projectGrid.append(card);
  });
}

function populateArchive() {
  if (!els.projectIndex) return;

  projects.forEach((project, index) => {
    const link = document.createElement("a");
    link.className = "archive-item";
    link.href = normalizeHref(project.href);
    link.dataset.cursor = "Open";
    if (project.external) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }

    link.innerHTML = `
      <span class="archive-item__meta">${String(index + 1).padStart(2, "0")}</span>
      <strong>${project.title}</strong>
      <p>${project.tag}</p>
      <span class="archive-item__arrow">Open</span>
    `;
    els.projectIndex.append(link);
  });
}

function updateCounts() {
  document.querySelectorAll("[data-live-count]").forEach((node) => {
    node.textContent = String(localProjects.length);
  });
}

function initLoader() {
  if (!els.loader || !els.loaderProgress) return;

  let progress = 0;
  const interval = window.setInterval(() => {
    progress = Math.min(progress + Math.random() * 11 + 6, 94);
    els.loaderProgress.style.width = `${progress}%`;
  }, 95);

  window.setTimeout(() => {
    window.clearInterval(interval);
    els.loaderProgress.style.width = "100%";
    els.loader.classList.add("is-complete");
    window.setTimeout(() => {
      els.loader.classList.add("is-hidden");
      window.setTimeout(() => els.loader?.remove(), 900);
    }, 520);
  }, 920);
}

function initReveals() {
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!reveals.length) return;

  if (!("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  reveals.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 55, 420)}ms`;
    observer.observe(element);
  });
}

function initCursor() {
  const cursor = els.cursor;
  if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

  const dot = cursor.querySelector(".cursor__dot");
  const ring = cursor.querySelector(".cursor__ring");
  let dotX = window.innerWidth / 2;
  let dotY = window.innerHeight / 2;
  let ringX = dotX;
  let ringY = dotY;
  let mouseX = dotX;
  let mouseY = dotY;

  document.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    state.pointerTarget.x = state.pointer.x;
    state.pointerTarget.y = state.pointer.y;
    cursor.classList.add("is-visible");
  });

  document.addEventListener("mouseover", (event) => {
    const target = event.target.closest("a, button, [data-cursor], [data-tilt-card]");
    if (!target) return;
    cursor.classList.add("is-hovering");
    if (els.cursorLabel) els.cursorLabel.textContent = target.dataset.cursor || "View";
  });

  document.addEventListener("mouseout", (event) => {
    const target = event.target.closest("a, button, [data-cursor], [data-tilt-card]");
    if (!target) return;
    cursor.classList.remove("is-hovering");
  });

  function animateCursor() {
    dotX += (mouseX - dotX) * 0.34;
    dotY += (mouseY - dotY) * 0.34;
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    if (els.cursorLabel) {
      els.cursorLabel.style.transform = `translate(${ringX}px, ${ringY}px) translate(24px, -50%)`;
    }
    requestAnimationFrame(animateCursor);
  }

  animateCursor();
}

function initMagnetic() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.09}px, ${y * 0.14}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}

function initAnchorNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      const scrollTarget = getPreferredScrollTarget(id, target);
      const header = document.querySelector(".site-header");
      const headerOffset = header ? header.getBoundingClientRect().height + 26 : 0;
      const landingOffset = 42;
      const top = scrollTarget.getBoundingClientRect().top + window.scrollY - headerOffset - landingOffset;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: state.reducedMotion ? "auto" : "smooth",
      });

      history.pushState(null, "", id);
    });
  });
}

function initPageTransitions() {
  const transition = document.createElement("div");
  transition.className = "page-transition";
  transition.setAttribute("aria-hidden", "true");
  transition.innerHTML = `
    <div class="page-transition__inner">
      <span class="page-transition__kicker">Opening</span>
      <strong class="page-transition__title">Launch path</strong>
      <div class="page-transition__bar"><span></span></div>
    </div>
  `;
  document.body.append(transition);
  els.pageTransition = transition;
  els.pageTransitionTitle = transition.querySelector(".page-transition__title");

  window.addEventListener("pageshow", () => {
    transition.classList.remove("is-active");
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (link.hasAttribute("download")) return;

    const url = new URL(href, window.location.href);
    if (url.href === window.location.href) return;

    event.preventDefault();
    const destinationLabel = getTransitionLabel(link, url);
    if (els.pageTransitionTitle) els.pageTransitionTitle.textContent = destinationLabel;
    transition.classList.add("is-active");

    window.setTimeout(() => {
      if (link.target === "_blank") {
        window.open(url.href, "_blank", "noopener,noreferrer");
        transition.classList.remove("is-active");
        return;
      }
      window.location.href = url.href;
    }, state.reducedMotion ? 0 : 620);
  });
}

function getTransitionLabel(link, url) {
  const cardTitle = link.querySelector("h3, strong")?.textContent?.trim();
  if (cardTitle) return cardTitle;

  const label = link.textContent.trim().replace(/\s+/g, " ");
  if (label && label.length <= 28) return label;

  return url.hostname.replace(/^www\./, "") || "Launch path";
}

function getPreferredScrollTarget(id, section) {
  const preferred = {
    "#work": "#work .section-heading",
    "#motion": "#motion .section-heading",
    "#index": "#index .section-heading",
    "#contact": ".contact__panel",
  };
  const selector = preferred[id];
  return selector ? section.querySelector(selector) || document.querySelector(selector) || section : section;
}

function initTiltCards() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.querySelectorAll("[data-tilt-card]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${y * -7}deg`);
      card.style.setProperty("--tilt-y", `${x * 8}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

function initParallax() {
  const layers = [...document.querySelectorAll("[data-parallax-speed]")];
  if (!layers.length || state.reducedMotion) return;

  let ticking = false;
  const update = () => {
    const viewportCenter = window.innerHeight / 2;
    layers.forEach((layer) => {
      const speed = Number(layer.dataset.parallaxSpeed) || 0;
      const rect = layer.getBoundingClientRect();
      const layerCenter = rect.top + rect.height / 2;
      const offset = (viewportCenter - layerCenter) * speed;
      layer.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });

    const pageMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    state.scrollProgress = window.scrollY / pageMax;
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

function initScene() {
  if (!els.canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(1.2, 0.7, 10.8);

    const rig = new THREE.Group();
    scene.add(rig);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    const key = new THREE.DirectionalLight(0x222222, 1.7);
    key.position.set(5, 5, 7);
    const blue = new THREE.PointLight(0x2f64ff, 5, 18);
    blue.position.set(-4, 2, 2);
    scene.add(ambient, key, blue);

    const objects = createPortfolioHalo(rig);
    const clock = new THREE.Clock();
    const temp = new THREE.Vector3();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function renderFrame() {
      const elapsed = clock.getElapsedTime();
      const scrollEase = THREE.MathUtils.smoothstep(state.scrollProgress, 0, 1);

      camera.position.x += (1.2 + state.pointerTarget.x * 0.42 - camera.position.x) * 0.035;
      camera.position.y += (0.7 + state.pointerTarget.y * 0.28 - camera.position.y) * 0.035;
      camera.position.z += (10 - scrollEase * 1.8 - camera.position.z) * 0.035;
      camera.lookAt(0, 0, 0);

      rig.rotation.y += (state.pointerTarget.x * 0.08 + scrollEase * 0.32 - rig.rotation.y) * 0.035;
      rig.rotation.x += (-state.pointerTarget.y * 0.08 - rig.rotation.x) * 0.035;

      objects.forEach((object, index) => {
        const pulse = 1 + Math.sin(elapsed * 0.55 + index) * 0.018;
        temp.setScalar(pulse);
        object.scale.lerp(temp, 0.07);
        object.position.y = object.userData.baseY + Math.sin(elapsed * object.userData.speed + index) * 0.08;
        object.rotation.x += object.userData.spinX;
        object.rotation.y += object.userData.spinY;
        if (object.userData.fadeMaterials) {
          object.userData.fadeMaterials.forEach((material) => {
            material.opacity =
              object.userData.baseOpacity + Math.sin(elapsed * 0.7 + index) * 0.018;
          });
        } else if (object.userData.fadeMaterial) {
          object.userData.fadeMaterial.opacity =
            object.userData.baseOpacity + Math.sin(elapsed * 0.7 + index) * 0.025;
        }
      });

      renderer.render(scene, camera);
    }

    function tick() {
      renderFrame();
      requestAnimationFrame(tick);
    }

    if (state.reducedMotion) renderFrame();
    else tick();
  } catch (error) {
    console.error("Homepage motion stage failed:", error);
  }
}

function createPortfolioHalo(group) {
  const objects = [];
  const clusters = [
    { x: 2.35, y: 0.05, z: -4.5, scale: 1, rotation: [-0.06, -0.2, 0.02], opacity: 0.14 },
    { x: -2.55, y: 1.58, z: -5.7, scale: 0.46, rotation: [0.08, 0.18, -0.12], opacity: 0.085 },
    { x: -2.15, y: -1.42, z: -5.25, scale: 0.38, rotation: [-0.04, 0.24, 0.18], opacity: 0.075 },
    { x: 4.75, y: 1.82, z: -6.1, scale: 0.34, rotation: [0.1, -0.3, 0.09], opacity: 0.07 },
    { x: 4.65, y: -1.58, z: -5.8, scale: 0.42, rotation: [-0.12, -0.22, -0.16], opacity: 0.08 },
  ];

  clusters.forEach((spec, index) => {
    const halo = createFrameCluster(spec.opacity, index);
    halo.position.set(spec.x, spec.y, spec.z);
    halo.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2]);
    halo.scale.setScalar(spec.scale);
    halo.userData = {
      baseY: halo.position.y,
      speed: 0.22 + index * 0.045,
      spinX: 0,
      spinY: (index % 2 ? -1 : 1) * (0.00035 + index * 0.00007),
      fadeMaterials: collectMaterials(halo),
      baseOpacity: spec.opacity,
    };
    group.add(halo);
    objects.push(halo);
  });

  return objects;
}

function createFrameCluster(opacity, seed) {
  const halo = new THREE.Group();
  const lineMaterials = [
    new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity }),
    new THREE.LineBasicMaterial({ color: 0x2f64ff, transparent: true, opacity: opacity * 0.86 }),
  ];
  const plateMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222,
    transparent: true,
    opacity: opacity * 0.32,
    side: THREE.DoubleSide,
  });

  for (let index = 0; index < 5; index += 1) {
    const geometry = new THREE.PlaneGeometry(3.9 + index * 0.52, 5.2 + index * 0.52);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), lineMaterials[(index + seed) % 2].clone());
    edges.position.z = -index * 0.12;
    edges.rotation.z = (index - 2) * 0.015;
    halo.add(edges);
  }

  const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 6.2), plateMaterial);
  plate.position.z = -0.42;
  halo.add(plate);

  for (let index = 0; index < 8; index += 1) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(index % 2 ? 1.2 : 0.72, 0.012, 0.012),
      new THREE.MeshBasicMaterial({
        color: index % 3 === 0 ? 0x2f64ff : 0x222222,
        transparent: true,
        opacity: index % 3 === 0 ? opacity * 1.1 : opacity * 0.72,
      })
    );
    line.position.set(-1.8 + (index % 4) * 1.2, -2.4 + Math.floor(index / 4) * 4.8, 0.08);
    line.rotation.z = index % 2 ? Math.PI / 2 : 0;
    halo.add(line);
  }

  return halo;
}

function collectMaterials(object) {
  const materials = [];
  object.traverse((child) => {
    if (!child.material) return;
    if (Array.isArray(child.material)) materials.push(...child.material);
    else materials.push(child.material);
  });
  return materials;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
