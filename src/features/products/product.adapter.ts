/**
 * ShopBoard — Product Domain Adapter (Day 5)
 *
 * Provides a typed boundary adapter between the historical API modules and the
 * active ShopBoard feature architecture.
 *
 * Responsibilities:
 * - Validates incoming category names against the supported ShopBoard categories:
 *   'Bags' | 'Shoes' | 'Accessories'.
 * - Excludes legacy Studio categories (Templates, Planners, etc.) and AEVUM
 *   categories (Paintings, Sculptures, etc.) from active storefront domain.
 * - Explicitly rejects unexpected categories instead of silently misclassifying
 *   them to 'Accessories'.
 * - Maps historical API product objects to the clean `Product` domain model.
 */

import type { Product as HistoricalProduct } from '../../modules/products/products.types.ts'
import {
  SHOPBOARD_CATEGORIES,
  type Category,
  type Product,
  type ShopBoardCategory,
} from './products.types.ts'

/**
 * Error thrown when an API or external payload specifies an unsupported category.
 */
export class UnexpectedCategoryError extends Error {
  readonly rawCategory: string
  readonly productId?: string

  constructor(rawCategory: string, productId?: string) {
    const idNotice = productId ? ` for product id "${productId}"` : ''
    super(
      `Unexpected product category: "${rawCategory}"${idNotice}. Supported categories are: ${SHOPBOARD_CATEGORIES.join(', ')}.`,
    )
    this.name = 'UnexpectedCategoryError'
    this.rawCategory = rawCategory
    this.productId = productId
  }
}

/**
 * Runtime type guard verifying whether a value is a supported ShopBoard category.
 */
export function isShopBoardCategory(
  value: unknown,
): value is ShopBoardCategory {
  if (typeof value !== 'string') {
    return false
  }
  const normalized = value.trim().toLowerCase()
  return SHOPBOARD_CATEGORIES.some((cat) => cat.toLowerCase() === normalized)
}

/**
 * Normalizes a category string to the canonical ShopBoardCategory casing.
 * Returns `null` if the category is unsupported.
 * Never silently defaults to "Accessories".
 */
export function toShopBoardCategory(value: unknown): ShopBoardCategory | null {
  if (typeof value !== 'string') {
    return null
  }
  const normalized = value.trim().toLowerCase()
  const matched = SHOPBOARD_CATEGORIES.find(
    (cat) => cat.toLowerCase() === normalized,
  )
  return matched ?? null
}

/**
 * Adapts an individual historical product into the clean ShopBoard Product domain model.
 * Throws `UnexpectedCategoryError` if the product contains an unsupported category.
 */
export function adaptProduct(raw: HistoricalProduct): Product {
  const category: Category | null = toShopBoardCategory(raw.category)

  if (!category) {
    throw new UnexpectedCategoryError(String(raw.category), String(raw.id))
  }

  return {
    id: String(raw.id),
    name: raw.name,
    category,
    price: raw.price,
    inStock: Boolean(raw.inStock),
    description: raw.description,
    icon: raw.icon,
  }
}

/**
 * Non-throwing safe adapter that returns `null` if the product category is unexpected.
 */
export function safeAdaptProduct(raw: HistoricalProduct): Product | null {
  const category: Category | null = toShopBoardCategory(raw.category)

  if (!category) {
    return null
  }

  return {
    id: String(raw.id),
    name: raw.name,
    category,
    price: raw.price,
    inStock: Boolean(raw.inStock),
    description: raw.description,
    icon: raw.icon,
  }
}

/**
 * Adapts a list of historical API products to clean ShopBoard Product objects.
 * Throws `UnexpectedCategoryError` if any product has an unexpected category.
 */
export function adaptProducts(
  rawList: readonly HistoricalProduct[],
): Product[] {
  return rawList.map(adaptProduct)
}
