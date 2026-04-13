const viewport = document.getElementById("canvasViewport");
const stage = document.getElementById("canvasStage");
const fitButton = document.getElementById("fitButton");
const zoomButton = document.getElementById("zoomButton");
const panButton = document.getElementById("panButton");
const shareButton = document.getElementById("shareButton");
const moreButton = document.getElementById("moreButton");
const topMenu = document.getElementById("topMenu");
const navButtons = Array.from(document.querySelectorAll(".nav-button"));
const panelCopies = Array.from(document.querySelectorAll("[data-panel-copy]"));
const toolButtons = Array.from(document.querySelectorAll("[data-tool]"));
const newLayerButton = document.getElementById("newLayerButton");
const helpButton = document.getElementById("helpButton");
const archiveButton = document.getElementById("archiveButton");
const zoomRange = document.getElementById("zoomRange");
const gridToggle = document.getElementById("gridToggle");
const layerList = document.getElementById("layerList");
const historyList = document.getElementById("historyList");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalButton = document.getElementById("closeModalButton");
const toast = document.getElementById("toast");
const canvasGrid = document.querySelector(".canvas-grid");
let highestLayer = 100;
let draggableItems = [];
let currentTool = "sticky";
let zoomLevel = 1;
let createdCount = 0;
let historyEntries = [];
let toastTimer = null;

const stockImages = [
  "../img/code2.png",
  "../img/code.jpg",
  "../img/background.jpeg",
  "../img/cat.jpg",
];

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("is-hidden");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.add("is-hidden");
  }, 2200);
}

function addHistory(message) {
  historyEntries = [message, ...historyEntries].slice(0, 8);
  historyList.innerHTML = historyEntries
    .map((entry) => `<li>${entry}</li>`)
    .join("");
}

function getLayerName(item, fallback = "Canvas item") {
  return item.dataset.layerName || fallback;
}

function refreshLayerList() {
  const items = Array.from(stage.querySelectorAll(".draggable"));
  layerList.innerHTML = items
    .slice()
    .reverse()
    .map((item) => `<li>${getLayerName(item)}</li>`)
    .join("");
}

function openModal(title, body) {
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modal.classList.remove("is-hidden");
}

function closeModal() {
  modal.classList.add("is-hidden");
}

function setDockActive(activeButton) {
  [zoomButton, fitButton, panButton].forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
  });
}

function centerCanvas() {
  const left = Math.max(0, (stage.scrollWidth - viewport.clientWidth) / 2 - 240);
  const top = Math.max(0, (stage.scrollHeight - viewport.clientHeight) / 2 - 180);
  viewport.scrollTo({ left, top, behavior: "smooth" });
  setDockActive(fitButton);
  addHistory("Re-centered the canvas");
}

let panState = null;
let freePanEnabled = true;

viewport.addEventListener("pointerdown", (event) => {
  if (!freePanEnabled || event.target.closest(".draggable") || event.target.closest("button")) {
    return;
  }

  panState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
  };

  viewport.classList.add("is-panning");
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", (event) => {
  if (!panState || panState.pointerId !== event.pointerId) {
    return;
  }

  viewport.scrollLeft = panState.scrollLeft - (event.clientX - panState.startX);
  viewport.scrollTop = panState.scrollTop - (event.clientY - panState.startY);
});

function stopPan(event) {
  if (!panState || panState.pointerId !== event.pointerId) {
    return;
  }

  viewport.classList.remove("is-panning");
  viewport.releasePointerCapture(event.pointerId);
  panState = null;
}

viewport.addEventListener("pointerup", stopPan);
viewport.addEventListener("pointercancel", stopPan);

function enableDrag(item) {
  let dragState = null;

  item.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialLeft: Number.parseFloat(item.style.left || "0"),
      initialTop: Number.parseFloat(item.style.top || "0"),
    };

    highestLayer += 1;
    item.style.zIndex = String(highestLayer);
    item.setPointerCapture(event.pointerId);
    addHistory(`Selected ${getLayerName(item)}`);
    refreshLayerList();
  });

  item.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = (event.clientX - dragState.startX) / zoomLevel;
    const deltaY = (event.clientY - dragState.startY) / zoomLevel;
    const nextLeft = dragState.initialLeft + deltaX;
    const nextTop = dragState.initialTop + deltaY;

    item.style.left = `${nextLeft}px`;
    item.style.top = `${nextTop}px`;
  });

  function stopDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    item.releasePointerCapture(event.pointerId);
    dragState = null;
  }

  item.addEventListener("pointerup", stopDrag);
  item.addEventListener("pointercancel", stopDrag);
}

function bindDraggables() {
  draggableItems = Array.from(stage.querySelectorAll(".draggable"));
  draggableItems.forEach((item) => {
    if (item.dataset.boundDrag === "true") {
      return;
    }

    item.dataset.boundDrag = "true";
    enableDrag(item);
  });
}

function applyZoom(value) {
  zoomLevel = value;
  stage.style.transform = `scale(${zoomLevel})`;
  stage.style.width = `${2200 * zoomLevel}px`;
  stage.style.height = `${1800 * zoomLevel}px`;
}

function createItemMarkup(tool, title, left, top) {
  const baseStyle = `left: ${left}px; top: ${top}px;`;

  if (tool === "text") {
    return `<div class="hero-type draggable" data-layer-name="${title}" style="${baseStyle}">${title.toUpperCase()}</div>`;
  }

  if (tool === "shape") {
    const shapeClass = createdCount % 2 === 0 ? "shape-circle" : "shape-blob";
    const label = shapeClass === "shape-circle" ? `${title} Circle` : `${title} Blob`;
    return `<div class="${shapeClass} draggable" data-layer-name="${label}" style="${baseStyle}"></div>`;
  }

  if (tool === "media") {
    const imageSrc = stockImages[createdCount % stockImages.length];
    return `
      <article class="media-card draggable" data-layer-name="${title}" style="${baseStyle}">
        <div class="media-frame">
          <img src="${imageSrc}" alt="${title}" />
          <div class="media-overlay">
            <span class="material-symbols-outlined">zoom_in</span>
          </div>
        </div>
        <div class="media-copy">
          <h3>${title}</h3>
          <p>Auto-added inspiration card</p>
        </div>
      </article>
    `;
  }

  if (tool === "pen") {
    return `
      <article class="sticky-note draggable" data-layer-name="${title}" style="${baseStyle}">
        <div>
          <h2>${title}</h2>
          <p>Quick sketch stroke converted into a note card for this prototype.</p>
        </div>
        <div class="pin-row">
          <span class="material-symbols-outlined">draw</span>
        </div>
      </article>
    `;
  }

  return `
    <article class="sticky-note draggable" data-layer-name="${title}" style="${baseStyle}">
      <div>
        <h2>${title}</h2>
        <p>Fresh note dropped onto the board. Drag it anywhere and keep building.</p>
      </div>
      <div class="pin-row">
        <span class="material-symbols-outlined">push_pin</span>
      </div>
    </article>
  `;
}

function addCanvasItem(tool = currentTool) {
  createdCount += 1;
  const titleMap = {
    sticky: `Idea Note ${createdCount}`,
    pen: `Sketch Layer ${createdCount}`,
    text: `Headline ${createdCount}`,
    shape: `Shape ${createdCount}`,
    media: `Reference ${createdCount}`,
  };

  const title = titleMap[tool] || `Layer ${createdCount}`;
  const left = 320 + (createdCount % 5) * 120;
  const top = 240 + (createdCount % 4) * 110;

  stage.insertAdjacentHTML("beforeend", createItemMarkup(tool, title, left, top));
  bindDraggables();
  refreshLayerList();
  addHistory(`Added ${title}`);
  showToast(`${title} created`);
}

function setTool(tool) {
  currentTool = tool;
  toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === tool);
  });
  addHistory(`Switched to ${tool} tool`);
  showToast(`${tool[0].toUpperCase()}${tool.slice(1)} tool selected`);
}

function setSidebarPanel(panel) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.panel === panel);
  });
  panelCopies.forEach((copy) => {
    copy.classList.toggle("is-hidden", copy.dataset.panelCopy !== panel);
  });
}

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTool(button.dataset.tool);
    addCanvasItem(button.dataset.tool);
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSidebarPanel(button.dataset.panel);
    addHistory(`Opened ${button.dataset.panel} panel`);
  });
});

newLayerButton.addEventListener("click", () => {
  addCanvasItem(currentTool);
});

helpButton.addEventListener("click", () => {
  openModal(
    "How This Prototype Works",
    "<p>Pick any tool in the top bar to generate a matching object on the canvas.</p><p>Drag cards to rearrange the board, use Zoom to step through scales, Fit to re-center, and Pan to toggle hand-drag navigation across the canvas.</p>"
  );
});

archiveButton.addEventListener("click", () => {
  const count = stage.querySelectorAll(".draggable").length;
  openModal(
    "Archive Snapshot",
    `<p>${count} live layers are currently on the canvas.</p><p>This prototype does not persist files yet, but the archive action is now wired and ready for a real backend or local storage pass.</p>`
  );
});

shareButton.addEventListener("click", async () => {
  const shareUrl = window.location.href;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Canvas link copied");
      addHistory("Copied share link");
      return;
    }
  } catch (error) {
    // Fall through to modal.
  }

  openModal("Share Canvas", `<p>Copy this link:</p><p><strong>${shareUrl}</strong></p>`);
});

moreButton.addEventListener("click", () => {
  topMenu.classList.toggle("is-hidden");
});

topMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-menu-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.menuAction;
  topMenu.classList.add("is-hidden");

  if (action === "theme") {
    document.body.classList.toggle("alt-glow");
    addHistory("Toggled ambient glow");
    showToast("Ambient glow updated");
    return;
  }

  if (action === "shuffle") {
    Array.from(stage.querySelectorAll(".draggable")).forEach((item, index) => {
      item.style.left = `${260 + (index % 5) * 180}px`;
      item.style.top = `${180 + Math.floor(index / 5) * 170}px`;
    });
    addHistory("Shuffled canvas layout");
    showToast("Layout shuffled");
    return;
  }

  if (action === "clear") {
    Array.from(stage.querySelectorAll(".draggable"))
      .slice(5)
      .forEach((item) => item.remove());
    bindDraggables();
    refreshLayerList();
    addHistory("Cleared generated items");
    showToast("Generated items cleared");
  }
});

zoomButton.addEventListener("click", () => {
  const next = zoomLevel >= 1.4 ? 0.8 : Number((zoomLevel + 0.1).toFixed(2));
  applyZoom(next);
  zoomRange.value = String(Math.round(next * 100));
  setDockActive(zoomButton);
  addHistory(`Zoom set to ${Math.round(next * 100)}%`);
  showToast(`Zoom ${Math.round(next * 100)}%`);
});

fitButton.addEventListener("click", () => {
  applyZoom(1);
  zoomRange.value = "100";
  centerCanvas();
});

panButton.addEventListener("click", () => {
  freePanEnabled = !freePanEnabled;
  setDockActive(panButton);
  showToast(freePanEnabled ? "Pan enabled" : "Pan locked");
  addHistory(freePanEnabled ? "Enabled pan mode" : "Locked pan mode");
});

zoomRange.addEventListener("input", () => {
  const next = Number(zoomRange.value) / 100;
  applyZoom(next);
  setDockActive(zoomButton);
});

gridToggle.addEventListener("change", () => {
  canvasGrid.classList.toggle("is-hidden", !gridToggle.checked);
  addHistory(gridToggle.checked ? "Grid shown" : "Grid hidden");
});

closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#moreButton") && !event.target.closest("#topMenu")) {
    topMenu.classList.add("is-hidden");
  }
});

window.addEventListener("load", () => {
  bindDraggables();
  refreshLayerList();
  addHistory("Canvas ready");
  setSidebarPanel("documents");
  applyZoom(1);
  centerCanvas();
});
