const viewport = document.getElementById("canvasViewport");
const stage = document.getElementById("canvasStage");
const fitButton = document.getElementById("fitButton");
const draggableItems = Array.from(document.querySelectorAll(".draggable"));
let highestLayer = 100;

function centerCanvas() {
  const left = Math.max(0, (stage.scrollWidth - viewport.clientWidth) / 2 - 240);
  const top = Math.max(0, (stage.scrollHeight - viewport.clientHeight) / 2 - 180);
  viewport.scrollTo({ left, top, behavior: "smooth" });
}

let panState = null;

viewport.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".draggable") || event.target.closest("button")) {
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

draggableItems.forEach((item) => {
  let dragState = null;

  item.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    const rect = item.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    highestLayer += 1;
    item.style.zIndex = String(highestLayer);
    item.setPointerCapture(event.pointerId);
  });

  item.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const nextLeft = event.clientX - stageRect.left + viewport.scrollLeft - dragState.offsetX;
    const nextTop = event.clientY - stageRect.top + viewport.scrollTop - dragState.offsetY;

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
});

fitButton.addEventListener("click", centerCanvas);

window.addEventListener("load", centerCanvas);
