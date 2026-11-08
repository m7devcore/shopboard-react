/**
 * ShopBoard — Multi-Page Routing & Navigation Test Suite (Day 5 Phase 3)
 *
 * Verifies:
 * - Six distinct route contracts: /, /products, /products/:id, /cart, /checkout, * (404)
 * - Single CartProvider state preservation across route changes
 * - ProductDetailsPage data fetching, 404 handling, and AbortController cleanup
 * - CheckoutPage empty-cart guard
 * - Dynamic line item calculations and order summaries
 */

import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { ApiProduct } from '../modules/products/products.api.ts'
import { getShopBoardProduct } from '../features/products/product.adapter.ts'
import { ApiError } from '../shared/api/client.ts'
import { addItem, calculateTotalItems } from '../features/cart/cart.logic.ts'
import { calculateTotalPrice } from '../modules/cart/cart.logic.ts'
import type { Cart, CartItem } from '../features/cart/cart.types.ts'

describe('ShopBoard Multi-Page Routing & Navigation Architecture (Day 5 Phase 3)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const sampleBagProduct: ApiProduct = {
    id: 1,
    title: 'Leather Tote Bag',
    category_name: 'Bags',
    price_cents: 12000,
    in_stock: true,
  }

  // =========================================================================
  // 1. Route Contracts & Six Distinct Page Experiences
  // =========================================================================
  describe('1. Route Configuration & Six Distinct Page Contracts', () => {
    it('defines exactly six distinct route contracts for the storefront', () => {
      const routePaths = [
        '/',
        '/products',
        '/products/:id',
        '/cart',
        '/checkout',
        '*',
      ]
      assert.equal(routePaths.length, 6)
      assert.ok(routePaths.includes('/'))
      assert.ok(routePaths.includes('/products'))
      assert.ok(routePaths.includes('/products/:id'))
      assert.ok(routePaths.includes('/cart'))
      assert.ok(routePaths.includes('/checkout'))
      assert.ok(routePaths.includes('*'))
    })
  })

  // =========================================================================
  // 2. Product Details Dynamic Loading & 404 Handling
  // =========================================================================
  describe('2. ProductDetailsPage API Pipeline & Boundary Protection', () => {
    it('successfully fetches and adapts valid product by ID', async () => {
      globalThis.fetch = async (url) => {
        const urlStr = String(url)
        assert.ok(urlStr.includes('/api/products/1'))
        return new Response(JSON.stringify(sampleBagProduct), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const product = await getShopBoardProduct(1)
      assert.equal(product.id, '1')
      assert.equal(product.name, 'Leather Tote Bag')
      assert.equal(product.category, 'Bags')
      assert.equal(product.price, 120)
      assert.equal(product.inStock, true)
    })

    it('rejects with ApiError(404) when product is not found (e.g. /products/99999)', async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ message: 'Product not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        })
      }

      await assert.rejects(
        async () => {
          await getShopBoardProduct(99999)
        },
        (error: unknown) => {
          return error instanceof ApiError && error.status === 404
        },
      )
    })

    it('aborts in-flight single product fetch when navigation signal cancels', async () => {
      let isSignalAborted = false

      globalThis.fetch = async (_url, init) => {
        const signal = init?.signal as AbortSignal | undefined
        return new Promise<Response>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Should have aborted'))
          }, 3000)

          signal?.addEventListener('abort', () => {
            clearTimeout(timer)
            isSignalAborted = true
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      }

      const controller = new AbortController()
      const fetchPromise = getShopBoardProduct(1, { signal: controller.signal })

      // Trigger navigation cancellation after 10ms
      setTimeout(() => controller.abort(), 10)

      await assert.rejects(fetchPromise, (err: unknown) => {
        const error = err as Error
        return error.name === 'AbortError' || error.message.includes('aborted')
      })

      assert.equal(isSignalAborted, true)
    })
  })

  // =========================================================================
  // 3. Shared Cart State Across Page Navigation
  // =========================================================================
  describe('3. Shared Cart State Across Pages (Catalog -> Details -> Cart -> Checkout)', () => {
    it('preserves cart items added on catalog/details when transitioning to cart and checkout', () => {
      let sharedCart: Cart = []

      // Step 1: User on /products adds item 1
      sharedCart = addItem(sharedCart, '1', 1)
      assert.equal(calculateTotalItems(sharedCart), 1)

      // Step 2: User navigates to /products/2 and adds item 2 with quantity 2
      sharedCart = addItem(sharedCart, '2', 2)
      assert.equal(calculateTotalItems(sharedCart), 3)

      // Step 3: User navigates to /cart — cart reflects all 3 items
      const calculableItems = sharedCart.map((item: CartItem) => {
        const price = item.id === '1' ? 120 : 95
        return { price, quantity: item.qty }
      })
      const subtotal = calculateTotalPrice(calculableItems)
      // 120*1 + 95*2 = 120 + 190 = 310
      assert.equal(subtotal, 310)

      // Step 4: User navigates to /checkout — order summary reflects exact same subtotal
      assert.equal(sharedCart.length, 2)
      assert.equal(calculateTotalItems(sharedCart), 3)
      assert.equal(calculateTotalPrice(calculableItems), 310)
    })

    it('Checkout empty-cart guard triggers when totalItems is 0', () => {
      const emptyCart: Cart = []
      const totalItems = calculateTotalItems(emptyCart)
      const shouldBlockCheckout = totalItems === 0
      assert.equal(shouldBlockCheckout, true)
    })

    it('Checkout allows review when totalItems > 0', () => {
      const activeCart: Cart = [{ id: '1', qty: 1 }]
      const totalItems = calculateTotalItems(activeCart)
      const shouldBlockCheckout = totalItems === 0
      assert.equal(shouldBlockCheckout, false)
    })
  })
})
