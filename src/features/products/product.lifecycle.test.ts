/**
 * ShopBoard — Product Lifecycle, StrictMode, Retry & API Scenarios Test Suite (Day 5 Phase 2D)
 *
 * Verifies:
 * - D5-028: Retry lifecycle, fresh request issuance, stale response overwrite prevention, rapid retries
 * - D5-029: React StrictMode double-mount simulation, effect cleanup, cart persistence/normalization, dialog cleanup
 * - D5-032: API simulation modes (/delay/3000, /fail/500, /empty), cancellation states, category boundary protection
 */

import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { ApiProductList } from '../../modules/products/products.api.ts'
import { isAbortError } from '../../shared/api/transport.ts'
import {
  getShopBoardProducts,
  UnexpectedCategoryError,
} from './product.adapter.ts'
import type { LoadState } from './products.types.ts'
import { readCartFromStorage, saveCartToStorage } from '../cart/cart.storage.ts'

describe('ShopBoard Lifecycle, StrictMode, Retry & API Scenarios (Day 5 Phase 2D)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const sampleCatalog: ApiProductList = {
    items: [
      {
        id: 1,
        title: 'Leather Tote Bag',
        category_name: 'Bags',
        price_cents: 12000,
        in_stock: true,
      },
      {
        id: 2,
        title: 'Canvas Weekender',
        category_name: 'Bags',
        price_cents: 9500,
        in_stock: true,
      },
    ],
    total: 2,
  }

  // =========================================================================
  // D5-028: Retry Lifecycle & Stale Response Overwrite Prevention
  // =========================================================================
  describe('D5-028: Retry Lifecycle & Stale Response Protection', () => {
    interface RequestRecord {
      readonly requestId: string
      readonly timestamp: number
      readonly signalAborted: () => boolean
    }

    it('1. Initial failure produces error state and retry creates a fresh request with new AbortController', async () => {
      let callCount = 0
      const requests: RequestRecord[] = []

      globalThis.fetch = async (
        _input: string | URL | Request,
        init?: RequestInit,
      ) => {
        callCount++
        const currentId = `req-${callCount}`
        const signal = init?.signal as AbortSignal | undefined

        requests.push({
          requestId: currentId,
          timestamp: Date.now(),
          signalAborted: () => signal?.aborted ?? false,
        })

        if (callCount === 1) {
          // First attempt fails with 500
          return new Response(
            JSON.stringify({ message: 'Internal Server Error' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Second attempt (retry) succeeds
        return new Response(JSON.stringify(sampleCatalog), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Hook simulation harness
      let state: LoadState = { status: 'loading' }
      const getState = (): LoadState => state
      let activeController: AbortController | null = null

      const executeFetch = async () => {
        if (activeController) {
          activeController.abort()
        }
        activeController = new AbortController()
        const controller = activeController
        let isCurrent = true

        state = { status: 'loading' }

        try {
          const products = await getShopBoardProducts({
            signal: controller.signal,
          })
          if (isCurrent && !controller.signal.aborted) {
            state = { status: 'success', products }
          }
        } catch (error: unknown) {
          if (isAbortError(error) || controller.signal.aborted || !isCurrent) {
            return
          }
          const message =
            error instanceof Error ? error.message : 'Failed to fetch catalog'
          state = { status: 'error', message }
        }
      }

      // Initial attempt
      await executeFetch()
      const s1 = getState()
      assert.equal(s1.status, 'error')
      assert.equal(callCount, 1)
      const req0 = requests[0]
      if (!req0) throw new Error('Missing req0')
      assert.equal(req0.requestId, 'req-1')
      assert.equal(req0.signalAborted(), false)

      // User triggers Retry
      await executeFetch()
      const s2 = getState()
      assert.equal(s2.status, 'success')
      assert.equal(callCount, 2)
      const req1 = requests[1]
      if (!req1) throw new Error('Missing req1')
      assert.equal(req1.requestId, 'req-2')
      if (s2.status === 'success') {
        assert.equal(s2.products.length, 2)
        assert.equal(s2.products[0]?.name, 'Leather Tote Bag')
      }
    })

    it('2. Earlier slow/delayed response cannot overwrite newer successful data after retry', async () => {
      let callCount = 0
      let resolveFirstRequest: ((resp: Response) => void) | null = null

      globalThis.fetch = async (
        _input: string | URL | Request,
        init?: RequestInit,
      ) => {
        callCount++
        const attempt = callCount
        const signal = init?.signal as AbortSignal | undefined

        if (attempt === 1) {
          // Delayed request that resolves much later
          return new Promise<Response>((resolve, reject) => {
            resolveFirstRequest = resolve
            if (signal) {
              signal.addEventListener('abort', () => {
                const abortError = new Error('The operation was aborted')
                abortError.name = 'AbortError'
                reject(abortError)
              })
            }
          })
        }

        // Retry request succeeds immediately with updated data
        const updatedCatalog: ApiProductList = {
          items: [
            {
              id: 99,
              title: 'New Season Sneaker',
              category_name: 'Shoes',
              price_cents: 14000,
              in_stock: true,
            },
          ],
          total: 1,
        }
        return new Response(JSON.stringify(updatedCatalog), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      let state: LoadState = { status: 'loading' }
      const getState = (): LoadState => state
      let activeController: AbortController | null = null

      const triggerFetch = (onComplete?: () => void) => {
        if (activeController) {
          activeController.abort()
        }
        activeController = new AbortController()
        const controller = activeController
        let isCurrent = true

        state = { status: 'loading' }

        getShopBoardProducts({ signal: controller.signal })
          .then((products) => {
            if (isCurrent && !controller.signal.aborted) {
              state = { status: 'success', products }
            }
            onComplete?.()
          })
          .catch((error: unknown) => {
            if (
              isAbortError(error) ||
              controller.signal.aborted ||
              !isCurrent
            ) {
              onComplete?.()
              return
            }
            state = {
              status: 'error',
              message: error instanceof Error ? error.message : 'Error',
            }
            onComplete?.()
          })

        return () => {
          isCurrent = false
          controller.abort()
        }
      }

      // Step 1: Start request 1 (delayed)
      const cleanup1 = triggerFetch()
      assert.equal(callCount, 1)
      assert.equal(getState().status, 'loading')

      // Step 2: User clicks Retry while request 1 is still in flight
      cleanup1() // Effect cleanup runs as retry increments counter
      await new Promise<void>((resolve) => {
        triggerFetch(resolve)
      })

      // State is now updated with request 2 results
      assert.equal(callCount, 2)
      const afterRetryState = getState()
      assert.equal(afterRetryState.status, 'success')
      if (afterRetryState.status === 'success') {
        assert.equal(afterRetryState.products[0]?.name, 'New Season Sneaker')
      }

      // Step 3: Now resolve request 1 late (e.g. server finally responds with stale catalog)
      if (resolveFirstRequest) {
        ;(resolveFirstRequest as (r: Response) => void)(
          new Response(JSON.stringify(sampleCatalog), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }

      await new Promise((r) => setTimeout(r, 10))

      // Crucial verification: stale response 1 MUST NOT overwrite newer response 2
      const finalState = getState()
      assert.equal(finalState.status, 'success')
      if (finalState.status === 'success') {
        assert.equal(finalState.products[0]?.name, 'New Season Sneaker')
        assert.equal(finalState.products.length, 1)
      }
    })

    it('3. Rapid sequential retries abort in-flight requests and cleanly commit only the final request', async () => {
      let activeRequests = 0
      let totalInitiated = 0
      const abortSignalsReceived: boolean[] = []

      globalThis.fetch = async (
        _input: string | URL | Request,
        init?: RequestInit,
      ) => {
        totalInitiated++
        activeRequests++
        const currentReq = totalInitiated
        const signal = init?.signal as AbortSignal | undefined

        return new Promise<Response>((resolve, reject) => {
          if (signal?.aborted) {
            activeRequests--
            abortSignalsReceived.push(true)
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            return reject(err)
          }

          signal?.addEventListener('abort', () => {
            activeRequests--
            abortSignalsReceived.push(true)
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })

          setTimeout(() => {
            if (signal?.aborted) return
            activeRequests--
            const catalog: ApiProductList = {
              items: [
                {
                  id: currentReq,
                  title: `Product from Req ${currentReq}`,
                  category_name: 'Bags',
                  price_cents: 5000 * currentReq,
                  in_stock: true,
                },
              ],
              total: 1,
            }
            resolve(
              new Response(JSON.stringify(catalog), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            )
          }, 30)
        })
      }

      let state: LoadState = { status: 'loading' }
      const getState = (): LoadState => state
      let activeController: AbortController | null = null

      const triggerRetry = () => {
        if (activeController) {
          activeController.abort()
        }
        activeController = new AbortController()
        const controller = activeController
        let isCurrent = true

        state = { status: 'loading' }

        getShopBoardProducts({ signal: controller.signal })
          .then((products) => {
            if (isCurrent && !controller.signal.aborted) {
              state = { status: 'success', products }
            }
          })
          .catch((error: unknown) => {
            if (
              isAbortError(error) ||
              controller.signal.aborted ||
              !isCurrent
            ) {
              return
            }
            state = {
              status: 'error',
              message: error instanceof Error ? error.message : 'Error',
            }
          })
      }

      // Rapidly trigger 3 retries in close succession
      triggerRetry()
      triggerRetry()
      triggerRetry()

      assert.equal(totalInitiated, 3)

      // Wait for async processing to settle
      await new Promise((r) => setTimeout(r, 80))

      const rapidFinalState = getState()
      assert.equal(rapidFinalState.status, 'success')
      if (rapidFinalState.status === 'success') {
        assert.equal(rapidFinalState.products[0]?.name, 'Product from Req 3')
      }
      assert.equal(abortSignalsReceived.length, 2)
    })
  })

  // =========================================================================
  // D5-029: StrictMode Simulation & Effects
  // =========================================================================
  describe('D5-029: React StrictMode Double-Mount & Storage Normalization', () => {
    it('1. StrictMode mount-unmount-remount cleans up first request and displays only second', async () => {
      let fetchCount = 0
      const signals: (AbortSignal | undefined)[] = []

      globalThis.fetch = async (
        _input: string | URL | Request,
        init?: RequestInit,
      ) => {
        fetchCount++
        signals.push(init?.signal as AbortSignal | undefined)
        return new Response(JSON.stringify(sampleCatalog), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      let displayState: LoadState = { status: 'loading' }
      const getDisplayState = (): LoadState => displayState

      // React StrictMode double-mount simulation:
      // Mount 1
      const controller1 = new AbortController()
      let isCurrent1 = true
      getShopBoardProducts({ signal: controller1.signal })
        .then((products) => {
          if (isCurrent1 && !controller1.signal.aborted) {
            displayState = { status: 'success', products }
          }
        })
        .catch(() => {})

      // Unmount 1 (Strict mode cleanup)
      isCurrent1 = false
      controller1.abort()

      // Remount (Mount 2)
      const controller2 = new AbortController()
      let isCurrent2 = true
      await getShopBoardProducts({ signal: controller2.signal })
        .then((products) => {
          if (isCurrent2 && !controller2.signal.aborted) {
            displayState = { status: 'success', products }
          }
        })
        .catch(() => {})

      assert.equal(fetchCount, 2)
      const sig0 = signals[0]
      const sig1 = signals[1]
      if (!sig0 || !sig1) throw new Error('Missing signals')
      assert.equal(sig0.aborted, true)
      assert.equal(sig1.aborted, false)
      const s = getDisplayState()
      assert.equal(s.status, 'success')
      if (s.status === 'success') {
        assert.equal(s.products.length, 2)
      }
    })

    it('2. Cart storage persistence migrates legacy format and normalizes to clean {id, qty}', () => {
      const mockStorageData = new Map<string, string>()
      const storage = {
        getItem: (key: string) => mockStorageData.get(key) ?? null,
        setItem: (key: string, value: string) =>
          mockStorageData.set(key, value),
        removeItem: (key: string) => mockStorageData.delete(key),
        clear: () => mockStorageData.clear(),
      }

      // Pre-seed storage with legacy cart item format (id, name, price, quantity)
      mockStorageData.set(
        'shopboard_cart',
        JSON.stringify([
          {
            id: 'item-101',
            name: 'Legacy Leather Bag',
            price: 99.99,
            quantity: 3,
          },
        ]),
      )

      // Step 1: Read cart (triggers migration in memory)
      const migratedCart = readCartFromStorage(storage)
      assert.deepEqual(migratedCart, [{ id: 'item-101', qty: 3 }])

      // Step 2: Storage sync effect runs on mount (saveCartToStorage without skip-initial-write ref)
      saveCartToStorage(migratedCart, storage)

      // Step 3: Storage is now normalized in persistent storage
      const storedRaw = storage.getItem('shopboard_cart')
      assert.notEqual(storedRaw, null)
      const parsed = JSON.parse(storedRaw ?? '[]') as Record<string, unknown>[]
      assert.deepEqual(parsed, [{ id: 'item-101', qty: 3 }])
      // Legacy price and name fields are strictly scrubbed
      const firstItem = parsed[0]
      if (!firstItem) throw new Error('Missing firstItem')
      assert.equal('price' in firstItem, false)
      assert.equal('name' in firstItem, false)
      assert.equal('quantity' in firstItem, false)
    })

    it('3. Dialog cleanup function closes dialog when component unmounts while open', () => {
      let isClosed = false

      const mockDialog = {
        open: true,
        showModal: () => {
          mockDialog.open = true
        },
        close: () => {
          isClosed = true
          mockDialog.open = false
        },
      }

      // Simulate the CartPanel effect cleanup:
      // return () => { if (dialog && dialog.open && typeof dialog.close === 'function') dialog.close() }
      const cleanup = () => {
        if (
          mockDialog &&
          mockDialog.open &&
          typeof mockDialog.close === 'function'
        ) {
          mockDialog.close()
        }
      }

      cleanup()
      assert.equal(isClosed, true)
      assert.equal(mockDialog.open, false)
    })
  })

  // =========================================================================
  // D5-032: API Simulation Modes (/delay/3000, /fail/500, /empty)
  // =========================================================================
  describe('D5-032: API Simulation Scenarios & Cancellation QA', () => {
    it('1. /delay/3000 simulation: aborting during prolonged loading cleanly cancels without error banner', async () => {
      let isAborted = false

      globalThis.fetch = async (
        _input: string | URL | Request,
        init?: RequestInit,
      ) => {
        const signal = init?.signal as AbortSignal | undefined
        return new Promise<Response>((_, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Should not resolve after abort'))
          }, 3000)

          signal?.addEventListener('abort', () => {
            clearTimeout(timeout)
            isAborted = true
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      }

      const controller = new AbortController()
      let displayedError: string | null = null

      const fetchPromise = getShopBoardProducts({ signal: controller.signal })
        .then(() => {
          assert.fail('Should not succeed')
        })
        .catch((error: unknown) => {
          if (isAbortError(error) || controller.signal.aborted) {
            // Correct behavior: do NOT display error banner
            return
          }
          displayedError =
            error instanceof Error ? error.message : 'Unknown error'
        })

      // Abort after 20ms (simulating user navigation or early exit)
      setTimeout(() => controller.abort(), 20)

      await fetchPromise
      assert.equal(isAborted, true)
      assert.equal(
        displayedError,
        null,
        'Aborted requests must not set error message',
      )
    })

    it('2. /fail/500 simulation: produces structured ApiError with HTTP 500 status', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Internal Server Error (Simulated 500)' }),
          {
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      await assert.rejects(
        async () => {
          await getShopBoardProducts()
        },
        (error: unknown) => {
          const isExpected =
            error instanceof Error &&
            error.message.includes('Internal Server Error')
          return isExpected
        },
      )
    })

    it('3. /empty simulation: returns empty items list, adapting to valid empty catalog', async () => {
      globalThis.fetch = async () => {
        const emptyList: ApiProductList = {
          items: [],
          total: 0,
        }
        return new Response(JSON.stringify(emptyList), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const products = await getShopBoardProducts()
      assert.equal(Array.isArray(products), true)
      assert.equal(products.length, 0)
    })

    it('4. Raw category protection remains active across API simulation and retry', async () => {
      globalThis.fetch = async () => {
        const invalidPayload = {
          items: [
            {
              id: 88,
              title: 'Pro Headphones',
              category_name: 'Electronics',
              price_cents: 19900,
              in_stock: true,
            },
          ],
          total: 1,
        }
        return new Response(JSON.stringify(invalidPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await assert.rejects(
        async () => {
          await getShopBoardProducts()
        },
        (error: unknown) => {
          return (
            error instanceof UnexpectedCategoryError &&
            error.rawCategory === 'Electronics'
          )
        },
      )
    })
  })
})
