import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Concept, scienceDatabase } from "../data/scienceDatabase";

interface AppState {
  completedSlugs: string[];
  currentConcept: Concept | null;
  isSidebarOpen: boolean;
  searchQuery: string;
  
  // Actions
  toggleConceptComplete: (slug: string) => void;
  setCurrentConcept: (slug: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  isUnlocked: (slug: string) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      completedSlugs: [],
      currentConcept: null,
      isSidebarOpen: true,
      searchQuery: "",

      toggleConceptComplete: (slug) => {
        set((state) => ({
          completedSlugs: state.completedSlugs.includes(slug)
            ? state.completedSlugs.filter((s) => s !== slug)
            : [...state.completedSlugs, slug],
        }));
      },

      setCurrentConcept: (slug) => {
        const concept = scienceDatabase.find((c) => c.slug === slug) || null;
        set({ currentConcept: concept });
      },

      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),

      isUnlocked: (slug) => {
        const concept = scienceDatabase.find((c) => c.slug === slug);
        if (!concept || concept.level === "Basic") return true;
        return concept.prerequisites.every((prereq) => {
          const prereqConcept = scienceDatabase.find(c => c.title === prereq);
          return prereqConcept ? get().completedSlugs.includes(prereqConcept.slug) : true;
        });
      },
    }),
    {
      name: "omni-science-storage",
      partialize: (state) => ({ completedSlugs: state.completedSlugs }),
    }
  )
);
