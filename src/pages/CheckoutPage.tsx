function getConfirmedTimestamp(): string {
  return new Date().toISOString()
}

/**
 * ShopBoard — Validated Demo Checkout Page (Day 5 Phase 4)
 *
 * Implements full interactive checkout form validation using:
 * - React Hook Form: Manages input lifecycle, values, dirty state, submission, and DOM focus.
 * - Zod: Validates field constraints against checkoutSchema and supplies localized error messages.
 * - shadcn/ui: Renders accessible Form, FormField, FormItem, FormLabel, FormControl, FormMessage, Input, and Button.
 *
 * Strict Demo-Only Semantics:
 * - Never claims a real order was submitted, paid for, or transmitted to a payment gateway.
 * - Never invents fake payment IDs or transaction authorization codes.
 * - Blocks checkout when the cart is empty.
 * - Preserves form inputs and cart contents upon validation or simulated failure.
 * - Captures an immutable order snapshot and clears the cart only upon successful demo completion.
 */

import * as React from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  checkoutSchema,
  type CheckoutFormData,
} from '../features/checkout/checkout.schema.ts'
import type { DemoOrderSnapshot } from '../features/checkout/checkout.types.ts'
import { useCart } from '../features/cart/useCart.ts'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../components/ui/form.tsx'
import { Input } from '../components/ui/input.tsx'
import { Button } from '../components/ui/button.tsx'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export interface CheckoutPageProps {
  simulateFailure?: boolean
  onOrderComplete?: (snapshot: DemoOrderSnapshot) => void
}

export default function CheckoutPage({
  simulateFailure = false,
  onOrderComplete,
}: CheckoutPageProps = {}) {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submissionError, setSubmissionError] = React.useState<string | null>(
    null,
  )
  const [completedOrder, setCompletedOrder] =
    React.useState<DemoOrderSnapshot | null>(null)

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const itemLabel = totalItems === 1 ? 'item' : 'items'

  const onSubmit = async (data: CheckoutFormData) => {
    // Empty-cart guard: block submission if cart has zero items
    if (totalItems === 0) {
      setSubmissionError(
        'Cannot complete checkout: your cart is empty. Please add items before checking out.',
      )
      return
    }

    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      // Deterministic simulation delay (~300ms)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Controlled deterministic failure trigger for testing/resilience validation
      if (simulateFailure || data.email === 'fail@simulation.invalid') {
        throw new Error(
          'Simulated payment gateway declined this transaction. Your cart items and form entries remain intact.',
        )
      }

      // Capture immutable order snapshot before clearing the cart
      const snapshot: DemoOrderSnapshot = {
        customer: data,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        totalItems,
        totalPrice,
        confirmedAt: getConfirmedTimestamp(),
        isDemonstration: true,
      }

      // Clear the cart only upon verified demo success
      clearCart()

      // Transition UI to confirmed demonstration order view
      setCompletedOrder(snapshot)
      onOrderComplete?.(snapshot)
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during demo submission.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // 1. Confirmed Demo Order View
  if (completedOrder) {
    return (
      <div className="checkout-page demo-confirmed-page">
        <header className="checkout-header">
          <span className="demo-confirmation-pill">Demonstration Only</span>
          <h1 className="checkout-title">Demo Order Confirmed</h1>
          <p className="checkout-subtitle">
            Thank you, {completedOrder.customer.fullName}. Your demonstration
            order has been recorded locally.
          </p>
        </header>

        <div className="demo-notice-callout" role="note">
          <span className="notice-icon" aria-hidden="true">
            ℹ️
          </span>
          <div className="notice-text">
            <strong>Demonstration Notice:</strong> No real payment was charged,
            no banking authorization occurred, and no physical shipment will be
            dispatched. This simulated workflow proves complete front-end state
            lifecycle, schema validation, and cart management.
          </div>
        </div>

        <div className="checkout-layout">
          <section
            className="demo-order-details"
            aria-label="Demo order confirmation details"
          >
            <div className="form-section-card">
              <h2 className="section-card-title">Delivery Details</h2>
              <dl className="demo-details-list">
                <div className="demo-detail-row">
                  <dt>Customer Name:</dt>
                  <dd>{completedOrder.customer.fullName}</dd>
                </div>
                <div className="demo-detail-row">
                  <dt>Email Address:</dt>
                  <dd>{completedOrder.customer.email}</dd>
                </div>
                <div className="demo-detail-row">
                  <dt>Shipping Address:</dt>
                  <dd>
                    {completedOrder.customer.address},{' '}
                    {completedOrder.customer.city},{' '}
                    {completedOrder.customer.postalCode}
                  </dd>
                </div>
                <div className="demo-detail-row">
                  <dt>Timestamp:</dt>
                  <dd>
                    {new Date(completedOrder.confirmedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="form-section-card">
              <h2 className="section-card-title">Purchased Items</h2>
              <div className="checkout-items-list" role="list">
                {completedOrder.items.map((item) => (
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
            </div>

            <div className="demo-actions-row">
              <Link to="/products" className="btn-primary-cta">
                ← Return to Catalog
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCompletedOrder(null)
                  form.reset()
                }}
                className="btn-secondary-link"
              >
                Place Another Demo Order
              </button>
            </div>
          </section>

          <aside
            className="checkout-summary-section"
            aria-label="Order financial summary"
          >
            <div className="summary-card">
              <h2 className="summary-card-title">Demo Transaction Summary</h2>

              <div className="summary-line">
                <span>Items Subtotal</span>
                <span>{formatPrice(completedOrder.totalPrice)}</span>
              </div>
              <div className="summary-line">
                <span>Standard Shipping</span>
                <span className="free-tag">Free</span>
              </div>
              <div className="summary-line">
                <span>Sales Tax</span>
                <span>$0.00</span>
              </div>

              <hr className="summary-divider" />

              <div className="summary-total-line">
                <span className="total-title">Total Paid</span>
                <span className="total-amount">$0.00 (Demo)</span>
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

  // 2. Empty Cart Guard View
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

  // 3. Interactive Validated Checkout Form
  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <span className="checkout-step-badge">Phase 4 Validated Checkout</span>
        <h1 className="checkout-title">Review Order & Checkout</h1>
        <p className="checkout-subtitle">
          Please provide your shipping details below to complete your
          demonstration order.
        </p>
      </header>

      {submissionError && (
        <div
          className="checkout-error-banner"
          role="alert"
          aria-live="assertive"
        >
          <span className="notice-icon" aria-hidden="true">
            ⚠️
          </span>
          <span className="error-message-text">{submissionError}</span>
        </div>
      )}

      <div className="checkout-layout">
        <section
          className="checkout-form-section"
          aria-label="Shipping and Customer Details"
        >
          <div className="form-section-card">
            <h2 className="section-card-title">1. Shipping Information</h2>
            <p className="section-card-desc">
              All fields are validated via Zod and rendered using accessible
              shadcn/ui form primitives.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="checkout-form space-y-4"
                aria-label="Checkout customer form"
              >
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Doe"
                          autoComplete="name"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />

                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jane.doe@example.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />

                {/* Street Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">
                        Street Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Studio Boulevard"
                          autoComplete="street-address"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />

                {/* City & Postal Code in 2-column grid */}
                <div className="form-fields-grid">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="field-group">
                        <FormLabel className="field-label">City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="San Francisco"
                            autoComplete="address-level2"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="field-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem className="field-group">
                        <FormLabel className="field-label">
                          Postal Code (ZIP)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="94103"
                            autoComplete="postal-code"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="field-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Delivery Option Selection */}
                <div className="delivery-method-box">
                  <h3 className="delivery-title">Delivery Method</h3>
                  <div className="delivery-option-selected">
                    <span className="delivery-name">
                      Complimentary Standard Delivery (2-4 business days)
                    </span>
                    <span className="delivery-price">$0.00</span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="checkout-submit-wrapper">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-submit-order"
                  >
                    {isSubmitting
                      ? 'Processing Demo Order...'
                      : `Complete Demo Order (${formatPrice(totalPrice)})`}
                  </Button>
                </div>
              </form>
            </Form>
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
