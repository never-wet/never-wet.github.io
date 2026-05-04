import React from "react";
import { scienceDatabase } from "../data/scienceDatabase";
import { useStore } from "../lib/store";
import Link from "next/link";
import { BookOpen, CheckCircle, Lock, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";

export default function Sidebar() {
  const { completedSlugs, isUnlocked } = useStore();
  const router = useRouter();
  const currentPath = router.asPath;

  const levels = ["Basic", "Intermediate", "Scientist"] as const;

  return (
    <div className="h-full w-80 flex flex-col p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-4">Learning Path</h2>
        <div className="space-y-8">
          {levels.map((level) => (
            <div key={level}>
              <h3 className={`text-xs font-bold mb-3 ${
                level === "Basic" ? "text-emerald-500" : 
                level === "Intermediate" ? "text-primary-500" : "text-amber-500"
              }`}>
                {level}
              </h3>
              <div className="space-y-1">
                {scienceDatabase
                  .filter((c) => c.level === level)
                  .map((concept) => {
                    const unlocked = isUnlocked(concept.slug);
                    const completed = completedSlugs.includes(concept.slug);
                    const isActive = currentPath.includes(concept.slug);

                    return (
                      <Link
                        key={concept.slug}
                        href={unlocked ? `/concept/${concept.slug}` : "#"}
                        className={`flex items-center justify-between group p-2.5 rounded-xl transition-all ${
                          isActive 
                            ? "bg-primary-600/10 text-primary-400 border border-primary-500/20" 
                            : unlocked 
                              ? "hover:bg-white/5 text-slate-400 hover:text-slate-200" 
                              : "opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {completed ? (
                            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                          ) : unlocked ? (
                            <BookOpen size={16} className="shrink-0" />
                          ) : (
                            <Lock size={16} className="shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{concept.title}</span>
                        </div>
                        {unlocked && !isActive && (
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
