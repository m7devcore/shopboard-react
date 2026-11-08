/**
 * ShopBoard — Route Loading Spinner (Day 5 Phase 3)
 *
 * Local Suspense fallback rendered inside `<Outlet />` while lazy-loaded
 * page chunks are being downloaded.
 */

export default function RouteLoadingSpinner() {
  return (
    <div
      className="route-loading-container"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="status-icon" aria-hidden="true">
        ⏳
      </div>
      <p className="status-text">Loading page content...</p>
    </div>
  )
}
