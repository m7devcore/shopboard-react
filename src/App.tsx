/**
 * ShopBoard — Application Composition Root (Day 5)
 *
 * App.tsx serves exclusively as the top-level application composition root:
 * - Mounts the application CartProvider as the single source of truth for cart data.
 * - Integrates top-level storefront layout (Header, Storefront, CartPanel).
 * - Delegates API catalog fetching and lifecycle to `useProducts()`.
 * - Delegates search, filtering, and catalog presentation to `Storefront`.
 * - Delegates cart state and persistence to `CartProvider`.
 */

import { CartProvider } from './features/cart/CartProvider.tsx'
import { useProducts } from './features/products/hooks/useProducts.ts'
import Header from './shared/components/Header.tsx'
import Storefront from './features/products/components/Storefront.tsx'
import CartPanel from './features/cart/components/CartPanel.tsx'

export default function App() {
  const { loadState, products, retry } = useProducts()

  return (
    <CartProvider products={products}>
      <div className="shopboard-app">
        <Header title="ShopBoard" />
        <main className="shopboard-content">
          <Storefront loadState={loadState} onRetry={retry} />
        </main>
        <CartPanel />
      </div>
    </CartProvider>
  )
}
