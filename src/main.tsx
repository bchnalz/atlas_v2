import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-4">
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-destructive max-w-md text-center">{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
