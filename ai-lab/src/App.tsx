import { AppErrorBoundary } from './components/AppErrorBoundary'
import { LabApp } from './app/LabApp'

function App() {
  return (
    <AppErrorBoundary>
      <LabApp />
    </AppErrorBoundary>
  )
}

export default App
