import type { CartItem } from '../../../modules/cart/cart.types.ts'
import { calculateLineTotal } from '../../../modules/cart/cart.logic.ts'

export interface CartRowProps {
  readonly item: CartItem
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
  const lineTotal = calculateLineTotal(item.price, item.quantity)

  return (
    <div className="cart-row" data-product-id={item.id}>
      <div className="cart-row-details">
        <h3 className="cart-row-title">{item.name}</h3>
        <span className="cart-row-unit-price">
          {formatPrice(item.price)} each
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
            aria-label={`Quantity: ${item.quantity}`}
          >
            {item.quantity}
          </span>
          <button
            type="button"
            className="btn-qty btn-increase"
            onClick={() => onIncrease(item.id)}
            aria-label={`Increase quantity of ${item.name}`}
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
