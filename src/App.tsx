/**
 * ShopBoard — Application Composition Root & Multi-Page Router (Day 5 Phase 3)
 *
 * Implements route-level lazy loading and shared cart state:
 * - Exactly ONE application-level CartProvider wraps the route hierarchy.
 * - Dynamic product catalog lifecycle is managed via `useProducts()`.
 * - Six distinct route experiences loaded via `React.lazy()`:
 *     1. `/` -> HomePage
 *     2. `/products` -> CatalogPage
 *     3. `/products/:id` -> ProductDetailsPage
 *     4. `/cart` -> CartPage
 *     5. `/checkout` -> CheckoutPage
 *     6. `*` -> NotFoundPage (404)
 * - Shared layout with `<RootLayout />` (Header, Nav, Outlet, CartPanel).
 */

import { lazy, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './features/cart/CartProvider.tsx'
import { useProducts } from './features/products/hooks/useProducts.ts'
import RootLayout from './shared/components/RootLayout.tsx'

const HomePage = lazy(() => import('./pages/HomePage.tsx'))
const CatalogPage = lazy(() => import('./pages/CatalogPage.tsx'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage.tsx'))
const CartPage = lazy(() => import('./pages/CartPage.tsx'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.tsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'))

export interface AppProps {
  readonly RouterComponent?: ComponentType<{ children: ReactNode }>
}

export default function App({ RouterComponent = BrowserRouter }: AppProps) {
  const { loadState, products, retry } = useProducts()

  return (
    <RouterComponent>
      <CartProvider products={products}>
        <Routes>
          <Route
            element={
              <RootLayout
                loadState={loadState}
                products={products}
                onRetry={retry}
              />
            }
          >
            <Route index element={<HomePage />} />
            <Route
              path="products"
              element={<CatalogPage loadState={loadState} onRetry={retry} />}
            />
            <Route path="products/:id" element={<ProductDetailsPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </RouterComponent>
  )
}
