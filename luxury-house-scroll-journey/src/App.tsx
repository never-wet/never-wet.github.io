import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { HouseScene } from "@/HouseScene";
import { useScrollTimeline } from "@/ScrollTimeline";
import { StageTextOverlay } from "@/StageTextOverlay";
import { propertyReference, propertyStages } from "@/PropertyData";

export function App() {
  const timeline = useScrollTimeline();
  const [sceneReady, setSceneReady] = useState(false);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const activeStage = propertyStages[timeline.activeStageIndex] ?? propertyStages[0];
  const loaderProgress = sceneReady && timeline.ready ? 1 : timeline.ready ? 0.76 : 0.38;

  useEffect(() => {
    if (!sceneReady || !timeline.ready) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setLoaderHidden(true), 520);
    return () => window.clearTimeout(timeout);
  }, [sceneReady, timeline.ready]);

  return (
    <main className="residence-app" id="residence">
      <Loader hidden={loaderHidden} progress={loaderProgress} />
      <CursorEffect />
      <HouseScene
        activeStageId={activeStage.id}
        onReady={() => setSceneReady(true)}
        progress={timeline.progress}
      />
      <StageTextOverlay activeStageIndex={timeline.activeStageIndex} progress={timeline.progress} />
      <div className="cinema-grain" aria-hidden="true" />
      <div className="scroll-track" aria-hidden="true">
        {propertyStages.map((stage) => (
          <span data-stage={stage.id} key={stage.id} />
        ))}
      </div>
    </main>
  );
}

function Loader({ hidden, progress }: { hidden: boolean; progress: number }) {
  const style = { "--loader-progress": progress } as CSSProperties;

  return (
    <div className={`loader ${hidden ? "is-hidden" : ""}`} style={style} aria-live="polite">
      <div className="loader__inner">
        <span>{propertyReference.styleName}</span>
        <strong>Preparing the private approach</strong>
        <i aria-hidden="true">
          <b />
        </i>
      </div>
    </div>
  );
}

function CursorEffect() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const prefersCoarsePointer = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  useEffect(() => {
    if (prefersCoarsePointer) {
      return undefined;
    }

    let frame = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX;
    let dotY = mouseY;
    let ringX = mouseX;
    let ringY = mouseY;

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursorRef.current?.classList.add("is-visible");
    };

    const onPointerOver = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const target = event.target.closest("a, button");
      if (!target) {
        return;
      }

      cursorRef.current?.classList.add("is-hovering");
      const label = target.getAttribute("aria-label") || target.textContent?.trim() || "View";
      if (labelRef.current) {
        labelRef.current.textContent = label.slice(0, 24);
      }
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("a, button")) {
        return;
      }

      cursorRef.current?.classList.remove("is-hovering");
    };

    const animate = () => {
      dotX += (mouseX - dotX) * 0.34;
      dotY += (mouseY - dotY) * 0.34;
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }

      if (labelRef.current) {
        labelRef.current.style.transform = `translate(${ringX + 28}px, ${ringY}px) translateY(-50%)`;
      }

      frame = window.requestAnimationFrame(animate);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      window.cancelAnimationFrame(frame);
    };
  }, [prefersCoarsePointer]);

  if (prefersCoarsePointer) {
    return null;
  }

  return (
    <div className="cursor" ref={cursorRef} aria-hidden="true">
      <span className="cursor__dot" ref={dotRef} />
      <span className="cursor__ring" ref={ringRef} />
      <span className="cursor__label" ref={labelRef}>
        View
      </span>
    </div>
  );
}
