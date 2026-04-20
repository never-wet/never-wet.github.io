import { sampleCircuitIndex } from '../memory/contentRegistry'
import { componentIndex } from '../memory/componentIndex'
import { lessonIndex } from '../memory/lessonIndex'
import { useCircuitLab } from '../state/CircuitLabContext'
import { ComponentGlyph } from './ComponentGlyph'

interface ComponentPaletteProps {
  onAddAtCenter: (typeId: string) => void
}

const categories = ['sources', 'controls', 'passive', 'outputs', 'logic', 'sensors', 'advanced'] as const
const featuredComponentIds = ['battery', 'switch', 'resistor', 'led', 'ground', 'and-gate', 'output-indicator']

export const ComponentPalette = ({ onAddAtCenter }: ComponentPaletteProps) => {
  const { state, loadSample, setActiveLesson } = useCircuitLab()

  return (
    <aside className="workspace-panel palette-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Examples</span>
          <h3>Explore and build</h3>
        </div>
        <span className="tag">{sampleCircuitIndex.length} starter boards</span>
      </div>

      <div className="palette-scroll">
        <section className="palette-section">
          <header className="panel-section-title">
            <strong>Featured circuits</strong>
            <p>Load a guided example, inspect it, then remix it in the live board.</p>
          </header>

          <div className="list-stack">
            {sampleCircuitIndex.map((sample) => (
              <button className="list-row" key={sample.id} onClick={() => loadSample(sample.id)} type="button">
                <div>
                  <strong>{sample.title}</strong>
                  <p>{sample.summary}</p>
                </div>
                <span className="tag">{sample.learningFocus[0]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="palette-section">
          <header className="panel-section-title">
            <strong>Lesson path</strong>
            <p>Jump into the related concepts while keeping the workbench open.</p>
          </header>

          <div className="list-stack">
            {lessonIndex.slice(0, 5).map((lesson) => {
              const completed = state.learning.completedLessonIds.includes(lesson.id)
              const active = state.learning.activeLessonId === lesson.id

              return (
                <button
                  className={active ? 'lesson-pill is-active' : 'lesson-pill'}
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson.id)}
                  type="button"
                >
                  <div>
                    <strong>{lesson.title}</strong>
                    <p>{lesson.summary}</p>
                  </div>
                  <span className={completed ? 'tag success' : 'tag'}>{completed ? 'Done' : lesson.duration}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="palette-section">
          <header className="panel-section-title">
            <strong>Quick components</strong>
            <p>Drag onto the board or click a symbol to drop it into the stage.</p>
          </header>

          <div className="component-icon-grid is-featured">
            {componentIndex
              .filter((component) => featuredComponentIds.includes(component.id))
              .map((component) => (
                <button
                  aria-label={`Add ${component.name} to the circuit board`}
                  className="component-icon-button"
                  draggable
                  key={component.id}
                  onClick={() => onAddAtCenter(component.id)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/circuit-component', component.id)
                    event.dataTransfer.effectAllowed = 'copy'
                  }}
                  title={`${component.name}: ${component.educationalSummary}`}
                  type="button"
                >
                  <ComponentGlyph className="component-icon-glyph" component={component} />
                  <span className="component-icon-caption">{component.shortName}</span>
                </button>
              ))}
          </div>
        </section>

        {categories.map((category) => {
          const components = componentIndex.filter((component) => component.category === category)

          return (
            <section className="palette-section" key={category}>
              <header className="panel-section-title">
                <strong>{category}</strong>
                <p>{components.length} components ready for drag-and-drop use.</p>
              </header>

              <div className="component-icon-grid">
                {components.map((component) => (
                  <button
                    aria-label={`Add ${component.name} to the circuit board`}
                    className="component-icon-button"
                    draggable
                    key={component.id}
                    onClick={() => onAddAtCenter(component.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/circuit-component', component.id)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                    title={`${component.name}: ${component.educationalSummary}`}
                    type="button"
                  >
                    <ComponentGlyph className="component-icon-glyph" component={component} />
                    <span className="component-icon-caption">{component.shortName}</span>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </aside>
  )
}
