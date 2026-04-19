import { Component, type ErrorInfo, type ReactNode } from 'react'

import { storageKeys } from '../memory/storageKeys'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  message?: string
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Cortex Lab runtime error:', error, info)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="runtime-fallback">
          <div className="runtime-fallback__card">
            <p className="section-kicker">Runtime issue</p>
            <h1>Cortex Lab hit a client-side error.</h1>
            <p>
              The workspace failed while mounting. The latest fix removes a graph
              initialization bug, so a refresh should pick up the rebuilt files.
            </p>
            <div className="runtime-fallback__actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Reload app
              </button>
              <button
                type="button"
                className="secondary-button secondary-button--danger"
                onClick={() => {
                  localStorage.removeItem(storageKeys.workspace)
                  window.location.reload()
                }}
              >
                Reset saved workspace
              </button>
            </div>
            {this.state.message ? (
              <pre className="runtime-fallback__message">{this.state.message}</pre>
            ) : null}
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
