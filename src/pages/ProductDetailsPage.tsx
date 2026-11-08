/**
 * ShopBoard — Product Details Page (Day 5 Phase 3)
 *
 * Fetches and displays dedicated single-product details using `getShopBoardProduct(id)`:
 * - Signal-aware request cancellation on route unmount / param change.
 * - Handles loading, 404/not-found, and API errors with retry.
 * - Integrates with shared CartProvider for adding items with custom quantities.
 * - Enforces stock availability rules.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../shared/api/client.ts'
import { isAbortError } from '../shared/api/transport.ts'
import {
  getShopBoardProduct,
  UnexpectedCategoryError,
} from '../features/products/product.adapter.ts'
import type { Product } from '../features/products/products.types.ts'
import { useCart } from '../features/cart/useCart.ts'
import StatusMessage from '../shared/components/StatusMessage.tsx'

export type DetailState =
  | { status: 'loading' }
  | { status: 'not-found'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; product: Product }

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { addItem } = useCart()

  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [retryCount, setRetryCount] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    if (!id || !id.trim()) {
      return
    }

    const controller = new AbortController()
    let isCurrent = true

    getShopBoardProduct(id, { signal: controller.signal })
      .then((product) => {
        if (isCurrent && !controller.signal.aborted) {
          setState({ status: 'success', product })
        }
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted || !isCurrent) {
          return
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({
            status: 'not-found',
            message: `Product with ID "${id}" was not found in our catalog.`,
          })
          return
        }

        if (error instanceof UnexpectedCategoryError) {
          setState({ status: 'error', message: error.message })
          return
        }

        const msg =
          error instanceof Error ? error.message : 'Failed to fetch product'
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          setState({
            status: 'not-found',
            message: `Product with ID "${id}" was not found in our catalog.`,
          })
        } else {
          setState({ status: 'error', message: msg })
        }
      })

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [id, retryCount])

  const handleAddToCart = () => {
    if (state.status !== 'success' || !state.product.inStock) {
      return
    }
    addItem(state.product.id, quantity)
    setFeedback(`Added ${quantity} ${state.product.name} to cart!`)
    setTimeout(() => {
      setFeedback(null)
    }, 3000)
  }

  const handleDecreaseQty = () => {
    setQuantity((q) => Math.max(1, q - 1))
  }

  const handleIncreaseQty = () => {
    setQuantity((q) => Math.min(99, q + 1))
  }

  if (!id || !id.trim()) {
    return (
      <div className="product-details-page">
        <div className="product-not-found" role="alert">
          <div className="not-found-icon" aria-hidden="true">
            🔍
          </div>
          <h1 className="not-found-title">Product Not Found</h1>
          <p className="not-found-message">
            No product ID was provided in the route.
          </p>
          <div className="not-found-actions">
            <Link to="/products" className="btn-primary-cta">
              ← Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-details-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb navigation">
        <Link to="/" className="breadcrumb-link">
          Home
        </Link>
        <span className="breadcrumb-separator" aria-hidden="true">
          /
        </span>
        <Link to="/products" className="breadcrumb-link">
          Catalog
        </Link>
        {state.status === 'success' && (
          <>
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>
            <span className="breadcrumb-current" aria-current="page">
              {state.product.name}
            </span>
          </>
        )}
      </nav>

      {state.status === 'loading' && <StatusMessage variant="loading" />}

      {state.status === 'error' && (
        <StatusMessage
          variant="error"
          message={state.message}
          onRetry={retry}
        />
      )}

      {state.status === 'not-found' && (
        <div className="product-not-found" role="alert">
          <div className="not-found-icon" aria-hidden="true">
            🔍
          </div>
          <h1 className="not-found-title">Product Not Found</h1>
          <p className="not-found-message">{state.message}</p>
          <div className="not-found-actions">
            <Link to="/products" className="btn-primary-cta">
              ← Return to Catalog
            </Link>
          </div>
        </div>
      )}

      {state.status === 'success' && (
        <article className="product-details-card">
          <div className="product-details-layout">
            <div className="product-details-visual" aria-hidden="true">
              <span className="product-large-icon">
                {state.product.icon || '🛍️'}
              </span>
              <span className="product-badge-overlay">
                {state.product.category}
              </span>
            </div>

            <div className="product-details-info">
              <div className="details-header">
                <span className="details-category">
                  {state.product.category}
                </span>
                <span
                  className={`stock-badge ${state.product.inStock ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                >
                  {state.product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <h1 className="details-title">{state.product.name}</h1>

              <div className="details-price-row">
                <span className="details-price">
                  {formatPrice(state.product.price)}
                </span>
                <span className="details-currency-note">
                  USD (Taxes calculated at checkout)
                </span>
              </div>

              {state.product.description && (
                <div className="details-description">
                  <h2>Description</h2>
                  <p>{state.product.description}</p>
                </div>
              )}

              <div className="details-actions-container">
                <div
                  className="details-quantity-selector"
                  role="group"
                  aria-label="Quantity selector"
                >
                  <span className="qty-label">Quantity:</span>
                  <div className="qty-controls">
                    <button
                      type="button"
                      className="btn-qty"
                      onClick={handleDecreaseQty}
                      disabled={quantity <= 1 || !state.product.inStock}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-display" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="btn-qty"
                      onClick={handleIncreaseQty}
                      disabled={quantity >= 99 || !state.product.inStock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-add-to-cart btn-details-add"
                  onClick={handleAddToCart}
                  disabled={!state.product.inStock}
                >
                  {state.product.inStock
                    ? `Add to Cart • ${formatPrice(state.product.price * quantity)}`
                    : 'Sold Out'}
                </button>

                {feedback && (
                  <div
                    className="add-feedback-toast"
                    role="status"
                    aria-live="polite"
                  >
                    ✓ {feedback}
                  </div>
                )}
              </div>

              <div className="details-footer-nav">
                <Link to="/products" className="btn-back-link">
                  ← Back to Catalog
                </Link>
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  )
}
