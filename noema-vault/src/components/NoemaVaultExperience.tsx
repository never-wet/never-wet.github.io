"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const VaultCanvas = dynamic(() => import("./VaultCanvas").then((module) => module.VaultCanvas), {
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

type StoryState = {
  chapter: number;
  drift: number;
};

const chapters: Chapter[] = [
  {
    id: "intro",
    label: "Entry",
    index: "00 / sealed memory",
    eyebrow: "NOEMA / VAULT // immersive intelligence infrastructure",
    title: "Volatile knowledge condenses into a sealed shard suspended in the dark.",
    body: "One controlled object holds the entire premise. Before the world expands, memory exists as density, pressure, and latent structure waiting to reveal itself.",
    actions: [
      { label: "Enter the Vault", href: "#transformation", variant: "primary" },
      { label: "View the System", href: "#vault", variant: "secondary" },
    ],
  },
  {
    id: "transformation",
    label: "Transform",
    index: "01 / controlled release",
    eyebrow: "Scene one // internal mechanics",
    title: "The shard fractures with purpose and writes itself into moving filaments.",
    body: "Instead of collapsing into debris, the core converts density into ribbons, particles, and visible internal logic. The transformation is narrative, not decorative.",
    meta: ["Procedural archive shard", "Triggered fracture sequence", "Atmospheric particulate depth"],
  },
  {
    id: "vault",
    label: "Vault",
    index: "02 / architectural field",
    eyebrow: "Scene two // scale shift",
    title: "Memory stops behaving like data and becomes a vault you can navigate.",
    body: "The camera leaves the object study and enters a larger system of arches, rails, and spatial traces, making the product legible as an environment instead of a brochure.",
    meta: ["Camera pull-through", "Persistent realtime world", "Architectural corridor reveal"],
  },
  {
    id: "capabilities",
    label: "Layers",
    index: "03 / active annotations",
    eyebrow: "Scene three // spatial capability map",
    title: "Indexing, synthesis, recall, and orchestration appear as live annotations inside the world.",
    body: "Capabilities stay embedded in the environment through field notes and minimal overlays, so the site keeps its cinematic continuity instead of breaking into generic feature cards.",
  },
  {
    id: "proof",
    label: "Proof",
    index: "04 / operating evidence",
    eyebrow: "Scene four // controlled trust",
    title: "Proof lands as sharp readouts suspended inside the same living system.",
    body: "The numbers below are premium prototype placeholders, presented the way real trust signals should live here: precise, calm, and inseparable from the world around them.",
  },
  {
    id: "finale",
    label: "Finale",
    index: "05 / inhabitable form",
    eyebrow: "Closing frame // archive complete",
    title: "At full scale, the archive becomes a place to think inside.",
    body: "NOEMA / VAULT is a fictional brand shell that can be replaced with your real language later. The experience is the real deliverable: one persistent WebGL world built around memory becoming architecture.",
    actions: [
      { label: "Start a Private Brief", href: "mailto:brief@noemavault.io", variant: "primary" },
      { label: "Restart Sequence", href: "#intro", variant: "secondary" },
    ],
  },
];

const annotationLayers = [
  {
    label: "Ingest Layer",
    value: "Pulls fragmented research, signals, and documents into one controlled memory field.",
  },
  {
    label: "Recall Layer",
    value: "Surfaces the right knowledge with low-friction retrieval and spatial context.",
  },
  {
    label: "Synthesis Layer",
    value: "Turns scattered fragments into coherent structure, sequence, and decision-ready narrative.",
  },
  {
    label: "Orchestration Layer",
    value: "Makes teams move through shared intelligence as one system rather than disconnected tools.",
  },
];

const proofReadouts = [
  {
    value: "4.8B",
    label: "Indexed signals",
    body: "Concept-scale memory volume rendered as a single navigable archive.",
  },
  {
    value: "270ms",
    label: "Median recall window",
    body: "Retrieval is framed as immediacy, not search fatigue.",
  },
  {
    value: "19",
    label: "Synced knowledge layers",
    body: "Research, operations, briefs, and decisions move in the same vault.",
  },
  {
    value: "99.97%",
    label: "Session continuity",
    body: "The system keeps context intact as users move through complexity.",
  },
];

export function NoemaVaultExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const storyRef = useRef<StoryState>({ chapter: 0, drift: 0 });
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
        window.innerWidth < 920 ||
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
          setUiProgress(storyRef.current.drift);
        });
      });
    };

    const ctx = gsap.context(() => {
      const progressState = { value: storyRef.current.drift };

      gsap.to(progressState, {
        value: 1,
        ease: "none",
        onUpdate: () => {
          storyRef.current.drift = progressState.value;
          syncUi();
        },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: reducedMotion ? 0.2 : 0.85,
          invalidateOnRefresh: true,
        },
      });

      chapterRefs.current.forEach((section, index) => {
        if (!section) {
          return;
        }

        ScrollTrigger.create({
          trigger: section,
          start: "top 54%",
          end: "bottom 42%",
          onEnter: () => {
            gsap.to(storyRef.current, {
              chapter: index,
              duration: reducedMotion ? 0.4 : 1.1,
              ease: reducedMotion ? "power1.out" : "power3.out",
              overwrite: true,
            });
            startTransition(() => {
              setActiveChapter(index);
            });
          },
          onEnterBack: () => {
            gsap.to(storyRef.current, {
              chapter: index,
              duration: reducedMotion ? 0.35 : 0.9,
              ease: reducedMotion ? "power1.out" : "power3.out",
              overwrite: true,
            });
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
            { autoAlpha: 0, y: 44, filter: "blur(18px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 78%",
                toggleActions: "play none none reverse",
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
      <VaultCanvas qualityTier={qualityTier} reducedMotion={reducedMotion} storyRef={storyRef} />

      <div className="site-noise" aria-hidden="true" />
      <div className="site-vignette" aria-hidden="true" />
      <div className="site-fog site-fog-a" aria-hidden="true" />
      <div className="site-fog site-fog-b" aria-hidden="true" />

      <header className="site-header">
        <a className="brand-lockup" href="#intro" aria-label="NOEMA / VAULT home">
          <span className="brand-glyph" aria-hidden="true" />
          <span className="brand-wordmark">NOEMA / VAULT</span>
        </a>

        <div className="header-readout">
          <span className="header-kicker">Live archive</span>
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
                        className={`vault-button${action.variant === "secondary" ? " vault-button-secondary" : ""}`}
                        href={action.href}
                        key={action.label}
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                ) : null}

                {chapter.id === "capabilities" ? (
                  <div className="annotation-grid">
                    {annotationLayers.map((item) => (
                      <article className="annotation-card" key={item.label}>
                        <p className="annotation-label">{item.label}</p>
                        <p className="annotation-value">{item.value}</p>
                      </article>
                    ))}
                  </div>
                ) : null}

                {chapter.id === "proof" ? (
                  <div className="metric-grid">
                    {proofReadouts.map((item) => (
                      <article className="metric-card" key={item.label}>
                        <p className="metric-value">{item.value}</p>
                        <p className="metric-label">{item.label}</p>
                        <p className="metric-body">{item.body}</p>
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
