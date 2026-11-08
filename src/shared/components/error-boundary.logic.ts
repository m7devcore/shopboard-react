/**
 * ShopBoard — Route Error Boundary Logic Module (Day 5 Phase 5)
 *
 * Encapsulates pure state transitions, error extraction, and recovery actions
 * for the application route ErrorBoundary.
 * Strict constraint: Pure TypeScript logic, zero DOM/JSX access.
 */

export interface ErrorBoundaryState {
  readonly hasError: boolean
  readonly error: Error | null
}

export function createInitialErrorBoundaryState(): ErrorBoundaryState {
  return { hasError: false, error: null }
}

export function computeDerivedErrorBoundaryState(
  error: Error,
): ErrorBoundaryState {
  return { hasError: true, error }
}

export function resetErrorBoundaryState(): ErrorBoundaryState {
  return { hasError: false, error: null }
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected rendering error occurred in this view.',
): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }
  return fallbackMessage
}
