/**
 * ShopBoard — Cart Pure Logic Module
 *
 * Pure functions for cart quantity and monetary calculations.
 * Strict constraint: No DOM, document, window, or localStorage access.
 */

export interface CartCalculableItem {
  readonly price?: number | string;
  readonly quantity?: number | string;
}

/**
 * Calculates total number of items across all cart entries using Array.reduce.
 *
 * @param cart - Array of cart entries with quantity.
 * @returns Total count of items.
 */
export function calculateTotalItems(cart: readonly CartCalculableItem[]): number {
  return cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

/**
 * Calculates overall cart monetary total using Array.reduce.
 *
 * @param cart - Array of cart entries with price and quantity.
 * @returns Sum total of all items.
 */
export function calculateTotalPrice(cart: readonly CartCalculableItem[]): number {
  return cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );
}

/**
 * Calculates a single line item total.
 *
 * @param price - Unit price.
 * @param quantity - Item quantity.
 * @returns Line total amount.
 */
export function calculateLineTotal(price: number | string, quantity: number | string): number {
  return (Number(price) || 0) * (Number(quantity) || 0);
}
