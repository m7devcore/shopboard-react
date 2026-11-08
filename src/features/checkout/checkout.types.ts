import type { CheckoutFormData } from './checkout.schema.ts'

/**
 * Snapshot of ordered item captured before clearing cart upon demo completion.
 */
export interface DemoOrderItemSnapshot {
  id: string
  name: string
  price: number
  qty: number
}

/**
 * Complete immutable snapshot of a confirmed demonstration transaction.
 * Note: Never includes fake transaction IDs or claims of financial settlement.
 */
export interface DemoOrderSnapshot {
  customer: CheckoutFormData
  items: DemoOrderItemSnapshot[]
  totalItems: number
  totalPrice: number
  confirmedAt: string
  isDemonstration: true
}
