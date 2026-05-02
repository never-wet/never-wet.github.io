"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { getBuildingById } from "../lib/navigationSystem";
import { useWorldStore } from "../store/useWorldStore";

export function WorldUI() {
  const activeBuilding = useWorldStore((state) => state.activeBuilding());
  const portalBuildingId = useWorldStore((state) => state.portalBuildingId);
  const portalOpen = useWorldStore((state) => state.portalOpen);
  const closePortal = useWorldStore((state) => state.closePortal);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const portalBuilding = getBuildingById(portalBuildingId);

  useEffect(() => {
    if (!portalOpen || !portalBuilding || !frameRef.current) return;
    frameRef.current.classList.remove("is-loaded");
    frameRef.current.src = portalBuilding.href;
  }, [portalOpen, portalBuilding]);

  const handleFrameLoad = () => {
    frameRef.current?.classList.add("is-loaded");
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.38, delay: 0.18, ease: "power2.out" });
    }
  };

  return (
    <>
      <div className="hud" aria-live="polite">
        <div className="brand-lockup">
          <strong>Never Wet</strong>
          <span>Playable homepage</span>
        </div>
        <aside className="target-panel" aria-label="Current destination">
          <small>Nearby portal</small>
          <strong>{activeBuilding?.name ?? "Central Plaza"}</strong>
          <p>{activeBuilding?.hint ?? "Move through the plaza. Buildings are portals."}</p>
        </aside>
        <div className="help-strip" aria-label="Controls">
          <kbd>WASD</kbd>
          <span>move</span>
          <kbd>Drag</kbd>
          <span>look</span>
          <kbd>Click</kbd>
          <span>walk or target</span>
          <kbd>E</kbd>
          <span>enter</span>
        </div>
      </div>

      <div className={`portal-layer ${portalOpen ? "is-open" : ""}`} aria-hidden={!portalOpen}>
        <div className="portal-bar">
          <div className="portal-title">
            <small>Inside portal</small>
            <strong>{portalBuilding?.name ?? "Loading"}</strong>
          </div>
          <button className="portal-close" type="button" aria-label="Return to plaza" onClick={closePortal}>
            Back
          </button>
        </div>
        <div className="portal-frame-shell">
          <iframe ref={frameRef} title="Destination page" loading="lazy" onLoad={handleFrameLoad} />
        </div>
      </div>

      <div ref={overlayRef} className="transition-overlay" aria-hidden="true">
        <div className="transition-card">
          <small>Entering</small>
          <strong>{portalBuilding?.shortName ?? "Portal"}</strong>
          <div className="transition-loader">
            <span />
          </div>
        </div>
      </div>
    </>
  );
}
