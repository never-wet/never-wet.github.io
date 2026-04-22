"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./experience-shell.module.css";
import type { SceneMotionState } from "./scene-utils";

const WebGLStage = dynamic(
  () => import("./webgl-stage").then((module) => module.WebGLStage),
  {
    ssr: false,
    loading: () => <div className={styles.canvasFallback} aria-hidden="true" />,
  }
);

const chapters = [
  {
    id: "intro",
    label: "Origin",
    overline: "ARCTIS / SIGNAL",
    title: "Signal systems for a planet in motion.",
    body:
      "A future-facing creative technology company working where climate logic, material behavior, and digital experience converge into one live spatial language.",
    note: "Scroll to enter the field",
    align: "left",
    kind: "intro",
  },
  {
    id: "chapter-1",
    label: "Reveal",
    overline: "Chapter 01 / Internal lattice",
    title: "A crystalline core holds intelligence before it becomes visible.",
    body:
      "At first the system is compressed into one suspended form. Rotate around it and the hidden structure begins to read as signal, material, and intent.",
    note: "Core rotation / controlled reveal / latent geometry",
    align: "right",
    kind: "chapter",
  },
  {
    id: "chapter-2",
    label: "Fracture",
    overline: "Chapter 02 / Pressure state",
    title: "Then pressure pushes the signal outward into atmosphere.",
    body:
      "The surface breaks into shards, particulate drift, and active filaments. What looked singular becomes a field of responsive matter with depth, timing, and consequence.",
    note: "Fracture / particulate release / filament emergence",
    align: "left",
    kind: "chapter",
  },
  {
    id: "chapter-3",
    label: "Field",
    overline: "Chapter 03 / Environmental scale",
    title: "The object reorganizes into a navigable world.",
    body:
      "Camera movement becomes architecture. Ribbons extend into larger structures, and the scene stops behaving like an object demo and starts behaving like a living environment.",
    note: "Camera drift / spatial expansion / environmental rings",
    align: "right",
    kind: "chapter",
  },
  {
    id: "systems",
    label: "Systems",
    overline: "Operating model",
    title: "From climate intelligence to immersive interfaces.",
    body:
      "ARCTIS / SIGNAL builds future-facing experiences that transform volatile systems into something spatial, legible, and emotionally precise.",
    note: "Persistent canvas / live overlays / measured interface",
    align: "left",
    kind: "info",
  },
  {
    id: "final",
    label: "Climax",
    overline: "Final state",
    title: "Build the next responsive world.",
    body:
      "The narrative resolves as a living final form: intelligent, cinematic, and ready to connect with people, systems, and environments that need more than flat screens.",
    note: "Open channel / start a live prototype",
    align: "center",
    kind: "final",
  },
] as const;

const ledger = [
  {
    label: "Climate",
    value: "Interfaces for sensing, changing conditions, and planetary-scale narratives.",
  },
  {
    label: "Signal",
    value: "Readable motion systems that turn invisible data into spatial presence.",
  },
  {
    label: "Material",
    value: "Procedural form languages that feel engineered rather than decorative.",
  },
  {
    label: "Experience",
    value: "Premium digital environments that stay immersive without dropping usability.",
  },
] as const;

const metrics = [
  {
    value: "Realtime",
    label: "Procedural 3D scenes driven live in the browser.",
  },
  {
    value: "Persistent",
    label: "One fullscreen canvas across the entire narrative.",
  },
  {
    value: "Adaptive",
    label: "Quality modes for mobile, weak GPUs, and reduced motion.",
  },
] as const;

function useViewportProfile() {
  const [profile, setProfile] = useState({
    lowPower: false,
    mobile: false,
    reducedMotion: false,
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateProfile = () => {
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
        .deviceMemory ?? 8;
      const lowPower =
        mobileQuery.matches ||
        motionQuery.matches ||
        navigator.hardwareConcurrency <= 6 ||
        deviceMemory <= 4;

      setProfile({
        lowPower,
        mobile: mobileQuery.matches,
        reducedMotion: motionQuery.matches,
      });
    };

    updateProfile();

    mobileQuery.addEventListener("change", updateProfile);
    motionQuery.addEventListener("change", updateProfile);

    return () => {
      mobileQuery.removeEventListener("change", updateProfile);
      motionQuery.removeEventListener("change", updateProfile);
    };
  }, []);

  return profile;
}

export default function ExperienceShell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const { lowPower, mobile, reducedMotion } = useViewportProfile();
  const [activeChapter, setActiveChapter] = useState(0);

  const sceneState = useRef<SceneMotionState>({
    activeChapter: 0,
    lowPower,
    mobile,
    pointerX: 0,
    pointerY: 0,
    reducedMotion,
    storyProgress: 0,
  });

  useEffect(() => {
    sceneState.current.lowPower = lowPower;
    sceneState.current.mobile = mobile;
    sceneState.current.reducedMotion = reducedMotion;
    sceneState.current.activeChapter = activeChapter;
  }, [activeChapter, lowPower, mobile, reducedMotion]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const queueUiRefresh = () => {
      if (animationFrameRef.current !== null) {
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
      });
    };

    const context = gsap.context(() => {
      gsap.to(sceneState.current, {
        storyProgress: 1,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: reducedMotion ? 0.35 : 1.4,
          onUpdate: queueUiRefresh,
        },
      });

      sectionRefs.current.forEach((section, index) => {
        if (!section) {
          return;
        }

        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveChapter(index),
          onEnterBack: () => setActiveChapter(index),
        });
      });
    }, containerRef);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      context.revert();
    };
  }, [reducedMotion]);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      if (mobile || reducedMotion) {
        sceneState.current.pointerX = 0;
        sceneState.current.pointerY = 0;
        return;
      }

      sceneState.current.pointerX = event.clientX / window.innerWidth - 0.5;
      sceneState.current.pointerY = event.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener("pointermove", updatePointer);
    return () => {
      window.removeEventListener("pointermove", updatePointer);
    };
  }, [mobile, reducedMotion]);

  const activeChapterData = chapters[activeChapter];

  const handleJump = (index: number) => {
    const section = sectionRefs.current[index];

    if (!section) {
      return;
    }

    section.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const chapterClassNames = useMemo(
    () => ({
      center: styles.alignCenter,
      left: styles.alignLeft,
      right: styles.alignRight,
    }),
    []
  );

  return (
    <div className={styles.shell}>
      <div className={styles.canvasMount} aria-hidden="true">
        <WebGLStage
          lowPower={lowPower}
          reducedMotion={reducedMotion}
          sceneState={sceneState}
        />
      </div>

      <header className={styles.hud}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <span className={styles.brandDot} />
            ARCTIS / SIGNAL
          </div>
          <div className={styles.brandRule} />
          <p className={styles.brandCopy}>
            Climate, signal, material intelligence, and digital experience
            shaped into one immersive realtime world.
          </p>
        </div>

        <div className={styles.progressHud}>
          <div className={styles.progressMeta}>
            <span className={styles.progressIndex}>
              0{activeChapter + 1} / 0{chapters.length}
            </span>
            <span className={styles.progressTitle}>{activeChapterData.label}</span>
          </div>

          <div className={styles.progressDots} aria-label="Chapter progress">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                type="button"
                className={`${styles.progressDot} ${
                  index === activeChapter ? styles.progressDotActive : ""
                }`}
                onClick={() => handleJump(index)}
                aria-label={`Jump to ${chapter.label}`}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.progressJump}
            onClick={() => handleJump(chapters.length - 1)}
          >
            Skip to climax
          </button>
        </div>
      </header>

      <main ref={containerRef} className={styles.story}>
        {chapters.map((chapter, index) => (
          <section
            key={chapter.id}
            id={chapter.id}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
            className={`${styles.chapter} ${chapterClassNames[chapter.align]}`}
            data-active={index === activeChapter}
          >
            <div className={styles.chapterInner}>
              <p className={styles.chapterLabel}>{chapter.overline}</p>

              {chapter.kind === "intro" ? (
                <h1 className={styles.headline}>{chapter.title}</h1>
              ) : (
                <h2 className={styles.chapterTitle}>{chapter.title}</h2>
              )}

              <p className={styles.chapterBody}>{chapter.body}</p>

              {chapter.kind === "intro" ? (
                <div className={styles.linkRow}>
                  <a className={styles.primaryLink} href="#chapter-1">
                    Enter signal field
                  </a>
                  <a
                    className={styles.secondaryLink}
                    href="mailto:channel@arctis-signal.studio"
                  >
                    Open channel
                  </a>
                </div>
              ) : null}

              {chapter.kind === "info" ? (
                <div className={styles.infoPanel}>
                  <div className={styles.infoColumn}>
                    <p className={styles.infoHeading}>Practice vectors</p>
                    <ul className={styles.ledger}>
                      {ledger.map((item) => (
                        <li key={item.label} className={styles.ledgerRow}>
                          <span className={styles.ledgerLabel}>{item.label}</span>
                          <span className={styles.ledgerValue}>{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.infoColumn}>
                    <p className={styles.infoHeading}>System behavior</p>
                    <div className={styles.metricStack}>
                      {metrics.map((metric) => (
                        <div key={metric.value} className={styles.metric}>
                          <div className={styles.metricValue}>{metric.value}</div>
                          <p className={styles.metricLabel}>{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {chapter.kind === "final" ? (
                <div className={styles.finalBlock}>
                  <div className={styles.linkRow}>
                    <a
                      className={styles.primaryLink}
                      href="mailto:channel@arctis-signal.studio"
                    >
                      Start a live prototype
                    </a>
                    <a className={styles.secondaryLink} href="#intro">
                      Return to origin
                    </a>
                  </div>
                  <p className={styles.footerLine}>
                    One persistent world. Six cinematic states. Realtime all the
                    way through.
                  </p>
                </div>
              ) : null}

              {chapter.kind === "chapter" || chapter.kind === "info" ? (
                <p className={styles.signalNote}>{chapter.note}</p>
              ) : null}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
