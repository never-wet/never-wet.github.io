"use client";

import { Command, FileCode, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { WorkspaceCommand } from "@/lib/types";
import { flattenFiles, fuzzyScore } from "@/lib/workspace-utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface CommandPaletteProps {
  commands: WorkspaceCommand[];
}

type PaletteItem =
  | {
      id: string;
      type: "command";
      title: string;
      subtitle: string;
      keybinding?: string;
      score: number;
      run: () => void;
    }
  | {
      id: string;
      type: "file";
      title: string;
      subtitle: string;
      score: number;
      run: () => void;
    };

export function CommandPalette({ commands }: CommandPaletteProps) {
  const open = useWorkspaceStore((state) => state.commandPaletteOpen);
  const query = useWorkspaceStore((state) => state.commandPaletteQuery);
  const setQuery = useWorkspaceStore((state) => state.setCommandPaletteQuery);
  const close = useWorkspaceStore((state) => state.closeCommandPalette);
  const files = useWorkspaceStore((state) => state.files);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    const commandMode = query.startsWith(">");
    const cleanQuery = commandMode ? query.slice(1) : query;
    const fileItems: PaletteItem[] = commandMode
      ? []
      : flattenFiles(files)
          .map((file) => ({
            id: file.id,
            type: "file" as const,
            title: file.name,
            subtitle: file.path,
            score: fuzzyScore(cleanQuery, `${file.name} ${file.path}`),
            run: () => openFile(file.id)
          }))
          .filter((item) => item.score > 0);

    const commandItems: PaletteItem[] = commands
      .map((commandItem) => ({
        id: commandItem.id,
        type: "command" as const,
        title: commandItem.title,
        subtitle: commandItem.category,
        keybinding: commandItem.keybinding,
        score: fuzzyScore(cleanQuery, `${commandItem.title} ${commandItem.category} ${commandItem.keywords?.join(" ") ?? ""}`),
        run: commandItem.run
      }))
      .filter((item) => item.score > 0);

    return [...commandItems, ...fileItems].sort((left, right) => right.score - left.score).slice(0, 12);
  }, [commands, files, openFile, query]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  if (!open) return null;

  function runItem(item = results[selectedIndex]) {
    if (!item) return;
    item.run();
    close();
  }

  return (
    <div className="palette-backdrop" onMouseDown={close}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="palette-input">
          <Command size={18} />
          <input
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                runItem();
              }
            }}
            onChange={(event) => {
              setSelectedIndex(0);
              setQuery(event.target.value);
            }}
            placeholder="Type a file name or > for commands"
            ref={inputRef}
            value={query}
          />
        </div>
        <div className="palette-results">
          {results.map((item, index) => {
            const Icon = item.type === "command" ? Terminal : FileCode;
            return (
              <button
                className={selectedIndex === index ? "active" : ""}
                key={`${item.type}-${item.id}`}
                onClick={() => runItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                type="button"
              >
                <Icon size={16} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                {"keybinding" in item && item.keybinding && <kbd>{item.keybinding}</kbd>}
              </button>
            );
          })}
          {!results.length && <p>No matching files or commands.</p>}
        </div>
      </div>
    </div>
  );
}
