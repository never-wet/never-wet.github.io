# Loop DAW Memory

## App Purpose

Loop DAW is a professional-feeling browser DAW MVP. It should let beginners create a musical loop quickly while still feeling like a real composition workspace.

## UX Rules

- Keep the interface dark, clean, and Ableton-inspired.
- Show the selected track clearly.
- Keep transport controls compact and always visible.
- Avoid clutter and secondary controls that compete with note editing.
- Piano roll and drum sequencer must feel immediate.
- Classic Mode should feel like clean sheet music software, not a cluttered engraving workstation.
- Visual feedback matters: active step, triggered notes, drum pads, recording state, and visualizer movement.

## Audio Rules

- Use Tone.js as the audio engine.
- Always start audio from a user gesture before preview or playback.
- Use Tone.Transport for sequenced playback.
- Use PolySynth for melody/chords, MonoSynth for bass, and dedicated drum synths.
- Master volume maps to Tone.Destination.volume.
- Track volume is handled through Tone.Volume nodes.
- Keep scheduling ahead with Tone.Transport and update UI with requestAnimationFrame.
- In Classic Mode, schedule notation by measure/beat and play staff notes through existing Tone instruments.

## Classic Mode Rules

- Use VexFlow for staff notation rendering.
- Do not manually draw staff lines, clefs, noteheads, rests, or bar lines with raw divs.
- Keep MVP notation simple: grand staff, treble clef, bass clef, common time signatures, whole/half/quarter/eighth notes, rests, erase, and playback.
- UX flow is select duration, click staff, note appears.
- Staff clicks map to measure, beat, staff, and pitch through `lib/notation.ts`.
- Click height must map to multiple treble and bass pitches, not a fixed Middle C.
- Treble staff notes play through Melody; bass staff notes play through Bass.
- Rests are stored in notation state and rendered, but do not trigger audio.
- Active measure and triggered notes should be visually highlighted when possible.
- Sheet notation should render as dark engraving on a light score so staff lines, clefs, time signatures, notes, stems, and rests remain readable.

## Notation Data Model

- Classic notes live in `notationNotes`, separate from piano-roll `notes`.
- Each notation item stores `id`, `type`, optional `pitch`, `duration`, `measure`, `beat`, and `staff`.
- Rests use the same notation item model with `type: "rest"` and no pitch.
- Supported time signatures are 2/4, 3/4, 4/4, 6/8, 9/8, 12/8, 2/2, 3/8, 5/4, and 7/8.
- `compositionMode` controls whether Modern DAW grid or Classic notation editor is shown.
- The model is intentionally export-friendly for future MusicXML/PDF/MIDI work.

## AI Logic

- AI is rule-based, not external API based.
- Generate from key, scale, style, chord progressions, rhythm templates, and repeated motifs.
- Supported styles: lofi, trap, EDM, pop, ambient.
- AI output should include melody, chords, bass, and drums.
- In Classic Mode, the top-bar AI button should update `notationNotes` directly with a visible four-measure score in the selected key/scale and time signature.
- Avoid pure randomness; use predictable musical anchors with small variations.
- Chord recommendations should include I-V-vi-IV, ii-V-I, vi-IV-I-V, and related common progressions.

## Performance Rules

- Centralize DAW state in Zustand.
- Keep Tone synth creation lazy and reused.
- Do not recreate the sequencer on every render.
- Use requestAnimationFrame for visual playhead updates from scheduled audio callbacks.
- Keep Three.js visualizer lightweight and dispose renderer/materials on unmount.

## Future Improvements

- Add clip launching and multiple patterns per track.
- Add piano keyboard UI and velocity editing.
- Add note drag and length editing.
- Add swing/groove controls.
- Add project save/load beyond local JSON.
- Add audio export/render.
- Add MIDI input support.
- Add better chord voicing and bass octave display.
- Add MusicXML export for Classic Mode.
- Add PDF export and print layout for rendered notation.
- Add MIDI import/export shared by Modern and Classic modes.
- Add key signatures, dynamics, articulations, slurs, ties, chord symbols, lyrics, and multiple pages.
