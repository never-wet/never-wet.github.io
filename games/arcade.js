const experience = document.querySelector("#arcadeExperience");
const pixelField = document.querySelector("#pixelGridField");
const cabinets = [...document.querySelectorAll(".cabinet")];
const cabinetGrid = document.querySelector(".cabinet-grid");
const statusTitle = document.querySelector("[data-status-title]");
const statusCopy = document.querySelector("[data-status-copy]");
const statusTag = document.querySelector("[data-status-tag]");
const statusLink = document.querySelector("[data-status-link]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaultCabinet = document.querySelector(".cabinet--hero") ?? cabinets[0] ?? null;
let statusLinkPressed = false;

const pixelGrid = {
  cellSize: 14,
  gap: 2,
  radius: 76,
  canvas: pixelField,
  ctx: pixelField?.getContext("2d"),
  width: 0,
  height: 0,
  cols: 0,
  rows: 0,
  offsetX: 0,
  offsetY: 0,
  pulseStarts: new Float32Array(0),
  pulseDuration: 500,
  flipAxis: new Uint8Array(0),
  paletteIndex: new Uint8Array(0),
  frame: 0,
  resizeFrame: 0,
  palettes: Array.from({ length: 19 }, (_, index) => {
    const tone = index - 9;

    return {
      front: `hsl(${216 + tone} 34% ${16 + tone * 0.35}%)`,
      frontEdge: `hsla(${194 + tone} 72% ${34 + tone * 0.45}%, 0.92)`,
      frontShadow: `hsla(${222 + tone} 54% 6%, 0.82)`,
      back: `hsl(${182 + tone} 84% ${62 + tone * 0.22}%)`,
      backEdge: `hsla(${52 + tone} 100% 88%, 0.96)`,
      backShadow: `hsla(${205 + tone} 78% 18%, 0.42)`,
    };
  }),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isStatusLinkEnabled() {
  return Boolean(statusLink && !statusLink.classList.contains("is-disabled"));
}

function getStatusLinkHref() {
  if (!statusLink) {
    return "";
  }

  const href = statusLink.getAttribute("href") ?? "";
  return href === "#" ? "" : href;
}

function isPointInsideStatusLink(clientX, clientY) {
  if (!statusLink) {
    return false;
  }

  const rect = statusLink.getBoundingClientRect();

  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function activateStatusLink(event) {
  if (!isStatusLinkEnabled()) {
    event?.preventDefault();
    return;
  }

  const href = getStatusLinkHref();

  if (!href) {
    event?.preventDefault();
    return;
  }

  event?.preventDefault();
  window.location.assign(href);
}

function setStatusLinkCursorState(isHot) {
  document.body.classList.toggle("status-cta-hot", isHot);
}

function setStatus(cabinet) {
  cabinets.forEach((entry) => entry.classList.toggle("is-selected", entry === cabinet));

  if (!cabinet || !statusTitle || !statusCopy || !statusTag || !statusLink) {
    return;
  }

  statusTitle.textContent = cabinet.dataset.title ?? "Never Wet Arcade";
  statusCopy.textContent = cabinet.dataset.copy ?? "";
  statusTag.textContent = cabinet.dataset.tag ?? "Arcade";

  const href = cabinet.dataset.href ?? "";
  const cta = cabinet.dataset.cta ?? "Enter Cabinet";
  statusLink.textContent = cta;

  if (href) {
    statusLink.href = href;
    statusLink.classList.remove("is-disabled");
    statusLink.removeAttribute("aria-disabled");
  } else {
    statusLink.href = "#";
    statusLink.classList.add("is-disabled");
    statusLink.setAttribute("aria-disabled", "true");
  }
}

function clearCabinetSelection() {
  cabinets.forEach((entry) => entry.classList.remove("is-selected"));
}

function resetCabinet(cabinet) {
  cabinet.style.setProperty("--tilt-x", "0deg");
  cabinet.style.setProperty("--tilt-y", "0deg");
}

function drawPixelCell(ctx, x, y, progress, axis, palette) {
  const size = pixelGrid.cellSize;
  const gap = pixelGrid.gap;
  let drawX = x;
  let drawY = y;
  let drawWidth = size;
  let drawHeight = size;
  const eased =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  if (progress > 0.001) {
    const flipScale = Math.max(0.04, Math.abs(Math.cos(eased * Math.PI)));
    const crossStretch = 1 + Math.sin(eased * Math.PI) * 0.28;
    const travel = (0.5 - eased) * (gap * 4);

    if (axis === 0) {
      drawWidth = Math.max(1, Math.round(size * flipScale));
      drawHeight = Math.round(size * crossStretch);
      drawX = x + (size - drawWidth) / 2 + travel;
      drawY = y - (drawHeight - size) / 2;
    } else {
      drawHeight = Math.max(1, Math.round(size * flipScale));
      drawWidth = Math.round(size * crossStretch);
      drawY = y + (size - drawHeight) / 2 + travel;
      drawX = x - (drawWidth - size) / 2;
    }
  }

  ctx.fillStyle = palette.front;
  ctx.fillRect(drawX, drawY, drawWidth, drawHeight);

  ctx.fillStyle = palette.frontEdge;
  ctx.fillRect(drawX, drawY, drawWidth, Math.max(1, Math.round(drawHeight * 0.18)));

  ctx.fillStyle = palette.frontShadow;
  ctx.fillRect(drawX, drawY + drawHeight - 1, drawWidth, 1);
}

function renderPixelGrid(snap = false) {
  if (!pixelGrid.canvas || !pixelGrid.ctx) {
    return;
  }

  pixelGrid.frame = 0;

  const { ctx, width, height, cols, rows, gap, cellSize, offsetX, offsetY, pulseDuration } = pixelGrid;
  const pitch = cellSize + gap;
  const now = performance.now();
  let needsMore = false;

  ctx.clearRect(0, 0, width, height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const x = offsetX + col * pitch;
      const y = offsetY + row * pitch;
      let progress = 0;
      const pulseStart = pixelGrid.pulseStarts[index];

      if (!snap && !reduceMotion.matches && pulseStart > 0) {
        const elapsed = now - pulseStart;

        if (elapsed >= pulseDuration) {
          pixelGrid.pulseStarts[index] = 0;
        } else {
          progress = Math.sin((elapsed / pulseDuration) * Math.PI);
          needsMore = true;
        }
      }

      drawPixelCell(
        ctx,
        x,
        y,
        progress,
        pixelGrid.flipAxis[index],
        pixelGrid.palettes[pixelGrid.paletteIndex[index]],
      );
    }
  }

  if (needsMore) {
    pixelGrid.frame = window.requestAnimationFrame(() => renderPixelGrid());
  }
}

function schedulePixelRender() {
  if (!pixelGrid.canvas || !pixelGrid.ctx || pixelGrid.frame) {
    return;
  }

  pixelGrid.frame = window.requestAnimationFrame(() => renderPixelGrid());
}

function resizePixelGrid() {
  if (!pixelGrid.canvas || !pixelGrid.ctx) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const pitch = pixelGrid.cellSize + pixelGrid.gap;
  const cols = Math.ceil((width + pixelGrid.gap) / pitch);
  const rows = Math.ceil((height + pixelGrid.gap) / pitch);
  const gridWidth = cols * pitch - pixelGrid.gap;
  const gridHeight = rows * pitch - pixelGrid.gap;
  const total = cols * rows;

  pixelGrid.canvas.width = Math.ceil(width * devicePixelRatio);
  pixelGrid.canvas.height = Math.ceil(height * devicePixelRatio);
  pixelGrid.canvas.style.width = `${width}px`;
  pixelGrid.canvas.style.height = `${height}px`;

  pixelGrid.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  pixelGrid.width = width;
  pixelGrid.height = height;
  pixelGrid.cols = cols;
  pixelGrid.rows = rows;
  pixelGrid.offsetX = Math.floor((width - gridWidth) / 2);
  pixelGrid.offsetY = Math.floor((height - gridHeight) / 2);
  pixelGrid.pulseStarts = new Float32Array(total);
  pixelGrid.flipAxis = new Uint8Array(total);
  pixelGrid.paletteIndex = new Uint8Array(total);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;

      pixelGrid.flipAxis[index] = (row + col) % 2;
      pixelGrid.paletteIndex[index] = (col * 11 + row * 7) % pixelGrid.palettes.length;
    }
  }

  renderPixelGrid(true);
}

function triggerPixelPulse(pointerX, pointerY) {
  if (!pixelGrid.canvas || !pixelGrid.ctx || reduceMotion.matches) {
    return;
  }

  const { cols, rows, gap, cellSize, offsetX, offsetY, radius, pulseDuration } = pixelGrid;
  const pitch = cellSize + gap;
  const radiusSquared = radius * radius;
  const now = performance.now();
  const minCol = clamp(Math.floor((pointerX - radius - offsetX) / pitch), 0, cols - 1);
  const maxCol = clamp(Math.floor((pointerX + radius - offsetX) / pitch), 0, cols - 1);
  const minRow = clamp(Math.floor((pointerY - radius - offsetY) / pitch), 0, rows - 1);
  const maxRow = clamp(Math.floor((pointerY + radius - offsetY) / pitch), 0, rows - 1);

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      const index = row * cols + col;
      const x = offsetX + col * pitch + cellSize / 2;
      const y = offsetY + row * pitch + cellSize / 2;
      const dx = x - pointerX;
      const dy = y - pointerY;

      if (dx * dx + dy * dy > radiusSquared) {
        continue;
      }

      if (pixelGrid.pulseStarts[index] > 0 && now - pixelGrid.pulseStarts[index] < pulseDuration) {
        continue;
      }

      pixelGrid.pulseStarts[index] = now;
    }
  }

  schedulePixelRender();
}

function schedulePixelResize() {
  if (pixelGrid.resizeFrame) {
    return;
  }

  pixelGrid.resizeFrame = window.requestAnimationFrame(() => {
    pixelGrid.resizeFrame = 0;
    resizePixelGrid();
  });
}

if (pixelGrid.canvas && pixelGrid.ctx) {
  resizePixelGrid();

  window.addEventListener("pointermove", (event) => {
    triggerPixelPulse(event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener("resize", schedulePixelResize);
  reduceMotion.addEventListener("change", () => {
    pixelGrid.pulseStarts.fill(0);
    renderPixelGrid(true);
  });
}

if (experience) {
  const updateScene = (event) => {
    if (reduceMotion.matches) {
      return;
    }

    const rect = experience.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    experience.style.setProperty("--look-x", clamp(x, -0.5, 0.5).toFixed(4));
    experience.style.setProperty("--look-y", clamp(y, -0.5, 0.5).toFixed(4));
  };

  experience.addEventListener("pointermove", updateScene);
  experience.addEventListener("pointerleave", () => {
    experience.style.setProperty("--look-x", "0");
    experience.style.setProperty("--look-y", "0");
    setStatusLinkCursorState(false);
  });
}

if (statusLink) {
  statusLink.addEventListener("pointerdown", activateStatusLink);
  statusLink.addEventListener("click", activateStatusLink);

  document.addEventListener("pointerdown", (event) => {
    statusLinkPressed = isStatusLinkEnabled() && isPointInsideStatusLink(event.clientX, event.clientY);
  }, true);

  document.addEventListener("pointermove", (event) => {
    setStatusLinkCursorState(isStatusLinkEnabled() && isPointInsideStatusLink(event.clientX, event.clientY));
  }, true);

  document.addEventListener("pointerup", (event) => {
    if (!statusLinkPressed) {
      return;
    }

    const shouldLaunch = isPointInsideStatusLink(event.clientX, event.clientY);
    statusLinkPressed = false;

    if (shouldLaunch) {
      activateStatusLink(event);
    }
  }, true);

  document.addEventListener("pointercancel", () => {
    statusLinkPressed = false;
    setStatusLinkCursorState(false);
  }, true);

  window.addEventListener("blur", () => {
    statusLinkPressed = false;
    setStatusLinkCursorState(false);
  });
}

cabinets.forEach((cabinet) => {
  cabinet.addEventListener("pointerenter", () => setStatus(cabinet));
  cabinet.addEventListener("focusin", () => setStatus(cabinet));

  cabinet.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches) {
      return;
    }

    const rect = cabinet.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cabinet.style.setProperty("--tilt-y", `${clamp(x * 16, -10, 10)}deg`);
    cabinet.style.setProperty("--tilt-x", `${clamp(y * -14, -10, 10)}deg`);
  });

  cabinet.addEventListener("pointerleave", () => resetCabinet(cabinet));
  cabinet.addEventListener("focusout", (event) => {
    resetCabinet(cabinet);

    if (!cabinetGrid?.contains(event.relatedTarget)) {
      clearCabinetSelection();
    }
  });
});

cabinetGrid?.addEventListener("pointerleave", () => {
  clearCabinetSelection();
});

setStatus(defaultCabinet);
clearCabinetSelection();
