import { useEffect, useRef } from 'react'
import type React from 'react'
import type { CartItem } from '../modules/cart/cart.types.ts'
import CartRow from './CartRow.tsx'

export interface CartPanelProps {
  readonly isOpen: boolean
  readonly items: readonly CartItem[]
  readonly totalItems: number
  readonly totalPrice: number
  readonly onClose: () => void
  readonly onClearCart: () => void
  readonly onIncreaseItem: (productId: string) => void
  readonly onDecreaseItem: (productId: string) => void
  readonly onRemoveItem: (productId: string) => void
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export default function CartPanel({
  isOpen,
  items,
  totalItems,
  totalPrice,
  onClose,
  onClearCart,
  onIncreaseItem,
  onDecreaseItem,
  onRemoveItem,
}: CartPanelProps) {
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
      className="cart-dialog"
      aria-labelledby="cart-panel-title"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="cart-panel-container">
        <header className="cart-panel-header">
          <h2 id="cart-panel-title" className="cart-panel-title">
            Shopping Cart ({totalItems})
          </h2>
          <button
            type="button"
            className="btn-close-cart"
            onClick={onClose}
            aria-label="Close shopping cart"
          >
            ×
          </button>
        </header>

        <div className="cart-panel-body">
          {items.length === 0 ? (
            <div className="cart-empty-container">
              <span className="cart-empty-icon" aria-hidden="true">
                🛍️
              </span>
              <p className="cart-empty-message">
                Your shopping cart is currently empty.
              </p>
            </div>
          ) : (
            <ul className="cart-items-list" aria-label="Shopping cart items">
              {items.map((item) => (
                <li key={item.id} className="cart-item-entry">
                  <CartRow
                    item={item}
                    onIncrease={onIncreaseItem}
                    onDecrease={onDecreaseItem}
                    onRemove={onRemoveItem}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <footer className="cart-panel-footer">
            <div className="cart-summary-row">
              <span className="cart-subtotal-label">
                Subtotal ({totalItems} {itemLabel}):
              </span>
              <span className="cart-subtotal-value">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="cart-footer-actions">
              <button
                type="button"
                className="btn-clear-cart"
                onClick={onClearCart}
                aria-label="Clear all items from shopping cart"
              >
                Clear Cart
              </button>
            </div>
          </footer>
        ) : null}
      </div>
    </dialog>
  )
}
