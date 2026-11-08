import { Link, NavLink } from 'react-router-dom'
import { useOptionalCart } from '../../features/cart/useCart.ts'

export interface HeaderProps {
  readonly title: string
  readonly totalItems?: number
  readonly isCartOpen?: boolean
  readonly onToggleCart?: () => void
}

export default function Header({
  title,
  totalItems: propTotalItems,
  isCartOpen: propIsCartOpen,
  onToggleCart: propOnToggleCart,
}: HeaderProps) {
  const cart = useOptionalCart()

  const totalItems = propTotalItems ?? cart?.totalItems ?? 0
  const isCartOpen = propIsCartOpen ?? cart?.isCartOpen ?? false
  const onToggleCart = propOnToggleCart ?? cart?.toggleCart

  const itemLabel = totalItems === 1 ? 'item' : 'items'

  return (
    <header className="shopboard-header">
      <div className="header-container">
        <div className="brand">
          <Link to="/" className="brand-link">
            <span className="brand-logo" aria-hidden="true">
              🛍️
            </span>
            <h1 className="brand-title">{title}</h1>
          </Link>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Catalog
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Cart
          </NavLink>
        </nav>

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
