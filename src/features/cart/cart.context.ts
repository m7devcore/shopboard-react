import { createContext } from 'react'
import type { Cart, HydratedCartItem } from './cart.types.ts'

export interface CartContextValue {
  readonly cart: Cart
  readonly items: readonly HydratedCartItem[]
  readonly totalItems: number
  readonly totalPrice: number
  readonly isCartOpen: boolean
  readonly openCart: () => void
  readonly closeCart: () => void
  readonly toggleCart: () => void
  readonly addItem: (id: string, qty?: number) => void
  readonly addToCart: (product: {
    id: string | number
    inStock?: boolean
  }) => void
  readonly increaseItem: (id: string) => void
  readonly decreaseItem: (id: string) => void
  readonly removeItem: (id: string) => void
  readonly clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
