"use client";

import { Home, Sparkles } from "lucide-react";
import { AlgorithmInfo } from "@/components/AlgorithmInfo";
import { ControlPanel } from "@/components/ControlPanel";
import { PseudocodePanel } from "@/components/PseudocodePanel";
import { StatsPanel } from "@/components/StatsPanel";
import { Visualizer } from "@/components/Visualizer";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-[var(--page)] text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1560px] flex-col gap-4 px-3 py-3 sm:px-4 lg:px-5">
        <header className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-black/10 bg-white/70 px-3 py-2 shadow-soft backdrop-blur-xl">
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-sm font-extrabold text-black/70 transition hover:-translate-y-0.5 hover:text-ink"
            href="../"
            aria-label="Back to Never Wet games"
            title="Back to Games"
          >
            <Home size={18} />
            <span className="hidden sm:inline">Games</span>
          </a>

          <div className="min-w-0 text-center">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/45">Interactive Computer Science</p>
            <h1 className="truncate text-lg font-black tracking-[-0.01em] sm:text-2xl">Sorting Algorithm Visualizer</h1>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-[#e9f7f2] px-3 py-2 text-sm font-extrabold text-[#166d5b] sm:inline-flex">
            <Sparkles size={17} />
            <span>Step by step</span>
          </div>
        </header>

        <ControlPanel />

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <Visualizer />

          <aside className="grid min-h-0 gap-4 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
            <StatsPanel />
            <AlgorithmInfo />
            <PseudocodePanel />
          </aside>
        </section>
      </div>
    </main>
  );
}
