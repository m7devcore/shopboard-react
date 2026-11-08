/**
 * ShopBoard — Catalog Page (Day 5 Phase 3)
 *
 * Full storefront catalog view hosting the 12-product grid, live search filter,
 * category selector, and sort controls.
 */

import { useOutletContext } from 'react-router-dom'
import type { LoadState } from '../features/products/products.types.ts'
import Storefront from '../features/products/components/Storefront.tsx'
import type { RootLayoutOutletContext } from '../shared/components/RootLayout.tsx'

export interface CatalogPageProps {
  readonly loadState?: LoadState
  readonly onRetry?: () => void
}

export default function CatalogPage(props: CatalogPageProps = {}) {
  const outletContext = useOutletContext<RootLayoutOutletContext | null>()

  const loadState = props.loadState ??
    outletContext?.loadState ?? { status: 'loading' }
  const onRetry = props.onRetry ?? outletContext?.onRetry ?? (() => {})

  return (
    <div className="catalog-page">
      <Storefront loadState={loadState} onRetry={onRetry} />
    </div>
  )
}
