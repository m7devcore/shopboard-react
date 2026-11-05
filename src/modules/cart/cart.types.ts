/**
 * ShopBoard — Cart Domain Types
 *
 * Defines strict TypeScript types for shopping cart items and cart collection.
 */

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type Cart = CartItem[];

export type AddableProduct = Pick<CartItem, "id" | "name" | "price"> & {
  inStock?: boolean;
};
