"use client";

import type { ReactNode } from "react";

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</h2>
      {children}
    </section>
  );
}
