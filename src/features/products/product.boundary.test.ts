import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type {
  ApiProduct,
  ApiProductList,
} from '../../modules/products/products.api.ts'
import { toProduct } from '../../modules/products/products.api.ts'
import { ApiError } from '../../shared/api/client.ts'
import {
  adaptApiProduct,
  adaptApiProductList,
  getShopBoardProducts,
  safeAdaptApiProduct,
  UnexpectedCategoryError,
} from './product.adapter.ts'

describe('ShopBoard Raw API Category Boundary & Fetch Pipeline (Day 5)', () => {
  const sampleBags: ApiProduct = {
    id: 1,
    title: 'Leather Tote Bag',
    category_name: 'Bags',
    price_cents: 8900,
    in_stock: true,
  }

  const sampleShoes: ApiProduct = {
    id: 4,
    title: 'Court Sneakers',
    category_name: 'Shoes',
    price_cents: 11000,
    in_stock: true,
  }

  const sampleAccessories: ApiProduct = {
    id: 8,
    title: 'Minimalist Timepiece',
    category_name: 'Accessories',
    price_cents: 15000,
    in_stock: false,
  }

  const sampleElectronics: ApiProduct = {
    id: 99,
    title: 'Noise-Cancelling Headphones',
    category_name: 'Electronics',
    price_cents: 19999,
    in_stock: true,
  }

  const samplePlanners: ApiProduct = {
    id: 101,
    title: 'Annual Studio Planner',
    category_name: 'Planners',
    price_cents: 2500,
    in_stock: true,
  }

  const samplePaintings: ApiProduct = {
    id: 202,
    title: 'Gilded Baroque Oil Canvas',
    category_name: 'Paintings',
    price_cents: 8500000,
    in_stock: true,
  }

  describe('1. Direct ApiProduct validation (adaptApiProduct)', () => {
    it('accepts official categories: Bags, Shoes, and Accessories with converted prices in dollars', () => {
      const bag = adaptApiProduct(sampleBags)
      assert.equal(bag.id, '1')
      assert.equal(bag.name, 'Leather Tote Bag')
      assert.equal(bag.category, 'Bags')
      assert.equal(bag.price, 89.0)
      assert.equal(bag.inStock, true)

      const shoe = adaptApiProduct(sampleShoes)
      assert.equal(shoe.id, '4')
      assert.equal(shoe.category, 'Shoes')
      assert.equal(shoe.price, 110.0)

      const acc = adaptApiProduct(sampleAccessories)
      assert.equal(acc.id, '8')
      assert.equal(acc.category, 'Accessories')
      assert.equal(acc.price, 150.0)
      assert.equal(acc.inStock, false)
    })

    it('accepts case-insensitive category strings and normalizes to canonical casing', () => {
      const lower = adaptApiProduct({ ...sampleBags, category_name: 'bags' })
      assert.equal(lower.category, 'Bags')

      const upper = adaptApiProduct({ ...sampleShoes, category_name: 'SHOES' })
      assert.equal(upper.category, 'Shoes')

      const padded = adaptApiProduct({
        ...sampleAccessories,
        category_name: '  accessories  ',
      })
      assert.equal(padded.category, 'Accessories')
    })

    it('explicitly rejects Electronics BEFORE lossy conversion and NEVER defaults to Accessories', () => {
      // PROVE THE FLAW IN THE OLD MAPPER FIRST:
      const historicalFlawed = toProduct(sampleElectronics)
      assert.equal(
        historicalFlawed.category,
        'Accessories',
        'Historical toProduct incorrectly converted Electronics to Accessories!',
      )

      // PROVE THE FIX IN THE ADAPTER:
      assert.throws(
        () => adaptApiProduct(sampleElectronics),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.name, 'UnexpectedCategoryError')
          assert.equal(err.rawCategory, 'Electronics')
          assert.equal(err.productId, '99')
          assert(
            err.message.includes('Unexpected product category: "Electronics"'),
          )
          assert(err.message.includes('Bags, Shoes, Accessories'))
          return true
        },
      )
    })

    it('explicitly rejects legacy Studio categories (Planners, Templates, etc.)', () => {
      assert.throws(
        () => adaptApiProduct(samplePlanners),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Planners')
          assert.equal(err.productId, '101')
          return true
        },
      )
    })

    it('explicitly rejects legacy AEVUM fine art categories (Paintings, Sculptures, etc.)', () => {
      assert.throws(
        () => adaptApiProduct(samplePaintings),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Paintings')
          assert.equal(err.productId, '202')
          return true
        },
      )
    })

    it('safeAdaptApiProduct returns null on unexpected category without throwing', () => {
      assert.equal(safeAdaptApiProduct(sampleElectronics), null)
      assert.equal(safeAdaptApiProduct(samplePlanners), null)
      assert.equal(safeAdaptApiProduct(samplePaintings), null)

      const valid = safeAdaptApiProduct(sampleBags)
      assert.notEqual(valid, null)
      assert.equal(valid?.category, 'Bags')
    })

    it('adaptApiProductList adapts an entire list of valid ApiProducts', () => {
      const list: ApiProductList = {
        items: [sampleBags, sampleShoes, sampleAccessories],
        total: 3,
      }
      const adapted = adaptApiProductList(list)
      assert.equal(adapted.length, 3)
      assert.equal(adapted[0]?.category, 'Bags')
      assert.equal(adapted[1]?.category, 'Shoes')
      assert.equal(adapted[2]?.category, 'Accessories')
    })
  })

  describe('2. Fetch-to-feature boundary pipeline (getShopBoardProducts)', () => {
    const originalFetch = globalThis.fetch

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('successfully fetches, validates and maps a valid API catalog response', async () => {
      const mockPayload: ApiProductList = {
        items: [sampleBags, sampleShoes, sampleAccessories],
        total: 3,
      }

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })

      const products = await getShopBoardProducts({
        endpointPath: '/mock/api/products',
      })
      assert.equal(products.length, 3)
      assert.equal(products[0]?.name, 'Leather Tote Bag')
      assert.equal(products[0]?.price, 89.0)
      assert.equal(products[0]?.category, 'Bags')
      assert.equal(products[1]?.category, 'Shoes')
      assert.equal(products[2]?.category, 'Accessories')
    })

    it('rejects with UnexpectedCategoryError when raw API payload contains Electronics', async () => {
      const mockPayloadWithElectronics: ApiProductList = {
        items: [sampleBags, sampleElectronics],
        total: 2,
      }

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockPayloadWithElectronics), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })

      await assert.rejects(
        async () => {
          await getShopBoardProducts({ endpointPath: '/mock/api/products' })
        },
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Electronics')
          assert.equal(err.productId, '99')
          return true
        },
      )
    })

    it('rejects with UnexpectedCategoryError when raw API payload contains legacy Planners', async () => {
      const mockPayload: ApiProductList = {
        items: [samplePlanners],
        total: 1,
      }

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })

      await assert.rejects(
        async () => {
          await getShopBoardProducts({ endpointPath: '/mock/api/products' })
        },
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Planners')
          assert.equal(err.productId, '101')
          return true
        },
      )
    })

    it('rejects with UnexpectedCategoryError when raw API payload contains legacy Paintings', async () => {
      const mockPayload: ApiProductList = {
        items: [samplePaintings],
        total: 1,
      }

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })

      await assert.rejects(
        async () => {
          await getShopBoardProducts({ endpointPath: '/mock/api/products' })
        },
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Paintings')
          assert.equal(err.productId, '202')
          return true
        },
      )
    })

    it('rejects with ApiError on malformed API responses (e.g. non-record or missing fields)', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ notAnArray: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })

      await assert.rejects(
        async () => {
          await getShopBoardProducts({ endpointPath: '/mock/api/products' })
        },
        (err: unknown) => {
          assert(err instanceof ApiError)
          assert.equal(err.status, 500)
          assert.equal(
            err.message,
            'Invalid product list payload received from API',
          )
          return true
        },
      )
    })

    it('rejects with ApiError on malformed product items in list', async () => {
      const malformedList = {
        items: [{ id: 1, title: 'Broken Product' }], // missing category_name, price_cents, in_stock
        total: 1,
      }

      globalThis.fetch = async () =>
        new Response(JSON.stringify(malformedList), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })

      await assert.rejects(
        async () => {
          await getShopBoardProducts({ endpointPath: '/mock/api/products' })
        },
        (err: unknown) => {
          assert(err instanceof ApiError)
          assert.equal(err.status, 500)
          assert.equal(
            err.message,
            'Malformed product item in API product list',
          )
          return true
        },
      )
    })
  })
})
