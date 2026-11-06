import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartProvider } from './features/cart/CartProvider.tsx'
import { useCart } from './features/cart/useCart.ts'
import CartPanel from './features/cart/components/CartPanel.tsx'
import Header from './shared/components/Header.tsx'
import Hero from './features/products/components/Hero.tsx'
import ProductList from './features/products/components/ProductList.tsx'
import ProductToolbar from './features/products/components/ProductToolbar.tsx'
import StatusMessage from './shared/components/StatusMessage.tsx'
import { getProducts } from './modules/products/products.api.ts'
import {
  filterProducts,
  groupProductsByCategory,
  sortProducts,
} from './modules/products/products.logic.ts'
import type {
  Category,
  CategoryFilter,
  LoadState,
  Product,
  SortOrder,
} from './modules/products/products.types.ts'

function ShopBoardStorefront({
  loadState,
  onRetry,
}: {
  readonly loadState: LoadState
  readonly onRetry: () => void
}) {
  const { totalItems, isCartOpen, toggleCart, addToCart } = useCart()

  // Filter and sort state owned by storefront
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

  // Derive available categories from loaded products in order of first appearance
  const availableCategories = useMemo<readonly Category[]>(() => {
    if (loadState.status !== 'success') {
      return []
    }
    return groupProductsByCategory(loadState.products).map(
      (group) => group.category,
    )
  }, [loadState])

  // Derive filtered and sorted products via preserved pure logic functions
  const filteredAndSortedProducts = useMemo<Product[]>(() => {
    if (loadState.status !== 'success') {
      return []
    }
    const filtered = filterProducts(loadState.products, {
      searchTerm,
      category: selectedCategory,
    })
    return sortProducts(filtered, sortOrder)
  }, [loadState, searchTerm, selectedCategory, sortOrder])

  return (
    <div className="shopboard-app">
      <Header
        title="ShopBoard"
        totalItems={totalItems}
        isCartOpen={isCartOpen}
        onToggleCart={toggleCart}
      />
      <main className="shopboard-content">
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
              resultCount={filteredAndSortedProducts.length}
            />

            {filteredAndSortedProducts.length === 0 ? (
              <StatusMessage variant="empty-filter" />
            ) : (
              <ProductList
                products={filteredAndSortedProducts}
                onAddToCart={addToCart}
              />
            )}
          </>
        )}
      </main>

      <CartPanel />
    </div>
  )
}

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [retryCounter, setRetryCounter] = useState(0)

  const handleRetry = useCallback(() => {
    setLoadState({ status: 'loading' })
    setRetryCounter((c) => c + 1)
  }, [])

  useEffect(() => {
    let isCurrent = true

    getProducts()
      .then((products) => {
        if (isCurrent) {
          setLoadState({ status: 'success', products })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to fetch catalog from server'
          setLoadState({ status: 'error', message })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [retryCounter])

  const products = loadState.status === 'success' ? loadState.products : []

  return (
    <CartProvider products={products}>
      <ShopBoardStorefront loadState={loadState} onRetry={handleRetry} />
    </CartProvider>
  )
}
