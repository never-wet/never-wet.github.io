"use client";

import { BookOpen } from "lucide-react";
import { algorithmMetadata } from "@/lib/sortingAlgorithms";
import { useSortingStore } from "@/store/useSortingStore";

export function AlgorithmInfo() {
  const { algorithm } = useSortingStore();
  const meta = algorithmMetadata[algorithm];

  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e9f7f2] text-[#166d5b]">
          <BookOpen size={20} />
        </span>
        <div>
          <p className="control-label">Algorithm</p>
          <h2 className="text-xl font-black">{meta.name}</h2>
        </div>
      </div>

      <p className="text-sm font-semibold text-black/65">{meta.summary}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <InfoCell label="Best" value={meta.time.best} />
        <InfoCell label="Average" value={meta.time.average} />
        <InfoCell label="Worst" value={meta.time.worst} />
        <InfoCell label="Space" value={meta.space} />
        <InfoCell label="Stable" value={meta.stable} />
        <InfoCell label="Use Case" value={meta.bestUseCase} wide />
      </dl>
    </section>
  );
}

function InfoCell({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-lg border border-black/10 bg-white/65 p-3 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-black/40">{label}</dt>
      <dd className="mt-1 font-black text-ink">{value}</dd>
    </div>
  );
}
