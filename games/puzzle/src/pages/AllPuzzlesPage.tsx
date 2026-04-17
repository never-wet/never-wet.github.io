import { useState } from "react";
import { SelectMenu } from "../components/common/SelectMenu";
import { PageHero } from "../components/layout/PageHero";
import { PuzzleCard } from "../components/puzzle/PuzzleCard";
import { useGame } from "../hooks/useGame";
import { gameManifest } from "../memory/gameManifest";

export function AllPuzzlesPage() {
  const { puzzles, getPuzzleStatus } = useGame();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = puzzles.filter((puzzle) => {
    const matchesSearch =
      search.length === 0 ||
      `${puzzle.title} ${puzzle.description} ${puzzle.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || puzzle.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page page--stack">
      <PageHero
        eyebrow="Puzzle Browser"
        title="All Puzzles"
        description="Browse every built-in challenge across logic, ciphers, scenes, passcodes, wordplay, and meta synthesis."
      />

      <section className="panel filters">
        <label className="field field--search">
          <span>Search</span>
          <input
            className="text-input"
            value={search}
            placeholder="Search puzzles, tags, or themes"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="field">
          <span>Category</span>
          <SelectMenu
            ariaLabel="Filter puzzles by category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "All categories" },
              ...gameManifest.categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
        </div>
      </section>

      <section className="card-grid">
        {filtered.map((puzzle) => (
          <PuzzleCard key={puzzle.id} puzzle={puzzle} status={getPuzzleStatus(puzzle.id)} />
        ))}
      </section>
    </div>
  );
}
