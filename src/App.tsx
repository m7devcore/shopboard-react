import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.tsx'
import ProductList from './components/ProductList.tsx'
import ProductToolbar from './components/ProductToolbar.tsx'
import StatusMessage from './components/StatusMessage.tsx'
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
import { addToCart, initializeCartState } from './modules/cart/cart.state.ts'
import { calculateTotalItems } from './modules/cart/cart.logic.ts'
import type { AddableProduct, Cart } from './modules/cart/cart.types.ts'

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [cart, setCart] = useState<Cart>(() => initializeCartState())
  const [retryCounter, setRetryCounter] = useState(0)

  // Filter and sort state owned by App
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

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

  const handleAddToCart = (product: AddableProduct) => {
    if (product.inStock === false) {
      return
    }
    const updatedCart = addToCart(product)
    setCart(updatedCart)
  }

  const totalCartItems = useMemo(() => calculateTotalItems(cart), [cart])

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
      <Header title="ShopBoard" totalItems={totalCartItems} />
      <main className="shopboard-content">
        {loadState.status === 'loading' && <StatusMessage variant="loading" />}

        {loadState.status === 'error' && (
          <StatusMessage
            variant="error"
            message={loadState.message}
            onRetry={handleRetry}
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
                onAddToCart={handleAddToCart}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
