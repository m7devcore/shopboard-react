/**
 * ShopBoard — Shared HTTP Client & Error Types
 *
 * Centralizes fetch calls, HTTP status checking, and structured error handling.
 * Pure networking layer with zero DOM access.
 */

export const BASE_URL = "https://shopboard-api.vercel.app";

function resolveInitialBaseUrl(): string {
  if (typeof window !== "undefined" && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const custom = params.get("api_base");
    if (custom) return custom;
  }
  return BASE_URL;
}

let activeBaseUrl: string = resolveInitialBaseUrl();

/**
 * Returns the currently active API base URL.
 * Allows tests to override the base URL deterministically.
 */
export function getApiBaseUrl(): string {
  return activeBaseUrl;
}

/**
 * Overrides the active API base URL (used by automated tests).
 */
export function setApiBaseUrl(url: string): void {
  activeBaseUrl = url;
}

/**
 * Custom error class representing an HTTP or API failure.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Type guard checking if an unknown value is a non-null plain object record.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extracts a human-readable error message from a failed HTTP response.
 */
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (isRecord(body)) {
      if (typeof body.error === "string" && body.error.trim().length > 0) {
        return body.error;
      }
      if (typeof body.message === "string" && body.message.trim().length > 0) {
        return body.message;
      }
    }
  } catch {
    // Ignore JSON parse errors on error responses and fall back to status text
  }
  const statusSuffix = res.statusText ? `: ${res.statusText}` : "";
  return `HTTP ${res.status} loading ${res.url || "API resource"}${statusSuffix}`;
}

/**
 * Performs an HTTP GET request, checks `res.ok`, parses JSON, and validates
 * the response payload at runtime using the provided validator function.
 *
 * @param path - Endpoint path starting with `/` (e.g. `/api/products`) or full URL.
 * @param validate - Runtime validator transforming `unknown` JSON into `T`.
 * @returns Validated payload of type `T`.
 */
export async function fetchJson<T>(path: string, validate: (raw: unknown) => T): Promise<T> {
  const url = path.startsWith("http") ? path : `${activeBaseUrl}${path}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (networkError) {
    const detail = networkError instanceof Error ? networkError.message : "Network request failed";
    throw new ApiError(0, `Network error while fetching ${path}: ${detail}`);
  }

  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new ApiError(res.status, message);
  }

  let rawData: unknown;
  try {
    rawData = await res.json();
  } catch {
    throw new ApiError(res.status, `Invalid JSON received from ${path}`);
  }

  return validate(rawData);
}
