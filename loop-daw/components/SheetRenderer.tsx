"use client";

import { useEffect, useRef } from "react";
import { Accidental, Formatter, GhostNote, Renderer, Stave, StaveConnector, StaveNote, Voice } from "vexflow";
import {
  BASS_Y,
  MEASURE_WIDTH,
  NOTATION_MEASURES,
  SHEET_HEIGHT,
  SHEET_MARGIN_X,
  SHEET_WIDTH,
  TREBLE_Y,
  beatUnitQuarterBeats,
  durationToQuarterBeats,
  durationToSignatureBeats,
  getTimeSignatureInfo,
  measureQuarterBeats,
  pitchAccidental,
  pitchToVexKey,
  restDuration,
  restKeyForStaff,
  sortNotation,
  type NotationDuration,
  type NotationNote,
  type NotationStaff,
  type TimeSignature,
} from "../lib/notation";

type SheetRendererProps = {
  notes: NotationNote[];
  timeSignature: TimeSignature;
  activeMeasure: number;
  triggeredIds: string[];
};

type RenderEvent = {
  note?: NotationNote;
  duration: NotationDuration;
  type: "note" | "rest" | "spacer";
};

const EPSILON = 0.001;

function durationFromQuarterBeats(quarterBeats: number): NotationDuration[] {
  const durations: NotationDuration[] = [];
  let remaining = quarterBeats;
  const options: Array<{ duration: NotationDuration; beats: number }> = [
    { duration: "w", beats: 4 },
    { duration: "h", beats: 2 },
    { duration: "q", beats: 1 },
    { duration: "8", beats: 0.5 },
  ];

  options.forEach((option) => {
    while (remaining + EPSILON >= option.beats) {
      durations.push(option.duration);
      remaining -= option.beats;
    }
  });

  return durations;
}

function restEventsForSignatureBeats(signatureBeats: number, timeSignature: TimeSignature): RenderEvent[] {
  const quarterBeats = signatureBeats * beatUnitQuarterBeats(timeSignature);
  return durationFromQuarterBeats(quarterBeats).map((duration) => ({ duration, type: "spacer" }));
}

function eventsForMeasure(notes: NotationNote[], measure: number, staff: NotationStaff, timeSignature: TimeSignature): RenderEvent[] {
  const events: RenderEvent[] = [];
  const measureBeats = getTimeSignatureInfo(timeSignature).numerator;
  let cursor = 0;

  sortNotation(notes.filter((note) => note.measure === measure && note.staff === staff)).forEach((note) => {
    if (note.beat + EPSILON < cursor) return;

    if (note.beat > cursor + EPSILON) {
      events.push(...restEventsForSignatureBeats(note.beat - cursor, timeSignature));
      cursor = note.beat;
    }

    const noteBeats = durationToSignatureBeats(note.duration, timeSignature);
    if (note.beat + noteBeats <= measureBeats + EPSILON) {
      events.push({ note, duration: note.duration, type: note.type });
      cursor = Math.max(cursor, note.beat + noteBeats);
    }
  });

  if (cursor < measureBeats - EPSILON) {
    events.push(...restEventsForSignatureBeats(measureBeats - cursor, timeSignature));
  }

  return events;
}

function createTickable(event: RenderEvent, staff: NotationStaff, triggeredIds: string[]) {
  if (event.type === "spacer") {
    return new GhostNote(event.duration);
  }

  const isRest = event.type === "rest" || event.note?.type === "rest";
  const key = isRest || !event.note?.pitch ? restKeyForStaff(staff) : pitchToVexKey(event.note.pitch);
  const staveNote = new StaveNote({
    clef: staff,
    keys: [key],
    duration: isRest ? restDuration(event.duration) : event.duration,
  });

  staveNote.setStyle({ fillStyle: "#111827", strokeStyle: "#111827" });

  if (isRest && event.note?.id) {
    staveNote.setAttribute("data-rest-id", event.note.id);
  }

  if (!isRest && event.note?.pitch) {
    const accidental = pitchAccidental(event.note.pitch);
    if (accidental) staveNote.addModifier(new Accidental(accidental), 0);
    if (event.note.id) {
      staveNote.setAttribute("data-note-id", event.note.id);
    }
    if (event.note.id && triggeredIds.includes(event.note.id)) {
      staveNote.setStyle({ fillStyle: "#0f766e", strokeStyle: "#0f766e" });
    }
  }

  return staveNote;
}

function drawMeasure(
  context: ReturnType<Renderer["getContext"]>,
  notes: NotationNote[],
  measure: number,
  y: number,
  staff: NotationStaff,
  timeSignature: TimeSignature,
  triggeredIds: string[],
) {
  const x = SHEET_MARGIN_X + measure * MEASURE_WIDTH;
  const stave = new Stave(x, y, MEASURE_WIDTH);
  if (measure === 0) stave.addClef(staff).addTimeSignature(timeSignature);
  stave.setContext(context).draw();

  const vexNotes = eventsForMeasure(notes, measure, staff, timeSignature).map((event) => createTickable(event, staff, triggeredIds));
  if (!vexNotes.length) {
    context.save();
    context.setFont("Arial", 10, "bold");
    context.setFillStyle("#475569");
    context.fillText(String(measure + 1), x + 8, staff === "treble" ? y - 8 : y + 82);
    context.restore();
    return stave;
  }
  const info = getTimeSignatureInfo(timeSignature);
  const voice = new Voice({ numBeats: info.numerator, beatValue: info.denominator }).setStrict(false);
  voice.addTickables(vexNotes);
  new Formatter().joinVoices([voice]).format([voice], MEASURE_WIDTH - (measure === 0 ? 78 : 24));
  voice.draw(context, stave);

  context.save();
  context.setFont("Arial", 10, "bold");
  context.setFillStyle("#475569");
  context.fillText(String(measure + 1), x + 8, staff === "treble" ? y - 8 : y + 82);
  context.restore();

  return stave;
}

function strengthenNotationSvg(host: HTMLDivElement, triggeredIds: string[]) {
  host.querySelectorAll("svg path, svg text, svg line").forEach((node) => {
    const element = node as SVGElement;
    element.style.fill = "#111827";
    element.style.stroke = "#111827";
    element.style.opacity = "1";
  });

  host.querySelectorAll("[data-note-id]").forEach((node) => {
    const id = node.getAttribute("data-note-id");
    if (!id || !triggeredIds.includes(id)) return;
    const element = node as SVGElement;
    element.style.filter = "drop-shadow(0 0 8px rgba(20, 184, 166, 0.75))";
    element.style.fill = "#0f766e";
    element.style.stroke = "#0f766e";
  });
}

export function SheetRenderer({ notes, timeSignature, activeMeasure, triggeredIds }: SheetRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(SHEET_WIDTH, SHEET_HEIGHT);
    const context = renderer.getContext();
    context.setFont("Arial", 10);
    context.setFillStyle("#111827");
    context.setStrokeStyle("#111827");

    for (let measure = 0; measure < NOTATION_MEASURES; measure += 1) {
      if (measure === activeMeasure) {
        const svg = host.querySelector("svg");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(SHEET_MARGIN_X + measure * MEASURE_WIDTH + 2));
        rect.setAttribute("y", "32");
        rect.setAttribute("width", String(MEASURE_WIDTH - 4));
        rect.setAttribute("height", "268");
        rect.setAttribute("fill", "rgba(20, 184, 166, 0.08)");
        rect.setAttribute("stroke", "rgba(15, 118, 110, 0.24)");
        rect.setAttribute("rx", "8");
        svg?.appendChild(rect);
      }

      const treble = drawMeasure(context, notes, measure, TREBLE_Y, "treble", timeSignature, triggeredIds);
      const bass = drawMeasure(context, notes, measure, BASS_Y, "bass", timeSignature, triggeredIds);

      if (measure === 0) {
        const brace = new StaveConnector(treble, bass).setType(StaveConnector.type.BRACE);
        const line = new StaveConnector(treble, bass).setType(StaveConnector.type.SINGLE_LEFT);
        brace.setContext(context).draw();
        line.setContext(context).draw();
      }
    }

    strengthenNotationSvg(host, triggeredIds);
  }, [activeMeasure, notes, timeSignature, triggeredIds]);

  return <div ref={hostRef} className="pointer-events-none" style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT }} />;
}
