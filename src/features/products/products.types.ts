/**
 * ShopBoard — Feature-Based Product Domain Types (Day 5)
 *
 * Strict domain types for ShopBoard products.
 * Supported categories are strictly:
 * - Bags
 * - Shoes
 * - Accessories
 *
 * Unrelated legacy Studio categories (Templates, Planners, Productivity, Education, Finance)
 * and AEVUM fine art categories (Paintings, Sculptures, etc.) are excluded from the active
 * storefront feature domain.
 */

export const SHOPBOARD_CATEGORIES = ['Bags', 'Shoes', 'Accessories'] as const

export type ShopBoardCategory = (typeof SHOPBOARD_CATEGORIES)[number]

/**
 * Primary category type for active ShopBoard products.
 */
export type Category = ShopBoardCategory

/**
 * Filter selection: one of the supported categories or "all".
 */
export type CategoryFilter = Category | 'all'

/**
 * Supported catalog sorting options.
 */
export type SortOrder =
  'default' | 'asc' | 'desc' | 'none' | 'price-asc' | 'price-desc'

/**
 * Clean ShopBoard Product domain entity.
 */
export interface Product {
  readonly id: string
  readonly name: string
  readonly category: Category
  readonly price: number
  readonly inStock: boolean
  readonly description: string
  readonly icon?: string
}

/**
 * Grouped product category structure.
 */
export interface CategoryGroup {
  readonly category: Category
  readonly items: readonly Product[]
}

/**
 * Discriminated union for asynchronous catalog loading state.
 */
export type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly products: readonly Product[] }
