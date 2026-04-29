"use client";

import {
  getNotationPositionFromPoint,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  type NotationDuration,
  type NotationNote,
  type NotationStaff,
  type NotationTool,
  type TimeSignature,
} from "../lib/notation";

type StaffInputLayerProps = {
  notes: NotationNote[];
  duration: NotationDuration;
  tool: NotationTool;
  selectedStaff: NotationStaff;
  timeSignature: TimeSignature;
  onAdd: (note: Omit<NotationNote, "id">) => void;
  onSelect: (note: NotationNote) => void;
  onErase: (note: NotationNote) => void;
};

export function StaffInputLayer({ notes, duration, tool, selectedStaff, timeSignature, onAdd, onSelect, onErase }: StaffInputLayerProps) {
  return (
    <button
      aria-label="Notation staff input"
      className="absolute left-0 top-0 cursor-crosshair bg-transparent text-left"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * SHEET_WIDTH;
        const y = ((event.clientY - rect.top) / rect.height) * SHEET_HEIGHT;
        const position = getNotationPositionFromPoint(x, y, duration, timeSignature, selectedStaff);
        if (!position) return;

        const existing = notes.find((note) => note.measure === position.measure && note.staff === position.staff && note.beat === position.beat);

        if (tool === "erase") {
          if (existing) onErase(existing);
          return;
        }

        const nextNote = {
          type: tool === "rest" ? "rest" : "note",
          pitch: tool === "rest" ? undefined : position.pitch,
          duration,
          beat: position.beat,
          measure: position.measure,
          staff: position.staff,
        } satisfies Omit<NotationNote, "id">;

        if (existing) {
          const sameItem =
            existing.type === nextNote.type &&
            existing.pitch === nextNote.pitch &&
            existing.duration === nextNote.duration &&
            existing.measure === nextNote.measure &&
            existing.beat === nextNote.beat &&
            existing.staff === nextNote.staff;

          if (sameItem) {
            onSelect(existing);
            return;
          }
        }

        onAdd(nextNote);
      }}
      style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT }}
      type="button"
    />
  );
}
