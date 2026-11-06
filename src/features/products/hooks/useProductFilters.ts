/**
 * ShopBoard — Product Search, Filtering & Sorting Hook (Day 5)
 *
 * Encapsulates client-side catalog filtering and sorting state.
 * Leverages the preserved pure functions from products.logic.ts.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  filterProducts,
  groupProductsByCategory,
  sortProducts,
} from '../../../modules/products/products.logic.ts'
import type {
  Category,
  CategoryFilter,
  Product,
  SortOrder,
} from '../../../modules/products/products.types.ts'

export interface UseProductFiltersResult {
  readonly searchTerm: string
  readonly setSearchTerm: (term: string) => void
  readonly selectedCategory: CategoryFilter
  readonly setSelectedCategory: (category: CategoryFilter) => void
  readonly sortOrder: SortOrder
  readonly setSortOrder: (order: SortOrder) => void
  readonly availableCategories: readonly Category[]
  readonly filteredProducts: readonly Product[]
  readonly resultCount: number
  readonly resetFilters: () => void
}

export function useProductFilters(
  products: readonly Product[],
): UseProductFiltersResult {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

  // Derive available categories in order of appearance
  const availableCategories = useMemo<readonly Category[]>(() => {
    return groupProductsByCategory(products).map((group) => group.category)
  }, [products])

  // Derive filtered and sorted catalog
  const filteredProducts = useMemo<readonly Product[]>(() => {
    const filtered = filterProducts(products, {
      searchTerm,
      category: selectedCategory,
    })
    return sortProducts(filtered, sortOrder)
  }, [products, searchTerm, selectedCategory, sortOrder])

  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSortOrder('default')
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,
    availableCategories,
    filteredProducts,
    resultCount: filteredProducts.length,
    resetFilters,
  }
}
