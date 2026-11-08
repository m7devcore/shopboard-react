/**
 * ShopBoard — Route Error Boundary Logic Test Suite (Day 5 Phase 5)
 *
 * Verifies:
 * - Initial state creation
 * - Derived state computation from Error objects
 * - State reset mechanics for recovery
 * - Defensive error message extraction across Error objects, string literals, and malformed inputs
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeDerivedErrorBoundaryState,
  createInitialErrorBoundaryState,
  getErrorMessage,
  resetErrorBoundaryState,
} from './error-boundary.logic.ts'

describe('Route Error Boundary Logic (Day 5 Phase 5)', () => {
  it('creates clean initial boundary state with hasError: false and error: null', () => {
    const state = createInitialErrorBoundaryState()
    assert.equal(state.hasError, false)
    assert.equal(state.error, null)
  })

  it('computes derived error boundary state from thrown Error', () => {
    const error = new Error('Chunk load failed: /assets/CartPage.js')
    const state = computeDerivedErrorBoundaryState(error)

    assert.equal(state.hasError, true)
    assert.equal(state.error, error)
    assert.equal(state.error?.message, 'Chunk load failed: /assets/CartPage.js')
  })

  it('resets error state to hasError: false and error: null on recovery', () => {
    const state = resetErrorBoundaryState()
    assert.equal(state.hasError, false)
    assert.equal(state.error, null)
  })

  describe('getErrorMessage', () => {
    it('extracts message from standard Error instances', () => {
      const msg = getErrorMessage(
        new Error('Network timeout during route import'),
      )
      assert.equal(msg, 'Network timeout during route import')
    })

    it('accepts string error values', () => {
      const msg = getErrorMessage('Direct string failure')
      assert.equal(msg, 'Direct string failure')
    })

    it('falls back safely on null, undefined, or empty messages', () => {
      assert.equal(
        getErrorMessage(null),
        'An unexpected rendering error occurred in this view.',
      )
      assert.equal(
        getErrorMessage(undefined),
        'An unexpected rendering error occurred in this view.',
      )
      assert.equal(
        getErrorMessage(new Error('   ')),
        'An unexpected rendering error occurred in this view.',
      )
    })

    it('allows customized fallback messages', () => {
      const customFallback = 'Custom fallback message'
      assert.equal(getErrorMessage(null, customFallback), customFallback)
    })
  })
})
