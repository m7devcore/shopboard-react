/**
 * ShopBoard — Feature-Based Cart Logic (Day 5)
 *
 * Pure, immutable functions for cart manipulation and calculations.
 * Strict architectural rule: Pure functions only. Zero side effects, zero mutations,
 * zero DOM/browser global access.
 */

import type { Cart, CartItem } from './cart.types.ts'

/**
 * Type guard verifying if an unknown value conforms to the Day 5 `CartItem` schema.
 */
export function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return false
  }

  const record = item as Record<string, unknown>

  return (
    'id' in record &&
    typeof record.id === 'string' &&
    record.id.trim().length > 0 &&
    'qty' in record &&
    typeof record.qty === 'number' &&
    Number.isFinite(record.qty) &&
    record.qty > 0 &&
    Number.isInteger(record.qty)
  )
}

/**
 * Adds an item to the cart immutably.
 * If the item already exists, its quantity is incremented by `qty`.
 * If it does not exist, a new entry is appended.
 *
 * @param cart - Current immutable cart array.
 * @param id - Product identifier to add.
 * @param qty - Quantity to add (defaults to 1).
 * @returns A new cart array with the added item.
 */
export function addItem(cart: Cart, id: string, qty: number = 1): CartItem[] {
  if (typeof id !== 'string') {
    return [...cart]
  }

  const cleanId = id.trim()
  if (cleanId.length === 0) {
    return [...cart]
  }

  const normalizedQty = Math.floor(Number(qty))
  if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
    return [...cart]
  }

  const existingIndex = cart.findIndex((item) => item.id === cleanId)

  if (existingIndex >= 0) {
    return cart.map((item, index) =>
      index === existingIndex
        ? { ...item, qty: item.qty + normalizedQty }
        : item,
    )
  }

  return [...cart, { id: cleanId, qty: normalizedQty }]
}

/**
 * Increases the quantity of an existing cart item by 1 immutably.
 * If the item does not exist, returns a shallow copy of the cart unchanged.
 *
 * @param cart - Current immutable cart array.
 * @param id - Product identifier to increment.
 * @returns A new cart array with the incremented item.
 */
export function increaseItem(cart: Cart, id: string): CartItem[] {
  if (typeof id !== 'string') {
    return [...cart]
  }

  const cleanId = id.trim()
  const existingIndex = cart.findIndex((item) => item.id === cleanId)

  if (existingIndex === -1) {
    return [...cart]
  }

  return cart.map((item, index) =>
    index === existingIndex ? { ...item, qty: item.qty + 1 } : item,
  )
}

/**
 * Decreases the quantity of an existing cart item by 1 immutably.
 * If the quantity drops to 0, the item is removed from the cart.
 * If the item does not exist, returns a shallow copy of the cart unchanged.
 *
 * @param cart - Current immutable cart array.
 * @param id - Product identifier to decrement.
 * @returns A new cart array with the decremented or removed item.
 */
export function decreaseItem(cart: Cart, id: string): CartItem[] {
  if (typeof id !== 'string') {
    return [...cart]
  }

  const cleanId = id.trim()
  const existingIndex = cart.findIndex((item) => item.id === cleanId)

  if (existingIndex === -1) {
    return [...cart]
  }

  const target = cart[existingIndex]
  if (!target) {
    return [...cart]
  }

  if (target.qty > 1) {
    return cart.map((item, index) =>
      index === existingIndex ? { ...item, qty: item.qty - 1 } : item,
    )
  }

  return cart.filter((item) => item.id !== cleanId)
}

/**
 * Removes an item from the cart by its product identifier immutably.
 *
 * @param cart - Current immutable cart array.
 * @param id - Product identifier to remove.
 * @returns A new cart array excluding the target item.
 */
export function removeItem(cart: Cart, id: string): CartItem[] {
  if (typeof id !== 'string') {
    return [...cart]
  }

  const cleanId = id.trim()
  return cart.filter((item) => item.id !== cleanId)
}

/**
 * Clears all items from the cart.
 *
 * @returns An empty cart array.
 */
export function clearCart(): CartItem[] {
  return []
}

/**
 * Calculates the total sum of item quantities across the cart.
 *
 * @param cart - Current immutable cart array.
 * @returns Total number of items in the cart.
 */
export function calculateTotalItems(cart: Cart): number {
  return cart.reduce((total, item) => {
    const q = item.qty
    return (
      total + (typeof q === 'number' && Number.isFinite(q) && q > 0 ? q : 0)
    )
  }, 0)
}

/**
 * Looks up a cart item by product ID.
 *
 * @param cart - Current immutable cart array.
 * @param id - Product identifier to find.
 * @returns Found CartItem or undefined.
 */
export function getItem(cart: Cart, id: string): CartItem | undefined {
  if (typeof id !== 'string') return undefined
  const cleanId = id.trim()
  return cart.find((item) => item.id === cleanId)
}

/**
 * Checks if an item exists in the cart.
 *
 * @param cart - Current immutable cart array.
 * @param id - Product identifier to check.
 * @returns True if item exists in cart.
 */
export function hasItem(cart: Cart, id: string): boolean {
  return getItem(cart, id) !== undefined
}
