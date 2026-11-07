import type React from 'react'
import type { Category, CategoryFilter, SortOrder } from '../products.types.ts'

export interface ProductToolbarProps {
  readonly searchTerm: string
  readonly onSearchChange: (searchTerm: string) => void
  readonly selectedCategory: CategoryFilter
  readonly onCategoryChange: (category: CategoryFilter) => void
  readonly sortOrder: SortOrder
  readonly onSortChange: (sortOrder: SortOrder) => void
  readonly availableCategories: readonly Category[]
  readonly resultCount: number
}

function isSortOrder(value: string): value is SortOrder {
  return (
    value === 'default' ||
    value === 'asc' ||
    value === 'desc' ||
    value === 'none' ||
    value === 'price-asc' ||
    value === 'price-desc'
  )
}

export default function ProductToolbar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortOrder,
  onSortChange,
  availableCategories,
  resultCount,
}: ProductToolbarProps) {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (isSortOrder(value)) {
      onSortChange(value)
    }
  }

  const isAllSelected = selectedCategory.toLowerCase() === 'all'

  return (
    <section className="product-toolbar" aria-label="Catalog filters and sort">
      <div className="toolbar-top-row">
        <div className="toolbar-search-group">
          <label htmlFor="product-search-input" className="toolbar-label">
            Search Products
          </label>
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              id="product-search-input"
              type="search"
              className="toolbar-input"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm ? (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        <div className="toolbar-sort-group">
          <label htmlFor="product-sort-select" className="toolbar-label">
            Sort by Price
          </label>
          <select
            id="product-sort-select"
            className="toolbar-select"
            value={sortOrder}
            onChange={handleSortChange}
          >
            <option value="default">Default</option>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="toolbar-bottom-row">
        <div className="toolbar-category-group">
          <span id="category-filter-label" className="toolbar-label">
            Categories
          </span>
          <div
            className="category-filter-list"
            role="group"
            aria-labelledby="category-filter-label"
          >
            <button
              type="button"
              className={`category-pill ${isAllSelected ? 'active' : ''}`}
              aria-pressed={isAllSelected}
              onClick={() => onCategoryChange('all')}
            >
              All
            </button>
            {availableCategories.map((cat) => {
              const isSelected =
                selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${isSelected ? 'active' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onCategoryChange(cat)}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div className="toolbar-count-group" aria-live="polite">
          <span className="toolbar-result-count">
            {resultCount} {resultCount === 1 ? 'product' : 'products'} found
          </span>
        </div>
      </div>
    </section>
  )
}
