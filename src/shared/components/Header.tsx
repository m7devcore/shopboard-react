export interface HeaderProps {
  readonly title: string
  readonly totalItems: number
  readonly isCartOpen?: boolean
  readonly onToggleCart?: () => void
}

export default function Header({
  title,
  totalItems,
  isCartOpen = false,
  onToggleCart,
}: HeaderProps) {
  const itemLabel = totalItems === 1 ? 'item' : 'items'

  return (
    <header className="shopboard-header">
      <div className="header-container">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            🛍️
          </span>
          <h1 className="brand-title">{title}</h1>
        </div>

        <nav className="header-actions" aria-label="Cart navigation">
          {onToggleCart ? (
            <button
              type="button"
              className="cart-toggle-btn"
              onClick={onToggleCart}
              aria-label={`Shopping cart with ${totalItems} ${itemLabel}`}
              aria-expanded={isCartOpen}
            >
              <span className="cart-icon" aria-hidden="true">
                🛒
              </span>
              <span className="cart-label">Cart</span>
              <span className="cart-badge" aria-live="polite">
                {totalItems}
              </span>
            </button>
          ) : (
            <div
              className="cart-indicator"
              role="status"
              aria-label={`Shopping cart with ${totalItems} ${itemLabel}`}
            >
              <span className="cart-icon" aria-hidden="true">
                🛒
              </span>
              <span className="cart-label">Cart</span>
              <span className="cart-badge" aria-live="polite">
                {totalItems}
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
