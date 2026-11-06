/**
 * ShopBoard — Product Catalog Fetching Hook (Day 5)
 *
 * Encapsulates catalog loading lifecycle, API errors, and retry management.
 * Preserves the exact Day 4 behavior (including race-condition protection)
 * without introducing premature AbortController logic (reserved for Phase 2).
 */

import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../../../modules/products/products.api.ts'
import type {
  LoadState,
  Product,
} from '../../../modules/products/products.types.ts'

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
    let isCurrent = true

    getProducts()
      .then((products) => {
        if (isCurrent) {
          setLoadState({ status: 'success', products })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to fetch catalog from server'
          setLoadState({ status: 'error', message })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [retryCounter])

  const products = loadState.status === 'success' ? loadState.products : []

  return {
    loadState,
    products,
    retry,
  }
}
