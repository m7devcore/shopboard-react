import { useEffect, useRef } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import type { HydratedCartItem } from '../cart.types.ts'
import { useOptionalCart } from '../useCart.ts'
import CartRow from './CartRow.tsx'

export interface CartPanelProps {
  readonly isOpen?: boolean
  readonly items?: readonly HydratedCartItem[]
  readonly totalItems?: number
  readonly totalPrice?: number
  readonly onClose?: () => void
  readonly onClearCart?: () => void
  readonly onIncreaseItem?: (productId: string) => void
  readonly onDecreaseItem?: (productId: string) => void
  readonly onRemoveItem?: (productId: string) => void
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export default function CartPanel(props: CartPanelProps = {}) {
  const context = useOptionalCart()

  const isOpen = props.isOpen ?? context?.isCartOpen ?? false
  const items = props.items ?? context?.items ?? []
  const totalItems = props.totalItems ?? context?.totalItems ?? 0
  const totalPrice = props.totalPrice ?? context?.totalPrice ?? 0
  const onClose = props.onClose ?? context?.closeCart ?? (() => {})
  const onClearCart = props.onClearCart ?? context?.clearCart ?? (() => {})
  const onIncreaseItem =
    props.onIncreaseItem ?? context?.increaseItem ?? (() => {})
  const onDecreaseItem =
    props.onDecreaseItem ?? context?.decreaseItem ?? (() => {})
  const onRemoveItem = props.onRemoveItem ?? context?.removeItem ?? (() => {})

  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (typeof dialog.showModal === 'function') {
      if (isOpen) {
        if (!dialog.open) {
          dialog.showModal()
        }
      } else {
        if (dialog.open) {
          dialog.close()
        }
      }
    }

    return () => {
      if (dialog && dialog.open && typeof dialog.close === 'function') {
        dialog.close()
      }
    }
  }, [isOpen])

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog) return
    const rect = dialog.getBoundingClientRect()
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width

    if (!isInDialog) {
      onClose()
    }
  }

  const itemLabel = totalItems === 1 ? 'item' : 'items'

  return (
    <dialog
      ref={dialogRef}
      className="cart-panel-dialog"
      aria-labelledby="cart-panel-title"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="cart-panel-content">
        <header className="cart-panel-header">
          <div className="cart-panel-header-title">
            <h2 id="cart-panel-title">Shopping Cart</h2>
            <span
              className="cart-panel-badge"
              aria-label={`${totalItems} ${itemLabel}`}
            >
              {totalItems} {itemLabel}
            </span>
          </div>
          <button
            type="button"
            className="btn-close-cart"
            onClick={onClose}
            aria-label="Close shopping cart"
          >
            ✕
          </button>
        </header>

        <div className="cart-panel-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <p className="cart-empty-text">Your cart is currently empty.</p>
              <button
                type="button"
                className="btn-continue-shopping"
                onClick={onClose}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div
              className="cart-rows-list"
              role="list"
              aria-label="Cart items list"
            >
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onIncrease={onIncreaseItem}
                  onDecrease={onDecreaseItem}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-panel-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Subtotal</span>
              <span
                className="cart-total-price"
                aria-label={`Subtotal: ${formatPrice(totalPrice)}`}
              >
                {formatPrice(totalPrice)}
              </span>
            </div>

            <div className="cart-panel-actions">
              <button
                type="button"
                className="btn-clear-cart"
                onClick={onClearCart}
                aria-label="Clear all items from cart"
              >
                Clear Cart
              </button>
              <Link
                to="/cart"
                className="btn-view-cart"
                onClick={onClose}
                aria-label="View shopping cart page"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                className="btn-checkout"
                onClick={onClose}
                aria-label="Proceed to checkout"
              >
                Checkout
              </Link>
            </div>
          </footer>
        )}
      </div>
    </dialog>
  )
}
