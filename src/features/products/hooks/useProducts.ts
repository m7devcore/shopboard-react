/**
 * ShopBoard — Product Catalog Fetching Hook (Day 5)
 *
 * Encapsulates catalog loading lifecycle, API errors, retry management,
 * and reliable AbortController request cancellation.
 *
 * Resilient behavior:
 * - On cleanup (unmount, retry counter increment, or StrictMode cycle),
 *   aborts the active request via `controller.abort()`.
 * - Intentionally aborted requests do NOT trigger user-facing error banners.
 * - Out-of-order or stale responses cannot overwrite newer successful data.
 * - Safely handles React 19 StrictMode double-mount in development.
 */

import { useCallback, useEffect, useState } from 'react'
import { isAbortError } from '../../../shared/api/transport.ts'
import { getShopBoardProducts } from '../product.adapter.ts'
import type { LoadState, Product } from '../products.types.ts'

export interface UseProductsResult {
  readonly loadState: LoadState
  readonly products: readonly Product[]
  readonly retry: () => void
}

export function useProducts(): UseProductsResult {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [retryCounter, setRetryCounter] = useState(0)

  const retry = useCallback(() => {
    setLoadState({ status: 'loading' })
    setRetryCounter((c) => c + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isCurrent = true

    getShopBoardProducts({ signal: controller.signal })
      .then((products) => {
        if (isCurrent) {
          setLoadState({ status: 'success', products })
        }
      })
      .catch((error: unknown) => {
        // Suppress intentional cancellation: do not render error banners or mutate unmounted state
        if (isAbortError(error) || controller.signal.aborted || !isCurrent) {
          return
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to fetch catalog from server'
        setLoadState({ status: 'error', message })
      })

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [retryCounter])

  const products = loadState.status === 'success' ? loadState.products : []

  return {
    loadState,
    products,
    retry,
  }
}
