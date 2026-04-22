(function () {
  var root = document.documentElement;
  var fixedLayoutWidth = Number(root.getAttribute('data-never-wet-scale-width')) || 1440;
  var narrowScreenQuery = window.matchMedia("(max-width: " + (fixedLayoutWidth - 1) + "px)");
  var fallbackViewportContent = "width=device-width, initial-scale=1.0, viewport-fit=cover";
  var hasBoundChangeListener = false;

  function ensureViewportMeta() {
    var viewportMeta = document.querySelector('meta[name="viewport"]');

    if (viewportMeta) {
      return viewportMeta;
    }

    if (!document.head || document.readyState === "loading") {
      return null;
    }

    viewportMeta = document.createElement("meta");
    viewportMeta.setAttribute("name", "viewport");
    viewportMeta.setAttribute("content", fallbackViewportContent);
    document.head.appendChild(viewportMeta);
    return viewportMeta;
  }

  function applyScaleMode() {
    var viewportMeta = ensureViewportMeta();

    if (!viewportMeta) {
      window.requestAnimationFrame(applyScaleMode);
      return;
    }

    if (!viewportMeta.dataset.neverWetOriginalContent) {
      viewportMeta.dataset.neverWetOriginalContent = viewportMeta.getAttribute("content") || fallbackViewportContent;
    }

    if (narrowScreenQuery.matches) {
      viewportMeta.setAttribute("content", "width=" + fixedLayoutWidth + ", viewport-fit=cover");
      root.dataset.neverWetScale = "scaled";
      root.style.setProperty("--never-wet-fixed-layout-width", String(fixedLayoutWidth));
      return;
    }

    viewportMeta.setAttribute("content", viewportMeta.dataset.neverWetOriginalContent);
    root.dataset.neverWetScale = "native";
    root.style.removeProperty("--never-wet-fixed-layout-width");
  }

  applyScaleMode();

  if (!hasBoundChangeListener) {
    if (typeof narrowScreenQuery.addEventListener === "function") {
      narrowScreenQuery.addEventListener("change", applyScaleMode);
    } else if (typeof narrowScreenQuery.addListener === "function") {
      narrowScreenQuery.addListener(applyScaleMode);
    }

    hasBoundChangeListener = true;
  }
})();
