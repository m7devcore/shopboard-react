/**
 * ShopBoard — Checkout Page (Day 5 Phase 3)
 *
 * Dedicated checkout page:
 * - Empty-cart guard preventing empty checkout attempts.
 * - Meaningful order summary showing all hydrated cart items, quantities, and totals.
 * - Clear navigation back to the cart or catalog.
 * - Previews the Phase 4 layout (preparing for React Hook Form + Zod + shadcn/ui).
 * - Explicitly does NOT fake or simulate a completed purchase.
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

export default function CheckoutPage() {
  const { items, totalItems, totalPrice } = useCart()

  const itemLabel = totalItems === 1 ? 'item' : 'items'

  if (totalItems === 0) {
    return (
      <div className="checkout-page empty-checkout" role="status">
        <div className="empty-cart-icon" aria-hidden="true">
          🛒
        </div>
        <h1 className="empty-cart-title">Your Cart is Empty</h1>
        <p className="empty-cart-text">
          You must add at least one product to your cart before proceeding to
          checkout.
        </p>
        <div className="empty-cart-actions">
          <Link to="/products" className="btn-primary-cta">
            ← Return to Catalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <span className="checkout-step-badge">
          Phase 3 Checkout Architecture
        </span>
        <h1 className="checkout-title">Review Order & Checkout</h1>
        <p className="checkout-subtitle">
          Please review your items below. The complete interactive form
          validation (React Hook Form + Zod + shadcn/ui) will be enabled in
          Phase 4.
        </p>
      </header>

      <div className="checkout-layout">
        <section
          className="checkout-form-preview"
          aria-label="Customer information preview"
        >
          <div className="form-section-card">
            <h2 className="section-card-title">
              1. Contact & Shipping Details
            </h2>
            <p className="section-card-desc">
              Customer credentials and shipping address form fields (Phase 4
              integration target).
            </p>

            <div className="preview-field-group">
              <label htmlFor="preview-email" className="preview-label">
                Email Address
              </label>
              <input
                id="preview-email"
                type="email"
                className="preview-input"
                placeholder="customer@example.com"
                disabled
              />
            </div>

            <div className="preview-field-grid">
              <div className="preview-field-group">
                <label htmlFor="preview-firstname" className="preview-label">
                  First Name
                </label>
                <input
                  id="preview-firstname"
                  type="text"
                  className="preview-input"
                  placeholder="First name"
                  disabled
                />
              </div>
              <div className="preview-field-group">
                <label htmlFor="preview-lastname" className="preview-label">
                  Last Name
                </label>
                <input
                  id="preview-lastname"
                  type="text"
                  className="preview-input"
                  placeholder="Last name"
                  disabled
                />
              </div>
            </div>

            <div className="preview-field-group">
              <label htmlFor="preview-address" className="preview-label">
                Street Address
              </label>
              <input
                id="preview-address"
                type="text"
                className="preview-input"
                placeholder="123 Studio Boulevard"
                disabled
              />
            </div>
          </div>

          <div className="form-section-card">
            <h2 className="section-card-title">2. Delivery Method</h2>
            <div className="delivery-option-selected">
              <span className="delivery-name">
                Complimentary Standard Delivery (2-4 business days)
              </span>
              <span className="delivery-price">$0.00</span>
            </div>
          </div>

          <div className="phase4-notice-banner" role="note">
            <span className="notice-icon" aria-hidden="true">
              ℹ️
            </span>
            <div className="notice-text">
              <strong>Phase 4 Readiness:</strong> This checkout view establishes
              the route contract, layout seam, and empty-cart guard. Dynamic
              client-side validation using
              <code>react-hook-form</code> and <code>zod</code> will complete
              this form in the next phase.
            </div>
          </div>
        </section>

        <aside
          className="checkout-summary-section"
          aria-label="Order items summary"
        >
          <div className="summary-card">
            <h2 className="summary-card-title">
              Order Summary ({totalItems} {itemLabel})
            </h2>

            <div className="checkout-items-list" role="list">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="checkout-item-row"
                  role="listitem"
                >
                  <div className="item-qty-name">
                    <span className="item-qty-badge">{item.qty}×</span>
                    <span className="item-name">{item.name}</span>
                  </div>
                  <span className="item-row-total">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="summary-divider" />

            <div className="summary-line">
              <span>Items Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="summary-line">
              <span>Estimated Shipping</span>
              <span className="free-tag">Free</span>
            </div>
            <div className="summary-line">
              <span>Estimated Sales Tax</span>
              <span>$0.00</span>
            </div>

            <hr className="summary-divider" />

            <div className="summary-total-line">
              <span className="total-title">Total</span>
              <span className="total-amount">{formatPrice(totalPrice)}</span>
            </div>

            <div className="checkout-actions">
              <Link to="/cart" className="btn-secondary-link btn-back-cart">
                ← Return to Cart
              </Link>
            </div>

            <p className="checkout-disclaimer">
              Demonstration storefront only. No payments or purchases will be
              processed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
