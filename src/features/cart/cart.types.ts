/**
 * ShopBoard — Feature-Based Cart Types (Day 5)
 *
 * Strict TypeScript types for the Day 5 cart model.
 * In accordance with Day 5 architecture:
 * - Persisted cart items only store `id` and `qty`.
 * - Product names, prices, and totals are NEVER persisted in localStorage.
 */

export interface CartItem {
  readonly id: string
  readonly qty: number
}

export type Cart = readonly CartItem[]

/**
 * Shape of legacy Day 4 stored items or unvalidated input encountered during migration.
 */
export interface LegacyCartItem {
  readonly id?: unknown
  readonly name?: unknown
  readonly price?: unknown
  readonly quantity?: unknown
  readonly qty?: unknown
  readonly [key: string]: unknown
}
