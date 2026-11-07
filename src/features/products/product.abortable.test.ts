import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { ApiProductList } from '../../modules/products/products.api.ts'
import { ApiError } from '../../shared/api/client.ts'
import { fetchWithSignal, isAbortError } from '../../shared/api/transport.ts'
import {
  getShopBoardProducts,
  UnexpectedCategoryError,
} from './product.adapter.ts'

describe('ShopBoard Abortable Catalog Fetch & Transport (Day 5 Phase 2B)', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const validApiList: ApiProductList = {
    items: [
      {
        id: 1,
        title: 'Leather Tote Bag',
        category_name: 'Bags',
        price_cents: 8900,
        in_stock: true,
      },
      {
        id: 4,
        title: 'Court Sneakers',
        category_name: 'Shoes',
        price_cents: 11000,
        in_stock: true,
      },
    ],
    total: 2,
  }

  it('1. AbortSignal reaches the actual fetch call', async () => {
    let capturedSignal: AbortSignal | undefined

    globalThis.fetch = async (
      _input: string | URL | Request,
      init?: RequestInit,
    ) => {
      capturedSignal = init?.signal as AbortSignal | undefined
      return new Response(JSON.stringify(validApiList), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const controller = new AbortController()
    const products = await getShopBoardProducts({
      endpointPath: '/api/products',
      signal: controller.signal,
    })

    assert.equal(products.length, 2)
    assert.strictEqual(capturedSignal, controller.signal)
    assert.equal(capturedSignal?.aborted, false)
  })

  it('2. Aborting a pending request rejects/cancels it with AbortError', async () => {
    const controller = new AbortController()

    globalThis.fetch = async (
      _input: string | URL | Request,
      init?: RequestInit,
    ) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal
        if (signal) {
          if (signal.aborted) {
            reject(new DOMException('This operation was aborted', 'AbortError'))
            return
          }
          signal.addEventListener('abort', () => {
            reject(new DOMException('This operation was aborted', 'AbortError'))
          })
        }
      })
    }

    const fetchPromise = getShopBoardProducts({
      endpointPath: '/api/products',
      signal: controller.signal,
    })

    // Abort after initiating
    controller.abort()

    await assert.rejects(
      async () => {
        await fetchPromise
      },
      (err: unknown) => {
        assert(isAbortError(err))
        return true
      },
    )
  })

  it('3. An aborted response does not overwrite newer state (simulating hook race condition)', async () => {
    let requestCount = 0
    const results: string[] = []

    // Simulate request 1 (slow, will be aborted) and request 2 (fast, retry)
    const controller1 = new AbortController()
    let isCurrent1 = true

    const controller2 = new AbortController()
    let isCurrent2 = true

    globalThis.fetch = async (
      _input: string | URL | Request,
      init?: RequestInit,
    ) => {
      requestCount++
      const currentReq = requestCount

      if (currentReq === 1) {
        // Slow request that takes 50ms
        return new Promise<Response>((resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
          setTimeout(() => {
            resolve(
              new Response(
                JSON.stringify({
                  items: [
                    {
                      id: 1,
                      title: 'Old Stale Product',
                      category_name: 'Bags',
                      price_cents: 1000,
                      in_stock: true,
                    },
                  ],
                  total: 1,
                }),
                { status: 200 },
              ),
            )
          }, 50)
        })
      }

      // Fast request 2
      return new Response(
        JSON.stringify({
          items: [
            {
              id: 2,
              title: 'New Fresh Product',
              category_name: 'Bags',
              price_cents: 2000,
              in_stock: true,
            },
          ],
          total: 1,
        }),
        { status: 200 },
      )
    }

    // Launch request 1
    const req1 = getShopBoardProducts({ signal: controller1.signal })
      .then((data) => {
        if (isCurrent1) results.push(data[0]!.name)
      })
      .catch((err) => {
        if (!isAbortError(err) && isCurrent1) results.push('Error 1')
      })

    // Simulate user clicking retry: abort 1, invalidate 1, start 2
    isCurrent1 = false
    controller1.abort()

    const req2 = getShopBoardProducts({ signal: controller2.signal })
      .then((data) => {
        if (isCurrent2) results.push(data[0]!.name)
      })
      .catch((err) => {
        if (!isAbortError(err) && isCurrent2) results.push('Error 2')
      })

    await Promise.allSettled([req1, req2])

    // Results must contain ONLY the fresh product from request 2
    assert.deepEqual(results, ['New Fresh Product'])
  })

  it('4. Retry starts a fresh request while canceling the old one', async () => {
    const signals: AbortSignal[] = []

    globalThis.fetch = async (
      _input: string | URL | Request,
      init?: RequestInit,
    ) => {
      signals.push(init?.signal as AbortSignal)
      return new Response(JSON.stringify(validApiList), { status: 200 })
    }

    // Request 1
    const c1 = new AbortController()
    const p1 = getShopBoardProducts({ signal: c1.signal })

    // Retry triggers cleanup: abort c1, create c2
    c1.abort()
    const c2 = new AbortController()
    const p2 = getShopBoardProducts({ signal: c2.signal })

    await Promise.all([p1, p2])

    assert.equal(signals.length, 2)
    assert.equal(signals[0]?.aborted, true, 'First signal was aborted')
    assert.equal(signals[1]?.aborted, false, 'Second signal remained active')
  })

  it('5. Intentional cancellation is identified by isAbortError and never classified as ApiError', () => {
    const domAbort = new DOMException(
      'The user aborted a request.',
      'AbortError',
    )
    assert.equal(isAbortError(domAbort), true)

    const genericAbort = new Error('Request was aborted')
    assert.equal(isAbortError(genericAbort), true)

    const apiError = new ApiError(500, 'Server Error')
    assert.equal(isAbortError(apiError), false)

    const networkError = new Error('Failed to fetch')
    assert.equal(isAbortError(networkError), false)
  })

  it('6. Normal HTTP 500 error is preserved and properly throws ApiError', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'Database connection failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await getShopBoardProducts({ endpointPath: '/api/products' })
      },
      (err: unknown) => {
        assert(err instanceof ApiError)
        assert.equal(err.status, 500)
        assert.equal(err.message, 'Database connection failed')
        return true
      },
    )
  })

  it('7. Invalid JSON and malformed payloads are safely rejected with ApiError', async () => {
    // Malformed JSON string
    globalThis.fetch = async () =>
      new Response('{invalid_json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await getShopBoardProducts({ endpointPath: '/api/products' })
      },
      (err: unknown) => {
        assert(err instanceof ApiError)
        assert(err.message.includes('Invalid JSON received'))
        return true
      },
    )

    // Missing items array
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ notItems: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await getShopBoardProducts({ endpointPath: '/api/products' })
      },
      (err: unknown) => {
        assert(err instanceof ApiError)
        assert(err.message.includes('Invalid product list payload'))
        return true
      },
    )
  })

  it('8. The raw category rejection regression still passes with signal support', async () => {
    const payloadWithElectronics: ApiProductList = {
      items: [
        {
          id: 99,
          title: 'Smart Speaker',
          category_name: 'Electronics',
          price_cents: 4999,
          in_stock: true,
        },
      ],
      total: 1,
    }

    globalThis.fetch = async () =>
      new Response(JSON.stringify(payloadWithElectronics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

    const controller = new AbortController()

    await assert.rejects(
      async () => {
        await getShopBoardProducts({
          endpointPath: '/api/products',
          signal: controller.signal,
        })
      },
      (err: unknown) => {
        assert(err instanceof UnexpectedCategoryError)
        assert.equal(err.rawCategory, 'Electronics')
        assert.equal(err.productId, '99')
        return true
      },
    )
  })

  it('9. Direct fetchWithSignal transport safely propagates signals and error status', async () => {
    let capturedInit: RequestInit | undefined
    globalThis.fetch = async (_input, init) => {
      capturedInit = init
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    const controller = new AbortController()
    const result = await fetchWithSignal(
      'https://example.com/api',
      (raw) => (raw as { ok: boolean }).ok,
      { signal: controller.signal },
    )

    assert.equal(result, true)
    assert.strictEqual(capturedInit?.signal, controller.signal)
  })
})
