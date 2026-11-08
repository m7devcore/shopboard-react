/**
 * ShopBoard — 404 Not Found Page (Day 5 Phase 3)
 *
 * Dedicated error boundary / catch-all route page rendered when a user navigates
 * to an undefined route. Provides clear messaging and immediate navigation paths
 * back to Home or Catalog.
 */

import { Link, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="not-found-page" role="alert">
      <div className="not-found-card">
        <span className="not-found-badge">404 Error</span>
        <h1 className="not-found-heading">Page Not Found</h1>
        <p className="not-found-description">
          The requested path{' '}
          <code className="not-found-path">{location.pathname}</code> does not
          exist in the ShopBoard storefront.
        </p>

        <div className="not-found-links">
          <Link to="/" className="btn-primary-cta">
            ← Return to Home
          </Link>
          <Link to="/products" className="btn-secondary-cta">
            Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  )
}
