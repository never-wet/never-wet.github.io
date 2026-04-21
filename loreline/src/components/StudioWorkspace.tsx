import { useEffect, useState, type ReactNode } from 'react'
import {
  studioNotebookSeed,
  studioProject,
  studioScenes,
  studioTabs,
  type StudioReferenceGroup,
  type StudioReferenceTab,
} from '../data/studioContent'

const DRAFT_STORAGE_KEY = 'loreline-studio-drafts'
const NOTE_STORAGE_KEY = 'loreline-studio-notebook'

function buildDefaultDrafts() {
  return studioScenes.reduce<Record<string, string>>((accumulator, scene) => {
    accumulator[scene.id] = scene.initialText
    return accumulator
  }, {})
}

function readStoredDrafts() {
  const defaults = buildDefaultDrafts()

  if (typeof window === 'undefined') {
    return defaults
  }

  try {
    const rawValue = window.localStorage.getItem(DRAFT_STORAGE_KEY)

    if (!rawValue) {
      return defaults
    }

    const parsed = JSON.parse(rawValue)

    if (!parsed || typeof parsed !== 'object') {
      return defaults
    }

    const mergedDrafts = { ...defaults }

    for (const [sceneId, draft] of Object.entries(parsed)) {
      if (typeof draft === 'string' && sceneId in mergedDrafts) {
        mergedDrafts[sceneId] = draft
      }
    }

    return mergedDrafts
  } catch {
    return defaults
  }
}

function readStoredNotebook() {
  if (typeof window === 'undefined') {
    return studioNotebookSeed
  }

  try {
    const rawValue = window.localStorage.getItem(NOTE_STORAGE_KEY)
    return rawValue && rawValue.trim().length > 0 ? rawValue : studioNotebookSeed
  } catch {
    return studioNotebookSeed
  }
}

function countWords(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return 0
  }

  return trimmedValue.split(/\s+/).length
}

function formatSavedAt(date: Date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMinutes(words: number) {
  return words / 200
}

function formatReadingTimeLabel(words: number) {
  if (words <= 0) {
    return '0 min read'
  }

  const roundedMinutes = Math.max(1, Math.round(formatMinutes(words)))
  return `${roundedMinutes} min read`
}

function renderReferenceCards(items: StudioReferenceGroup[]) {
  return (
    <div className="studio-context__cards">
      {items.map((item) => (
        <article className="studio-reference-card" key={item.title}>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </article>
      ))}
    </div>
  )
}

export function StudioWorkspace() {
  const [activeSceneId, setActiveSceneId] = useState(studioScenes[0].id)
  const [isProjectOpen, setIsProjectOpen] = useState(true)
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isEditorActive, setIsEditorActive] = useState(false)
  const [activeTab, setActiveTab] = useState<StudioReferenceTab>('characters')
  const [drafts, setDrafts] = useState<Record<string, string>>(() => readStoredDrafts())
  const [notebook, setNotebook] = useState(() => readStoredNotebook())
  const [savedLabel, setSavedLabel] = useState('Autosaves locally in your browser')

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Loreline Studio | Empire of Salt'

    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
    window.localStorage.setItem(NOTE_STORAGE_KEY, notebook)
    setSavedLabel(`Saved locally at ${formatSavedAt(new Date())}`)
  }, [drafts, notebook])

  useEffect(() => {
    if (isFocusMode) {
      setIsProjectOpen(false)
      setIsContextOpen(false)
    }
  }, [isFocusMode])

  const activeScene = studioScenes.find((scene) => scene.id === activeSceneId) ?? studioScenes[0]
  const activeDraft = drafts[activeScene.id] ?? activeScene.initialText
  const activeSceneWordCount = countWords(activeDraft)
  const totalWordCount = studioScenes.reduce((total, scene) => total + countWords(drafts[scene.id] ?? scene.initialText), 0)
  const targetProgress = Math.min(100, Math.round((activeSceneWordCount / activeScene.targetWords) * 100))
  const readingTimeLabel = formatReadingTimeLabel(activeSceneWordCount)
  const projectReadingTimeLabel = formatReadingTimeLabel(totalWordCount)

  function handleProjectToggle() {
    if (isFocusMode) {
      setIsFocusMode(false)
    }

    setIsProjectOpen((current) => !current)
  }

  function handleContextToggle() {
    if (isFocusMode) {
      setIsFocusMode(false)
    }

    setIsContextOpen((current) => !current)
  }

  function handleFocusToggle() {
    setIsFocusMode((current) => !current)
  }

  function openContext(tab: StudioReferenceTab) {
    setIsFocusMode(false)
    setActiveTab(tab)
    setIsContextOpen(true)
  }

  let contextContent: ReactNode

  switch (activeTab) {
    case 'characters':
      contextContent = renderReferenceCards(activeScene.references.characters)
      break
    case 'places':
      contextContent = renderReferenceCards(activeScene.references.places)
      break
    case 'lore':
      contextContent = renderReferenceCards(activeScene.references.lore)
      break
    case 'timeline':
      contextContent = renderReferenceCards(activeScene.references.timeline)
      break
    case 'notebook':
      contextContent = (
        <div className="studio-context__notebook">
          <label className="studio-context__label" htmlFor="studio-notebook">
            Project notebook
          </label>
          <textarea
            className="studio-notebook"
            id="studio-notebook"
            onChange={(event) => setNotebook(event.target.value)}
            value={notebook}
          />
        </div>
      )
      break
  }

  return (
    <div className={`studio-shell ${isFocusMode ? 'studio-shell--focus' : ''} ${isEditorActive ? 'studio-shell--typing' : ''}`}>
      <header className={`studio-topbar ${isFocusMode && isEditorActive ? 'studio-topbar--quiet' : ''}`}>
        <div className="studio-topbar__inner">
          <div className="studio-topbar__identity">
            <a className="brand" href="./">
              Loreline
            </a>
            <div className="studio-topbar__breadcrumbs" aria-label="Current writing location">
              <span>{studioProject.title}</span>
              <span>/</span>
              <span>{activeScene.chapterLabel}</span>
              <span>/</span>
              <span>{activeScene.title}</span>
            </div>
          </div>

          <div className="studio-topbar__status">
            <span>{activeSceneWordCount} words</span>
            <span>{readingTimeLabel}</span>
            <span>{savedLabel}</span>
          </div>

          <div className="studio-topbar__actions">
            <button className="button button--ghost button--compact" onClick={handleProjectToggle} type="button">
              {isProjectOpen ? 'Hide project' : 'Show project'}
            </button>
            <button className="button button--ghost button--compact" onClick={handleContextToggle} type="button">
              {isContextOpen ? 'Hide guide' : 'Story guide'}
            </button>
            <button className="button button--primary button--compact" onClick={handleFocusToggle} type="button">
              {isFocusMode ? 'Exit focus mode' : 'Focus mode'}
            </button>
          </div>
        </div>
      </header>

      <main
        className={`studio-layout ${isProjectOpen ? 'studio-layout--project-open' : 'studio-layout--project-closed'} ${
          isContextOpen ? 'studio-layout--context-open' : 'studio-layout--context-closed'
        } ${isFocusMode ? 'studio-layout--focus' : ''}`}
      >
        <aside
          aria-hidden={!isProjectOpen}
          className={`studio-sidebar ${isProjectOpen ? 'studio-sidebar--open' : 'studio-sidebar--closed'}`}
          aria-label="Story project navigation"
        >
            <div className="studio-sidebar__intro">
              <p className="studio-sidebar__eyebrow">Writing studio</p>
              <h1>{studioProject.title}</h1>
              <p>{studioProject.summary}</p>
            </div>

            <div className="studio-sidebar__metrics" aria-label="Project stats">
              {studioProject.metrics.map((metric) => (
                <article className="studio-sidebar__metric" key={metric.label}>
                  <span>{metric.value}</span>
                  <p>{metric.label}</p>
                </article>
              ))}
            </div>

            <div className="studio-sidebar__scene-list">
              <div className="studio-sidebar__heading">
                <h2>Draft scenes</h2>
                <p>{totalWordCount} manuscript words, {projectReadingTimeLabel.toLowerCase()}</p>
              </div>

              {studioScenes.map((scene) => {
                const sceneWordCount = countWords(drafts[scene.id] ?? scene.initialText)

                return (
                  <button
                    aria-pressed={scene.id === activeScene.id}
                    className={`studio-scene-button ${scene.id === activeScene.id ? 'studio-scene-button--active' : ''}`}
                    key={scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    type="button"
                  >
                    <div className="studio-scene-button__topline">
                      <span>{scene.chapterLabel}</span>
                      <span>{scene.status}</span>
                    </div>
                    <h3>{scene.title}</h3>
                    <p>{scene.location}</p>
                    <div className="studio-scene-button__meta">
                      <span>{scene.pointOfView}</span>
                      <span>{sceneWordCount} / {scene.targetWords}</span>
                    </div>
                  </button>
                )
              })}
            </div>
        </aside>

        <section className="studio-main" aria-labelledby="studio-scene-title">
          <div className="studio-main__scene" key={activeScene.id}>
            <div className="studio-main__header">
              <div>
                <p className="studio-main__eyebrow">
                  {activeScene.chapterLabel} / {activeScene.location} / {activeScene.status}
                </p>
                <h2 id="studio-scene-title">{activeScene.title}</h2>
                <p className="studio-main__synopsis">{activeScene.synopsis}</p>
              </div>

              <div className="studio-main__insights" aria-label="Scene writing stats">
                <article className="studio-insight-card">
                  <span>Point of view</span>
                  <strong>{activeScene.pointOfView}</strong>
                </article>
                <article className="studio-insight-card">
                  <span>Scene target</span>
                  <strong>{activeScene.targetWords} words</strong>
                </article>
                <article className="studio-insight-card">
                  <span>Read time</span>
                  <strong>{readingTimeLabel}</strong>
                </article>
              </div>
            </div>

            <div className="studio-main__tools" aria-label="Story context shortcuts">
              {studioTabs.map((tab) => (
                <button
                  className={`studio-tool-chip ${
                    isContextOpen && activeTab === tab.id ? 'studio-tool-chip--active' : ''
                  }`}
                  key={tab.id}
                  onClick={() => openContext(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="studio-editor-frame">
              <div className="studio-editor-frame__top">
                <div className="studio-editor-frame__route">
                  <span>Manuscript</span>
                  <span>/</span>
                  <span>{activeScene.chapterLabel}</span>
                  <span>/</span>
                  <span>{activeScene.title}</span>
                </div>
                <div className="studio-editor-frame__stats">
                  <span>{activeSceneWordCount} words</span>
                  <span>{readingTimeLabel}</span>
                  <span>{activeScene.location}</span>
                </div>
              </div>

              <div className="studio-editor-surface">
                <div className="studio-editor-shell">
                  <label className="studio-context__label" htmlFor="studio-editor">
                    Scene draft
                  </label>
                  <textarea
                    className="studio-editor"
                    id="studio-editor"
                    onBlur={() => setIsEditorActive(false)}
                    onChange={(event) =>
                      setDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [activeScene.id]: event.target.value,
                      }))
                    }
                    onFocus={() => setIsEditorActive(true)}
                    spellCheck
                    value={activeDraft}
                  />
                </div>
              </div>

              <div className="studio-editor-footer">
                <div className="studio-progress">
                  <div className="studio-progress__label">
                    <span>Scene target</span>
                    <strong>
                      {activeSceneWordCount} / {activeScene.targetWords}
                    </strong>
                  </div>
                  <div aria-hidden="true" className="studio-progress__bar">
                    <span style={{ width: `${targetProgress}%` }} />
                  </div>
                </div>

                <div className="studio-editor-footer__meta">
                  <span>{savedLabel}</span>
                  <span>Keep the manuscript primary. Open world context only when the scene needs it.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside
          aria-hidden={!isContextOpen}
          className={`studio-context ${isContextOpen ? 'studio-context--open' : 'studio-context--closed'}`}
          aria-label="Linked story context"
        >
            <div className="studio-context__header">
              <div>
                <p className="studio-context__eyebrow">Story guide</p>
                <h2>Linked material for this scene</h2>
              </div>
              <p className="studio-context__description">
                Open the layer you need, check it, and get back to the page without dragging the whole interface into view.
              </p>
            </div>

            <div aria-label="Reference categories" className="studio-context__tabs" role="tablist">
              {studioTabs.map((tab) => (
                <button
                  aria-selected={tab.id === activeTab}
                  className={`studio-context__tab ${tab.id === activeTab ? 'studio-context__tab--active' : ''}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="studio-watchpanel">
              <p className="studio-context__label">Continuity watchpoints</p>
              <ul>
                {activeScene.continuityNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>

            <div className="studio-context__panel" role="tabpanel">
              <div className="studio-context__panel-body" key={`${activeScene.id}-${activeTab}`}>
                {contextContent}
              </div>
            </div>
        </aside>
      </main>
    </div>
  )
}
