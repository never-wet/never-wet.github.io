import React from "react";
import Layout from "../components/Layout";
import Head from "next/head";
import { ArrowRight, BookOpen, Cpu, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Omni-Science | Next-Gen Learning Platform</title>
      </Head>

      <div className="relative overflow-hidden">
        {/* Hero Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary-600/10 to-transparent blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-6 py-24 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-600/10 border border-primary-500/20 rounded-full text-primary-400 text-xs font-bold uppercase tracking-widest"
          >
            <Cpu size={14} />
            Powered by Interactive Intuition
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white max-w-4xl mx-auto leading-[0.9]"
          >
            Understand the <span className="text-primary-500">Universe</span> with Clarity.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto font-medium"
          >
            Omni-Science combines structured knowledge with immersive 3D simulations. Don't just read science—feel it through our intuition engine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/concept/derivative" className="btn-primary flex items-center gap-2 px-8 py-4 text-lg">
              Start Learning <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 rounded-full border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition-all text-lg">
              View Curriculum
            </button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BookOpen className="text-emerald-400" />}
            title="Structured Paths"
            description="From Basic foundations to Scientist-level mastery, follow a guided curriculum that builds upon your progress."
          />
          <FeatureCard
            icon={<Globe className="text-primary-400" />}
            title="Intuition Engine"
            description="Switch between deep mathematical Theory, immersive 3D Visuals, and relatable Analogies for every concept."
          />
          <FeatureCard
            icon={<Cpu className="text-amber-400" />}
            title="Interactive Labs"
            description="Manipulate spacetime, observe entropy, and visualize wave functions in our custom-built 3D simulation engine."
          />
        </div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-10 space-y-4">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm font-medium">{description}</p>
    </div>
  );
}
