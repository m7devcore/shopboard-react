# ShopBoard Day 5 — Architecture & State Questions

## 1. Where does the cart state live, and why?

The cart state lives in `CartProvider` (`src/features/cart/CartProvider.tsx`), which wraps the entire application inside `App.tsx` using React Context.

We placed it here so a single shopping cart is shared across all pages—the catalog (`/products`), product details (`/products/:id`), cart review (`/cart`), and checkout (`/checkout`)—as well as the persistent header badge and sliding cart panel. Storing it in this central provider prevents out-of-sync cart duplicates and eliminates prop drilling. It also syncs minimal item data (`{ id, qty }`) to `localStorage` so items remain saved after a page refresh.

## 2. Which React effect did I keep, and why is it necessary?

We kept the `useEffect` inside the `useProducts` hook (`src/features/products/hooks/useProducts.ts`), which fetches the product catalog from the external API when the storefront loads.

This effect is necessary because network fetching is an asynchronous side effect that synchronizes React state with an outside system. It uses an `AbortController` signal and cleans up on unmount or retry (`controller.abort()`). This ensures that if the user navigates away or retries a request, any in-flight response is cancelled safely and cannot cause race conditions or update an unmounted component.

## 3. What re-renders when "Add to Cart" is clicked?

When the user clicks "Add to Cart":

1. The click handler calls `addItem()` from the `useCart()` hook, which triggers a state update (`setItems`) inside `CartProvider`.
2. Any component subscribed to the cart context re-renders to reflect the new data:
   - The **Header** (`Header.tsx`) re-renders to display the updated item count badge.
   - The **Cart Panel** drawer (`CartPanel.tsx`) and the **Cart Page** (`CartPage.tsx`), if open or active, re-render to display the new item row, updated quantities, and recalculated subtotal.
   - The **Checkout Page** (`CheckoutPage.tsx`), if active, re-renders the order summary.
3. On the **Product Details Page** (`ProductDetailsPage.tsx`), clicking "Add to Cart" also calls `setFeedback(...)` to display a brief confirmation notice ("Added X to cart!"), causing that page component to re-render locally from its own state update.
4. Components that do not consume `CartContext` do not re-render directly from the cart context change, although they may still re-render if their parent re-renders or if their own props/state change.
