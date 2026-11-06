/// <reference types="node" />
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import type { CartItem } from './cart.types.ts'
import {
  addItem,
  increaseItem,
  decreaseItem,
  removeItem,
  clearCart,
  calculateTotalItems,
  getItem,
  hasItem,
  isValidCartItem,
} from './cart.logic.ts'

describe('Cart Pure Logic (Day 5)', () => {
  describe('isValidCartItem', () => {
    test('returns true for valid Day 5 CartItem', () => {
      assert.equal(isValidCartItem({ id: 'prod-1', qty: 2 }), true)
      assert.equal(isValidCartItem({ id: '42', qty: 1 }), true)
    })

    test('returns false for invalid inputs', () => {
      assert.equal(isValidCartItem(null), false)
      assert.equal(isValidCartItem(undefined), false)
      assert.equal(isValidCartItem('string'), false)
      assert.equal(isValidCartItem([]), false)
      assert.equal(isValidCartItem({ id: '', qty: 1 }), false)
      assert.equal(isValidCartItem({ id: '1', qty: 0 }), false)
      assert.equal(isValidCartItem({ id: '1', qty: -1 }), false)
      assert.equal(isValidCartItem({ id: '1', qty: 1.5 }), false)
      assert.equal(isValidCartItem({ id: 123, qty: 1 }), false)
    })
  })

  describe('addItem', () => {
    test('adds new item with default quantity of 1', () => {
      const initial: readonly CartItem[] = Object.freeze([])
      const result = addItem(initial, 'item-1')

      assert.deepEqual(result, [{ id: 'item-1', qty: 1 }])
      assert.notEqual(result, initial)
    })

    test('adds new item with custom quantity', () => {
      const initial: readonly CartItem[] = Object.freeze([])
      const result = addItem(initial, 'item-1', 4)

      assert.deepEqual(result, [{ id: 'item-1', qty: 4 }])
    })

    test('increments quantity when item already exists in cart', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 2 }),
        Object.freeze({ id: 'item-2', qty: 1 }),
      ])
      const result = addItem(initial, 'item-1', 3)

      assert.deepEqual(result, [
        { id: 'item-1', qty: 5 },
        { id: 'item-2', qty: 1 },
      ])
      assert.equal(initial[0]?.qty, 2) // Original unchanged
    })

    test('trims whitespace from product ID', () => {
      const initial: readonly CartItem[] = Object.freeze([])
      const result = addItem(initial, '  item-trim  ', 2)

      assert.deepEqual(result, [{ id: 'item-trim', qty: 2 }])
    })

    test('ignores invalid or empty product ID without mutating cart', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 1 }),
      ])
      assert.deepEqual(addItem(initial, ''), [{ id: 'item-1', qty: 1 }])
      assert.deepEqual(addItem(initial, '   '), [{ id: 'item-1', qty: 1 }])
      // @ts-expect-error Testing runtime invalid input
      assert.deepEqual(addItem(initial, null), [{ id: 'item-1', qty: 1 }])
    })

    test('ignores invalid or non-positive quantity', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 1 }),
      ])
      assert.deepEqual(addItem(initial, 'item-2', 0), [
        { id: 'item-1', qty: 1 },
      ])
      assert.deepEqual(addItem(initial, 'item-2', -5), [
        { id: 'item-1', qty: 1 },
      ])
      assert.deepEqual(addItem(initial, 'item-2', NaN), [
        { id: 'item-1', qty: 1 },
      ])
    })

    test('strictly preserves immutability on input', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'a', qty: 1 }),
      ])
      const result = addItem(initial, 'b', 2)

      assert.equal(initial.length, 1)
      assert.equal(result.length, 2)
      assert.notEqual(result, initial)
    })
  })

  describe('increaseItem', () => {
    test('increments existing item quantity by exactly 1', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 1 }),
        Object.freeze({ id: 'item-2', qty: 3 }),
      ])
      const result = increaseItem(initial, 'item-1')

      assert.deepEqual(result, [
        { id: 'item-1', qty: 2 },
        { id: 'item-2', qty: 3 },
      ])
      assert.equal(initial[0]?.qty, 1) // Pure
    })

    test('returns shallow copy unchanged if product not found', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 1 }),
      ])
      const result = increaseItem(initial, 'non-existent')

      assert.deepEqual(result, [{ id: 'item-1', qty: 1 }])
      assert.notEqual(result, initial)
    })
  })

  describe('decreaseItem', () => {
    test('decrements existing item quantity by 1 when qty > 1', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 3 }),
      ])
      const result = decreaseItem(initial, 'item-1')

      assert.deepEqual(result, [{ id: 'item-1', qty: 2 }])
      assert.equal(initial[0]?.qty, 3)
    })

    test('removes item completely when quantity drops to 1 and is decreased', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 1 }),
        Object.freeze({ id: 'item-2', qty: 2 }),
      ])
      const result = decreaseItem(initial, 'item-1')

      assert.deepEqual(result, [{ id: 'item-2', qty: 2 }])
    })

    test('returns shallow copy unchanged if product not found', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 2 }),
      ])
      const result = decreaseItem(initial, 'missing')

      assert.deepEqual(result, [{ id: 'item-1', qty: 2 }])
    })
  })

  describe('removeItem', () => {
    test('removes target item from cart', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 2 }),
        Object.freeze({ id: 'item-2', qty: 5 }),
      ])
      const result = removeItem(initial, 'item-1')

      assert.deepEqual(result, [{ id: 'item-2', qty: 5 }])
    })

    test('returns unchanged array if item id does not exist', () => {
      const initial: readonly CartItem[] = Object.freeze([
        Object.freeze({ id: 'item-1', qty: 2 }),
      ])
      const result = removeItem(initial, 'unknown')

      assert.deepEqual(result, [{ id: 'item-1', qty: 2 }])
    })
  })

  describe('clearCart', () => {
    test('returns an empty array', () => {
      const result = clearCart()
      assert.deepEqual(result, [])
    })
  })

  describe('calculateTotalItems', () => {
    test('calculates sum of quantities correctly', () => {
      const cart: readonly CartItem[] = [
        { id: '1', qty: 2 },
        { id: '2', qty: 3 },
        { id: '3', qty: 1 },
      ]
      assert.equal(calculateTotalItems(cart), 6)
    })

    test('returns 0 for empty cart', () => {
      assert.equal(calculateTotalItems([]), 0)
    })

    test('ignores non-positive quantities defensively', () => {
      const cart = [
        { id: '1', qty: 3 },
        { id: '2', qty: -2 },
        { id: '3', qty: 0 },
      ]
      assert.equal(calculateTotalItems(cart), 3)
    })
  })

  describe('getItem & hasItem', () => {
    const cart: readonly CartItem[] = [
      { id: 'a', qty: 1 },
      { id: 'b', qty: 4 },
    ]

    test('getItem returns item if present, undefined otherwise', () => {
      assert.deepEqual(getItem(cart, 'b'), { id: 'b', qty: 4 })
      assert.equal(getItem(cart, 'z'), undefined)
    })

    test('hasItem returns true if present, false otherwise', () => {
      assert.equal(hasItem(cart, 'a'), true)
      assert.equal(hasItem(cart, 'unknown'), false)
    })
  })
})
