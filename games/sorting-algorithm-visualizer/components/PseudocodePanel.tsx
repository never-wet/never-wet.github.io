"use client";

import { Code2 } from "lucide-react";
import { algorithmMetadata } from "@/lib/sortingAlgorithms";
import { useSortingStore } from "@/store/useSortingStore";

export function PseudocodePanel() {
  const store = useSortingStore();
  const meta = algorithmMetadata[store.algorithm];
  const currentLine = store.highlights.pseudocodeLine;

  return (
    <section className="panel grid min-h-[280px] grid-rows-[auto_minmax(0,1fr)] p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff3c7] text-[#9b6900]">
          <Code2 size={20} />
        </span>
        <div>
          <p className="control-label">Pseudocode</p>
          <h2 className="text-xl font-black">{meta.name}</h2>
        </div>
      </div>

      <ol className="pseudocode-scroll min-h-0 overflow-auto rounded-lg border border-black/10 bg-[#18212f] p-2 font-mono text-xs text-white/72">
        {meta.pseudocode.map((line, index) => {
          const active = currentLine === index;
          return (
            <li
              key={line}
              className={`grid grid-cols-[2.4rem_minmax(0,1fr)] gap-2 rounded-md px-2 py-2 transition ${
                active ? "bg-cyan/25 text-white ring-1 ring-cyan/40" : ""
              }`}
            >
              <span className="select-none text-right text-white/35">{String(index + 1).padStart(2, "0")}</span>
              <code className="whitespace-pre-wrap">{line}</code>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
