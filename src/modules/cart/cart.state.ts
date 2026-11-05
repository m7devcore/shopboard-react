/**
 * ShopBoard — Cart State & Persistence Module
 *
 * Manages in-memory shopping cart state and synchronizes with localStorage.
 * Handles missing or invalid saved storage data safely with defensive fallbacks.
 */

import type { AddableProduct, Cart, CartItem } from "./cart.types.ts";

const STORAGE_KEY = "shopboard_cart";

let cartState: Cart = [];

/**
 * Type guard verifying if an unknown value is a valid `CartItem`.
 */
export function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return false;
  }

  return (
    "id" in item &&
    typeof item.id === "string" &&
    item.id.trim().length > 0 &&
    "name" in item &&
    typeof item.name === "string" &&
    "price" in item &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    "quantity" in item &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0
  );
}

/**
 * Safely loads stored cart data from localStorage.
 *
 * @returns Restored cart items or empty array if missing/invalid.
 */
export function loadCartFromStorage(): Cart {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return [];
    }

    const parsed: unknown = JSON.parse(rawData);

    // Validate that parsed output is an array of valid cart item objects
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filter and sanitize entries to ensure expected schema
    return parsed.filter(isValidCartItem);
  } catch (error) {
    console.warn("ShopBoard: Failed to parse stored cart data, resetting.", error);
    return [];
  }
}

/**
 * Safely writes cart data to localStorage.
 *
 * @param cart - Current cart array.
 */
export function saveCartToStorage(cart: readonly CartItem[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("ShopBoard: Failed to save cart to localStorage.", error);
  }
}

/**
 * Initializes the in-memory cart from persistent storage.
 *
 * @returns Current cart state.
 */
export function initializeCartState(): Cart {
  cartState = loadCartFromStorage();
  return [...cartState];
}

/**
 * Returns a shallow copy of the current cart state.
 */
export function getCartState(): Cart {
  return [...cartState];
}

/**
 * Adds a product to the cart. If already present, increments its quantity.
 * Uses Array.find to detect existing cart entry.
 *
 * @param product - Product object with id, name, and price.
 * @returns Updated cart state.
 */
export function addToCart(product: AddableProduct): Cart {
  if (!product || !product.id) {
    return [...cartState];
  }

  // Guard against adding out-of-stock items
  if ("inStock" in product && product.inStock === false) {
    return [...cartState];
  }

  const existingEntry = cartState.find((entry) => entry.id === String(product.id));

  if (existingEntry) {
    existingEntry.quantity += 1;
  } else {
    cartState.push({
      id: String(product.id),
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  saveCartToStorage(cartState);
  return [...cartState];
}

/**
 * Increases the quantity of a cart item by 1.
 *
 * @param productId - ID of the product to increase.
 * @returns Updated cart state.
 */
export function increaseQuantity(productId: string): Cart {
  const item = cartState.find((entry) => entry.id === String(productId));
  if (item) {
    item.quantity += 1;
    saveCartToStorage(cartState);
  }
  return [...cartState];
}

/**
 * Decreases the quantity of a cart item by 1.
 * If quantity reaches 0, removes the item from the cart.
 *
 * @param productId - ID of the product to decrease.
 * @returns Updated cart state.
 */
export function decreaseQuantity(productId: string): Cart {
  const index = cartState.findIndex((entry) => entry.id === String(productId));
  if (index !== -1) {
    const target = cartState[index];
    if (target) {
      target.quantity -= 1;
      if (target.quantity <= 0) {
        cartState.splice(index, 1);
      }
      saveCartToStorage(cartState);
    }
  }
  return [...cartState];
}

/**
 * Removes an item from the cart by its id.
 *
 * @param productId - ID of the product to remove.
 * @returns Updated cart state.
 */
export function removeFromCart(productId: string): Cart {
  const index = cartState.findIndex((entry) => entry.id === String(productId));
  if (index !== -1) {
    cartState.splice(index, 1);
    saveCartToStorage(cartState);
  }
  return [...cartState];
}

/**
 * Clears all items from the cart and removes them from localStorage.
 *
 * @returns Empty cart state.
 */
export function clearCart(): Cart {
  cartState = [];
  saveCartToStorage(cartState);
  return [...cartState];
}
