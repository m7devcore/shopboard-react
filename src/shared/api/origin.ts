/**
 * ShopBoard — Trusted API Origin Configuration (Day 5 - D5-030)
 *
 * Enforces a trusted, tamper-proof API origin for active network requests.
 * Eliminates runtime query-string origin overrides (`?api_base=`).
 *
 * Security guarantees:
 * 1. Canonical production API origin: `https://shopboard-api.vercel.app`.
 * 2. Never reads origins from `window.location.search`, `location.hash`, or user-supplied URL queries.
 * 3. Supports trusted build-time/environment configuration via `VITE_API_BASE_URL`.
 * 4. Strictly validates configured origins:
 *    - Must parse as a valid absolute URL.
 *    - Rejects non-HTTP(S) schemes (javascript:, file:, data:, etc.).
 *    - Enforces HTTPS for all remote origins. Plain HTTP is strictly restricted to
 *      loopback addresses (`localhost`, `127.0.0.1`, `[::1]`) for local development/testing.
 * 5. Fails safely on malformed or untrusted origins by defaulting to the canonical production API.
 */

export const CANONICAL_API_ORIGIN = 'https://shopboard-api.vercel.app'

let testOverrideOrigin: string | null = null

/**
 * Normalizes a URL by trimming whitespace and removing trailing slashes.
 */
function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/**
 * Validates whether an origin string is an acceptable, secure API origin.
 * - Must be a valid absolute URL.
 * - Must have protocol 'https:' OR ('http:' ONLY on loopback hostnames).
 * - Disallows embedded credentials.
 */
export function isAllowedOrigin(originStr: string): boolean {
  if (typeof originStr !== 'string' || originStr.trim().length === 0) {
    return false
  }

  try {
    const parsed = new URL(originStr)

    // Only HTTP and HTTPS schemes are supported
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }

    // Disallow credentials in origin definitions
    if (parsed.username || parsed.password) {
      return false
    }

    // If HTTP, strictly require a loopback host (localhost or 127.0.0.1 or ::1)
    if (parsed.protocol === 'http:') {
      const hostname = parsed.hostname.toLowerCase()
      const isLoopback =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]'

      if (!isLoopback) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Reads the build-time or environment configuration for VITE_API_BASE_URL.
 */
function getEnvConfiguredOrigin(): string | undefined {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_API_BASE_URL === 'string'
  ) {
    const val = import.meta.env.VITE_API_BASE_URL.trim()
    if (val.length > 0) return val
  }

  if (
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env.VITE_API_BASE_URL === 'string'
  ) {
    const val = process.env.VITE_API_BASE_URL.trim()
    if (val.length > 0) return val
  }

  return undefined
}

/**
 * Resolves the trusted API origin for the active ShopBoard application.
 * Never reads from window.location.search or user-controlled URL queries.
 */
export function getTrustedApiOrigin(): string {
  // 1. Programmatic test override (used in automated unit tests)
  if (testOverrideOrigin !== null) {
    if (isAllowedOrigin(testOverrideOrigin)) {
      return normalizeOrigin(testOverrideOrigin)
    }
    // Fail safely if test override is malformed
    return CANONICAL_API_ORIGIN
  }

  // 2. Build-time / environment configuration (e.g. VITE_API_BASE_URL)
  const envOrigin = getEnvConfiguredOrigin()
  if (envOrigin) {
    if (isAllowedOrigin(envOrigin)) {
      return normalizeOrigin(envOrigin)
    }
    // If configured origin is invalid/malformed, fail safely to canonical production API
    return CANONICAL_API_ORIGIN
  }

  // 3. Default canonical production API origin
  return CANONICAL_API_ORIGIN
}

/**
 * Sets a trusted origin override for isolated automated unit tests.
 * Pass `null` to reset.
 */
export function setTrustedApiOriginForTesting(origin: string | null): void {
  testOverrideOrigin = origin
}
