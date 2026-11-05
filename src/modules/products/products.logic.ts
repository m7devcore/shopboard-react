/**
 * ShopBoard — Products Pure Logic Module
 *
 * Pure functions for searching, filtering, sorting, and grouping products.
 * Strict constraint: No DOM, document, window, or localStorage access.
 */

import type { Category, FilterCriteria, Product, SortOrder } from "./products.types.ts";

export type ProductSortable = Pick<Product, "id" | "name" | "category" | "price">;

/**
 * Filters products by name (case-insensitive) and category.
 *
 * @param products - List of product objects.
 * @param criteria - Search and filter criteria.
 * @returns Filtered list of products without mutating the input array.
 */
export function filterProducts<T extends ProductSortable>(
  products: readonly T[],
  { searchTerm = "", category = "all" }: FilterCriteria = {},
): T[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch =
      normalizedSearch === "" || product.name.toLowerCase().includes(normalizedSearch);

    const matchesCategory =
      normalizedCategory === "all" ||
      normalizedCategory === "" ||
      product.category.toLowerCase() === normalizedCategory;

    return matchesSearch && matchesCategory;
  });
}

/**
 * Sorts products by price without mutating the source array.
 *
 * @param products - List of product objects.
 * @param sortOrder - 'asc' / 'price-asc' (low to high), 'desc' / 'price-desc' (high to low), or 'default' / 'none'.
 * @returns Newly sorted shallow copy of products.
 */
export function sortProducts<T extends ProductSortable>(
  products: readonly T[],
  sortOrder: SortOrder | string = "default",
): T[] {
  const sortedCopy: T[] = [...products];

  if (sortOrder === "asc" || sortOrder === "price-asc") {
    return sortedCopy.sort((a, b) => a.price - b.price);
  }

  if (sortOrder === "desc" || sortOrder === "price-desc") {
    return sortedCopy.sort((a, b) => b.price - a.price);
  }

  return sortedCopy;
}

/**
 * Groups products by category, keeping categories in order of first appearance
 * and products in their incoming order. Does not mutate the source array.
 *
 * @param products - List of product objects.
 * @returns Ordered category groups.
 */
export function groupProductsByCategory<T extends ProductSortable>(
  products: readonly T[],
): Array<{ category: Category; items: T[] }> {
  const groups: Array<{ category: Category; items: T[] }> = [];

  for (const product of products) {
    const existingGroup = groups.find((group) => group.category === product.category);
    if (existingGroup) {
      existingGroup.items.push(product);
    } else {
      groups.push({ category: product.category, items: [product] });
    }
  }

  return groups;
}
