import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type {
  ApiProduct,
  ApiProductList,
} from '../../modules/products/products.api.ts'
import { ApiError } from './client.ts'
import {
  CANONICAL_API_ORIGIN,
  getTrustedApiOrigin,
  isAllowedOrigin,
  setTrustedApiOriginForTesting,
} from './origin.ts'
import { fetchWithSignal } from './transport.ts'
import {
  getShopBoardProduct,
  getShopBoardProducts,
  UnexpectedCategoryError,
} from '../../features/products/product.adapter.ts'

describe('D5-030 Security Regression: Trusted API Origin Enforcement', () => {
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window

  afterEach(() => {
    globalThis.fetch = originalFetch
    globalThis.window = originalWindow
    setTrustedApiOriginForTesting(null)
    delete process.env.VITE_API_BASE_URL
  })

  const sampleProducts: ApiProductList = {
    items: [
      {
        id: 1,
        title: 'Leather Tote Bag',
        category_name: 'Bags',
        price_cents: 8900,
        in_stock: true,
      },
    ],
    total: 1,
  }

  const sampleSingleProduct: ApiProduct = {
    id: 1,
    title: 'Leather Tote Bag',
    category_name: 'Bags',
    price_cents: 8900,
    in_stock: true,
  }

  describe('1. Origin Validation Logic', () => {
    it('accepts canonical production https origin', () => {
      assert.equal(isAllowedOrigin('https://shopboard-api.vercel.app'), true)
    })

    it('accepts local loopback http origins for development and testing', () => {
      assert.equal(isAllowedOrigin('http://localhost:5173'), true)
      assert.equal(isAllowedOrigin('http://127.0.0.1:4180'), true)
      assert.equal(isAllowedOrigin('http://[::1]:3000'), true)
    })

    it('strictly rejects non-loopback plain http origins', () => {
      assert.equal(isAllowedOrigin('http://attacker.invalid'), false)
      assert.equal(isAllowedOrigin('http://shopboard-api.vercel.app'), false)
      assert.equal(isAllowedOrigin('http://192.168.1.100:8080'), false)
    })

    it('strictly rejects dangerous non-http protocols', () => {
      assert.equal(isAllowedOrigin('javascript:alert(1)'), false)
      assert.equal(isAllowedOrigin('file:///etc/passwd'), false)
      assert.equal(isAllowedOrigin('data:text/html,<script>'), false)
      assert.equal(isAllowedOrigin('ws://localhost:5173'), false)
    })

    it('strictly rejects URLs with embedded credentials or malformed syntax', () => {
      assert.equal(isAllowedOrigin('https://user:pass@example.com'), false)
      assert.equal(isAllowedOrigin('not-a-valid-url'), false)
      assert.equal(isAllowedOrigin(''), false)
    })
  })

  describe('2. Query-Parameter Immunity (Attacker URL Tests)', () => {
    const maliciousQueries = [
      '?api_base=https://attacker.invalid',
      '?api_base=http://127.0.0.1:9999',
      '?api_base=http%3A%2F%2Fattacker.invalid%2Ffake-api',
      '?api_base=javascript:alert(1)',
      '?api_base=//attacker.invalid',
      '?foo=bar&api_base=https://evil.com&baz=1',
      '?api_base=%00https://attacker.invalid',
    ]

    for (const query of maliciousQueries) {
      it(`catalog fetch ignores ${query} and targets trusted origin`, async () => {
        // Simulate browser environment with malicious query string in location
        const mockWindow = {
          location: {
            search: query,
            href: `http://localhost:5173/${query}`,
            pathname: '/',
          },
        }
        // @ts-expect-error Mocking window for security query test
        globalThis.window = mockWindow

        let requestedUrl = ''
        globalThis.fetch = async (input: string | URL | Request) => {
          requestedUrl = String(input)
          return new Response(JSON.stringify(sampleProducts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const products = await getShopBoardProducts({
          endpointPath: '/api/products',
        })
        assert.equal(products.length, 1)

        // Request MUST use canonical trusted origin, NEVER attacker URL
        assert(
          requestedUrl.startsWith(CANONICAL_API_ORIGIN),
          `Expected request to start with ${CANONICAL_API_ORIGIN}, but got ${requestedUrl}`,
        )
        assert(
          !requestedUrl.includes('attacker.invalid'),
          'Request leaked to attacker domain!',
        )
        assert(
          !requestedUrl.includes('127.0.0.1:9999'),
          'Request leaked to attacker port!',
        )
      })

      it(`product-by-ID fetch ignores ${query} and targets trusted origin`, async () => {
        const mockWindow = {
          location: {
            search: query,
            href: `http://localhost:5173/${query}`,
            pathname: '/',
          },
        }
        // @ts-expect-error Mocking window for security query test
        globalThis.window = mockWindow

        let requestedUrl = ''
        globalThis.fetch = async (input: string | URL | Request) => {
          requestedUrl = String(input)
          return new Response(JSON.stringify(sampleSingleProduct), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const product = await getShopBoardProduct(1)
        assert.equal(product.id, '1')

        assert(
          requestedUrl.startsWith(CANONICAL_API_ORIGIN),
          `Expected request to start with ${CANONICAL_API_ORIGIN}, but got ${requestedUrl}`,
        )
        assert(!requestedUrl.includes('attacker.invalid'))
      })
    }
  })

  describe('3. Build-Time Configuration & Safe Fallback', () => {
    it('valid VITE_API_BASE_URL loopback origin is accepted for development', () => {
      process.env.VITE_API_BASE_URL = 'http://127.0.0.1:4188'
      const origin = getTrustedApiOrigin()
      assert.equal(origin, 'http://127.0.0.1:4188')
    })

    it('valid VITE_API_BASE_URL https origin is accepted for staging/production', () => {
      process.env.VITE_API_BASE_URL = 'https://staging-api.shopboard.internal'
      const origin = getTrustedApiOrigin()
      assert.equal(origin, 'https://staging-api.shopboard.internal')
    })

    it('invalid build-time configuration fails safely to canonical production origin', () => {
      // Plain HTTP to non-loopback host is rejected
      process.env.VITE_API_BASE_URL = 'http://insecure-remote-server.com'
      const origin = getTrustedApiOrigin()
      assert.equal(origin, CANONICAL_API_ORIGIN)

      // Malformed string is rejected
      process.env.VITE_API_BASE_URL = 'not_a_valid_url'
      const fallbackOrigin = getTrustedApiOrigin()
      assert.equal(fallbackOrigin, CANONICAL_API_ORIGIN)
    })

    it('query parameters cannot override valid build-time configuration', async () => {
      process.env.VITE_API_BASE_URL = 'http://127.0.0.1:4188'

      const mockWindow = {
        location: {
          search: '?api_base=https://attacker.invalid',
          href: 'http://localhost:5173/?api_base=https://attacker.invalid',
        },
      }
      // @ts-expect-error Mocking window
      globalThis.window = mockWindow

      let requestedUrl = ''
      globalThis.fetch = async (input: string | URL | Request) => {
        requestedUrl = String(input)
        return new Response(JSON.stringify(sampleProducts), { status: 200 })
      }

      await getShopBoardProducts({ endpointPath: '/api/products' })
      assert(requestedUrl.startsWith('http://127.0.0.1:4188/api/products'))
      assert(!requestedUrl.includes('attacker.invalid'))
    })
  })

  describe('4. Transport Boundary Security & Untrusted URL Blocking', () => {
    it('blocks direct calls with arbitrary untrusted external URLs', async () => {
      await assert.rejects(
        async () => {
          await fetchWithSignal(
            'http://attacker.invalid/api/malicious',
            (raw) => raw,
          )
        },
        (err: unknown) => {
          assert(err instanceof ApiError)
          assert(err.message.includes('Blocked request to untrusted origin'))
          return true
        },
      )
    })

    it('allows direct calls to verified allowed origins', async () => {
      let called = false
      globalThis.fetch = async () => {
        called = true
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }

      const res = await fetchWithSignal(
        'http://127.0.0.1:4188/api/status',
        (raw) => raw,
      )
      assert.deepEqual(res, { ok: true })
      assert.equal(called, true)
    })

    it('category rejection regression continues to work through secure transport', async () => {
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            items: [
              {
                id: 999,
                title: 'Smart Gadget',
                category_name: 'Electronics',
                price_cents: 9999,
                in_stock: true,
              },
            ],
            total: 1,
          }),
          { status: 200 },
        )

      await assert.rejects(
        async () => {
          await getShopBoardProducts({ endpointPath: '/api/products' })
        },
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Electronics')
          return true
        },
      )
    })
  })
})
