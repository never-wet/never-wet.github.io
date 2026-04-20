# Adding Content

## Add a New Component

1. Open `src/memory/componentIndex.ts`.
2. Add a new `ComponentDefinition` entry with:
   - `id`, `name`, `category`, `symbol`, and `educationalSummary`
   - `terminals` with stable terminal ids and local SVG coordinates
   - `parameters` with defaults and editor metadata
   - `validationRules`, `examples`, and phase support notes
3. Update `src/builder/ComponentSymbol.tsx` so the new component has a clear visual symbol on the board.
4. If the component should simulate in phase 1, add edge or source handling in `src/simulation/engine.ts`.
5. If the component needs special validation, extend `src/simulation/validation.ts`.

## Add a New Lesson

1. Add a `LessonDefinition` entry in `src/memory/lessonIndex.ts`.
2. Link it to a sample circuit by setting `sampleCircuitId` if you want one-click lesson loading.
3. If the lesson needs a new starter circuit, add it in `src/memory/contentRegistry.ts`.
4. The Learn view and lesson dock will pick it up automatically.

## Add a New Quiz

1. Add a `QuizDefinition` entry in `src/memory/quizIndex.ts`.
2. Use an existing `kind` when possible:
   - `multiple-choice`
   - `component-match`
   - `prediction`
   - `troubleshooting`
   - `build-check`
3. For a build-based quiz, define `expectedBuild` with required component types, minimum wire count, and loop requirements.
4. If the quiz needs a sample circuit, point `sampleCircuitId` at one from `src/memory/contentRegistry.ts`.

## Add a New Quiz Type

1. Extend the `QuizKind` union in `src/memory/types.ts`.
2. Add any extra fields needed on `QuizDefinition`.
3. Update `src/quiz/PracticeView.tsx` to render and evaluate the new type.
4. If the new type needs deeper board or simulation checks, reuse or extend helpers from `src/simulation/engine.ts`.
