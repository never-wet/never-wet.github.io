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
