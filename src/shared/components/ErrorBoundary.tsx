/**
 * ShopBoard — React Route Error Boundary Component (Day 5 Phase 5)
 *
 * Implements a real React Error Boundary for catching:
 * - Lazy-loaded chunk dynamic import failures (network drop, chunk 404).
 * - Uncaught rendering errors inside page routes.
 *
 * Resilience Guarantees:
 * - Traps failures inside the active `<main className="shopboard-content">` seam.
 * - Prevents route crashes from unmounting the global `<Header />` or `<CartPanel />`.
 * - Provides an interactive "Try Again" recovery action that clears error state
 *   and re-mounts the route subtree.
 * - Includes a safe fallback link to return to the catalog (`/products`).
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import {
  computeDerivedErrorBoundaryState,
  createInitialErrorBoundaryState,
  getErrorMessage,
  resetErrorBoundaryState,
  type ErrorBoundaryState,
} from './error-boundary.logic.ts'

export interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: (error: Error, reset: () => void) => ReactNode
  readonly onReset?: () => void
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = createInitialErrorBoundaryState()
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return computeDerivedErrorBoundaryState(error)
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an unhandled rendering error:',
      error,
      errorInfo,
    )
  }

  handleReset = (): void => {
    this.setState(resetErrorBoundaryState())
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div
          className="error-boundary-fallback"
          role="alert"
          aria-live="assertive"
        >
          <div className="error-fallback-card">
            <span className="error-fallback-icon" aria-hidden="true">
              ⚠️
            </span>
            <h2 className="error-fallback-title">Something went wrong</h2>
            <p className="error-fallback-message">
              {getErrorMessage(this.state.error)}
            </p>
            <div className="error-fallback-actions">
              <button
                type="button"
                className="btn-primary-cta btn-try-again"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <a href="/products" className="btn-secondary-link">
                Return to Catalog
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
