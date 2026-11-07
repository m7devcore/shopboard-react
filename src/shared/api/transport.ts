/**
 * ShopBoard — Signal-Aware HTTP Transport (Day 5)
 *
 * Provides an unprotected, reusable HTTP transport supporting AbortSignal cancellation
 * without mutating the protected historical `src/shared/api/client.ts`.
 *
 * Responsibilities:
 * - Accepts an optional `AbortSignal` and passes it to `fetch()`.
 * - Re-throws genuine `AbortError` instances cleanly for caller cancellation handling.
 * - Extracts structured API error messages on HTTP failures (status !== 2xx).
 * - Detects and safely rejects malformed/invalid JSON.
 * - Applies runtime schema validators against parsed JSON payloads.
 * - Preserves existing request base configuration (`getApiBaseUrl()`) until D5-030.
 * - Reuses canonical `ApiError` and `isRecord` from `src/shared/api/client.ts`.
 */

import { ApiError, getApiBaseUrl, isRecord } from './client.ts'

export interface FetchOptions {
  readonly signal?: AbortSignal
}

/**
 * Type guard verifying whether an error represents an intentional AbortController cancellation.
 */
export function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const err = error as { name?: unknown; message?: unknown }
  return (
    err.name === 'AbortError' ||
    (typeof err.message === 'string' &&
      err.message.toLowerCase().includes('aborted'))
  )
}

/**
 * Extracts a human-readable error message from a failed HTTP response body.
 */
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (isRecord(body)) {
      if (typeof body.error === 'string' && body.error.trim().length > 0) {
        return body.error
      }
      if (typeof body.message === 'string' && body.message.trim().length > 0) {
        return body.message
      }
    }
  } catch {
    // Fall back to status text if JSON parsing fails
  }
  const statusSuffix = res.statusText ? `: ${res.statusText}` : ''
  return `HTTP ${res.status} loading ${res.url || 'API resource'}${statusSuffix}`
}

/**
 * Performs a signal-aware HTTP GET request, verifies `res.ok`, parses JSON,
 * and validates the resulting payload at runtime using the provided validator function.
 *
 * @param path - Endpoint path (e.g. `/api/products`) or absolute URL.
 * @param validate - Runtime validator transforming `unknown` JSON into `T`.
 * @param options - Request options including optional `AbortSignal`.
 * @returns Validated payload of type `T`.
 */
export async function fetchWithSignal<T>(
  path: string,
  validate: (raw: unknown) => T,
  options: FetchOptions = {},
): Promise<T> {
  const activeBaseUrl = getApiBaseUrl()
  const url = path.startsWith('http') ? path : `${activeBaseUrl}${path}`

  let res: Response
  try {
    res = await fetch(url, { signal: options.signal })
  } catch (networkError: unknown) {
    if (isAbortError(networkError)) {
      throw networkError
    }
    const detail =
      networkError instanceof Error
        ? networkError.message
        : 'Network request failed'
    throw new ApiError(0, `Network error while fetching ${path}: ${detail}`)
  }

  if (!res.ok) {
    const message = await extractErrorMessage(res)
    throw new ApiError(res.status, message)
  }

  let rawData: unknown
  try {
    rawData = await res.json()
  } catch {
    throw new ApiError(res.status, `Invalid JSON received from ${path}`)
  }

  return validate(rawData)
}
