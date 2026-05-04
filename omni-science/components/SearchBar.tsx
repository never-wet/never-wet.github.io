import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { scienceDatabase } from "../data/scienceDatabase";
import { useRouter } from "next/router";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof scienceDatabase>([]);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length > 1) {
      const filtered = scienceDatabase.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.subject.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (slug: string) => {
    router.push(`/concept/${slug}`);
    setQuery("");
  };

  return (
    <div className="relative w-full">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for any concept (e.g. Entropy, Gravity)..."
          className="w-full h-11 bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-10 focus:outline-none focus:border-primary-500/30 focus:ring-4 focus:ring-primary-500/5 transition-all text-sm placeholder:text-slate-600"
        />
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          {results.map((c) => (
            <button
              key={c.slug}
              onClick={() => handleSelect(c.slug)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-primary-600/10 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="text-left flex-1">
                <div className="font-bold text-sm text-slate-200">{c.title}</div>
                <div className="text-xs text-slate-500">{c.subject} • {c.level}</div>
              </div>
              <div className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded">
                UNLOCK
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
