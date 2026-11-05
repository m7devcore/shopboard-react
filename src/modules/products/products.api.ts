/**
 * ShopBoard — Products API & Mapper Module
 *
 * Isolates external REST API wire formats (`ApiProduct`, `ApiProductList`) from
 * internal application types (`Product`). Performs strict runtime schema
 * validation and maps `price_cents` to dollars exclusively in `toProduct()`.
 */

import { ApiError, fetchJson, isRecord } from "../../shared/api/client.ts";
import type { Category, Product } from "./products.types.ts";

/**
 * Wire format for a single product returned by `https://shopboard-api.vercel.app/api/products`.
 */
export interface ApiProduct {
  id: number;
  title: string;
  category_name: string;
  price_cents: number;
  in_stock: boolean;
}

/**
 * Wire format for the product list endpoint response.
 */
export interface ApiProductList {
  items: ApiProduct[];
  total: number;
}

const VALID_CATEGORIES: readonly Category[] = [
  "Bags",
  "Shoes",
  "Accessories",
  "Templates",
  "Planners",
  "Productivity",
  "Education",
  "Finance",
];

/**
 * Type guard verifying if a string matches a known internal Category.
 */
export function isCategory(value: string): value is Category {
  return VALID_CATEGORIES.some((cat) => cat.toLowerCase() === value.trim().toLowerCase());
}

/**
 * Normalizes an API category string into a valid internal `Category`.
 */
export function toCategory(rawCategory: string): Category {
  const trimmed = rawCategory.trim();
  const match = VALID_CATEGORIES.find((cat) => cat.toLowerCase() === trimmed.toLowerCase());
  return match ?? "Accessories";
}

/**
 * Runtime type guard for `ApiProduct`.
 */
export function isApiProduct(value: unknown): value is ApiProduct {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.category_name === "string" &&
    value.category_name.trim().length > 0 &&
    typeof value.price_cents === "number" &&
    Number.isFinite(value.price_cents) &&
    value.price_cents >= 0 &&
    typeof value.in_stock === "boolean"
  );
}

/**
 * Runtime validator for a single `ApiProduct` payload.
 */
export function parseApiProduct(raw: unknown): ApiProduct {
  if (!isApiProduct(raw)) {
    throw new ApiError(500, "Invalid product payload received from API");
  }
  return raw;
}

/**
 * Runtime validator for `ApiProductList` (`{ items: ApiProduct[], total: number }`).
 */
export function parseApiProductList(raw: unknown): ApiProductList {
  if (!isRecord(raw) || !Array.isArray(raw.items) || typeof raw.total !== "number") {
    throw new ApiError(500, "Invalid product list payload received from API");
  }

  const validatedItems: ApiProduct[] = [];
  for (const entry of raw.items) {
    if (!isApiProduct(entry)) {
      throw new ApiError(500, "Malformed product item in API product list");
    }
    validatedItems.push(entry);
  }

  return {
    items: validatedItems,
    total: raw.total,
  };
}

const CATEGORY_ICONS: Readonly<Record<Category, string>> = {
  Bags: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
  Shoes: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18h18v-2l-4-2-3-5-3 2-5 1-3 3v3z"></path><line x1="3" y1="21" x2="21" y2="21"></line></svg>`,
  Accessories: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 15"></polyline></svg>`,
  Templates: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
  Planners: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  Productivity: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  Education: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  Finance: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  Paintings: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  Sculptures: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"></circle><path d="M6 21v-2a6 6 0 0 1 12 0v2"></path></svg>`,
  "Decorative Antiques": `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  "Ceramics & Glass": `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2h8l-1 6H9L8 2z"></path><path d="M9 8c-3 2-4 5-4 8a7 7 0 0 0 14 0c0-3-1-6-4-8"></path><line x1="12" y1="16" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>`,
  "Prints & Editions": `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
  Curiosities: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
};

const API_PRODUCT_DESCRIPTIONS: Readonly<Record<number, string>> = {
  1: "Structured full-grain carry tote with reinforced architectural seams and dedicated 16-inch studio compartment.",
  2: "Heavyweight waxed canvas everyday backpack engineered with modular interior pockets and weatherproof hardware.",
  3: "Compact minimalist crossbody sling with magnetic quick-release buckle and concealed travel passport sleeve.",
  4: "Clean low-profile court sneakers crafted with matte calfskin uppers and vulcanized rubber soles.",
  5: "Lightweight responsive distance runners featuring breathable engineered mesh and dual-density cushioning.",
  6: "Hand-stitched Italian suede penny loafers with flexible leather welt construction for studio and travel.",
  7: "Ultra-soft merino wool studio scarf woven in a classic herringbone twill pattern for cold-weather layering.",
  8: "Brushed stainless steel minimalist timepiece with sapphire crystal glass and Japanese quartz movement.",
  9: "Acetate architectural frames fitted with polarized UV400 lenses and five-barrel stainless hinges.",
  10: "Weekender cabin duffel bag with water-resistant ballistic nylon shell and ventilated shoe compartment.",
  11: "Matte natural rubber chelsea rain boots with gusseted elastic side panels and high-traction lug outsoles.",
  12: "Vegetable-tanned full-grain leather belt finished with a solid brushed nickel roller buckle.",
};

/**
 * Maps an external `ApiProduct` wire object to the internal `Product` domain model.
 * `price_cents` is converted to dollars exclusively inside this mapper.
 */
export function toProduct(api: ApiProduct): Product {
  const category = toCategory(api.category_name);
  const priceDollars = Math.round(api.price_cents) / 100;
  const baseDescription =
    API_PRODUCT_DESCRIPTIONS[api.id] ??
    `Precision-crafted ${api.title.toLowerCase()} from the ShopBoard ${category} collection.`;

  return {
    id: String(api.id),
    name: api.title,
    category,
    price: priceDollars,
    inStock: api.in_stock,
    description: baseDescription,
    icon: CATEGORY_ICONS[category],
  };
}

export interface FetchProductsOptions {
  endpointPath?: string;
}

let failOnceConsumed = false;

/**
 * Resolves the API endpoint path, supporting optional simulation query parameters
 * (`?api_mode=fail`, `?api_mode=fail_once`, `?api_mode=empty`, `?api_mode=delay`)
 * when running in a browser.
 */
export function resolveProductsEndpoint(customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  if (typeof window !== "undefined" && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("api_mode");
    if (mode === "fail") {
      return "/fail/500/api/products";
    }
    if (mode === "fail_once" && !failOnceConsumed) {
      failOnceConsumed = true;
      return "/fail/500/api/products";
    }
    if (mode === "empty") {
      return "/empty/api/products";
    }
    if (mode === "delay") {
      return "/delay/1500/api/products";
    }
  }

  return "/api/products";
}

/**
 * Fetches and maps the full product catalog from the REST API.
 */
export async function getProducts(options: FetchProductsOptions = {}): Promise<Product[]> {
  const endpoint = resolveProductsEndpoint(options.endpointPath);
  const data = await fetchJson(endpoint, parseApiProductList);
  return data.items.map(toProduct);
}

/**
 * Fetches and maps a single product by ID from the REST API.
 */
export async function getProduct(id: number | string): Promise<Product> {
  const raw = await fetchJson(`/api/products/${encodeURIComponent(String(id))}`, parseApiProduct);
  return toProduct(raw);
}
