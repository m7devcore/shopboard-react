/**
 * ShopBoard — Product Domain Types
 *
 * Defines strict TypeScript types for internal Product entities, categories,
 * filter/sort controls, and discriminated union async LoadState.
 */

import type { AevumCategory } from "../artworks/artworks.types.ts";

export type { AevumCategory };

export type ApiCategory = "Bags" | "Shoes" | "Accessories";

export type StudioCategory = "Templates" | "Planners" | "Productivity" | "Education" | "Finance";

export type Category = ApiCategory | StudioCategory | AevumCategory;

export type CategoryFilter = Category | "all";

export type SortOrder = "default" | "asc" | "desc" | "none" | "price-asc" | "price-desc";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  inStock: boolean;
  description: string;
  icon?: string;
}

export interface FilterCriteria {
  searchTerm?: string;
  category?: string;
}

export interface CategoryGroup {
  category: Category;
  items: Product[];
}

export type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; products: Product[] };
