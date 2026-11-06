/**
 * ShopBoard — Storefront Catalog View Component (Day 5)
 *
 * Renders the product catalog presentation layer: Hero, status messages,
 * product toolbar, and product cards grid.
 */

import type { LoadState } from '../../../modules/products/products.types.ts'
import { useCart } from '../../cart/useCart.ts'
import { useProductFilters } from '../hooks/useProductFilters.ts'
import Hero from './Hero.tsx'
import ProductToolbar from './ProductToolbar.tsx'
import ProductList from './ProductList.tsx'
import StatusMessage from '../../../shared/components/StatusMessage.tsx'

export interface StorefrontProps {
  readonly loadState: LoadState
  readonly onRetry: () => void
}

export default function Storefront({ loadState, onRetry }: StorefrontProps) {
  const { addToCart } = useCart()

  const products = loadState.status === 'success' ? loadState.products : []
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,
    availableCategories,
    filteredProducts,
    resultCount,
  } = useProductFilters(products)

  return (
    <>
      <Hero
        eyebrow="Curated Essentials"
        headline="Everyday Carry & Studio Goods"
        subtitle="Thoughtfully engineered bags, footwear, and accessories built for daily utility."
      />

      {loadState.status === 'loading' && <StatusMessage variant="loading" />}

      {loadState.status === 'error' && (
        <StatusMessage
          variant="error"
          message={loadState.message}
          onRetry={onRetry}
        />
      )}

      {loadState.status === 'success' && loadState.products.length === 0 && (
        <StatusMessage variant="empty-catalog" />
      )}

      {loadState.status === 'success' && loadState.products.length > 0 && (
        <>
          <ProductToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            availableCategories={availableCategories}
            resultCount={resultCount}
          />

          {filteredProducts.length === 0 ? (
            <StatusMessage variant="empty-filter" />
          ) : (
            <ProductList products={filteredProducts} onAddToCart={addToCart} />
          )}
        </>
      )}
    </>
  )
}
