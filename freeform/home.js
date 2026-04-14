const STORAGE_KEY = "never-wet-freeform-projects";

const createProjectButton = document.querySelector("#createProjectButton");
const createProjectInlineButton = document.querySelector("#createProjectInlineButton");
const openLastProjectButton = document.querySelector("#openLastProjectButton");
const projectForm = document.querySelector("#projectForm");
const projectNameInput = document.querySelector("#projectNameInput");
const projectDescriptionInput = document.querySelector("#projectDescriptionInput");
const cancelProjectButton = document.querySelector("#cancelProjectButton");
const projectsGrid = document.querySelector("#projectsGrid");
const emptyState = document.querySelector("#emptyState");
const projectCount = document.querySelector("#projectCount");
const projectCardTemplate = document.querySelector("#projectCardTemplate");

let projects = loadProjects();

setup();
renderProjects();

function setup() {
  createProjectButton?.addEventListener("click", openProjectForm);
  createProjectInlineButton?.addEventListener("click", openProjectForm);
  openLastProjectButton?.addEventListener("click", openLastProject);
  cancelProjectButton?.addEventListener("click", closeProjectForm);
  projectForm?.addEventListener("submit", handleCreateProject);
}

function openProjectForm() {
  projectForm?.classList.remove("is-hidden");
  projectNameInput?.focus();
  projectNameInput?.select();
}

function closeProjectForm() {
  projectForm?.classList.add("is-hidden");
  projectForm?.reset();
}

function handleCreateProject(event) {
  event.preventDefault();
  const name = projectNameInput.value.trim();
  const description = projectDescriptionInput.value.trim();
  if (!name) {
    projectNameInput.focus();
    return;
  }

  const project = {
    id: crypto.randomUUID?.() || `project-${Date.now()}`,
    roomId: (crypto.randomUUID?.() || `room-${Date.now()}`).slice(0, 8),
    name,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  projects.unshift(project);
  persistProjects();
  renderProjects();
  closeProjectForm();
  openProject(project);
}

function renderProjects() {
  projectsGrid.innerHTML = "";
  projectCount.textContent = String(projects.length);
  emptyState.classList.toggle("is-hidden", projects.length > 0);

  projects.forEach((project) => {
    const node = projectCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("[data-project-name]").textContent = project.name;
    node.querySelector("[data-project-description]").textContent = project.description || "No description yet.";
    node.querySelector("[data-project-updated]").textContent = `Updated ${formatRelative(project.updatedAt)}`;
    node.querySelector("[data-project-room]").textContent = `Room ${project.roomId}`;
    node.querySelector("[data-project-open]").addEventListener("click", () => openProject(project));
    node.querySelector("[data-project-open-live]").addEventListener("click", () => openProject(project, true));
    node.querySelector("[data-project-delete]").addEventListener("click", () => deleteProject(project.id));
    projectsGrid.appendChild(node);
  });
}

function openLastProject() {
  if (!projects.length) {
    openProjectForm();
    return;
  }
  openProject(projects[0]);
}

function openProject(project, live = false) {
  touchProject(project.id);
  const target = new URL(live ? "./live.html" : "./canvas.html", window.location.href);
  target.searchParams.set("room", project.roomId);
  target.searchParams.set("project", project.name);
  window.location.href = target.toString();
}

function touchProject(id) {
  const project = projects.find((entry) => entry.id === id);
  if (!project) return;
  project.updatedAt = Date.now();
  projects = [project, ...projects.filter((entry) => entry.id !== id)];
  persistProjects();
  renderProjects();
}

function deleteProject(id) {
  const project = projects.find((entry) => entry.id === id);
  if (!project) return;
  const confirmed = window.confirm(`Delete "${project.name}" from the project list?`);
  if (!confirmed) return;
  projects = projects.filter((entry) => entry.id !== id);
  persistProjects();
  renderProjects();
}

function loadProjects() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((project) => project && project.id && project.roomId && project.name)
      .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
  } catch {
    return [];
  }
}

function persistProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function formatRelative(value) {
  const diff = Math.max(0, Date.now() - Number(value || 0));
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}
