"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SignalCanvas = dynamic(() => import("./SignalCanvas").then((module) => module.SignalCanvas), {
  ssr: false,
});

type QualityTier = "high" | "low";

type Chapter = {
  id: string;
  label: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  meta?: string[];
  actions?: { label: string; href: string; variant?: "primary" | "secondary" }[];
};

const chapters: Chapter[] = [
  {
    id: "intro",
    label: "Entry",
    index: "00 / entry signal",
    eyebrow: "ARCTIS / SIGNAL // climate signal atelier",
    title: "The interface begins as a suspended intelligence in the dark.",
    body: "A crystalline signal core hangs in silence, collecting pressure, climate noise, and latent structure before the world around it starts to move.",
    actions: [
      { label: "Enter the Signal", href: "#chapter-1", variant: "primary" },
      { label: "View Systems", href: "#systems", variant: "secondary" },
    ],
  },
  {
    id: "chapter-1",
    label: "Core",
    index: "01 / latent structure",
    eyebrow: "Scene one // internal reveal",
    title: "Signal is not decoration. It is the architecture before matter commits.",
    body: "As the camera closes in, the core opens its internal logic: hard edges, refracted volume, and a pulse field responding to every invisible condition around it.",
    meta: ["Reflective shell", "Iridescent density", "Measured camera drift"],
  },
  {
    id: "chapter-2",
    label: "Fracture",
    index: "02 / pressure event",
    eyebrow: "Scene two // controlled collapse",
    title: "Under stress the object does not fail. It fractures into information.",
    body: "Shards separate, particulate weather accelerates, and the system releases a cloud of data-bearing fragments that reorganize faster than collapse can spread.",
    meta: ["Reactive shard field", "Particle release", "Fog-thickened transition"],
  },
  {
    id: "chapter-3",
    label: "Field",
    index: "03 / expanded environment",
    eyebrow: "Scene three // spatial intelligence",
    title: "Filaments pull the camera into a larger environment built from living signal.",
    body: "The world widens into rails, corridors, and material traces. The scene stops behaving like an object study and becomes a navigable system with scale and consequence.",
    meta: ["Scroll-linked camera path", "Ribbon corridor", "Environmental depth"],
  },
  {
    id: "systems",
    label: "Systems",
    index: "04 / live layers",
    eyebrow: "Information overlay // minimal instrumentation",
    title: "Climate, material intelligence, spatial computing, and experience design move as one stack.",
    body: "Information appears as instrumentation inside the live world: concise layers, no dashboard bloat, and no break from the realtime scene.",
    meta: [
      "Climate sensing as signal choreography",
      "Material systems rendered as programmable surfaces",
      "Spatial environments designed for cognition, not novelty",
      "Interfaces that behave like adaptive ecosystems",
    ],
  },
  {
    id: "finale",
    label: "Final",
    index: "05 / terminal form",
    eyebrow: "Closing frame // living intelligence",
    title: "The final structure arrives as a world-scale form that feels alive, lucid, and inevitable.",
    body: "ARCTIS / SIGNAL is a fictional premium studio, but the interface is real: one persistent WebGL environment, guided by scroll, built as a cinematic spatial system instead of a standard site.",
    actions: [
      { label: "Start a Private Brief", href: "mailto:future@arctissignal.studio", variant: "primary" },
      { label: "Restart Sequence", href: "#intro", variant: "secondary" },
    ],
  },
];

const instrumentation = [
  {
    label: "Climate Signal",
    value: "Adaptive sensing systems built around volatile environmental input.",
  },
  {
    label: "Material Logic",
    value: "Reflective, translucent, and programmable surfaces behaving like living media.",
  },
  {
    label: "Spatial Experience",
    value: "Realtime worlds where camera, typography, and motion compose a single narrative object.",
  },
  {
    label: "System Intelligence",
    value: "Interfaces that move from object-scale detail to environment-scale presence without breaking immersion.",
  },
];

export function ArctisSignalExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const progressRef = useRef(0);
  const activeChapterRef = useRef(0);
  const syncFrameRef = useRef<number | null>(null);

  const [uiProgress, setUiProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [qualityTier, setQualityTier] = useState<QualityTier>("high");

  const activeLabel = chapters[activeChapter]?.label ?? chapters[0].label;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateCapability = () => {
      const lowPower =
        media.matches ||
        window.innerWidth < 900 ||
        (navigator.hardwareConcurrency ?? 8) <= 6 ||
        window.devicePixelRatio > 2;

      setReducedMotion(media.matches);
      setQualityTier(lowPower ? "low" : "high");
    };

    updateCapability();
    media.addEventListener("change", updateCapability);
    window.addEventListener("resize", updateCapability);

    return () => {
      media.removeEventListener("change", updateCapability);
      window.removeEventListener("resize", updateCapability);
    };
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const syncUi = () => {
      if (syncFrameRef.current !== null) {
        return;
      }

      syncFrameRef.current = window.requestAnimationFrame(() => {
        syncFrameRef.current = null;
        startTransition(() => {
          setUiProgress(progressRef.current);
        });
      });
    };

    const ctx = gsap.context(() => {
      const progressState = { value: progressRef.current };

      gsap.to(progressState, {
        value: 1,
        ease: "none",
        onUpdate: () => {
          progressRef.current = progressState.value;
          syncUi();
        },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: reducedMotion ? 0.3 : 1.1,
          invalidateOnRefresh: true,
        },
      });

      chapterRefs.current.forEach((section, index) => {
        if (!section) {
          return;
        }

        ScrollTrigger.create({
          trigger: section,
          start: "top 52%",
          end: "bottom 52%",
          onEnter: () => {
            activeChapterRef.current = index;
            startTransition(() => {
              setActiveChapter(index);
            });
          },
          onEnterBack: () => {
            activeChapterRef.current = index;
            startTransition(() => {
              setActiveChapter(index);
            });
          },
        });
      });

      if (!reducedMotion) {
        gsap.utils.toArray<HTMLElement>(".chapter-panel").forEach((panel) => {
          gsap.fromTo(
            panel,
            { autoAlpha: 0, y: 48, filter: "blur(12px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top 86%",
                end: "top 42%",
                scrub: 0.9,
              },
            }
          );
        });
      } else {
        gsap.set(".chapter-panel", { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      }
    }, containerRef);

    return () => {
      if (syncFrameRef.current !== null) {
        window.cancelAnimationFrame(syncFrameRef.current);
        syncFrameRef.current = null;
      }
      ctx.revert();
    };
  }, [reducedMotion]);

  const progressSegments = useMemo(
    () =>
      chapters.map((chapter, index) => ({
        id: chapter.id,
        label: chapter.label,
        active: index === activeChapter,
      })),
    [activeChapter]
  );

  return (
    <div className="experience-shell" ref={containerRef}>
      <SignalCanvas
        progressRef={progressRef}
        qualityTier={qualityTier}
        reducedMotion={reducedMotion}
      />

      <div className="site-noise" aria-hidden="true" />
      <div className="site-vignette" aria-hidden="true" />
      <div className="site-fog site-fog-a" aria-hidden="true" />
      <div className="site-fog site-fog-b" aria-hidden="true" />

      <header className="site-header">
        <a className="brand-lockup" href="#intro" aria-label="ARCTIS / SIGNAL home">
          <span className="brand-glyph" aria-hidden="true" />
          <span className="brand-wordmark">ARCTIS / SIGNAL</span>
        </a>

        <div className="header-readout">
          <span className="header-kicker">Realtime world</span>
          <span className="header-state">{activeLabel}</span>
        </div>
      </header>

      <aside className="progress-rail" aria-label="Story progression">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ "--progress": Math.min(Math.max(uiProgress, 0), 1) } as CSSProperties}
          />
        </div>
        <div className="progress-markers">
          {progressSegments.map((segment) => (
            <a
              className={`progress-marker${segment.active ? " is-active" : ""}`}
              href={`#${segment.id}`}
              key={segment.id}
            >
              {segment.label}
            </a>
          ))}
        </div>
      </aside>

      <main className="chapter-stack">
        {chapters.map((chapter, index) => (
          <section
            className={`chapter chapter-${chapter.id}`}
            id={chapter.id}
            key={chapter.id}
            ref={(node) => {
              chapterRefs.current[index] = node;
            }}
          >
            <div className="chapter-panel">
              <div className="chapter-copy">
                <p className="chapter-index">{chapter.index}</p>
                <p className="chapter-eyebrow">{chapter.eyebrow}</p>
                {index === 0 ? (
                  <h1 className="chapter-title chapter-title-hero">{chapter.title}</h1>
                ) : (
                  <h2 className="chapter-title">{chapter.title}</h2>
                )}
                <p className="chapter-body">{chapter.body}</p>

                {chapter.meta ? (
                  <div className="chapter-meta">
                    {chapter.meta.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                ) : null}

                {chapter.actions ? (
                  <div className="chapter-actions">
                    {chapter.actions.map((action) => (
                      <a
                        className={`signal-button${action.variant === "secondary" ? " signal-button-secondary" : ""}`}
                        href={action.href}
                        key={action.label}
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                ) : null}

                {chapter.id === "systems" ? (
                  <div className="instrument-grid">
                    {instrumentation.map((item) => (
                      <article className="instrument-strip" key={item.label}>
                        <p className="instrument-label">{item.label}</p>
                        <p className="instrument-value">{item.value}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
