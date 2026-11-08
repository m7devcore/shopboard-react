/**
 * ShopBoard — Cart Page (Day 5 Phase 3)
 *
 * Full-page shopping cart view:
 * - Shares singleton CartProvider with the header drawer.
 * - Displays all hydrated items, live unit prices, line totals, and order subtotal.
 * - Supports quantity increases/decreases, item removal, and full cart clearing.
 * - Provides direct links to individual product details and the checkout workflow.
 */

import { Link } from 'react-router-dom'
import { useCart } from '../features/cart/useCart.ts'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart()

  const itemLabel = totalItems === 1 ? 'item' : 'items'

  return (
    <div className="cart-page">
      <header className="page-header">
        <h1 className="page-title">Shopping Cart</h1>
        <p className="page-subtitle">
          Review your selected items before proceeding to checkout.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="cart-empty-panel" role="status">
          <div className="empty-cart-icon" aria-hidden="true">
            🛒
          </div>
          <h2 className="empty-cart-title">Your Cart is Currently Empty</h2>
          <p className="empty-cart-text">
            Looks like you haven't added any essentials to your cart yet.
          </p>
          <Link to="/products" className="btn-primary-cta">
            Browse Our Catalog →
          </Link>
        </div>
      ) : (
        <div className="cart-page-layout">
          <section className="cart-items-section" aria-label="Cart items table">
            <div className="cart-items-header">
              <span className="col-product">Product</span>
              <span className="col-price">Price</span>
              <span className="col-qty">Quantity</span>
              <span className="col-total">Total</span>
              <span className="col-action">Action</span>
            </div>

            <div className="cart-items-list" role="list">
              {items.map((item) => {
                const lineTotal = item.price * item.qty
                return (
                  <article
                    key={item.id}
                    className="cart-page-row"
                    role="listitem"
                  >
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">
                        <Link
                          to={`/products/${item.id}`}
                          className="cart-item-link"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      {!item.isAvailable && (
                        <span className="item-unavailable-warning">
                          Currently Unavailable
                        </span>
                      )}
                    </div>

                    <div className="cart-item-price">
                      {item.isAvailable ? formatPrice(item.price) : '—'}
                    </div>

                    <div className="cart-item-quantity">
                      <div
                        className="quantity-controls"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          className="btn-qty btn-decrease"
                          onClick={() => decreaseItem(item.id)}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span
                          className="cart-row-quantity"
                          aria-label={`Quantity: ${item.qty}`}
                        >
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="btn-qty btn-increase"
                          onClick={() => increaseItem(item.id)}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      {formatPrice(lineTotal)}
                    </div>

                    <div className="cart-item-actions">
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="cart-table-footer">
              <button
                type="button"
                className="btn-clear-cart"
                onClick={clearCart}
                aria-label="Clear all items from cart"
              >
                Clear Entire Cart
              </button>
              <Link to="/products" className="btn-secondary-link">
                ← Continue Shopping
              </Link>
            </div>
          </section>

          <aside className="cart-summary-card" aria-label="Order summary">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span>Total Items</span>
              <span className="summary-value">
                {totalItems} {itemLabel}
              </span>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span className="summary-value">{formatPrice(totalPrice)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span className="summary-value summary-free">Free Standard</span>
            </div>

            <div className="summary-row summary-total-row">
              <span className="total-label">Estimated Total</span>
              <span className="total-value">{formatPrice(totalPrice)}</span>
            </div>

            <div className="summary-actions">
              <Link
                to="/checkout"
                className="btn-primary-cta btn-checkout-action"
              >
                Proceed to Checkout →
              </Link>
            </div>

            <p className="summary-security-note">
              🔒 256-bit SSL encrypted checkout preview.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
