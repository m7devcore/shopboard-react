/// <reference types="node" />
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import type { CartItem } from './cart.types.ts'
import {
  CART_STORAGE_KEY,
  migrateCartItems,
  loadAndMigrateCart,
  saveCartToStorage,
  clearCartStorage,
  type StorageLike,
} from './cart.storage.ts'

/**
 * Creates an isolated in-memory StorageLike implementation for test safety.
 * Strictly guarantees that real browser localStorage is never accessed or mutated.
 */
function createMemoryStorage(
  initialData: Record<string, string> = {},
): StorageLike & {
  data: Map<string, string>
} {
  const data = new Map<string, string>(Object.entries(initialData))
  return {
    data,
    getItem(key: string): string | null {
      return data.has(key) ? data.get(key)! : null
    },
    setItem(key: string, value: string): void {
      data.set(key, String(value))
    },
    removeItem(key: string): void {
      data.delete(key)
    },
  }
}

describe('Cart Storage & Migration (Day 5)', () => {
  describe('migrateCartItems pure migration', () => {
    test('safely migrates Day 4 legacy items to Day 5 schema', () => {
      const legacyItems = [
        { id: '1', name: 'Leather Tote Bag', price: 89, quantity: 2 },
        { id: '2', name: 'Minimalist Watch', price: 149, quantity: 1 },
      ]

      const migrated = migrateCartItems(legacyItems)

      assert.deepEqual(migrated, [
        { id: '1', qty: 2 },
        { id: '2', qty: 1 },
      ])
    })

    test('strips name, price, and extra properties completely', () => {
      const itemsWithExtraneousFields = [
        {
          id: 'item-1',
          name: 'Noise Cancelling Headphones',
          price: 299,
          quantity: 1,
          description: 'A great product',
          inStock: true,
          category: 'Electronics',
          total: 299,
        },
      ]

      const migrated = migrateCartItems(itemsWithExtraneousFields)

      assert.deepEqual(migrated, [{ id: 'item-1', qty: 1 }])
      assert.equal('name' in migrated[0]!, false)
      assert.equal('price' in migrated[0]!, false)
      assert.equal('total' in migrated[0]!, false)
    })

    test('handles already-migrated Day 5 items seamlessly', () => {
      const day5Items: CartItem[] = [
        { id: '1', qty: 3 },
        { id: '2', qty: 1 },
      ]

      const result = migrateCartItems(day5Items)

      assert.deepEqual(result, day5Items)
    })

    test('merges duplicate IDs by summing their quantities', () => {
      const duplicates = [
        { id: 'prod-1', quantity: 2 },
        { id: 'prod-2', quantity: 1 },
        { id: 'prod-1', quantity: 3 }, // Duplicate prod-1
        { id: 'prod-2', qty: 4 }, // Duplicate prod-2 with Day 5 field
      ]

      const result = migrateCartItems(duplicates)

      assert.deepEqual(result, [
        { id: 'prod-1', qty: 5 },
        { id: 'prod-2', qty: 5 },
      ])
    })

    test('is strictly idempotent', () => {
      const messyInput = [
        { id: '1', name: 'Bag', price: 50, quantity: 2 },
        { id: '1', qty: 3 },
        { id: '2', quantity: 1 },
        null,
        'invalid',
      ]

      const firstPass = migrateCartItems(messyInput)
      const secondPass = migrateCartItems(firstPass)
      const thirdPass = migrateCartItems(secondPass)

      assert.deepEqual(firstPass, [
        { id: '1', qty: 5 },
        { id: '2', qty: 1 },
      ])
      assert.deepEqual(firstPass, secondPass)
      assert.deepEqual(secondPass, thirdPass)
    })

    test('handles non-array and empty inputs safely', () => {
      assert.deepEqual(migrateCartItems(null), [])
      assert.deepEqual(migrateCartItems(undefined), [])
      assert.deepEqual(migrateCartItems('not an array'), [])
      assert.deepEqual(migrateCartItems(12345), [])
      assert.deepEqual(migrateCartItems({}), [])
      assert.deepEqual(migrateCartItems([]), [])
    })

    test('filters out malformed entries', () => {
      const malformedList = [
        null,
        undefined,
        123,
        'random-string',
        [],
        {},
        { id: '' }, // empty ID
        { id: '   ' }, // whitespace ID
        { name: 'Missing ID', qty: 2 }, // missing ID
        { id: 'valid-id', qty: 0 }, // 0 quantity
        { id: 'valid-id-2', qty: -4 }, // negative quantity
        { id: 'valid-id-3', qty: NaN }, // NaN quantity
        { id: 'valid-id-4', qty: 'not-a-number' },
      ]

      assert.deepEqual(migrateCartItems(malformedList), [])
    })

    test('floors fractional quantities to positive integers', () => {
      const input = [
        { id: 'item-1', quantity: 2.9 },
        { id: 'item-2', qty: 4.1 },
      ]

      const result = migrateCartItems(input)

      assert.deepEqual(result, [
        { id: 'item-1', qty: 2 },
        { id: 'item-2', qty: 4 },
      ])
    })

    test('converts numeric product IDs to strings', () => {
      const input = [{ id: 42, quantity: 1 }]
      const result = migrateCartItems(input)

      assert.deepEqual(result, [{ id: '42', qty: 1 }])
    })
  })

  describe('loadAndMigrateCart with storage', () => {
    test('returns empty array when storage is missing or undefined', () => {
      const result = loadAndMigrateCart(undefined)
      assert.deepEqual(result, [])
    })

    test('returns empty array when storage key is empty or null', () => {
      const storage = createMemoryStorage()
      assert.deepEqual(loadAndMigrateCart(storage), [])

      storage.setItem(CART_STORAGE_KEY, '')
      assert.deepEqual(loadAndMigrateCart(storage), [])

      storage.setItem(CART_STORAGE_KEY, '   ')
      assert.deepEqual(loadAndMigrateCart(storage), [])
    })

    test('handles invalid JSON gracefully without throwing', () => {
      const storage = createMemoryStorage({
        [CART_STORAGE_KEY]: '{malformed-json-here',
      })

      const result = loadAndMigrateCart(storage)
      assert.deepEqual(result, [])
    })

    test('migrates legacy storage and writes clean Day 5 JSON back to storage', () => {
      const legacyStorageValue = JSON.stringify([
        { id: '1', name: 'Leather Tote Bag', price: 89, quantity: 2 },
        { id: '2', name: 'Minimalist Watch', price: 149, quantity: 1 },
      ])

      const storage = createMemoryStorage({
        [CART_STORAGE_KEY]: legacyStorageValue,
      })

      const result = loadAndMigrateCart(storage)

      assert.deepEqual(result, [
        { id: '1', qty: 2 },
        { id: '2', qty: 1 },
      ])

      // Storage should have been updated with Day 5 schema
      const updatedRaw = storage.getItem(CART_STORAGE_KEY)
      assert.equal(
        updatedRaw,
        JSON.stringify([
          { id: '1', qty: 2 },
          { id: '2', qty: 1 },
        ]),
      )
    })

    test('does not rewrite storage if already cleanly migrated', () => {
      let setItemCallCount = 0
      const cleanData = JSON.stringify([
        { id: '1', qty: 2 },
        { id: '2', qty: 1 },
      ])

      const storage: StorageLike = {
        getItem(key: string) {
          return key === CART_STORAGE_KEY ? cleanData : null
        },
        setItem() {
          setItemCallCount++
        },
        removeItem() {},
      }

      const result = loadAndMigrateCart(storage)

      assert.deepEqual(result, [
        { id: '1', qty: 2 },
        { id: '2', qty: 1 },
      ])
      assert.equal(setItemCallCount, 0)
    })

    test('handles storage read access errors (e.g., SecurityError) safely', () => {
      const errorThrowingStorage: StorageLike = {
        getItem() {
          throw new Error('SecurityError: Access to storage is denied')
        },
        setItem() {},
        removeItem() {},
      }

      assert.doesNotThrow(() => {
        const result = loadAndMigrateCart(errorThrowingStorage)
        assert.deepEqual(result, [])
      })
    })
  })

  describe('saveCartToStorage', () => {
    test('persists strictly { id, qty } to storage', () => {
      const storage = createMemoryStorage()
      const cart: readonly CartItem[] = [
        { id: 'prod-1', qty: 2 },
        { id: 'prod-2', qty: 5 },
      ]

      saveCartToStorage(cart, storage)

      const saved = JSON.parse(storage.getItem(CART_STORAGE_KEY)!)
      assert.deepEqual(saved, [
        { id: 'prod-1', qty: 2 },
        { id: 'prod-2', qty: 5 },
      ])
    })

    test('filters out invalid items before saving', () => {
      const storage = createMemoryStorage()
      const cart: readonly CartItem[] = [
        { id: 'prod-1', qty: 2 },
        { id: '', qty: 3 },
        { id: 'prod-2', qty: 0 },
      ]

      saveCartToStorage(cart, storage)

      const saved = JSON.parse(storage.getItem(CART_STORAGE_KEY)!)
      assert.deepEqual(saved, [{ id: 'prod-1', qty: 2 }])
    })

    test('handles storage write errors (e.g., QuotaExceededError) safely', () => {
      const errorStorage: StorageLike = {
        getItem() {
          return null
        },
        setItem() {
          throw new Error('QuotaExceededError: Storage quota exceeded')
        },
        removeItem() {},
      }

      assert.doesNotThrow(() => {
        saveCartToStorage([{ id: '1', qty: 1 }], errorStorage)
      })
    })

    test('no-ops when storage is undefined', () => {
      assert.doesNotThrow(() => {
        saveCartToStorage([{ id: '1', qty: 1 }], undefined)
      })
    })
  })

  describe('clearCartStorage', () => {
    test('removes cart key from storage', () => {
      const storage = createMemoryStorage({
        [CART_STORAGE_KEY]: JSON.stringify([{ id: '1', qty: 1 }]),
      })

      clearCartStorage(storage)

      assert.equal(storage.getItem(CART_STORAGE_KEY), null)
    })

    test('handles storage delete errors safely', () => {
      const errorStorage: StorageLike = {
        getItem() {
          return null
        },
        setItem() {},
        removeItem() {
          throw new Error('SecurityError')
        },
      }

      assert.doesNotThrow(() => {
        clearCartStorage(errorStorage)
      })
    })
  })
})
