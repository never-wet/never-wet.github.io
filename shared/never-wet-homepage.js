 import { projects } from "../igloo-home/projects.js";

const quickLaunchContainer = document.querySelector("[data-home-quick-launch]");
const projectGridContainer = document.querySelector("[data-home-project-grid]");
const liveCount = document.querySelector("[data-live-count]");
const projectCount = document.querySelector("[data-project-count]");

const localProjects = projects.filter((project) => !project.external);
const featuredProjects = localProjects.slice(0, 5);

function normalizeHref(href) {
  if (!href) {
    return "#";
  }

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  if (href.startsWith("../")) {
    return `./${href.slice(3)}`;
  }

  return href;
}

function createLink(project, className, featured = false) {
  const link = document.createElement("a");
  link.className = `${className}${featured ? ` ${className}--featured` : ""}`;
  link.href = normalizeHref(project.href);

  if (project.external) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }

  const tag = document.createElement("span");
  tag.className = `${className}__tag`;
  tag.textContent = project.tag;

  const title = document.createElement("strong");
  title.className = `${className}__title`;
  title.textContent = project.title;

  const description = document.createElement("p");
  description.textContent = project.description;

  const meta = document.createElement("span");
  meta.className = `${className}__meta`;
  meta.textContent = project.external ? "External site" : `Open ${project.title}`;

  link.append(tag, title, description, meta);
  return link;
}

if (quickLaunchContainer) {
  featuredProjects.forEach((project, index) => {
    quickLaunchContainer.append(createLink(project, "quick-link", index === 0));
  });
}

if (projectGridContainer) {
  projects.forEach((project) => {
    projectGridContainer.append(createLink(project, "project-card"));
  });

  const directoryCard = document.createElement("a");
  directoryCard.className = "project-card project-card--directory";
  directoryCard.href = "./project-hub.html";
  directoryCard.innerHTML = `
    <span class="project-card__tag">Directory</span>
    <strong class="project-card__title">Open the full project directory</strong>
    <p>Use the full listing when you want every destination in one quieter grid.</p>
    <span class="project-card__meta">View all projects</span>
  `;
  projectGridContainer.append(directoryCard);
}

if (liveCount) {
  liveCount.textContent = String(localProjects.length);
}

if (projectCount) {
  projectCount.textContent = `${localProjects.length} live destinations plus the external site.`;
}

// Reveal animations
function initRevealAnimations() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.05,
    }
  );

  reveals.forEach((el) => observer.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllEffects);
} else {
  initAllEffects();
}

function initAllEffects() {
  initRevealAnimations();
  initLoader();
  initCustomCursor();
  init3DTilt();
  initParallax();
  initMagneticButtons();
  initRippleEffect();
}

// Smooth Loader
function initLoader() {
  const loader = document.getElementById("pageLoader");
  const progress = document.getElementById("loaderProgress");
  if (!loader || !progress) return;

  let loaded = 0;
  const images = document.querySelectorAll("img");
  const total = Math.max(images.length, 1);

  function updateProgress() {
    loaded++;
    const percent = Math.min((loaded / total) * 100, 100);
    progress.style.width = `${percent}%`;

    if (loaded >= total) {
      setTimeout(() => {
        loader.classList.add("is-hidden");
        setTimeout(() => loader.remove(), 800);
      }, 400);
    }
  }

  if (images.length === 0) {
    progress.style.width = "100%";
    setTimeout(() => {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 800);
    }, 600);
    return;
  }

  images.forEach((img) => {
    if (img.complete) {
      updateProgress();
    } else {
      img.addEventListener("load", updateProgress);
      img.addEventListener("error", updateProgress);
    }
  });

  // Fallback: hide loader after 3 seconds max
  setTimeout(() => {
    if (!loader.classList.contains("is-hidden")) {
      progress.style.width = "100%";
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 800);
    }
  }, 3000);
}

// Custom Cursor
function initCustomCursor() {
  const cursor = document.getElementById("customCursor");
  if (!cursor || window.matchMedia("(pointer: coarse)").matches) {
    if (cursor) cursor.style.display = "none";
    return;
  }

  const dot = cursor.querySelector(".cursor-dot");
  const ring = cursor.querySelector(".cursor-ring");
  let mouseX = 0, mouseY = 0;
  let dotX = 0, dotY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("mousedown", () => cursor.classList.add("is-clicking"));
  document.addEventListener("mouseup", () => cursor.classList.remove("is-clicking"));

  // Hover detection
  const hoverTargets = document.querySelectorAll("a, button, .quick-link, .project-card, .metric");
  hoverTargets.forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
  });

  function animateCursor() {
    dotX += (mouseX - dotX) * 0.2;
    dotY += (mouseY - dotY) * 0.2;
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;

    dot.style.left = `${dotX}px`;
    dot.style.top = `${dotY}px`;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;

    requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

// 3D Tilt Effect
function init3DTilt() {
  const cards = document.querySelectorAll(".quick-link, .project-card, .metric");
  
  cards.forEach((card) => {
    card.classList.add("tilt-3d");
    
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

// Parallax Effect
function initParallax() {
  const overlay = document.querySelector(".home-overlay");
  const noise = document.querySelector(".home-noise");
  const hero = document.querySelector(".hero");
  
  if (!overlay && !noise) return;

  let ticking = false;
  
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        if (overlay) {
          overlay.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
        if (noise) {
          noise.style.transform = `translateY(${scrollY * 0.1}px)`;
        }
        if (hero) {
          const heroContent = hero.querySelectorAll("h1, p, .hero-actions, .hero-metrics");
          heroContent.forEach((el, i) => {
            el.style.transform = `translateY(${scrollY * (0.05 + i * 0.02)}px)`;
            el.style.opacity = Math.max(0.3, 1 - scrollY / 600);
          });
        }
        
        ticking = false;
      });
      ticking = true;
    }
  });
}

// Magnetic Button Effect
function initMagneticButtons() {
  const buttons = document.querySelectorAll(".button, .home-nav__button");
  
  buttons.forEach((btn) => {
    btn.classList.add("magnetic");
    
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

// Ripple Effect
function initRippleEffect() {
  const buttons = document.querySelectorAll(".button, .home-nav__button");
  
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      btn.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}
