export interface NoteTemplateDefinition {
  id: string
  label: string
  helper: string
  buildTitle: (contextTitle?: string) => string
  buildMarkdown: (contextTitle?: string) => string
  tags: string[]
}

export const noteTemplates: NoteTemplateDefinition[] = [
  {
    id: 'experiment-summary',
    label: 'Experiment Summary',
    helper: 'Capture the goal, setup, and what changed.',
    buildTitle: (contextTitle) =>
      contextTitle ? `Experiment summary for ${contextTitle}` : 'Experiment summary',
    buildMarkdown: (contextTitle) => `# Experiment Summary

## Goal
- What question is this experiment trying to answer?

## Setup
- Dataset:
- Builder flow:
- Hyperparameters:

## What Changed
- Architecture changes:
- Dataset changes:
- Evaluation changes:

## Takeaways
- Main result:
- Next step:

${contextTitle ? `Linked focus: ${contextTitle}` : ''}`.trim(),
    tags: ['experiment', 'summary'],
  },
  {
    id: 'training-observation',
    label: 'Training Observation',
    helper: 'Document how the loss, accuracy, and behavior changed during training.',
    buildTitle: (contextTitle) =>
      contextTitle ? `Training observation for ${contextTitle}` : 'Training observation',
    buildMarkdown: (contextTitle) => `# Training Observation

## During Training
- Did the loss trend downward?
- Did validation metrics diverge?
- Did the model appear underfit or overfit?

## Signals Worth Keeping
- Best metric:
- Weird behavior:
- Configuration worth repeating:

## Interpretation
- Why this likely happened:
- What to try next:

${contextTitle ? `Linked focus: ${contextTitle}` : ''}`.trim(),
    tags: ['training', 'observation'],
  },
  {
    id: 'result-interpretation',
    label: 'Result Interpretation',
    helper: 'Turn a saved run into a durable research note.',
    buildTitle: (contextTitle) =>
      contextTitle ? `Result interpretation for ${contextTitle}` : 'Result interpretation',
    buildMarkdown: (contextTitle) => `# Result Interpretation

## Result Snapshot
- Model version:
- Dataset:
- Accuracy / loss:

## What It Means
- Strongest signal:
- Weakest signal:
- Confidence level:

## Decision
- Keep / iterate / discard:
- Follow-up action:

${contextTitle ? `Linked focus: ${contextTitle}` : ''}`.trim(),
    tags: ['result', 'interpretation'],
  },
]
