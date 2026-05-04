import React from "react";
import { useStore } from "../lib/store";
import { scienceDatabase } from "../data/scienceDatabase";
import { Award } from "lucide-react";

export default function LearningProgress() {
  const { completedSlugs } = useStore();
  const totalConcepts = scienceDatabase.length;
  const progress = Math.round((completedSlugs.length / totalConcepts) * 100);

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-950/40 border border-white/5 rounded-full">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-white/5"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={88}
            strokeDashoffset={88 - (88 * progress) / 100}
            className="text-primary-500 transition-all duration-1000 ease-out"
          />
        </svg>
        <Award size={12} className="absolute text-primary-400" />
      </div>
      <div className="hidden md:block">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none">Level: Master</div>
        <div className="text-xs font-black text-slate-200">{progress}% Progress</div>
      </div>
    </div>
  );
}
