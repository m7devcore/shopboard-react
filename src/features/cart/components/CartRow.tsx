import type { HydratedCartItem } from '../cart.types.ts'

export interface CartRowProps {
  readonly item: HydratedCartItem
  readonly onIncrease: (productId: string) => void
  readonly onDecrease: (productId: string) => void
  readonly onRemove: (productId: string) => void
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(amount: number): string {
  return USD_FORMATTER.format(amount)
}

export default function CartRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartRowProps) {
  const quantity = item.quantity ?? item.qty
  const isAvailable = item.isAvailable !== false
  const unitPrice = isAvailable ? item.price : 0
  const lineTotal = unitPrice * quantity

  return (
    <div className="cart-row" data-product-id={item.id}>
      <div className="cart-row-details">
        <h3 className="cart-row-title">
          {item.name}
          {!isAvailable && (
            <span className="cart-row-unavailable"> (Unavailable)</span>
          )}
        </h3>
        <span className="cart-row-unit-price">
          {isAvailable ? `${formatPrice(unitPrice)} each` : 'Unavailable'}
        </span>
      </div>

      <div className="cart-row-actions">
        <div
          className="quantity-controls"
          role="group"
          aria-label={`Quantity controls for ${item.name}`}
        >
          <button
            type="button"
            className="btn-qty btn-decrease"
            onClick={() => onDecrease(item.id)}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>
          <span
            className="cart-row-quantity"
            aria-label={`Quantity: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            className="btn-qty btn-increase"
            onClick={() => onIncrease(item.id)}
            aria-label={`Increase quantity of ${item.name}`}
            disabled={!isAvailable}
          >
            +
          </button>
        </div>

        <span
          className="cart-row-line-total"
          aria-label={`Line total: ${formatPrice(lineTotal)}`}
        >
          {formatPrice(lineTotal)}
        </span>

        <button
          type="button"
          className="btn-remove-item"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name} from cart`}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
