export type StatusVariant =
  'loading' | 'error' | 'empty-catalog' | 'empty-filter'

export interface StatusMessageProps {
  readonly variant: StatusVariant
  readonly message?: string
  readonly onRetry?: () => void
}

const DEFAULT_MESSAGES: Readonly<Record<StatusVariant, string>> = {
  loading: 'Loading products from ShopBoard API...',
  error:
    'Unable to load products. Please check your network connection and try again.',
  'empty-catalog': 'No products are currently available in the catalog.',
  'empty-filter': 'No products match your current search or filter criteria.',
}

const VARIANT_ICONS: Readonly<Record<StatusVariant, string>> = {
  loading: '⏳',
  error: '⚠️',
  'empty-catalog': '📦',
  'empty-filter': '🔍',
}

export default function StatusMessage({
  variant,
  message,
  onRetry,
}: StatusMessageProps) {
  const displayMessage = message ?? DEFAULT_MESSAGES[variant]
  const isError = variant === 'error'
  const role = isError ? 'alert' : 'status'
  const ariaLive = isError ? 'assertive' : 'polite'

  return (
    <div
      className={`status-message-container status-${variant}`}
      role={role}
      aria-live={ariaLive}
    >
      <div className="status-icon" aria-hidden="true">
        {VARIANT_ICONS[variant]}
      </div>
      <p className="status-text">{displayMessage}</p>
      {isError && onRetry ? (
        <button
          type="button"
          className="btn-retry"
          onClick={onRetry}
          aria-label="Retry loading products"
        >
          Try Again
        </button>
      ) : null}
    </div>
  )
}
