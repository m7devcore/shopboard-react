/**
 * ShopBoard — Root Layout Component (Day 5 Phase 5)
 *
 * Implements the shared layout using React Router's `<Outlet />`:
 * - Mounts the global `<Header />` with brand title, primary navigation, and live cart count.
 * - Wraps route content in `<ErrorBoundary>` to trap lazy import or render failures
 *   without tearing down the global shell or cart drawer.
 * - Wraps route content in `<Suspense>` with `<RouteLoadingSpinner />` fallback
 *   for on-demand lazy route loading.
 * - Mounts the application cart drawer `<CartPanel />`.
 * - Passes catalog loading state, products, and retry callback via Outlet context.
 */

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import type {
  LoadState,
  Product,
} from '../../features/products/products.types.ts'
import Header from './Header.tsx'
import CartPanel from '../../features/cart/components/CartPanel.tsx'
import RouteLoadingSpinner from './RouteLoadingSpinner.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

export interface RootLayoutOutletContext {
  readonly loadState: LoadState
  readonly products: readonly Product[]
  readonly onRetry: () => void
}

export interface RootLayoutProps {
  readonly loadState: LoadState
  readonly products: readonly Product[]
  readonly onRetry: () => void
}

export default function RootLayout({
  loadState,
  products,
  onRetry,
}: RootLayoutProps) {
  return (
    <div className="shopboard-app">
      <Header title="ShopBoard" />
      <main className="shopboard-content">
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingSpinner />}>
            <Outlet context={{ loadState, products, onRetry }} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <CartPanel />
    </div>
  )
}
