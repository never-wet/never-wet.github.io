"use client";

import { useEffect, useRef } from "react";
import { useSystemStore } from "@/store/useSystemStore";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const cursorLabel = useSystemStore((state) => state.cursorLabel);
  const setCursorLabel = useSystemStore((state) => state.setCursorLabel);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;

    let dotX = window.innerWidth / 2;
    let dotY = window.innerHeight / 2;
    let ringX = dotX;
    let ringY = dotY;
    let targetX = dotX;
    let targetY = dotY;
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursorRef.current?.classList.add("is-visible");
    };

    const onPointerOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor], button, a");
      if (!target) return;
      cursorRef.current?.classList.add("is-hovering");
      setCursorLabel(target.dataset.cursor ?? "LOCK");
    };

    const onPointerOut = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor], button, a");
      if (!target) return;
      cursorRef.current?.classList.remove("is-hovering");
      setCursorLabel("SCAN");
    };

    const tick = () => {
      dotX += (targetX - dotX) * 0.34;
      dotY += (targetY - dotY) * 0.34;
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(26px, -50%)`;
      }

      frame = window.requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    frame = window.requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      window.cancelAnimationFrame(frame);
    };
  }, [setCursorLabel]);

  return (
    <div className="system-cursor" ref={cursorRef} aria-hidden="true">
      <span className="system-cursor__dot" ref={dotRef} />
      <span className="system-cursor__ring" ref={ringRef} />
      <span className="system-cursor__label" ref={labelRef}>
        {cursorLabel}
      </span>
    </div>
  );
}
