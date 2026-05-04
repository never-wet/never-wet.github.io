import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useStore } from "../lib/store";
import { Menu, User } from "lucide-react";
import SearchBar from "./SearchBar";
import LearningProgress from "./LearningProgress";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isSidebarOpen, setSidebarOpen } = useStore();

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar with Framer Motion for smooth transition */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-r border-white/5 bg-slate-950/20 backdrop-blur-xl z-30 overflow-hidden flex-shrink-0"
          >
            <div className="w-80">
               <Sidebar />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-background/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} className="text-slate-400" />
            </button>
            <div className="font-black text-xl tracking-tighter hidden sm:block">
              OMNI<span className="text-primary-500">SCIENCE</span>
            </div>
          </div>

          <div className="flex-1 max-w-xl px-4">
            <SearchBar />
          </div>

          <div className="flex items-center gap-4">
            <LearningProgress />
            <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
              <User size={16} className="text-primary-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}
