import { appManifest } from './memory/appManifest'
import { componentIndex } from './memory/componentIndex'
import { lessonIndex } from './memory/lessonIndex'
import { quizIndex } from './memory/quizIndex'
import { CircuitLabProvider, useCircuitLab } from './state/CircuitLabContext'
import { AppHeader } from './app/AppHeader'
import { HomeView } from './app/HomeView'
import { ProgressView } from './app/ProgressView'
import { WorkspaceView } from './builder/WorkspaceView'
import { LearnView } from './education/LearnView'
import { LibraryView } from './library/LibraryView'
import { PracticeView } from './quiz/PracticeView'

const AppContent = () => {
  const { state } = useCircuitLab()
  const isStudioSection =
    state.ui.activeSection === 'builder' ||
    state.ui.activeSection === 'simulation' ||
    state.ui.activeSection === 'sandbox'

  return (
    <div className={isStudioSection ? 'app-shell is-studio-shell' : 'app-shell'}>
      <AppHeader />
      <main className={isStudioSection ? 'app-main is-studio' : 'app-main'}>
        {state.ui.activeSection === 'home' && <HomeView />}
        {state.ui.activeSection === 'learn' && <LearnView />}
        {(state.ui.activeSection === 'builder' ||
          state.ui.activeSection === 'simulation' ||
          state.ui.activeSection === 'sandbox') && <WorkspaceView />}
        {state.ui.activeSection === 'practice' && <PracticeView />}
        {state.ui.activeSection === 'library' && <LibraryView />}
        {state.ui.activeSection === 'progress' && <ProgressView />}
      </main>

      {!isStudioSection && (
        <footer className="app-footer">
          <div>
            <strong>{appManifest.name}</strong>
            <span>{appManifest.tagline}</span>
          </div>
          <div className="footer-metrics">
            <span>{componentIndex.length} components</span>
            <span>{lessonIndex.length} lessons</span>
            <span>{quizIndex.length} quizzes</span>
          </div>
        </footer>
      )}
    </div>
  )
}

export default function App() {
  return (
    <CircuitLabProvider>
      <AppContent />
    </CircuitLabProvider>
  )
}
