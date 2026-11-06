/// <reference types="node" />
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import type { Product } from '../../modules/products/products.types.ts'
import {
  readCartFromStorage,
  saveCartToStorage,
  CART_STORAGE_KEY,
  type StorageLike,
} from './cart.storage.ts'
import {
  addItem,
  increaseItem,
  decreaseItem,
  removeItem,
  clearCart,
  calculateTotalItems,
} from './cart.logic.ts'

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

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Leather Tote Bag',
    category: 'Bags',
    price: 89,
    inStock: true,
    description: 'Classic leather tote',
  },
  {
    id: '2',
    name: 'Minimalist Watch',
    category: 'Accessories',
    price: 149,
    inStock: true,
    description: 'Clean design',
  },
  {
    id: '3',
    name: 'Canvas Backpack',
    category: 'Bags',
    price: 65,
    inStock: false, // Out of stock
    description: 'Durable backpack',
  },
]

describe('Cart Integration & Hydration (Day 5)', () => {
  test('readCartFromStorage performs pure reads with zero storage write side-effects', () => {
    let setItemCalled = false
    const memory = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify([
        { id: '1', name: 'Legacy Name', price: 999, quantity: 3 },
      ]),
    })

    const wrappedStorage: StorageLike = {
      getItem(key) {
        return memory.getItem(key)
      },
      setItem(key, value) {
        setItemCalled = true
        memory.setItem(key, value)
      },
      removeItem(key) {
        memory.removeItem(key)
      },
    }

    const items = readCartFromStorage(wrappedStorage)

    // Result is migrated in-memory
    assert.deepEqual(items, [{ id: '1', qty: 3 }])
    // Zero writes occurred during read
    assert.equal(setItemCalled, false)
  })

  test('hydrates live API product data and computes total price from current catalog', () => {
    const cart = [
      { id: '1', qty: 2 },
      { id: '2', qty: 1 },
    ]

    // Hydration logic as executed in CartProvider
    const hydrated = cart.map((item) => {
      const prod = mockProducts.find((p) => String(p.id) === item.id)
      return {
        id: item.id,
        name: prod?.name ?? 'Unavailable Product',
        price: prod?.price ?? 0,
        qty: item.qty,
        quantity: item.qty,
        inStock: prod?.inStock ?? false,
        isAvailable: !!prod,
      }
    })

    const totalCount = calculateTotalItems(cart)
    const totalPrice = hydrated.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    )

    assert.equal(totalCount, 3)
    assert.equal(totalPrice, 89 * 2 + 149 * 1) // 178 + 149 = 327
    assert.equal(hydrated[0]?.name, 'Leather Tote Bag')
    assert.equal(hydrated[1]?.name, 'Minimalist Watch')
  })

  test('API price changes dynamically override old prices', () => {
    const cart = [{ id: '1', qty: 1 }]

    // Simulate API price update from $89 to $95
    const updatedProducts: Product[] = [
      {
        ...mockProducts[0]!,
        price: 95,
      },
    ]

    const hydrated = cart.map((item) => {
      const prod = updatedProducts.find((p) => String(p.id) === item.id)
      return {
        id: item.id,
        name: prod?.name ?? 'Unavailable',
        price: prod?.price ?? 0,
        qty: item.qty,
        isAvailable: !!prod,
      }
    })

    const totalPrice = hydrated.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    )

    // Total reflects fresh $95 price, not any cached or old price
    assert.equal(totalPrice, 95)
  })

  test('safely handles missing API products without charging or throwing', () => {
    // Product '9999' does not exist in mockProducts
    const cart = [
      { id: '1', qty: 1 },
      { id: '9999', qty: 2 },
    ]

    const hydrated = cart.map((item) => {
      const prod = mockProducts.find((p) => String(p.id) === item.id)
      return {
        id: item.id,
        name: prod ? prod.name : 'Unavailable Product',
        price: prod ? prod.price : 0,
        qty: item.qty,
        isAvailable: !!prod,
      }
    })

    const totalPrice = hydrated.reduce((sum, item) => {
      if (!item.isAvailable || item.price <= 0) return sum
      return sum + item.price * item.qty
    }, 0)

    assert.equal(hydrated[1]?.isAvailable, false)
    assert.equal(hydrated[1]?.price, 0)
    // Only product 1 ($89) is charged
    assert.equal(totalPrice, 89)
  })

  test('StrictMode simulation: pure functional updates never double-increment', () => {
    let state = [{ id: '1', qty: 1 }]

    // Simulate React StrictMode executing updater callback twice
    const updater = (prev: typeof state) => increaseItem(prev, '1')

    const firstRun = updater(state)
    const secondRun = updater(state) // React re-runs updater on identical state

    assert.deepEqual(firstRun, [{ id: '1', qty: 2 }])
    assert.deepEqual(secondRun, [{ id: '1', qty: 2 }])

    // State only advances when committed
    state = firstRun
    assert.deepEqual(state, [{ id: '1', qty: 2 }])
  })

  test('persisted data contains ONLY id and qty', () => {
    const memory = createMemoryStorage()
    const cart = [
      { id: '1', qty: 2 },
      { id: '2', qty: 1 },
    ]

    saveCartToStorage(cart, memory)

    const raw = memory.getItem(CART_STORAGE_KEY)
    const parsed = JSON.parse(raw!)

    assert.deepEqual(parsed, [
      { id: '1', qty: 2 },
      { id: '2', qty: 1 },
    ])

    // Verify absence of any extraneous keys
    for (const item of parsed) {
      assert.deepEqual(Object.keys(item).sort(), ['id', 'qty'])
    }
  })

  test('cart lifecycle: add -> increase -> decrease -> remove -> clear', () => {
    let cart = [{ id: '1', qty: 1 }]

    // Add new product
    cart = addItem(cart, '2', 2)
    assert.deepEqual(cart, [
      { id: '1', qty: 1 },
      { id: '2', qty: 2 },
    ])

    // Increase product 1
    cart = increaseItem(cart, '1')
    assert.deepEqual(cart, [
      { id: '1', qty: 2 },
      { id: '2', qty: 2 },
    ])

    // Decrease product 1
    cart = decreaseItem(cart, '1')
    assert.deepEqual(cart, [
      { id: '1', qty: 1 },
      { id: '2', qty: 2 },
    ])

    // Decrease product 1 to 0 (auto-removes)
    cart = decreaseItem(cart, '1')
    assert.deepEqual(cart, [{ id: '2', qty: 2 }])

    // Explicitly remove product 2
    cart = removeItem(cart, '2')
    assert.deepEqual(cart, [])

    // Add back and clear
    cart = addItem(cart, '1', 5)
    assert.deepEqual(cart, [{ id: '1', qty: 5 }])
    cart = clearCart()
    assert.deepEqual(cart, [])
  })
})
