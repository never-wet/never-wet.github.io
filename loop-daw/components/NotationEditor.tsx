"use client";

import { Download, Trash2 } from "lucide-react";
import { SheetRenderer } from "./SheetRenderer";
import { StaffInputLayer } from "./StaffInputLayer";
import { playTrackNote, unlockAudioEngine } from "../lib/audioEngine";
import { durationToSixteenthSteps, pitchToDisplay, SHEET_HEIGHT, SHEET_WIDTH, stepToMeasure, type NotationNote } from "../lib/notation";
import { useDAWStore } from "../store/useDAWStore";

export function NotationEditor() {
  const notes = useDAWStore((state) => state.notationNotes);
  const tracks = useDAWStore((state) => state.tracks);
  const selectedDuration = useDAWStore((state) => state.selectedNotationDuration);
  const notationTool = useDAWStore((state) => state.notationTool);
  const selectedStaff = useDAWStore((state) => state.selectedNotationStaff);
  const timeSignature = useDAWStore((state) => state.timeSignature);
  const activeStep = useDAWStore((state) => state.activeStep);
  const triggeredIds = useDAWStore((state) => state.triggeredIds);
  const selectedNotationId = useDAWStore((state) => state.selectedNotationId);
  const keyName = useDAWStore((state) => state.key);
  const scale = useDAWStore((state) => state.scale);
  const masterVolume = useDAWStore((state) => state.masterVolume);
  const addNotationNote = useDAWStore((state) => state.addNotationNote);
  const removeNotationNote = useDAWStore((state) => state.removeNotationNote);
  const selectNotationNote = useDAWStore((state) => state.selectNotationNote);

  const selectedNote = notes.find((note) => note.id === selectedNotationId) ?? null;
  const activeMeasure = activeStep >= 0 ? stepToMeasure(activeStep, timeSignature) : -1;

  const previewNote = async (noteId: string) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note || note.type === "rest" || !note.pitch) return;
    const track = tracks.find((item) => item.id === (note.staff === "bass" ? "bass" : "melody")) ?? tracks[0];
    await unlockAudioEngine(tracks, masterVolume);
    playTrackNote(track, note.pitch, durationToSixteenthSteps(note.duration), undefined, 0.84);
  };

  const previewNotationPayload = async (note: Omit<NotationNote, "id">) => {
    if (note.type === "rest" || !note.pitch) return;
    const track = tracks.find((item) => item.id === (note.staff === "bass" ? "bass" : "melody")) ?? tracks[0];
    await unlockAudioEngine(tracks, masterVolume);
    playTrackNote(track, note.pitch, durationToSixteenthSteps(note.duration), undefined, 0.84);
  };

  return (
    <section
      className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_72px] overflow-hidden rounded-lg border border-white/10 bg-[#11151a]/85"
      data-notation-note-count={notes.length}
      data-notation-pitches={notes.map((note) => note.pitch ?? note.type).join(",")}
      data-notation-rest-count={notes.filter((note) => note.type === "rest").length}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-violet-200">Classic Mode</p>
          <h1 className="text-lg font-black text-white">Grand staff notation</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span>{timeSignature}</span>
          <span>
            {keyName} {scale}
          </span>
          <button
            className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 font-black text-slate-300 hover:bg-white/[0.07]"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ notationNotes: notes, timeSignature }, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "loop-daw-notation.json";
              link.click();
              URL.revokeObjectURL(url);
            }}
            type="button"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="min-h-0 overflow-auto bg-[#f7f8f3] p-6">
        <div className="relative mx-auto rounded-xl border border-slate-300 bg-white shadow-2xl" style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT }}>
          <SheetRenderer notes={notes} timeSignature={timeSignature} activeMeasure={activeMeasure} triggeredIds={triggeredIds} />
          <StaffInputLayer
            duration={selectedDuration}
            notes={notes}
            onAdd={(note) => {
              addNotationNote(note);
              void previewNotationPayload(note);
            }}
            onErase={(note) => removeNotationNote(note.id)}
            onSelect={(note) => {
              selectNotationNote(note.id);
              void previewNote(note.id);
            }}
            selectedStaff={selectedStaff}
            timeSignature={timeSignature}
            tool={notationTool}
          />
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0d1015] px-4">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-slate-500">Selected</p>
          <p className="truncate text-sm font-bold text-slate-200">
            {selectedNote
              ? `${selectedNote.type === "rest" ? "Rest" : pitchToDisplay(selectedNote.pitch, keyName, scale)} - ${selectedNote.duration} - measure ${
                  selectedNote.measure + 1
                }, beat ${selectedNote.beat + 1}`
              : "Click a rendered note beat to select it, or choose Erase to delete."}
          </p>
        </div>
        {selectedNote && (
          <button
            className="flex h-9 items-center gap-2 rounded-md border border-rose-300/30 bg-rose-300/10 px-3 text-xs font-black text-rose-100 hover:bg-rose-300/18"
            onClick={() => removeNotationNote(selectedNote.id)}
            type="button"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </footer>
    </section>
  );
}
