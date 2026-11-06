/**
 * ShopBoard — Feature-Based Cart Types (Day 5)
 *
 * Strict TypeScript types for the Day 5 cart model.
 * In accordance with Day 5 architecture:
 * - Persisted cart items only store `id` and `qty`.
 * - Product names, prices, and totals are NEVER persisted in localStorage.
 * - Live product metadata is hydrated dynamically from validated API data.
 */

export interface CartItem {
  readonly id: string
  readonly qty: number
}

export type Cart = readonly CartItem[]

/**
 * Hydrated cart item model representing live product data joined with cart quantity.
 * Used exclusively in memory / React rendering; never persisted to localStorage.
 */
export interface HydratedCartItem {
  readonly id: string
  readonly name: string
  readonly price: number
  /**
   * Alias for `qty` for compatibility with UI components.
   */
  readonly quantity: number
  readonly qty: number
  readonly inStock?: boolean
  readonly isAvailable?: boolean
}

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
