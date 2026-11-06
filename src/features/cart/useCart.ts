import { useContext } from 'react'
import { CartContext, type CartContextValue } from './cart.context.ts'

/**
 * Hook to access the React-managed shopping cart.
 * Must be used within a <CartProvider>.
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a <CartProvider>')
  }
  return context
}

/**
 * Hook to optionally access the shopping cart context if within a CartProvider.
 */
export function useOptionalCart(): CartContextValue | null {
  return useContext(CartContext)
}
