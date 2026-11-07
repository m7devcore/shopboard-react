import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Product as HistoricalProduct } from '../../modules/products/products.types.ts'
import {
  adaptProduct,
  adaptProducts,
  isShopBoardCategory,
  safeAdaptProduct,
  toShopBoardCategory,
  UnexpectedCategoryError,
} from './product.adapter.ts'

describe('ShopBoard Product Domain Adapter (Day 5)', () => {
  describe('isShopBoardCategory', () => {
    it('returns true for all official ShopBoard categories regardless of case or whitespace', () => {
      assert.equal(isShopBoardCategory('Bags'), true)
      assert.equal(isShopBoardCategory('bags'), true)
      assert.equal(isShopBoardCategory('BAGS'), true)
      assert.equal(isShopBoardCategory('  Shoes  '), true)
      assert.equal(isShopBoardCategory('accessories'), true)
      assert.equal(isShopBoardCategory('Accessories'), true)
    })

    it('returns false for legacy Studio categories', () => {
      assert.equal(isShopBoardCategory('Templates'), false)
      assert.equal(isShopBoardCategory('Planners'), false)
      assert.equal(isShopBoardCategory('Productivity'), false)
      assert.equal(isShopBoardCategory('Education'), false)
      assert.equal(isShopBoardCategory('Finance'), false)
    })

    it('returns false for legacy AEVUM fine art categories', () => {
      assert.equal(isShopBoardCategory('Paintings'), false)
      assert.equal(isShopBoardCategory('Sculptures'), false)
      assert.equal(isShopBoardCategory('Decorative Antiques'), false)
      assert.equal(isShopBoardCategory('Ceramics & Glass'), false)
      assert.equal(isShopBoardCategory('Prints & Editions'), false)
      assert.equal(isShopBoardCategory('Curiosities'), false)
    })

    it('returns false for arbitrary unknown strings or non-string inputs', () => {
      assert.equal(isShopBoardCategory('Electronics'), false)
      assert.equal(isShopBoardCategory(''), false)
      assert.equal(isShopBoardCategory(null), false)
      assert.equal(isShopBoardCategory(undefined), false)
      assert.equal(isShopBoardCategory(42), false)
    })
  })

  describe('toShopBoardCategory', () => {
    it('normalizes valid categories to canonical title-case', () => {
      assert.equal(toShopBoardCategory('bags'), 'Bags')
      assert.equal(toShopBoardCategory('SHOES'), 'Shoes')
      assert.equal(toShopBoardCategory('  accessories  '), 'Accessories')
    })

    it('returns null and NEVER defaults to Accessories for legacy Studio categories', () => {
      assert.equal(toShopBoardCategory('Templates'), null)
      assert.equal(toShopBoardCategory('Planners'), null)
      assert.equal(toShopBoardCategory('Productivity'), null)
      assert.equal(toShopBoardCategory('Education'), null)
      assert.equal(toShopBoardCategory('Finance'), null)
    })

    it('returns null and NEVER defaults to Accessories for legacy AEVUM categories', () => {
      assert.equal(toShopBoardCategory('Paintings'), null)
      assert.equal(toShopBoardCategory('Sculptures'), null)
      assert.equal(toShopBoardCategory('Decorative Antiques'), null)
      assert.equal(toShopBoardCategory('Ceramics & Glass'), null)
      assert.equal(toShopBoardCategory('Prints & Editions'), null)
      assert.equal(toShopBoardCategory('Curiosities'), null)
    })

    it('returns null for arbitrary unknown or non-string inputs', () => {
      assert.equal(toShopBoardCategory('Automotive'), null)
      assert.equal(toShopBoardCategory(''), null)
      assert.equal(toShopBoardCategory(null), null)
      assert.equal(toShopBoardCategory(undefined), null)
    })
  })

  describe('adaptProduct', () => {
    const validSample: HistoricalProduct = {
      id: '1',
      name: 'Leather Tote Bag',
      category: 'Bags',
      price: 89,
      inStock: true,
      description: 'Structured carry tote.',
      icon: '<svg></svg>',
    }

    it('adapts a valid product correctly preserving all domain fields', () => {
      const adapted = adaptProduct(validSample)

      assert.deepEqual(adapted, {
        id: '1',
        name: 'Leather Tote Bag',
        category: 'Bags',
        price: 89,
        inStock: true,
        description: 'Structured carry tote.',
        icon: '<svg></svg>',
      })
    })

    it('normalizes lowercase category to canonical ShopBoard category', () => {
      const sample = { ...validSample, category: 'shoes' as unknown as 'Shoes' }
      const adapted = adaptProduct(sample)
      assert.equal(adapted.category, 'Shoes')
    })

    it('throws UnexpectedCategoryError for legacy Studio categories without silently misclassifying', () => {
      const studioProduct: HistoricalProduct = {
        ...validSample,
        id: '101',
        name: 'Annual Planner 2026',
        category: 'Planners',
      }

      assert.throws(
        () => adaptProduct(studioProduct),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.name, 'UnexpectedCategoryError')
          assert.equal(err.rawCategory, 'Planners')
          assert.equal(err.productId, '101')
          assert(
            err.message.includes('Unexpected product category: "Planners"'),
          )
          assert(err.message.includes('Bags, Shoes, Accessories'))
          return true
        },
      )
    })

    it('throws UnexpectedCategoryError for legacy AEVUM fine art categories', () => {
      const aevumProduct: HistoricalProduct = {
        ...validSample,
        id: '202',
        name: 'Oil Canvas 1890',
        category: 'Paintings',
      }

      assert.throws(
        () => adaptProduct(aevumProduct),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Paintings')
          assert.equal(err.productId, '202')
          return true
        },
      )
    })

    it('throws UnexpectedCategoryError for arbitrary unknown categories', () => {
      const unknownProduct: HistoricalProduct = {
        ...validSample,
        id: '303',
        name: 'Smart Gadget',
        category: 'Electronics' as unknown as 'Accessories',
      }

      assert.throws(
        () => adaptProduct(unknownProduct),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Electronics')
          assert.equal(err.productId, '303')
          return true
        },
      )
    })
  })

  describe('safeAdaptProduct', () => {
    it('returns adapted product when category is valid', () => {
      const sample: HistoricalProduct = {
        id: '2',
        name: 'Canvas Backpack',
        category: 'Bags',
        price: 49,
        inStock: true,
        description: 'Waxed canvas.',
      }
      const adapted = safeAdaptProduct(sample)
      assert.equal(adapted?.name, 'Canvas Backpack')
      assert.equal(adapted?.category, 'Bags')
    })

    it('returns null instead of throwing when category is unexpected', () => {
      const sample: HistoricalProduct = {
        id: '303',
        name: 'Oil Painting',
        category: 'Paintings',
        price: 999,
        inStock: true,
        description: 'Historical.',
      }
      const adapted = safeAdaptProduct(sample)
      assert.equal(adapted, null)
    })
  })

  describe('adaptProducts', () => {
    it('batch adapts an entire catalog of valid products', () => {
      const rawCatalog: HistoricalProduct[] = [
        {
          id: '1',
          name: 'Tote',
          category: 'Bags',
          price: 89,
          inStock: true,
          description: 'd1',
        },
        {
          id: '4',
          name: 'Sneakers',
          category: 'Shoes',
          price: 110,
          inStock: true,
          description: 'd4',
        },
        {
          id: '8',
          name: 'Watch',
          category: 'Accessories',
          price: 150,
          inStock: false,
          description: 'd8',
        },
      ]

      const adapted = adaptProducts(rawCatalog)
      assert.equal(adapted.length, 3)
      assert.equal(adapted[0]?.category, 'Bags')
      assert.equal(adapted[1]?.category, 'Shoes')
      assert.equal(adapted[2]?.category, 'Accessories')
    })

    it('throws if any product in the batch has an unexpected category', () => {
      const rawCatalog: HistoricalProduct[] = [
        {
          id: '1',
          name: 'Tote',
          category: 'Bags',
          price: 89,
          inStock: true,
          description: 'd1',
        },
        {
          id: '99',
          name: 'Template',
          category: 'Templates',
          price: 19,
          inStock: true,
          description: 'd99',
        },
      ]

      assert.throws(
        () => adaptProducts(rawCatalog),
        (err: unknown) => {
          assert(err instanceof UnexpectedCategoryError)
          assert.equal(err.rawCategory, 'Templates')
          return true
        },
      )
    })
  })
})
