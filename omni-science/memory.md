# Omni-Science Project Memory

## Design Philosophy
- **Apple-level clean:** Minimalist UI with high-quality typography and spacing.
- **Intuition-First:** Prioritize visual and analogical understanding before deep theory.
- **Seamless Motion:** Use Framer Motion for all UI transitions to eliminate "jumps".
- **Glassmorphism:** Use slate-colored panels with backdrop blur for a modern, futuristic feel.

## Knowledge Structure
- Every concept must have:
  - `Theory`: Mathematical formula and academic text.
  - `Visual`: Interactive 3D simulation or diagram.
  - `Analogy`: Relatable "real-world" metaphor.
- Progression is enforced: Intermediate topics require Basic prerequisites.

## Implementation Rules
- **Visualization:** Use React Three Fiber for 3D labs. Lazy load them to maintain performance.
- **State Management:** Use Zustand for tracking completed topics and current navigation.
- **Math Rendering:** Use KaTeX for professional scientific notation.
- **Icons:** Use Lucide React for consistent, clean iconography.

## Component Guidelines
- **Layout:** Responsive sidebar with learning path + sticky header with search.
- **ConceptView:** Main content split into visual/sim (Left) and explanation/metadata (Right).
- **IntuitionToggle:** Segmented control with smooth spring-based selection pill.

## Performance
- Avoid heavy re-renders in the 3D canvas.
- Use `AnimatePresence` for mode switching.
- Optimize Three.js geometries (low poly where possible).
