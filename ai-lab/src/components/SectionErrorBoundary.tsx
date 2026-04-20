import { Component, type ErrorInfo, type ReactNode } from 'react'

interface SectionErrorBoundaryProps {
  children: ReactNode
  title: string
  message: string
  resetLabel?: string
  onReset?: () => void
}

interface SectionErrorBoundaryState {
  hasError: boolean
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  public state: SectionErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): SectionErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.title} runtime error:`, error, info)
  }

  private handleReset = () => {
    this.setState({ hasError: false })
    this.props.onReset?.()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <section className="section-fallback">
          <p className="section-kicker">Panel issue</p>
          <h3>{this.props.title}</h3>
          <p>{this.props.message}</p>
          {this.props.onReset ? (
            <button
              type="button"
              className="secondary-button"
              onClick={this.handleReset}
            >
              {this.props.resetLabel ?? 'Reset panel'}
            </button>
          ) : null}
        </section>
      )
    }

    return this.props.children
  }
}
