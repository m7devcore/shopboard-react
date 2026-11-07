/**
 * ShopBoard — Product Domain Adapter & Boundary Client (Day 5)
 *
 * Provides a typed boundary adapter between the raw external REST API and the
 * active ShopBoard feature architecture.
 *
 * Responsibilities:
 * - Validates the ORIGINAL `category_name` from raw API payloads (`ApiProduct`)
 *   BEFORE the historical `toProduct()` mapper can replace an unknown category.
 * - Prevents lossy silent conversions (such as 'Electronics' defaulting to 'Accessories').
 * - Validates incoming category names against the supported ShopBoard categories:
 *   'Bags' | 'Shoes' | 'Accessories'.
 * - Excludes legacy Studio categories (Templates, Planners, etc.) and AEVUM
 *   categories (Paintings, Sculptures, etc.) from the active storefront domain.
 * - Reuses historical endpoint resolution, HTTP client, JSON parsing, and price mapping.
 */

import { fetchWithSignal } from '../../shared/api/transport.ts'
import {
  parseApiProduct,
  parseApiProductList,
  resolveProductsEndpoint,
  toProduct,
  type ApiProduct,
  type ApiProductList,
  type FetchProductsOptions,
} from '../../modules/products/products.api.ts'
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
 * Validates the raw `ApiProduct.category_name` BEFORE historical mapper can replace it.
 * Reuses `toProduct(api)` for price mapping, descriptions, and category icons.
 * Throws `UnexpectedCategoryError` if the raw category is unsupported.
 */
export function adaptApiProduct(api: ApiProduct): Product {
  const category = toShopBoardCategory(api.category_name)

  if (!category) {
    throw new UnexpectedCategoryError(api.category_name, String(api.id))
  }

  // Reuse historical toProduct for price_cents -> dollars mapping, descriptions, and icons
  const mapped = toProduct(api)

  return {
    id: mapped.id,
    name: mapped.name,
    category,
    price: mapped.price,
    inStock: mapped.inStock,
    description: mapped.description,
    icon: mapped.icon,
  }
}

/**
 * Non-throwing safe adapter that returns `null` if the raw API product category is unexpected.
 */
export function safeAdaptApiProduct(api: ApiProduct): Product | null {
  const category = toShopBoardCategory(api.category_name)

  if (!category) {
    return null
  }

  const mapped = toProduct(api)

  return {
    id: mapped.id,
    name: mapped.name,
    category,
    price: mapped.price,
    inStock: mapped.inStock,
    description: mapped.description,
    icon: mapped.icon,
  }
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

/**
 * Adapts a raw API product list payload, validating all raw categories before mapping.
 */
export function adaptApiProductList(list: ApiProductList): Product[] {
  return list.items.map(adaptApiProduct)
}

export interface FetchShopBoardProductsOptions extends FetchProductsOptions {
  readonly signal?: AbortSignal
}

/**
 * Fetches and validates the product catalog from the REST API for the active ShopBoard storefront.
 * Validates the raw `category_name` on wire before any lossy category fallback can occur.
 * Accepts an optional `AbortSignal` for request cancellation.
 */
export async function getShopBoardProducts(
  options: FetchShopBoardProductsOptions = {},
): Promise<Product[]> {
  const endpoint = resolveProductsEndpoint(options.endpointPath)
  const data = await fetchWithSignal(endpoint, parseApiProductList, {
    signal: options.signal,
  })
  return data.items.map(adaptApiProduct)
}

/**
 * Fetches and validates a single product by ID from the REST API for the active ShopBoard storefront.
 * Accepts an optional `AbortSignal` for request cancellation.
 */
export async function getShopBoardProduct(
  id: number | string,
  options: { readonly signal?: AbortSignal } = {},
): Promise<Product> {
  const raw = await fetchWithSignal(
    `/api/products/${encodeURIComponent(String(id))}`,
    parseApiProduct,
    { signal: options.signal },
  )
  return adaptApiProduct(raw)
}
