/**
 * ShopBoard — React Cart Provider (Day 5)
 *
 * Establishes React as the single source of truth for the shopping cart.
 * - Manages an immutable in-memory cart state: CartItem[] = { id, qty }[].
 * - Persists strictly { id, qty } to localStorage via cart.storage.ts.
 * - Dynamically hydrates product names, prices, and line totals from live API products.
 * - Never trusts or stores legacy prices.
 * - Safely handles out-of-stock items and products removed from the API catalog.
 * - Guarantees zero storage writes during rendering or state updater execution.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../products/products.types.ts'
import type { Cart, HydratedCartItem } from './cart.types.ts'
import {
  addItem,
  increaseItem,
  decreaseItem,
  removeItem,
  clearCart as pureClearCart,
  calculateTotalItems,
} from './cart.logic.ts'
import {
  getLocalStorage,
  readCartFromStorage,
  saveCartToStorage,
  type StorageLike,
} from './cart.storage.ts'
import { CartContext, type CartContextValue } from './cart.context.ts'

export interface CartProviderProps {
  readonly children: ReactNode
  readonly products?: readonly Product[]
  readonly storage?: StorageLike
}

export function CartProvider({
  children,
  products = [],
  storage = getLocalStorage(),
}: CartProviderProps) {
  // 1. Initial State: Pure read without storage writes during render.
  const [cart, setCart] = useState<Cart>(() => {
    return readCartFromStorage(storage)
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  // 2. Storage Sync Effect: Persist { id, qty } after render commits.
  // Respects React StrictMode; does not write during render or impure updaters.
  useEffect(() => {
    saveCartToStorage(cart, storage)
  }, [cart, storage])

  // 3. Hydrate cart entries with live API product data.
  // Missing products are safely flagged with $0 price to prevent arbitrary charging.
  const items = useMemo<readonly HydratedCartItem[]>(() => {
    return cart.map((item) => {
      const product = products.find((p) => String(p.id) === item.id)

      if (!product) {
        return {
          id: item.id,
          name: 'Unavailable Product',
          price: 0,
          quantity: item.qty,
          qty: item.qty,
          inStock: false,
          isAvailable: false,
        }
      }

      return {
        id: item.id,
        name: product.name,
        price: product.price,
        quantity: item.qty,
        qty: item.qty,
        inStock: product.inStock,
        isAvailable: true,
      }
    })
  }, [cart, products])

  // 4. Derive total items count using pure logic.
  const totalItems = useMemo(() => calculateTotalItems(cart), [cart])

  // 5. Derive total price dynamically from current validated API prices.
  // Unavailable or removed products with price 0 do not contribute to total.
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.isAvailable || item.price <= 0) {
        return sum
      }
      return sum + item.price * item.qty
    }, 0)
  }, [items])

  // 6. Cart Drawer Toggle Controls
  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), [])

  // 7. Pure Immutable State Mutations
  const handleAddItem = useCallback(
    (id: string, qty: number = 1) => {
      const cleanId = String(id).trim()
      const product = products.find((p) => String(p.id) === cleanId)
      if (product && product.inStock === false) {
        return
      }
      setCart((prev) => addItem(prev, cleanId, qty))
    },
    [products],
  )

  const handleAddToCart = useCallback(
    (product: { id: string | number; inStock?: boolean }) => {
      if (product.inStock === false) {
        return
      }
      handleAddItem(String(product.id), 1)
    },
    [handleAddItem],
  )

  const handleIncreaseItem = useCallback((id: string) => {
    setCart((prev) => increaseItem(prev, id))
  }, [])

  const handleDecreaseItem = useCallback((id: string) => {
    setCart((prev) => decreaseItem(prev, id))
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setCart((prev) => removeItem(prev, id))
  }, [])

  const handleClearCart = useCallback(() => {
    setCart(pureClearCart())
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      items,
      totalItems,
      totalPrice,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem: handleAddItem,
      addToCart: handleAddToCart,
      increaseItem: handleIncreaseItem,
      decreaseItem: handleDecreaseItem,
      removeItem: handleRemoveItem,
      clearCart: handleClearCart,
    }),
    [
      cart,
      items,
      totalItems,
      totalPrice,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      handleAddItem,
      handleAddToCart,
      handleIncreaseItem,
      handleDecreaseItem,
      handleRemoveItem,
      handleClearCart,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
