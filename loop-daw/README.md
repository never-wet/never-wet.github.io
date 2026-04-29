# Loop DAW

Loop DAW is a browser-based mini DAW built for fast music sketching. It combines an Ableton-inspired workspace with a real Tone.js audio engine, multi-track sequencing, drums, mixer controls, recording, and rule-based AI composition.

## Tech Stack

- Next.js
- React
- TypeScript
- Tone.js
- Zustand
- Tailwind CSS
- Three.js
- VexFlow

## Run Locally

```bash
npm install
npm run dev
```

Build and publish the static export into this folder:

```bash
npm run build
```

## Features

- Multi-track workspace: Melody, Chords, Bass, and Drums
- Piano roll for C4 through B4 notes
- Drum sequencer with kick, snare, hi-hat, clap, and percussion lanes
- Tone.Transport sequencer with loop playback and active-step feedback
- Tone.js instruments using PolySynth, FMSynth, MonoSynth, and drum synths
- Instant note and drum preview on click
- Keyboard recording for melodic tracks
- Quantized overdub recording while playback runs
- Track mute, solo, and volume controls
- Master volume mapped to Tone.Destination.volume
- Style-based AI generation for lofi, trap, EDM, pop, and ambient
- Chord recommendations using common progressions
- Auto drum generation per style
- Three.js analyser visualizer reacting to the audio engine
- Modern Mode / Classic Mode switch in the transport bar
- Classic notation editor rendered with VexFlow
- Treble and bass grand staff with clefs, common time signatures, measures, bar lines, notes, and rests
- Click-to-add notation notes with whole, half, quarter, and eighth durations
- Erase tool and selected-note delete action
- Classic Mode playback through the same Tone.js engine

## Architecture

- `components/TransportBar.tsx` handles play, stop, record, BPM, loop, and fast AI generation.
- `components/ClassicModeButton.tsx` switches between Modern Mode and Classic Mode.
- `components/TrackList.tsx` manages track selection, mute, solo, and per-track volume.
- `components/ClipGrid.tsx` gives a compact arrangement overview and active-step feedback.
- `components/PianoRoll.tsx` edits melody/chords/bass notes and records keyboard input.
- `components/DrumSequencer.tsx` edits drum lanes.
- `components/NotationToolbar.tsx` provides duration, rest, clef target, time signature, erase, and clear controls.
- `components/NotationEditor.tsx` hosts the sheet music view, staff input layer, selected-note status, and notation export.
- `components/SheetRenderer.tsx` renders real staff notation using VexFlow SVG output.
- `components/StaffInputLayer.tsx` maps staff clicks into measure, beat, pitch, staff, and duration data.
- `components/AIComposerPanel.tsx` exposes key, scale, style, chord progressions, and pattern generation.
- `components/Mixer.tsx` controls master and track levels.
- `components/Visualizer3D.tsx` renders a lightweight Three.js audio visualizer.
- `store/useDAWStore.ts` centralizes tracks, notes, drums, notation notes, mode, transport, mixer, key/scale/style, recording, and visual feedback.
- `lib/audioEngine.ts` owns Tone.js synths, drum voices, routing, preview playback, and analyser data.
- `lib/sequencer.ts` owns Tone.Transport scheduling and requestAnimationFrame UI updates for both Modern and Classic modes.
- `lib/aiComposer.ts` generates musical patterns using scales, progressions, motifs, and style templates.
- `lib/musicTheory.ts` provides notes, scales, chord helpers, MIDI conversion, and quantization.
- `lib/notation.ts` defines notation data, duration math, staff geometry, pitch mapping, measure/beat conversion, and VexFlow key helpers.

## Classic Mode

Classic Mode is a traditional sheet music editor for users who prefer staff notation. It uses VexFlow to render the treble staff, bass staff, selected time signature, notes, rests, measures, and bar lines. The app does not manually draw notation with divs.

Notation notes are stored separately from piano-roll notes:

```ts
{
  id: string;
  type: "note" | "rest";
  pitch?: "C4";
  duration: "w" | "h" | "q" | "8";
  beat: 0;
  measure: 0;
  staff: "treble" | "bass";
}
```

Supported time signatures are 2/4, 3/4, 4/4, 6/8, 9/8, 12/8, 2/2, 3/8, 5/4, and 7/8. Duration and measure math live in `lib/notation.ts`, so changing the time signature updates rendering and playback without deleting existing score data.

During Classic Mode playback, `Tone.Transport` runs at sixteenth-note resolution. The sequencer maps each notation event from `measure + beat` into the transport timeline, plays treble notes on the melody instrument, plays bass staff notes on the bass instrument, and skips rests.

The transport AI button also works in Classic Mode. It generates a four-measure score in the selected key/scale and time signature, using repeated motifs plus simple rests instead of pure random notes.

Future notation features are planned around this data model: MusicXML export, PDF export, MIDI import/export, key signatures, dynamics, articulations, slurs, ties, chord notation, lyrics, and multiple pages.

## Design Goal

The app should feel like a serious beginner-friendly DAW MVP: clean, dark, immediate, low-latency, and focused on making a loop quickly.
