"use client";

import { useEffect, useRef } from "react";
import { useVehicleStore } from "@/store/useVehicleStore";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const cursorLabel = useVehicleStore((state) => state.cursorLabel);
  const setCursorLabel = useVehicleStore((state) => state.setCursorLabel);
  const setHoverTarget = useVehicleStore((state) => state.setHoverTarget);

  useEffect(() => {
    const cursor = cursorRef.current;
    const label = labelRef.current;
    if (!cursor || !label || window.matchMedia("(pointer: coarse)").matches) return undefined;

    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.5;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf = 0;

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor.classList.add("is-visible");
    };

    const onPointerOver = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (!target) return;
      cursor.classList.add("is-hovering");
      setCursorLabel(target.dataset.cursor || "VIEW");
      setHoverTarget("ui");
    };

    const onPointerOut = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (!target) return;
      cursor.classList.remove("is-hovering");
      setCursorLabel("SCAN");
      setHoverTarget("none");
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("mouseover", onPointerOver);
    document.addEventListener("mouseout", onPointerOut);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseover", onPointerOver);
      document.removeEventListener("mouseout", onPointerOut);
      window.cancelAnimationFrame(raf);
    };
  }, [setCursorLabel, setHoverTarget]);

  return (
    <div ref={cursorRef} className="system-cursor" aria-hidden="true">
      <span className="system-cursor__ring" />
      <span className="system-cursor__dot" />
      <span ref={labelRef} className="system-cursor__label">
        {cursorLabel}
      </span>
    </div>
  );
}
