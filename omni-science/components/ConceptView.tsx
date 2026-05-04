import React, { useState } from "react";
import { Concept } from "../data/scienceDatabase";
import MathRenderer from "./MathRenderer";
import IntuitionToggle, { Mode } from "./IntuitionToggle";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, Lightbulb, Activity, BookOpen } from "lucide-react";
import { useStore } from "../lib/store";
import dynamic from "next/dynamic";

const VisualizationCanvas = dynamic(() => import("./VisualizationCanvas"), { ssr: false });

interface ConceptViewProps {
  concept: Concept;
}

export default function ConceptView({ concept }: ConceptViewProps) {
  const [mode, setMode] = useState<Mode>("Theory");
  const { toggleConceptComplete, completedSlugs } = useStore();
  const isCompleted = completedSlugs.includes(concept.slug);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded">
              {concept.subject}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {concept.level}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
            {concept.title}
          </h1>
        </div>

        <div className="flex flex-col items-end gap-4">
          <IntuitionToggle mode={mode} setMode={setMode} />
          <button
            onClick={() => toggleConceptComplete(concept.slug)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              isCompleted
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white text-black hover:bg-slate-200"
            }`}
          >
            {isCompleted ? <CheckCircle size={18} /> : null}
            {isCompleted ? "Completed" : "Mark as Complete"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Visuals & Simulations */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-card min-h-[400px] md:h-[500px] relative overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              {mode === "Visual" ? (
                <motion.div
                  key="visual"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                   <VisualizationCanvas concept={concept} />
                </motion.div>
              ) : mode === "Analogy" ? (
                <motion.div
                  key="analogy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 md:p-12 text-center space-y-6 w-full"
                >
                  <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                    <Lightbulb className="text-amber-400" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200 uppercase tracking-tighter">The Intuitive Analogy</h3>
                  <p className="text-xl text-slate-400 leading-relaxed font-medium italic">
                    "{concept.analogy}"
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="theory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full p-8 space-y-8"
                >
                   <div className="bg-black/40 rounded-3xl p-10 border border-white/5 text-center">
                      <MathRenderer formula={concept.formula} block />
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">Core Mathematical Model</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      {concept.applications.map(app => (
                        <div key={app} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                           <Activity size={16} className="text-primary-400 mb-2" />
                           <div className="text-sm font-bold">{app}</div>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Text & Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center gap-2 mb-4 text-primary-400">
              <BookOpen size={20} />
              <h3 className="font-bold uppercase tracking-widest text-xs">Explanation</h3>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed font-medium">
              {concept.text}
            </p>
          </div>

          <div className="glass-card p-8">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">Prerequisites</h4>
            <div className="space-y-3">
              {concept.prerequisites.map((p) => (
                <div key={p} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-primary-500/30 transition-colors">
                  <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200">{p}</span>
                  <ArrowRight size={14} className="text-slate-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
