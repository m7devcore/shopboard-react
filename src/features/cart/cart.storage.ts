/**
 * ShopBoard — Feature-Based Cart Storage & Migration Module (Day 5)
 *
 * Handles persistent storage of the shopping cart and safe migration from Day 4.
 *
 * Day 4 schema: { id: string, name: string, price: number, quantity: number }[]
 * Day 5 schema: { id: string, qty: number }[]
 *
 * Strict requirements:
 * 1. ONLY `id` and `qty` are persisted. Product names, prices, and totals are never stored.
 * 2. Migration safely handles empty storage, invalid JSON, malformed entries, duplicate IDs,
 *    and invalid quantities.
 * 3. Migration is strictly idempotent: repeated executions produce identical results without data loss.
 * 4. All localStorage operations are wrapped defensively against access errors (e.g., SecurityError,
 *    QuotaExceededError, SSR/Node environments).
 * 5. Accepts an optional `StorageLike` interface to facilitate test isolation without mutating real storage.
 */

import type { CartItem } from './cart.types.ts'

export const CART_STORAGE_KEY = 'shopboard_cart'

/**
 * Minimal abstraction for storage mechanisms (e.g., window.localStorage or mock storage in tests).
 */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Safely resolves the window.localStorage instance if available.
 * Returns undefined in SSR, headless environments, or when storage access is blocked by security policy.
 */
export function getLocalStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/**
 * Pure migration function: takes raw unvalidated data and produces a sanitized,
 * deduplicated Day 5 CartItem array strictly containing { id: string, qty: number }.
 *
 * Safe handling rules:
 * - If input is not an array, returns [].
 * - Omits any element that is null, non-object, or an array.
 * - Sanitizes `id`: accepts non-empty strings (or finite numbers converted to string).
 * - Extracts quantity from either `qty` or `quantity`: accepts positive finite numbers.
 *   Floats are floored to positive integers.
 * - Drops invalid quantities (<= 0, NaN, non-numeric).
 * - Drops names, prices, subtotals, or any foreign properties.
 * - Deduplicates items sharing the same `id` by summing their quantities.
 * - Idempotent: repeated application on the same data yields an identical array.
 *
 * @param rawItems - Unparsed or parsed raw storage data.
 * @returns Sanitized Day 5 CartItem array.
 */
export function migrateCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) {
    return []
  }

  const mergedQuantities = new Map<string, number>()
  const idOrder: string[] = []

  for (const entry of rawItems) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      continue
    }

    const record = entry as Record<string, unknown>

    // 1. Resolve product ID
    let rawId: unknown = record.id
    if (typeof rawId === 'number' && Number.isFinite(rawId)) {
      rawId = String(rawId)
    }

    if (typeof rawId !== 'string') {
      continue
    }

    const cleanId = rawId.trim()
    if (cleanId.length === 0) {
      continue
    }

    // 2. Resolve quantity (check Day 5 `qty` first, fallback to Day 4 `quantity`)
    const candidateQty = record.qty !== undefined ? record.qty : record.quantity
    const parsedQty = Number(candidateQty)

    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      continue
    }

    const cleanQty = Math.floor(parsedQty)
    if (cleanQty <= 0) {
      continue
    }

    // 3. Merge duplicate IDs by accumulating quantity
    if (mergedQuantities.has(cleanId)) {
      const existing = mergedQuantities.get(cleanId)!
      mergedQuantities.set(cleanId, existing + cleanQty)
    } else {
      mergedQuantities.set(cleanId, cleanQty)
      idOrder.push(cleanId)
    }
  }

  return idOrder.map((id) => ({
    id,
    qty: mergedQuantities.get(id)!,
  }))
}

/**
 * Safely reads and migrates cart items from storage without performing any write side-effects.
 * Ideal for pure React state initializers and render cycles.
 *
 * @param storage - Optional custom storage provider (defaults to browser localStorage).
 * @returns Array of sanitized Day 5 CartItem objects.
 */
export function readCartFromStorage(
  storage: StorageLike | undefined = getLocalStorage(),
): CartItem[] {
  if (!storage) {
    return []
  }

  try {
    const rawData = storage.getItem(CART_STORAGE_KEY)
    if (
      !rawData ||
      typeof rawData !== 'string' ||
      rawData.trim().length === 0
    ) {
      return []
    }

    const parsed: unknown = JSON.parse(rawData)
    return migrateCartItems(parsed)
  } catch {
    return []
  }
}

/**
 * Loads cart from persistent storage, executes migration if necessary, and writes back
 * clean Day 5 data to storage if legacy fields or unmerged duplicates were detected.
 *
 * @param storage - Optional custom storage provider (defaults to browser localStorage).
 * @returns Array of sanitized Day 5 CartItem objects.
 */
export function loadAndMigrateCart(
  storage: StorageLike | undefined = getLocalStorage(),
): CartItem[] {
  if (!storage) {
    return []
  }

  try {
    const rawData = storage.getItem(CART_STORAGE_KEY)
    if (
      !rawData ||
      typeof rawData !== 'string' ||
      rawData.trim().length === 0
    ) {
      return []
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(rawData)
    } catch (parseError) {
      console.warn(
        'ShopBoard: Failed to parse stored cart JSON data, resetting.',
        parseError,
      )
      return []
    }

    const migrated = migrateCartItems(parsed)
    const serializedMigrated = JSON.stringify(migrated)

    // If storage contained legacy items (names/prices/quantity) or malformed entries,
    // update storage with the clean Day 5 serialization.
    if (serializedMigrated !== rawData.trim()) {
      try {
        storage.setItem(CART_STORAGE_KEY, serializedMigrated)
      } catch (writeError) {
        console.warn(
          'ShopBoard: Failed to write migrated cart to storage.',
          writeError,
        )
      }
    }

    return migrated
  } catch (storageError) {
    console.warn(
      'ShopBoard: Access error reading cart from storage.',
      storageError,
    )
    return []
  }
}

/**
 * Persists the current cart to storage.
 * Strictly guarantees that ONLY `id` and `qty` are saved.
 *
 * @param cart - Cart items to serialize and store.
 * @param storage - Optional custom storage provider (defaults to browser localStorage).
 */
export function saveCartToStorage(
  cart: readonly CartItem[],
  storage: StorageLike | undefined = getLocalStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    const sanitized: CartItem[] = cart
      .filter(
        (item) =>
          typeof item?.id === 'string' &&
          item.id.trim().length > 0 &&
          Number(item.qty) > 0,
      )
      .map((item) => ({
        id: item.id.trim(),
        qty: Math.floor(Number(item.qty)),
      }))

    storage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitized))
  } catch (error) {
    console.warn('ShopBoard: Failed to save cart to storage.', error)
  }
}

/**
 * Clears stored cart data from persistent storage.
 *
 * @param storage - Optional custom storage provider (defaults to browser localStorage).
 */
export function clearCartStorage(
  storage: StorageLike | undefined = getLocalStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(CART_STORAGE_KEY)
  } catch (error) {
    console.warn('ShopBoard: Failed to clear cart storage.', error)
  }
}
